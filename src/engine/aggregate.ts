// Shared engine helpers. Aggregates placed assets into capability totals
// per node and across the architecture, and provides adjacency utilities.

import { ASSET_CATALOGUE } from "../config/assetCatalogue";
import type {
  AssetEffects,
  PlacedAsset,
  Scenario,
} from "../types/game";

export interface NodeCapability extends AssetEffects {
  hasC2: boolean;
  hasSensor: boolean;
  hasEffector: boolean;
  assetCount: number;
}

const emptyCap = (): NodeCapability => ({
  detection: 0,
  classification: 0,
  decisionSupport: 0,
  engagement: 0,
  counterUas: 0,
  ewEffect: 0,
  resilience: 0,
  sustainment: 0,
  integrationBonus: 0,
  hasC2: false,
  hasSensor: false,
  hasEffector: false,
  assetCount: 0,
});

function addEffects(cap: NodeCapability, e: AssetEffects) {
  cap.detection += e.detection;
  cap.classification += e.classification;
  cap.decisionSupport += e.decisionSupport;
  cap.engagement += e.engagement;
  cap.counterUas += e.counterUas;
  cap.ewEffect += e.ewEffect;
  cap.resilience += e.resilience;
  cap.sustainment += e.sustainment;
  cap.integrationBonus += e.integrationBonus;
}

/** Build adjacency map from scenario links (undirected). */
export function buildAdjacency(scenario: Scenario): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of scenario.map.nodes) adj.set(n.id, new Set());
  for (const [a, b] of scenario.map.links) {
    adj.get(a)?.add(b);
    adj.get(b)?.add(a);
  }
  return adj;
}

/** Capability physically present at each node. */
export function capabilityByNode(
  placed: PlacedAsset[]
): Map<string, NodeCapability> {
  const map = new Map<string, NodeCapability>();
  for (const p of placed) {
    const def = ASSET_CATALOGUE[p.type];
    if (!map.has(p.nodeId)) map.set(p.nodeId, emptyCap());
    const cap = map.get(p.nodeId)!;
    addEffects(cap, def.effects);
    cap.assetCount += 1;
    if (def.stage.includes("classify") || def.stage.includes("decide"))
      cap.hasC2 = cap.hasC2 || def.type === "c2_node";
    if (def.stage.includes("sense")) cap.hasSensor = true;
    if (
      def.effects.engagement > 0 ||
      def.effects.counterUas > 0 ||
      def.effects.ewEffect > 0
    )
      cap.hasEffector = true;
  }
  return map;
}

/**
 * Effective capability "seen" at a node, including a fraction of capability
 * from directly adjacent nodes. This rewards layered, connected layouts.
 */
export function effectiveCapabilityAt(
  nodeId: string,
  byNode: Map<string, NodeCapability>,
  adj: Map<string, Set<string>>,
  spill = 0.4
): NodeCapability {
  const base = byNode.get(nodeId) ?? emptyCap();
  const out = { ...base };
  for (const neighbour of adj.get(nodeId) ?? []) {
    const n = byNode.get(neighbour);
    if (!n) continue;
    out.detection += n.detection * spill;
    out.classification += n.classification * spill;
    out.decisionSupport += n.decisionSupport * spill;
    out.engagement += n.engagement * spill;
    out.counterUas += n.counterUas * spill;
    out.ewEffect += n.ewEffect * spill;
    // resilience & sustainment are local; integration bonus spills lightly
    out.integrationBonus += n.integrationBonus * spill;
  }
  return out;
}

export interface ArchitectureTotals extends AssetEffects {
  c2Count: number;
  sensorCount: number;
  effectorCount: number;
  resiliencePackages: number;
  sustainmentPackages: number;
  integrationUpgrades: number;
  totalAssets: number;
  distinctNodesUsed: number;
}

export function architectureTotals(placed: PlacedAsset[]): ArchitectureTotals {
  const t: ArchitectureTotals = {
    detection: 0,
    classification: 0,
    decisionSupport: 0,
    engagement: 0,
    counterUas: 0,
    ewEffect: 0,
    resilience: 0,
    sustainment: 0,
    integrationBonus: 0,
    c2Count: 0,
    sensorCount: 0,
    effectorCount: 0,
    resiliencePackages: 0,
    sustainmentPackages: 0,
    integrationUpgrades: 0,
    totalAssets: placed.length,
    distinctNodesUsed: new Set(placed.map((p) => p.nodeId)).size,
  };
  for (const p of placed) {
    const def = ASSET_CATALOGUE[p.type];
    t.detection += def.effects.detection;
    t.classification += def.effects.classification;
    t.decisionSupport += def.effects.decisionSupport;
    t.engagement += def.effects.engagement;
    t.counterUas += def.effects.counterUas;
    t.ewEffect += def.effects.ewEffect;
    t.resilience += def.effects.resilience;
    t.sustainment += def.effects.sustainment;
    t.integrationBonus += def.effects.integrationBonus;
    if (def.type === "c2_node") t.c2Count += 1;
    if (def.stage.includes("sense")) t.sensorCount += 1;
    if (def.effects.engagement > 0 || def.effects.counterUas > 0) t.effectorCount += 1;
    if (def.type === "passive_resilience") t.resiliencePackages += 1;
    if (def.type === "sustainment") t.sustainmentPackages += 1;
    if (def.type === "integration_upgrade") t.integrationUpgrades += 1;
  }
  return t;
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
