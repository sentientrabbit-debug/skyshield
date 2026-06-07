// simulateScenario: the orchestrator.
// Walks each threat wave through Sense → Classify → Decide → Act → Sustain → Recover,
// emits an animated replay event stream, and assembles the debrief + advice card.

import {
  architectureTotals,
  buildAdjacency,
  capabilityByNode,
  effectiveCapabilityAt,
} from "./aggregate";
import {
  calculateClassification,
  calculateConsequence,
  calculateDecision,
  calculateDetection,
  calculateEngagement,
} from "./calculators";
import {
  buildAdviceCard,
  categorise,
  runDebriefRules,
} from "./generateDebrief";
import { THREAT_LABEL } from "../config/assetCatalogue";
import { buildTips, computeStars, evaluateObjectives } from "./scoring";
import type { PlacedAsset, Scenario } from "../types/game";
import type {
  AssetDamage,
  ReplayEvent,
  SimulationResult,
  StageScores,
  TrackResult,
} from "../types/results";

const TICKS_PER_LEG = 6;

export function simulateScenario(
  scenario: Scenario,
  placed: PlacedAsset[]
): SimulationResult {
  const adj = buildAdjacency(scenario);
  const byNode = capabilityByNode(placed);
  const totals = architectureTotals(placed);

  const defendedByNode = new Map(
    scenario.defendedAssets.map((d) => [d.nodeId, d])
  );

  const tracks: TrackResult[] = [];
  const events: ReplayEvent[] = [];
  const damageMap = new Map<string, AssetDamage>();

  let munitions = scenario.budget.munitions;
  const munitionsStart = Math.max(1, munitions);

  let tick = 0;
  let detectedCount = 0;
  let classifiedCount = 0;
  let engagedCount = 0;
  let engagementSuccess = 0;
  let decisionDelaySum = 0;
  let totalConsequence = 0;
  let threatIndex = 0;

  for (const wave of scenario.threatWaves) {
    // Saturation rises with concurrent threat weight in this wave.
    const waveWeight = wave.threats.reduce((a, t) => a + t.saturationWeight, 0);

    wave.threats.forEach((threat, i) => {
      const threatId = `t${threatIndex++}`;
      const spawnTick = tick + i; // slight stagger within wave
      const route = threat.route;
      const endNode = route[route.length - 1];
      const endCap = effectiveCapabilityAt(endNode, byNode, adj);

      const notes: string[] = [];

      events.push({ t: spawnTick, kind: "spawn", threatId, nodeId: route[0], label: THREAT_LABEL[threat.type] });

      // --- SENSE ---
      const det = calculateDetection(endCap, threat);
      if (det.detected) {
        detectedCount++;
        events.push({ t: spawnTick + 1, kind: "detect", threatId, nodeId: endNode });
        if (det.detectedLate)
          notes.push(`Detected late near ${nodeName(scenario, endNode)}. There was not enough sensor layering to create early warning.`);
      } else {
        notes.push(`Not detected before arrival at ${nodeName(scenario, endNode)}. That approach needs better sensor coverage.`);
      }

      // --- CLASSIFY ---
      const cls = calculateClassification(endCap, threat, det.detected);
      if (cls.classified) {
        classifiedCount++;
        events.push({ t: spawnTick + 2, kind: "classify", threatId, nodeId: endNode });
      } else if (det.detected) {
        notes.push(threat.type === "unknown" || threat.type === "decoy"
          ? `Detected, but not understood clearly enough. This was an ambiguous ${THREAT_LABEL[threat.type].toLowerCase()}.`
          : "Detected, but not identified clearly enough for a fast response.");
      }

      // --- DECIDE ---
      const overloadPressure = Math.max(0, waveWeight - (endCap.decisionSupport + endCap.integrationBonus)) * 0.15;
      const dec = calculateDecision(endCap, threat, cls.classified, overloadPressure);
      decisionDelaySum += dec.delay;
      if (overloadPressure > 1.2) {
        events.push({ t: spawnTick + 2, kind: "overload", threatId, nodeId: endNode, label: "Decision node overloaded" });
        notes.push("Decision-making was overloaded because several tracks arrived at once.");
      }

      // --- ACT ---
      const saturation = Math.max(0, waveWeight - 3) * 0.2;
      const munitionsFrac = munitions / munitionsStart;
      const eng = calculateEngagement(endCap, threat, cls.classified, dec.delay, saturation, munitionsFrac);

      let outcome: TrackResult["outcome"] = "leaked";
      let succeeded = false;
      let munitionsUsed = 0;

      if (eng.engaged) {
        engagedCount++;
        munitionsUsed = Math.min(munitions, eng.munitionsUsed);
        munitions -= munitionsUsed;
        events.push({ t: spawnTick + 3, kind: "engage_attempt", threatId, nodeId: endNode });
        if (eng.succeeded) {
          succeeded = true;
          engagementSuccess++;
          events.push({ t: spawnTick + 4, kind: "engage_hit", threatId, nodeId: endNode });
          outcome = threat.type === "decoy" ? "wasted_on_decoy" : "stopped";
          if (threat.type === "decoy")
            notes.push("The system engaged a decoy, so attention and munitions were spent on the wrong track.");
        } else {
          events.push({ t: spawnTick + 4, kind: "engage_miss", threatId, nodeId: endNode });
          notes.push("The system tried to stop it, but the engagement failed in this run.");
        }
      }

      // --- SUSTAIN / RECOVER (consequence) ---
      const target = defendedByNode.get(endNode) ?? null;
      let consequenceDealt = 0;
      let rawConsequence = 0;
      if (!succeeded && threat.type !== "decoy") {
        const con = calculateConsequence(threat, target, endCap.resilience);
        consequenceDealt = con.dealt;
        rawConsequence = con.raw;
        totalConsequence += con.dealt;
        if (con.dealt > 0) {
          events.push({ t: spawnTick + 5, kind: "leak", threatId, nodeId: endNode });
          events.push({ t: spawnTick + 6, kind: "consequence", threatId, nodeId: endNode, label: `−${con.dealt}` });
          if (con.reduction > 0) {
            outcome = "mitigated";
            notes.push(`Resilience reduced the damage${target ? ` at ${target.name}` : ""} by ${con.reduction}.`);
          }
          if (target) {
            const prev = damageMap.get(target.id);
            const dmg: AssetDamage = prev ?? {
              assetId: target.id,
              name: target.name,
              damage: 0,
              recoveryTime: 0,
              resilienceReduction: 0,
            };
            dmg.damage += con.dealt;
            dmg.recoveryTime = Math.max(dmg.recoveryTime, con.recoveryTime);
            dmg.resilienceReduction += con.reduction;
            damageMap.set(target.id, dmg);
          }
        }
      }

      tracks.push({
        threatId,
        type: threat.type,
        waveId: wave.id,
        route,
        detected: det.detected,
        detectedLate: det.detectedLate,
        classified: cls.classified,
        decisionDelay: dec.delay,
        engaged: eng.engaged,
        engagementSucceeded: succeeded,
        munitionsUsed,
        outcome,
        targetAssetId: target?.id ?? null,
        consequenceDealt,
        rawConsequence,
        notes,
      });
    });

    // Advance the clock past this wave; sustainment partially refills munitions.
    tick += wave.threats.length + TICKS_PER_LEG;
    const refill = Math.round(totals.sustainment * 0.4);
    munitions = Math.min(munitionsStart, munitions + refill);
  }

  const n = tracks.length || 1;
  const engageable = tracks.filter((t) => t.classified).length || 1;
  const scores: StageScores = {
    detectionRate: round(detectedCount / n),
    classificationRate: round(classifiedCount / n),
    avgDecisionDelay: round(decisionDelaySum / n),
    engagementRate: round(engagementSuccess / engageable),
    munitionsRemainingFrac: round(munitions / munitionsStart),
    resilienceInvestment: totals.resiliencePackages,
    totalConsequence: round(totalConsequence),
  };

  const judgement = categorise(scores, totals, tracks);
  const debrief = runDebriefRules(scores, totals);
  const adviceCard = buildAdviceCard(judgement, scores, totals);

  const stars = computeStars(scenario, placed, scores);
  const objectives = evaluateObjectives(scenario, scores, tracks);
  const tips = buildTips(scores, totals, tracks, scenario);

  const totalTicks = Math.max(...events.map((e) => e.t), 0) + 2;

  return {
    tracks,
    damage: [...damageMap.values()],
    events,
    scores,
    judgement,
    debrief,
    adviceCard,
    totalTicks,
    stars,
    objectives,
    tips,
  };
}

function round(x: number) {
  return Math.round(x * 100) / 100;
}

function nodeName(scenario: Scenario, id: string) {
  return scenario.map.nodes.find((n) => n.id === id)?.name ?? id;
}
