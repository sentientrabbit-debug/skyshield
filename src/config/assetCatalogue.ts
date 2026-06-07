// The ten MVP defensive asset families.
// All values are fictional and for educational illustration only.

import type { AssetType, DefenceAssetDef } from "../types/game";

const zero = {
  detection: 0,
  classification: 0,
  decisionSupport: 0,
  engagement: 0,
  counterUas: 0,
  ewEffect: 0,
  resilience: 0,
  sustainment: 0,
  integrationBonus: 0,
};

export const ASSET_CATALOGUE: Record<AssetType, DefenceAssetDef> = {
  long_range_sensor: {
    type: "long_range_sensor",
    displayName: "Long-range sensor",
    blurb:
      "Gives earlier warning across a wide area. It helps you see something is coming, but it cannot stop the track by itself.",
    stage: ["sense"],
    cost: 4,
    workforce: 2,
    integrationLoad: 2,
    effects: { ...zero, detection: 4, classification: 1 },
    evidenceConfidence: "reported",
  },
  local_sensor: {
    type: "local_sensor",
    displayName: "Local sensor",
    blurb:
      "Watches a smaller area near a protected site. It improves the close-in picture where there is less time to react.",
    stage: ["sense"],
    cost: 3,
    workforce: 1,
    integrationLoad: 1,
    effects: { ...zero, detection: 3, classification: 2 },
    evidenceConfidence: "proven",
  },
  passive_sensor: {
    type: "passive_sensor",
    displayName: "Passive sensor",
    blurb:
      "Looks or listens without transmitting in this teaching model. It is harder to disrupt, but gives weaker identification.",
    stage: ["sense"],
    cost: 3,
    workforce: 1,
    integrationLoad: 1,
    effects: { ...zero, detection: 2, classification: 0, resilience: 1 },
    evidenceConfidence: "emerging",
  },
  c2_node: {
    type: "c2_node",
    displayName: "Command and control node",
    blurb:
      "Turns tracks into decisions. It helps the system decide faster, but one overworked command node can become a bottleneck.",
    stage: ["classify", "decide"],
    cost: 5,
    workforce: 3,
    integrationLoad: 2,
    effects: { ...zero, classification: 3, decisionSupport: 4 },
    evidenceConfidence: "proven",
  },
  integration_upgrade: {
    type: "integration_upgrade",
    displayName: "Network integration",
    blurb:
      "Connects nearby sensors, command nodes and effectors so information moves faster. Useful, but it uses scarce network capacity.",
    stage: ["classify", "decide", "act"],
    cost: 4,
    workforce: 1,
    integrationLoad: 3,
    effects: { ...zero, integrationBonus: 3, decisionSupport: 1 },
    evidenceConfidence: "reported",
  },
  surface_defence: {
    type: "surface_defence",
    displayName: "Surface defence unit",
    blurb:
      "The main answer to faster, higher-consequence threats. Powerful, but expensive and limited by munitions.",
    stage: ["act"],
    cost: 6,
    workforce: 3,
    integrationLoad: 2,
    effects: { ...zero, engagement: 5 },
    evidenceConfidence: "proven",
  },
  counter_uas: {
    type: "counter_uas",
    displayName: "Counter-drone unit",
    blurb:
      "Good local protection against drones. It is efficient against smaller threats, but weak against faster cruise-type threats.",
    stage: ["act"],
    cost: 3,
    workforce: 2,
    integrationLoad: 1,
    effects: { ...zero, counterUas: 5, engagement: 1 },
    evidenceConfidence: "reported",
  },
  electronic_warfare: {
    type: "electronic_warfare",
    displayName: "Electronic warfare unit",
    blurb:
      "Disrupts some drones and decoys in this teaching model. Useful, but the effect is less certain than a simple intercept.",
    stage: ["act"],
    cost: 4,
    workforce: 2,
    integrationLoad: 2,
    effects: { ...zero, ewEffect: 4 },
    evidenceConfidence: "emerging",
  },
  passive_resilience: {
    type: "passive_resilience",
    displayName: "Resilience package",
    blurb:
      "Hardening, dispersal, backups and repair plans. It does not stop a threat, but it reduces damage if one gets through.",
    stage: ["recover"],
    cost: 3,
    workforce: 1,
    integrationLoad: 0,
    effects: { ...zero, resilience: 5 },
    evidenceConfidence: "proven",
  },
  sustainment: {
    type: "sustainment",
    displayName: "Sustainment package",
    blurb:
      "Reloads, repairs and keeps people and systems operating through repeated waves. It helps later in the fight, not at first contact.",
    stage: ["sustain"],
    cost: 4,
    workforce: 2,
    integrationLoad: 1,
    effects: { ...zero, sustainment: 5 },
    evidenceConfidence: "reported",
  },
};

export const ASSET_ORDER: AssetType[] = [
  "long_range_sensor",
  "local_sensor",
  "passive_sensor",
  "c2_node",
  "integration_upgrade",
  "surface_defence",
  "counter_uas",
  "electronic_warfare",
  "passive_resilience",
  "sustainment",
];

export const STAGE_LABEL: Record<string, string> = {
  sense: "See",
  classify: "Understand",
  decide: "Decide",
  act: "Act",
  sustain: "Keep going",
  recover: "Recover",
};

export const EVIDENCE_LABEL: Record<string, string> = {
  proven: "Tested",
  reported: "Reported",
  emerging: "Still maturing",
  vendor_claim: "Claim only",
};

export const THREAT_LABEL: Record<string, string> = {
  small_uas: "Small drone",
  attack_drone: "Attack drone",
  cruise_type: "Cruise-type threat",
  decoy: "Decoy",
  unknown: "Unknown track",
};
