import { ASSET_CATALOGUE } from "../config/assetCatalogue";
import type { AssetType, PlacedAsset, Scenario } from "../types/game";

const ASSET_TIPS: Record<AssetType, string> = {
  long_range_sensor:
    "Use this when you need earlier warning. It helps you see a track sooner, but you still need command and control and a weapon or other response.",
  local_sensor:
    "Use this near something you care about. It improves the final picture close to the asset, where time is short.",
  passive_sensor:
    "Use this to add a sensing layer that is less obvious in this teaching model. It helps resilience, but gives weaker identification.",
  c2_node:
    "Use this to turn a track into a decision. Without enough command and control, the system may see a threat and still react too slowly.",
  integration_upgrade:
    "Use this to make nearby sensors, command and control and effectors work together. It improves the chain, but uses scarce network capacity.",
  surface_defence:
    "Use this against faster, higher-consequence threats. It is powerful, expensive and limited by munitions.",
  counter_uas:
    "Use this against drones near protected sites. It is efficient against smaller threats, but it is the wrong answer for cruise-type threats.",
  electronic_warfare:
    "Use this against drones, decoys and networked threats. The effect is useful but less certain in this public teaching model.",
  passive_resilience:
    "Use this where you cannot guarantee interception. It reduces damage when something gets through.",
  sustainment:
    "Use this when the scenario has repeated waves. It helps the architecture keep fighting after the first burst of activity.",
};

function countByType(placed: PlacedAsset[]) {
  const has = (type: AssetType) => placed.some((p) => p.type === type);
  return {
    sensor: placed.some((p) => ASSET_CATALOGUE[p.type].stage.includes("sense")),
    c2: has("c2_node"),
    effector: placed.some((p) => {
      const e = ASSET_CATALOGUE[p.type].effects;
      return e.engagement > 0 || e.counterUas > 0 || e.ewEffect > 0;
    }),
    resilience: has("passive_resilience"),
    sustainment: has("sustainment"),
  };
}

export function CoachPanel({
  scenario,
  selectedAsset,
  placed,
}: {
  scenario: Scenario;
  selectedAsset: AssetType | null;
  placed: PlacedAsset[];
}) {
  const c = countByType(placed);
  const missing: string[] = [];
  if (!c.sensor) missing.push("a way to see threats");
  if (!c.c2) missing.push("a way to decide quickly");
  if (!c.effector) missing.push("a way to act");
  if (!c.resilience) missing.push("a way to reduce damage if something leaks through");
  if (!c.sustainment && scenario.threatWaves.length > 1) missing.push("a way to stay effective in later waves");

  return (
    <div className="coach-card">
      <div className="coach-head">
        <span className="coach-avatar">OCSA</span>
        <div>
          <div className="panel-title" style={{ marginBottom: 2 }}>Coach</div>
          <div className="coach-line">Your job is to keep priority sites working through the attack, not to shoot down every dot.</div>
        </div>
      </div>

      {selectedAsset ? (
        <div className="coach-tip">
          <b>{ASSET_CATALOGUE[selectedAsset].displayName}:</b> {ASSET_TIPS[selectedAsset]}
        </div>
      ) : (
        <div className="coach-tip">
          Pick a layer on the left, then place it on the map. Stars mark sites with consequences if hit.
        </div>
      )}

      {missing.length > 0 ? (
        <div className="coach-warning">
          Current gap: add {missing[0]}.
        </div>
      ) : (
        <div className="coach-good">
          You have the basic chain: see, understand, decide, act, absorb and keep going.
        </div>
      )}
    </div>
  );
}
