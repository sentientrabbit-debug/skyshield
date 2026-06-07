import type { ScenarioBudget } from "../types/game";

export interface Spend {
  budget: number;
  workforce: number;
  integration: number;
}

function Chip({ k, v, cap }: { k: string; v: number; cap: number }) {
  const frac = cap > 0 ? v / cap : 0;
  const cls = frac > 0.95 ? "crit" : frac > 0.8 ? "low" : "";
  return (
    <div className="stat-chip">
      <span className="k">{k}</span>
      <span className={`v ${cls}`}>
        {v}/{cap}
      </span>
    </div>
  );
}

export function TopBar({
  budget,
  spend,
  onBack,
  right,
}: {
  budget: ScenarioBudget;
  spend: Spend;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      <span className="brand">SKYSHIELD</span>
      {onBack && (
        <button className="btn-ghost" style={{ padding: "6px 12px" }} onClick={onBack}>
          ← Scenarios
        </button>
      )}
      <span className="spacer" />
      <Chip k="Budget" v={spend.budget} cap={budget.budget} />
      <Chip k="People" v={spend.workforce} cap={budget.workforce} />
      <Chip k="Network" v={spend.integration} cap={budget.integration} />
      {right}
    </div>
  );
}
