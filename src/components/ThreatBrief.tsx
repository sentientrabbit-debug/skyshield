import { THREAT_LABEL } from "../config/assetCatalogue";
import type { Scenario, ThreatType } from "../types/game";

function threatCounts(scenario: Scenario) {
  const counts = new Map<ThreatType, number>();
  for (const wave of scenario.threatWaves) {
    for (const threat of wave.threats) counts.set(threat.type, (counts.get(threat.type) ?? 0) + 1);
  }
  return [...counts.entries()];
}

export function ThreatBrief({ scenario }: { scenario: Scenario }) {
  const counts = threatCounts(scenario);
  return (
    <div className="panel panel-pad threat-brief">
      <div className="panel-title">Mission brief</div>
      <div className="brief-line">
        <b>Protect:</b> {scenario.defendedAssets.map((a) => a.name).join(", ")}.
      </div>
      <div className="brief-line">
        <b>Incoming:</b> {counts.map(([type, count]) => `${count} ${THREAT_LABEL[type]}`).join(", ")} across {scenario.threatWaves.length} wave{scenario.threatWaves.length === 1 ? "" : "s"}.
      </div>
      <div className="brief-line">
        <b>Win condition:</b> reduce damage and avoid running out of decision capacity or munitions.
      </div>
    </div>
  );
}
