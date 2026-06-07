import type { ScenarioListing } from "../config/loadScenario";

export function ScenarioSelect({
  scenarios,
  onSelect,
}: {
  scenarios: ScenarioListing[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="page">
      <div className="eyebrow">Step 1 · Choose the problem</div>
      <h2>Choose a synthetic scenario</h2>
      <p className="muted" style={{ maxWidth: 720 }}>
        These scenarios use fictional geography and simplified rules. The aim is to
        teach judgement: what you protect, where you place layers, and what you can
        honestly say after the run.
      </p>
      <div className="scenario-grid">
        {scenarios.map(({ id, scenario }) => {
          const m = scenario.metadata;
          return (
            <button key={id} className="scenario-card" onClick={() => onSelect(id)}>
              <h3>{m.scenarioName}</h3>
              <div className="muted">{m.description}</div>
              <div className="focus">Player lesson: {m.learningFocus}</div>
              <span className={`diff ${m.difficulty}`}>{m.difficulty}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
