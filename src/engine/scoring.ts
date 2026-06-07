// Scoring: three-axis star rating, objective evaluation, and "try this next" tips.
// Designed to give the player a clear, fair, repeatable result they can chase.

import { ASSET_CATALOGUE } from "../config/assetCatalogue";
import type { ArchitectureTotals } from "./aggregate";
import type {
  PlacedAsset,
  Scenario,
  ScenarioObjective,
} from "../types/game";
import type {
  ObjectiveResult,
  StageScores,
  StarRating,
  TrackResult,
} from "../types/results";

/** Total "value at stake" across all defended assets (used to normalise protection). */
function valueAtStake(scenario: Scenario): number {
  return scenario.defendedAssets.reduce(
    (a, d) => a + d.operationalValue + d.publicConsequence,
    0
  );
}

function spend(placed: PlacedAsset[]): number {
  return placed.reduce((a, p) => a + ASSET_CATALOGUE[p.type].cost, 0);
}

/** Fraction of placed assets whose evidence is proven/reported (vs emerging/vendor). */
function evidenceQuality(placed: PlacedAsset[]): number {
  if (placed.length === 0) return 1;
  const weight: Record<string, number> = {
    proven: 1,
    reported: 0.8,
    emerging: 0.45,
    vendor_claim: 0.2,
  };
  const sum = placed.reduce(
    (a, p) => a + (weight[ASSET_CATALOGUE[p.type].evidenceConfidence] ?? 0.5),
    0
  );
  return sum / placed.length;
}

function stars3(frac: number): number {
  if (frac >= 0.85) return 3;
  if (frac >= 0.6) return 2;
  if (frac >= 0.3) return 1;
  return 0;
}

export function computeStars(
  scenario: Scenario,
  placed: PlacedAsset[],
  scores: StageScores
): StarRating {
  const stake = valueAtStake(scenario) || 1;
  // Protection: how little consequence got through, relative to what was at stake.
  const protectionFrac = Math.max(0, 1 - scores.totalConsequence / stake);

  // Efficiency: protection achieved per unit of budget actually spent.
  const used = spend(placed) || 1;
  const cap = scenario.budget.budget || 1;
  const thrift = 1 - used / cap; // how much budget was left
  // Reward protecting well without spending everything.
  const efficiencyFrac = Math.max(0, Math.min(1, protectionFrac * 0.7 + thrift * 0.3));

  const evidenceFrac = evidenceQuality(placed);

  const protection = stars3(protectionFrac);
  const efficiency = stars3(efficiencyFrac);
  const evidence = stars3(evidenceFrac);
  return {
    protection,
    efficiency,
    evidence,
    total: protection + efficiency + evidence,
  };
}

export function evaluateObjectives(
  scenario: Scenario,
  scores: StageScores,
  tracks: TrackResult[]
): ObjectiveResult[] {
  const objectives = scenario.objectives ?? [];
  // Per-asset damage tally from tracks.
  const damageByAsset = new Map<string, number>();
  for (const t of tracks) {
    if (t.targetAssetId && t.consequenceDealt > 0) {
      damageByAsset.set(
        t.targetAssetId,
        (damageByAsset.get(t.targetAssetId) ?? 0) + t.consequenceDealt
      );
    }
  }

  return objectives.map((o: ScenarioObjective) => {
    let met = false;
    let detail = "";
    switch (o.kind) {
      case "protect_asset_below": {
        const dmg = Math.round(damageByAsset.get(o.assetId ?? "") ?? 0);
        met = dmg < o.value;
        detail = `Damage taken: ${dmg} (target: under ${o.value}).`;
        break;
      }
      case "total_consequence_below": {
        const c = Math.round(scores.totalConsequence);
        met = c < o.value;
        detail = `Total damage: ${c} (target: under ${o.value}).`;
        break;
      }
      case "engagement_rate_above": {
        met = scores.engagementRate > o.value;
        detail = `Engagement success: ${Math.round(scores.engagementRate * 100)}% (target: over ${Math.round(o.value * 100)}%).`;
        break;
      }
      case "munitions_remaining_above": {
        met = scores.munitionsRemainingFrac > o.value;
        detail = `Munitions left: ${Math.round(scores.munitionsRemainingFrac * 100)}% (target: over ${Math.round(o.value * 100)}%).`;
        break;
      }
      case "detection_rate_above": {
        met = scores.detectionRate > o.value;
        detail = `Detection: ${Math.round(scores.detectionRate * 100)}% (target: over ${Math.round(o.value * 100)}%).`;
        break;
      }
    }
    return { id: o.id, label: o.label, met, detail };
  });
}

/** Concrete, plain-English "try this next" suggestions based on the weakest links. */
export function buildTips(
  scores: StageScores,
  totals: ArchitectureTotals,
  tracks: TrackResult[],
  scenario: Scenario
): string[] {
  const tips: string[] = [];

  // Find the defended node that took the most damage.
  const dmgByNode = new Map<string, number>();
  for (const t of tracks) {
    if (t.consequenceDealt > 0) {
      const node = scenario.defendedAssets.find((d) => d.id === t.targetAssetId)?.nodeId;
      if (node) dmgByNode.set(node, (dmgByNode.get(node) ?? 0) + t.consequenceDealt);
    }
  }
  const worst = [...dmgByNode.entries()].sort((a, b) => b[1] - a[1])[0];
  const worstName = worst
    ? scenario.map.nodes.find((n) => n.id === worst[0])?.name
    : null;

  if (scores.detectionRate < 0.6 && worstName) {
    tips.push(`Add a sensor covering ${worstName} — too many tracks arrived unseen.`);
  }
  if (scores.classificationRate < 0.5 && scores.detectionRate >= 0.6) {
    tips.push("Add a C2 node or local sensor so detected tracks can be identified in time.");
  }
  if (scores.engagementRate < 0.5 && totals.effectorCount > 0) {
    tips.push("Match effectors to the threat: counter-drone for drones, surface defence for cruise-type threats.");
  }
  if (scores.engagementRate < 0.5 && totals.effectorCount === 0) {
    tips.push("You had no way to act — add at least one effector near a protected site.");
  }
  if (scores.munitionsRemainingFrac < 0.25 && totals.sustainmentPackages === 0) {
    tips.push("Add a sustainment package — you ran out of capacity before the last wave.");
  }
  if (scores.totalConsequence > 4 && totals.resiliencePackages === 0 && worstName) {
    tips.push(`Add a passive resilience package at ${worstName} to reduce damage when interception fails.`);
  }
  if (totals.c2Count === 1 && totals.totalAssets >= 7) {
    tips.push("Spread decision-making: a second C2 node reduces overload when waves overlap.");
  }
  if (tips.length === 0) {
    tips.push("Strong run. Try the same scenario with a smaller budget to test efficiency.");
  }
  return tips.slice(0, 3);
}
