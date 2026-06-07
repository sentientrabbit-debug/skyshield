import type { Scenario } from "../types/game";
import type { SimulationResult, StarRating } from "../types/results";

const STAR_AXES: [keyof StarRating, string, string][] = [
  ["protection", "Protection", "How well your priority sites came through the attack."],
  ["efficiency", "Efficiency", "Value protected for the resources you spent."],
  ["evidence", "Evidence", "How much you relied on proven rather than emerging kit."],
];

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`star ${i < n ? "on" : ""}`}>★</span>
      ))}
    </span>
  );
}

function headline(total: number): { title: string; tone: string } {
  if (total >= 8) return { title: "Outstanding defence", tone: "good" };
  if (total >= 6) return { title: "Solid defence", tone: "good" };
  if (total >= 4) return { title: "Held, but with gaps", tone: "warn" };
  if (total >= 2) return { title: "Under pressure", tone: "warn" };
  return { title: "Overwhelmed", tone: "bad" };
}

export function ScoreScreen({
  scenario,
  result,
  onSeeDebrief,
  onReplay,
  onScenarios,
}: {
  scenario: Scenario;
  result: SimulationResult;
  onSeeDebrief: () => void;
  onReplay: () => void;
  onScenarios: () => void;
}) {
  const h = headline(result.stars.total);
  const objectives = result.objectives;
  const metCount = objectives.filter((o) => o.met).length;

  return (
    <div className="page score-screen">
      <div className="eyebrow">Step 4 · Result</div>
      <h2 className={`score-headline tone-${h.tone}`}>{h.title}</h2>
      <p className="muted" style={{ maxWidth: 620 }}>
        {scenario.metadata.scenarioName} — a synthetic run. Your score reflects how
        the whole chain performed, not just how many tracks you stopped.
      </p>

      <div className="star-row">
        {STAR_AXES.map(([key, label, help]) => (
          <div className="star-box" key={key}>
            <div className="star-label">{label}</div>
            <Stars n={result.stars[key] as number} />
            <div className="star-help">{help}</div>
          </div>
        ))}
      </div>

      {objectives.length > 0 && (
        <div className="objective-block">
          <div className="panel-title">
            Mission objectives · {metCount} of {objectives.length} met
          </div>
          {objectives.map((o) => (
            <div key={o.id} className={`objective-line ${o.met ? "met" : "missed"}`}>
              <span className="obj-mark">{o.met ? "✓" : "✕"}</span>
              <span>
                <b>{o.label}</b>
                <span className="obj-detail"> — {o.detail}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="tips-block">
        <div className="panel-title">Try this next</div>
        {result.tips.map((t, i) => (
          <div key={i} className="tip-line">→ {t}</div>
        ))}
      </div>

      <div className="start-actions" style={{ justifyContent: "flex-start", marginTop: 22 }}>
        <button className="btn-primary" onClick={onReplay}>Adjust and retry</button>
        <button className="btn-ghost" onClick={onSeeDebrief}>See full debrief</button>
        <button className="btn-ghost" onClick={onScenarios}>Choose another scenario</button>
      </div>
    </div>
  );
}
