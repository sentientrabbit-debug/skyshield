import type { AssetType, PlacedAsset, Scenario } from "../types/game";
import { ASSET_CATALOGUE, STAGE_LABEL } from "../config/assetCatalogue";

export function StatusPanel({
  scenario,
  selectedAsset,
  placed,
  onRemove,
}: {
  scenario: Scenario;
  selectedAsset: AssetType | null;
  placed: PlacedAsset[];
  onRemove: (instanceId: string) => void;
}) {
  const def = selectedAsset ? ASSET_CATALOGUE[selectedAsset] : null;
  const nodeName = (id: string) =>
    scenario.map.nodes.find((n) => n.id === id)?.name ?? id;

  return (
    <div className="panel panel-pad">
      <div className="panel-title">Selected layer</div>
      {def ? (
        <div style={{ marginBottom: 16 }}>
          <div className="asset-name" style={{ fontSize: 15 }}>{def.displayName}</div>
          <div className="asset-blurb" style={{ marginTop: 4 }}>{def.blurb}</div>
          <div className="faint" style={{ fontFamily: "var(--mono)", fontSize: 11, marginTop: 6 }}>
            Role in the chain: {def.stage.map((s) => STAGE_LABEL[s]).join(" → ")}
          </div>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 13 }}>
          Select a layer from the build menu, then click a map node to place it.
        </p>
      )}

      <div className="panel-title" style={{ marginTop: 8 }}>
        Your placed layers · {placed.length}
      </div>
      {placed.length === 0 && <p className="faint" style={{ fontSize: 12 }}>Nothing placed yet. Start with a way to see threats or protect a priority site.</p>}
      {placed.map((p) => (
        <div key={p.instanceId} className="track-line" style={{ fontSize: 12.5 }}>
          <span style={{ flex: 1 }}>
            {ASSET_CATALOGUE[p.type].displayName}
            <span className="faint"> · {nodeName(p.nodeId)}</span>
          </span>
          <button
            className="btn-ghost"
            style={{ padding: "2px 8px", fontSize: 11 }}
            onClick={() => onRemove(p.instanceId)}
          >
            remove
          </button>
        </div>
      ))}
    </div>
  );
}
