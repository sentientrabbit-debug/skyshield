// Rule-based debrief generation, judgement categorisation and the OCSA Advice Card.
// Language is plain English and avoids claims about real-world performance.

import type { ArchitectureTotals } from "./aggregate";
import type {
  AdviceCard,
  DebriefMessage,
  JudgementCategory,
  StageScores,
  TrackResult,
} from "../types/results";

interface Rule {
  id: string;
  stage: DebriefMessage["stage"];
  severity: DebriefMessage["severity"];
  test: (s: StageScores, t: ArchitectureTotals) => boolean;
  message: string;
}

const RULES: Rule[] = [
  {
    id: "high_detection_low_engagement",
    stage: "act",
    severity: "warn",
    test: (s) => s.detectionRate > 0.75 && s.engagementRate < 0.45,
    message:
      "You saw many of the tracks, but could not reliably stop them. In IAMD terms, a good air picture is useful warning. It is not protection unless the rest of the chain can act.",
  },
  {
    id: "low_sustainment",
    stage: "sustain",
    severity: "bad",
    test: (s) => s.munitionsRemainingFrac < 0.25,
    message:
      "The defence worked early, then ran short of munitions or staying power. Repeated waves punish plans that only buy the first intercept.",
  },
  {
    id: "low_resilience",
    stage: "recover",
    severity: "warn",
    test: (s, t) => t.resiliencePackages < 1 && s.totalConsequence > 5,
    message:
      "Your plan relied on stopping everything. When tracks got through, there was little hardening, dispersal or backup capacity to reduce the damage.",
  },
  {
    id: "weak_classification",
    stage: "classify",
    severity: "warn",
    test: (s) => s.detectionRate > 0.6 && s.classificationRate < 0.5,
    message:
      "You detected many tracks, but did not always understand them well enough to respond confidently. Detection says something is there. Classification says what it probably is.",
  },
  {
    id: "single_c2",
    stage: "decide",
    severity: "warn",
    test: (_s, t) => t.c2Count === 1 && t.totalAssets >= 6,
    message:
      "Too much decision-making depended on one command and control node. That can work in a simple run, but it creates a bottleneck when several tracks arrive together.",
  },
  {
    id: "no_integration",
    stage: "system",
    severity: "info",
    test: (_s, t) =>
      t.integrationUpgrades === 0 && t.sensorCount > 0 && t.effectorCount > 0,
    message:
      "You bought sensors and effectors, but did not invest in connecting them. In this model, integration helps information move quickly enough for action.",
  },
  {
    id: "decision_delay",
    stage: "decide",
    severity: "warn",
    test: (s) => s.avgDecisionDelay > 2,
    message:
      "Decision delay was high. Fast tracks can arrive before the system is ready to act, even if they were detected.",
  },
  {
    id: "balanced_strong",
    stage: "system",
    severity: "good",
    test: (s, t) =>
      s.detectionRate > 0.7 &&
      s.engagementRate > 0.6 &&
      t.resiliencePackages >= 1 &&
      t.sustainmentPackages >= 1,
    message:
      "This was a balanced layered plan. It had ways to see, decide, act, absorb damage and keep going, which is why it outperformed a single-layer defence in this scenario.",
  },
];

export function runDebriefRules(
  scores: StageScores,
  totals: ArchitectureTotals
): DebriefMessage[] {
  const out: DebriefMessage[] = [];
  for (const r of RULES) {
    if (r.test(scores, totals)) {
      out.push({ id: r.id, stage: r.stage, severity: r.severity, message: r.message });
    }
  }
  if (out.length === 0) {
    out.push({
      id: "neutral",
      stage: "system",
      severity: "info",
      message:
        "The result was mixed. There was no single dominant failure, so the advice should focus on the weakest evidence and the next test needed before scaling the approach.",
    });
  }
  return out;
}

