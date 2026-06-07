import { ASSET_CATALOGUE, ASSET_ORDER, EVIDENCE_LABEL } from "../config/assetCatalogue";
import type { AssetType } from "../types/game";
import { useTooltip } from "./Tooltip";

export function BuildPanel({
  available,
  selected,
  affordable,
  onSelect,
}: {
  available: AssetType[];
  selected: AssetType | null;
  affordable: (t: AssetType) => boolean;
  onSelect: (t: AssetType) => void;
}) {
  const tip = useTooltip();
  const order = ASSET_ORDER.filter((t) => available.includes(t));
  return (
    <div className="panel panel-pad">
      <div className="panel-title">Build menu</div>
      <p className="faint" style={{ fontSize: 12, marginTop: -4 }}>
        Costs are shown as budget · people · network. Network means integration effort.
      </p>
      {order.map((t) => {
        const def = ASSET_CATALOGUE[t];
        const aff = affordable(t);
        const sel = selected === t;
        return (
          <button
            key={t}
            className={`asset-item panel ${sel ? "selected" : ""} ${aff ? "" : "unaffordable"}`}
            onClick={() => aff && onSelect(t)}
            disabled={!aff}
            {...tip.bind(def.displayName, def.blurb)}
          >
            <div className="asset-row">
              <span className="asset-name">{def.displayName}</span>
              <span className="asset-cost">
                {def.cost} budget · {def.workforce} people · {def.integrationLoad} net
              </span>
            </div>
            <div className="asset-blurb">{def.blurb}</div>
            <span className={`ev-tag ev-${def.evidenceConfidence}`}>
              Evidence: {EVIDENCE_LABEL[def.evidenceConfidence]}
            </span>
          </button>
        );
      })}
      <p className="faint" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
        Select a layer, then click a map node to place it. Click the small numbered badge on a node to remove the most recent layer there.
      </p>
    </div>
  );
}
