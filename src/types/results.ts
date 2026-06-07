// Simulation result types and replay event model.

import type { PipelineStage, ThreatType } from "./game";

export type TrackOutcome =
  | "stopped"
  | "leaked"
  | "mitigated" // leaked but consequence reduced by resilience
  | "wasted_on_decoy";

export interface TrackResult {
  threatId: string;
  type: ThreatType;
  waveId: string;
  route: string[];
  detected: boolean;
  detectedLate: boolean;
  classified: boolean;
  decisionDelay: number; // 0..n abstract ticks
  engaged: boolean;
  engagementSucceeded: boolean;
  munitionsUsed: number;
  outcome: TrackOutcome;
  targetAssetId: string | null;
  consequenceDealt: number; // post-resilience damage
  rawConsequence: number; // pre-resilience
  notes: string[];
}

export interface AssetDamage {
  assetId: string;
  name: string;
  damage: number;
  recoveryTime: number;
  resilienceReduction: number;
}

/** Animated replay event consumed by the MapView. */
export interface ReplayEvent {
  t: number; // tick when it begins
  kind:
    | "spawn"
    | "detect"
    | "classify"
    | "engage_attempt"
    | "engage_hit"
    | "engage_miss"
    | "leak"
    | "consequence"
    | "overload";
  threatId: string;
  nodeId?: string;
  assetId?: string;
  label?: string;
}

export interface StageScores {
  detectionRate: number;
  classificationRate: number;
  avgDecisionDelay: number;
  engagementRate: number;
  munitionsRemainingFrac: number;
  resilienceInvestment: number;
  totalConsequence: number;
}

export type JudgementCategory =
  | "robust_layered"
  | "credible_but_fragile"
  | "strong_sensors_weak_response"
  | "strong_effectors_weak_warning"
  | "over_centralised"
  | "high_promise_low_evidence"
  | "resilient_but_underdefended";

export interface DebriefMessage {
  id: string;
  stage: PipelineStage | "system";
  severity: "good" | "warn" | "bad" | "info";
  message: string;
}

export interface AdviceCard {
  architectureJudgement: string;
  strongestArea: string;
  mainWeakness: string;
  whatWeCanSay: string;
  whatWeNeedNext: string;
}

export interface ObjectiveResult {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

/** Three-axis star rating shown on the score screen. */
export interface StarRating {
  protection: number; // 0..3 — how well priority sites were protected
  efficiency: number; // 0..3 — value protected per resource spent
  evidence: number; // 0..3 — reliance on proven vs emerging assets
  total: number; // 0..9
}

export interface SimulationResult {
  tracks: TrackResult[];
  damage: AssetDamage[];
  events: ReplayEvent[];
  scores: StageScores;
  judgement: JudgementCategory;
  debrief: DebriefMessage[];
  adviceCard: AdviceCard;
  totalTicks: number;
  stars: StarRating;
  objectives: ObjectiveResult[];
  tips: string[]; // "try this next" after-action suggestions
}
