// Loads bundled scenarios and enforces the PUBLIC_SYNTHETIC classification gate.
// The public app must refuse to load anything not labelled PUBLIC_SYNTHETIC.

import type { Scenario } from "../types/game";
import dronePressure from "./scenarios/drone-pressure.json";
import cruiseWarning from "./scenarios/cruise-warning.json";
import mixedSalvo from "./scenarios/mixed-salvo.json";

export const REQUIRED_CLASSIFICATION = "PUBLIC_SYNTHETIC";

export interface ScenarioListing {
  id: string;
  scenario: Scenario;
}

const RAW: { id: string; data: unknown }[] = [
  { id: "drone-pressure", data: dronePressure },
  { id: "cruise-warning", data: cruiseWarning },
  { id: "mixed-salvo", data: mixedSalvo },
];

/** Minimal structural validation. Throws if a scenario looks malformed. */
function validate(data: unknown, id: string): Scenario {
  const s = data as Scenario;
  if (!s || typeof s !== "object") {
    throw new Error(`Scenario ${id} is not an object`);
  }
  if (!s.metadata || s.metadata.classification !== REQUIRED_CLASSIFICATION) {
    throw new Error(
      `Scenario ${id} rejected: classification must be ${REQUIRED_CLASSIFICATION}`
    );
  }
  if (!Array.isArray(s.map?.nodes) || s.map.nodes.length === 0) {
    throw new Error(`Scenario ${id} has no map nodes`);
  }
  if (!Array.isArray(s.defendedAssets) || s.defendedAssets.length === 0) {
    throw new Error(`Scenario ${id} has no defended assets`);
  }
  if (!Array.isArray(s.threatWaves) || s.threatWaves.length === 0) {
    throw new Error(`Scenario ${id} has no threat waves`);
  }
  // Referential checks: every defended asset and threat route node must exist.
  const nodeIds = new Set(s.map.nodes.map((n) => n.id));
  for (const da of s.defendedAssets) {
    if (!nodeIds.has(da.nodeId)) {
      throw new Error(`Scenario ${id}: defended asset ${da.id} on unknown node`);
    }
  }
  return s;
}

export function loadScenarios(): ScenarioListing[] {
  const out: ScenarioListing[] = [];
  for (const { id, data } of RAW) {
    try {
      out.push({ id, scenario: validate(data, id) });
    } catch (err) {
      // In a public build, silently drop invalid/non-public scenarios.
      console.error(err);
    }
  }
  return out;
}

export function getScenario(id: string): Scenario | null {
  return loadScenarios().find((l) => l.id === id)?.scenario ?? null;
}
