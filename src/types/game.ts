// Core domain types for SKYSHIELD.
// PUBLIC SYNTHETIC TRAINING VERSION: NOT AN OPERATIONAL MODEL.

export type ThreatType =
  | "small_uas"
  | "attack_drone"
  | "cruise_type"
  | "decoy"
  | "unknown";

export type EvidenceConfidence =
  | "proven"
  | "reported"
  | "emerging"
  | "vendor_claim";

/** The ten MVP asset families. */
export type AssetType =
  | "long_range_sensor"
  | "local_sensor"
  | "passive_sensor"
  | "c2_node"
  | "integration_upgrade"
  | "surface_defence"
  | "counter_uas"
  | "electronic_warfare"
  | "passive_resilience"
  | "sustainment";

/** Stage in the educational pipeline: Sense → Classify → Decide → Act → Sustain → Recover. */
export type PipelineStage =
  | "sense"
  | "classify"
  | "decide"
  | "act"
  | "sustain"
  | "recover";

export interface AssetEffects {
  detection: number;
  classification: number;
  decisionSupport: number;
  engagement: number;
  counterUas: number;
  ewEffect: number;
  resilience: number;
  sustainment: number;
  integrationBonus: number;
}

/** A definition of a buildable asset (from scenario config / catalogue). */
export interface DefenceAssetDef {
  type: AssetType;
  displayName: string;
  blurb: string;
  stage: PipelineStage[];
  cost: number;
  workforce: number;
  integrationLoad: number;
  effects: AssetEffects;
  evidenceConfidence: EvidenceConfidence;
}

/** An asset the player has actually placed on a node. */
export interface PlacedAsset {
  instanceId: string;
  type: AssetType;
  nodeId: string;
}

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface DefendedAsset {
  id: string;
  name: string;
  nodeId: string;
  operationalValue: number;
  publicConsequence: number;
  baselineResilience: number;
  recoveryDifficulty: number;
}

export interface ThreatDef {
  type: ThreatType;
  route: string[];
  detectability: number;
  classificationDifficulty: number;
  speedClass: number;
  consequence: number;
  saturationWeight: number;
}

export interface ThreatWave {
  id: string;
  name: string;
  threats: ThreatDef[];
}

export interface ScenarioBudget {
  budget: number;
  workforce: number;
  integration: number;
  munitions: number;
}

export interface ScenarioMeta {
  scenarioName: string;
  classification: string;
  version: string;
  description: string;
  learningFocus: string;
  difficulty: "Introductory" | "Moderate" | "Demanding" | "Tutorial";
}

/** A scenario-specific objective, evaluated against the result after a run. */
export interface ScenarioObjective {
  id: string;
  /** Plain-English statement shown before and after the run. */
  label: string;
  /** Machine kind used by the evaluator. */
  kind:
    | "protect_asset_below" // damage to a named asset stays under `value`
    | "total_consequence_below" // total damage under `value`
    | "engagement_rate_above" // engagement success fraction over `value`
    | "munitions_remaining_above" // fraction of munitions left over `value`
    | "detection_rate_above"; // detection fraction over `value`
  value: number;
  assetId?: string;
}

/** Optional guided-tutorial step shown during the build phase. */
export interface TutorialStep {
  id: string;
  text: string;
  /** Advance when this asset type has been placed (anywhere or on `nodeId`). */
  requireAssetType?: AssetType;
  requireNodeId?: string;
  /** Or simply advance on the player pressing "next". */
  freeform?: boolean;
}

export interface Scenario {
  metadata: ScenarioMeta;
  budget: ScenarioBudget;
  map: {
    nodes: MapNode[];
    links: [string, string][];
  };
  defendedAssets: DefendedAsset[];
  availableDefenceAssets: AssetType[];
  threatWaves: ThreatWave[];
  objectives?: ScenarioObjective[];
  tutorial?: TutorialStep[];
}