export function categorise(
  scores: StageScores,
  totals: ArchitectureTotals,
  tracks: TrackResult[]
): JudgementCategory {
  const leaked = tracks.filter((t) => t.outcome === "leaked").length;
  const total = tracks.length || 1;
  const leakRate = leaked / total;

  if (scores.munitionsRemainingFrac < 0.25 || (scores.detectionRate > 0.7 && leakRate > 0.4)) {
    if (scores.detectionRate > 0.7) return "credible_but_fragile";
  }
  if (scores.detectionRate > 0.75 && scores.engagementRate < 0.45)
    return "strong_sensors_weak_response";
  if (scores.engagementRate > 0.65 && scores.detectionRate < 0.5)
    return "strong_effectors_weak_warning";
  if (totals.c2Count === 1 && totals.totalAssets >= 7) return "over_centralised";
  if (totals.resiliencePackages >= 2 && scores.engagementRate < 0.5)
    return "resilient_but_underdefended";
  if (
    scores.detectionRate > 0.7 &&
    scores.engagementRate > 0.6 &&
    totals.resiliencePackages >= 1 &&
    totals.sustainmentPackages >= 1
  )
    return "robust_layered";

  if (totals.integrationUpgrades + totals.sensorCount > 0 && scores.totalConsequence < 4 && scores.engagementRate < 0.55)
    return "high_promise_low_evidence";

  return "credible_but_fragile";
}

export const JUDGEMENT_LABEL: Record<JudgementCategory, string> = {
  robust_layered: "Balanced layered defence",
  credible_but_fragile: "Works, but fragile",
  strong_sensors_weak_response: "Good warning, weak response",
  strong_effectors_weak_warning: "Good weapons, weak warning",
  over_centralised: "Decision bottleneck risk",
  high_promise_low_evidence: "Looks promising, needs evidence",
  resilient_but_underdefended: "Resilient, but under-defended",
};

const JUDGEMENT_BLURB: Record<JudgementCategory, string> = {
  robust_layered:
    "The plan had useful layers across warning, decision, response, resilience and sustainment.",
  credible_but_fragile:
    "The plan can work at first contact, but weak endurance or dependency risks remain.",
  strong_sensors_weak_response:
    "The plan sees threats better than it can stop or absorb them.",
  strong_effectors_weak_warning:
    "The plan has response options, but they depend on seeing and understanding tracks in time.",
  over_centralised:
    "The plan depends heavily on one decision point, which is risky under simultaneous pressure.",
  high_promise_low_evidence:
    "The result depends on assumptions that would need validation before advice could be firm.",
  resilient_but_underdefended:
    "The plan reduces damage after impact, but still allows too many tracks through.",
};

export function buildAdviceCard(
  judgement: JudgementCategory,
  scores: StageScores,
  totals: ArchitectureTotals
): AdviceCard {
  const stageStrength: [string, number][] = [
    ["seeing incoming tracks", scores.detectionRate],
    ["understanding what the tracks are", scores.classificationRate],
    ["making timely decisions", 1 - Math.min(1, scores.avgDecisionDelay / 4)],
    ["stopping tracks once engaged", scores.engagementRate],
    ["staying effective after repeated waves", scores.munitionsRemainingFrac],
    ["reducing damage when tracks get through", Math.min(1, totals.resiliencePackages / 2)],
  ];
  const sorted = [...stageStrength].sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];

  return {
    architectureJudgement: `${JUDGEMENT_LABEL[judgement]}: ${JUDGEMENT_BLURB[judgement]}`,
    strongestArea: strongest.charAt(0).toUpperCase() + strongest.slice(1) + ".",
    mainWeakness: weakest.charAt(0).toUpperCase() + weakest.slice(1) + ".",
    whatWeCanSay:
      "In this fictional run, the architecture reduced some risk to priority sites. The result cannot be used to claim protection for any real place, system or threat.",
    whatWeNeedNext:
      "Evidence on sensor performance, classification quality, command and control workload, operator capacity, munitions depth, sustainment, resilience benefits and allied integration.",
  };
}
