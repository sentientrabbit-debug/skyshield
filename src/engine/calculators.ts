// Per-stage calculators implementing the educational pipeline:
// Sense → Classify → Decide → Act → Sustain → Recover.
// These are deterministic, coherent heuristics: NOT physics, NOT operational.

import type { NodeCapability } from "./aggregate";
import { clamp01 } from "./aggregate";
import type { DefendedAsset, ThreatDef } from "../types/game";

/**
 * Detection score → probability a track is seen, and whether it is seen late.
 * Detection = sensor coverage + passive bonus − threat detectability penalty.
 */
export function calculateDetection(cap: NodeCapability, threat: ThreatDef) {
  const coverage = cap.detection;
  const penalty = threat.detectability;
  const score = coverage - penalty * 1.2 + (cap.resilience > 0 ? 0.5 : 0);
  const prob = clamp01(0.15 + score * 0.12);
  const detected = prob >= 0.4;
  // "Late" if detected but only marginally, or single-layer coverage.
  const detectedLate = detected && (prob < 0.62 || cap.assetCount <= 1);
  return { detected, detectedLate, prob: Math.round(prob * 100) / 100, score };
}

/**
 * Classification = sensor overlap + C2 support + integration − difficulty.
 * Determines whether a detected track can be confidently identified.
 */
export function calculateClassification(
  cap: NodeCapability,
  threat: ThreatDef,
  detected: boolean
) {
  if (!detected) return { classified: false, score: 0 };
  const overlap = cap.classification + (cap.assetCount > 2 ? 1 : 0);
  const c2 = cap.decisionSupport * 0.5;
  const integ = cap.integrationBonus * 0.6;
  const score = overlap + c2 + integ - threat.classificationDifficulty * 1.1;
  const classified = score >= 0.5;
  return { classified, score: Math.round(score * 100) / 100 };
}

/**
 * Decision delay = base − C2 capacity − integration + ambiguity + overload.
 * Higher delay means engagement may arrive too late.
 */
export function calculateDecision(
  cap: NodeCapability,
  _threat: ThreatDef,
  classified: boolean,
  overloadPressure: number
) {
  const base = 2;
  const c2 = cap.decisionSupport * 0.4;
  const integ = cap.integrationBonus * 0.3;
  const ambiguity = classified ? 0 : 1.5;
  const overload = overloadPressure * 0.8;
  const delay = Math.max(0, base - c2 - integ + ambiguity + overload);
  return { delay: Math.round(delay * 100) / 100 };
}

/**
 * Engagement = relevant effector strength + C2 bonus − saturation − munitions depletion.
 * Picks the most relevant effector channel for the threat type.
 */
export function calculateEngagement(
  cap: NodeCapability,
  threat: ThreatDef,
  classified: boolean,
  decisionDelay: number,
  saturation: number,
  munitionsFrac: number
) {
  // Choose the channel that best matches the threat.
  let effector = 0;
  switch (threat.type) {
    case "small_uas":
      effector = Math.max(cap.counterUas, cap.ewEffect, cap.engagement * 0.4);
      break;
    case "attack_drone":
      effector = Math.max(cap.counterUas * 0.8, cap.ewEffect * 0.7, cap.engagement * 0.6);
      break;
    case "cruise_type":
      effector = cap.engagement; // needs real surface defence
      break;
    case "decoy":
      effector = Math.max(cap.ewEffect, cap.engagement * 0.3);
      break;
    case "unknown":
      effector = cap.engagement * 0.7 + cap.ewEffect * 0.3;
      break;
  }
  const c2Bonus = cap.decisionSupport * 0.2 + cap.integrationBonus * 0.3;
  const saturationPenalty = saturation * 1.1;
  const munitionsPenalty = (1 - munitionsFrac) * 4;
  const latePenalty = decisionDelay > threat.speedClass + 1 ? 2 : 0;

  const available = effector > 0 && munitionsFrac > 0;
  const score =
    effector + c2Bonus - saturationPenalty - munitionsPenalty - latePenalty;
  const prob = clamp01(0.1 + score * 0.13);
  const engaged = available && classified;
  const succeeded = engaged && prob >= 0.5;
  // Munitions consumed scale with effort against this threat.
  const munitionsUsed = engaged ? Math.max(1, Math.round(threat.saturationWeight)) : 0;
  return {
    engaged,
    succeeded,
    prob: Math.round(prob * 100) / 100,
    munitionsUsed,
    score,
  };
}

/**
 * Consequence = threat consequence − resilience reduction − recovery bonus.
 * Applies when a track leaks (not stopped) and reaches a defended asset.
 */
export function calculateConsequence(
  threat: ThreatDef,
  target: DefendedAsset | null,
  nodeResilience: number
) {
  const raw = threat.consequence + (target ? target.publicConsequence * 0.4 : 0);
  if (raw <= 0) return { dealt: 0, raw: 0, reduction: 0, recoveryTime: 0 };
  const baseRes = target ? target.baselineResilience : 0;
  const reduction = (baseRes + nodeResilience) * 0.6;
  const dealt = Math.max(0, raw - reduction);
  const recoveryTime = target
    ? Math.max(0, target.recoveryDifficulty - nodeResilience * 0.5)
    : 0;
  return {
    dealt: Math.round(dealt * 100) / 100,
    raw: Math.round(raw * 100) / 100,
    reduction: Math.round(reduction * 100) / 100,
    recoveryTime: Math.round(recoveryTime * 100) / 100,
  };
}
