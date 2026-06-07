import { JUDGEMENT_LABEL } from "../engine/generateDebrief";
import { STAGE_LABEL, THREAT_LABEL } from "../config/assetCatalogue";
import type { Scenario } from "../types/game";
import type { SimulationResult } from "../types/results";
import { AdviceCard } from "./AdviceCard";

const OUTCOME_LABEL: Record<string, string> = {
  stopped: "Stopped before impact",
  leaked: "Got through",
  mitigated: "Got through, damage reduced",
  wasted_on_decoy: "Effort spent on a decoy",
};

const SCORE_HELP: Record<string, string> = {
  "Tracks seen": "How many incoming tracks were detected before they reached the target area.",
  "Tracks understood": "How many detected tracks were identified well enough for a confident response.",
  "Stopped when engaged": "How often the response succeeded once the system had enough information to act.",
  "Decision delay": "Lower is better. High delay means fast tracks may arrive before the response is ready.",
  "Munitions left": "How much of the starting stock remained after reload and sustainment effects.",
  "Damage score": "A synthetic consequence score after any resilience benefit. Lower is better.",
};

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export function DebriefPanel({
  scenario,
  result,
  onReplay,
  onScenarios,
}: {
  scenario: Scenario;
  result: SimulationResult;
  onReplay: () => void;
  onScenarios: () => void;
}) {
  const s = result.scores;
  return (
    <div className="page">
      <div className="eyebrow">Step 4 · Debrief and advice</div>
      <h2>{scenario.metadata.scenarioName} · synthetic result</h2>
      <div className="judgement-pill">{JUDGEMENT_LABEL[result.judgement]}</div>

      <div className="score-row">
        {[
          ["Tracks seen", pct(s.detectionRate)],
          ["Tracks understood", pct(s.classificationRate)],
          ["Stopped when engaged", pct(s.engagementRate)],
          ["Decision delay", s.avgDecisionDelay.toFixed(1)],
          ["Munitions left", pct(s.munitionsRemainingFrac)],
          ["Damage score", String(s.totalConsequence)],
        ].map(([label, num]) => (
          <div className="score-box" key={label} title={SCORE_HELP[label]}>
            <div className="label">{label}</div>
            <div className="num">{num}</div>
            <div className="score-help">{SCORE_HELP[label]}</div>
          </div>
        ))}
      </div>

      <div className="debrief-grid">
        <div>
          <div className="panel-title">What happened and why</div>
          {result.debrief.map((d) => (
            <div key={d.id} className={`debrief-msg sev-${d.severity}`}>
              <span className="stage-tag">
                {d.stage === "system" ? "Whole chain" : STAGE_LABEL[d.stage]}
              </span>
              <span>{d.message}</span>
            </div>
          ))}

          {result.damage.length > 0 && (
            <>
              <div className="panel-title" style={{ marginTop: 20 }}>Sites hit</div>
              {result.damage.map((d) => (
                <div key={d.assetId} className="track-line">
                  <span className="track-dot dot-leaked" />
                  <b>{d.name}</b>
                  <span className="track-notes">
                    damage {Math.round(d.damage)}
                    {d.resilienceReduction > 0 && ` · resilience absorbed ${Math.round(d.resilienceReduction)}`}
                    {d.recoveryTime > 0 && ` · recovery difficulty ${Math.round(d.recoveryTime)}`}
                  </span>
                </div>
              ))}
            </>
          )}

          <div className="panel-title" style={{ marginTop: 20 }}>Track-by-track</div>
          {result.tracks.map((t) => (
            <div key={t.threatId} className="track-line" style={{ alignItems: "flex-start" }}>
              <span className={`track-dot dot-${t.outcome}`} style={{ marginTop: 5 }} />
              <div>
                <b>{THREAT_LABEL[t.type]}</b>{" "}
                <span className="track-notes">· {OUTCOME_LABEL[t.outcome]}</span>
                {t.notes.length > 0 && (
                  <div className="track-notes">{t.notes.join(" ")}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <AdviceCard card={result.adviceCard} />
      </div>

      <div className="start-actions" style={{ justifyContent: "flex-start", marginTop: 24 }}>
        <button className="btn-primary" onClick={onReplay}>Adjust defence plan</button>
        <button className="btn-ghost" onClick={onScenarios}>Choose another scenario</button>
      </div>
    </div>
  );
}
