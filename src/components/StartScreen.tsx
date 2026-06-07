import { useState } from "react";

export function StartScreen({ onStart }: { onStart: () => void }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="start-wrap">
      <div className="start-grid-bg" />
      <div className="eyebrow">Synthetic IAMD education · OCSA</div>
      <h1 className="start-title">SKYSHIELD</h1>
      <p className="start-sub">
        Build a layered defence, run the attack, then explain what happened.
      </p>
      <p className="start-blurb">
        Integrated air and missile defence means making a chain work under pressure:
        see the threat, work out what it is, decide what to do, act in time, absorb
        any damage, and stay effective for the next wave. This demo uses fictional
        places, fictional threats and simple teaching rules.
      </p>
      <p className="faint" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
        Fictional data · no real sites · no real systems · not operational modelling
      </p>
      <div className="start-actions">
        <button className="btn-primary" onClick={onStart}>
          Start mission
        </button>
        <button className="btn-ghost" onClick={() => setShowHelp((s) => !s)}>
          How to play
        </button>
      </div>
      {showHelp && (
        <div className="panel panel-pad" style={{ maxWidth: 720, textAlign: "left", marginTop: 8 }}>
          <div className="panel-title">How to play</div>
          <ol className="muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            <li>Choose a fictional scenario. Each one teaches a different pressure point.</li>
            <li>Spend three resources: budget, people and network capacity.</li>
            <li>Place layers on the map: sensors, command and control, weapons, electronic warfare, resilience and sustainment.</li>
            <li>Run the attack. Watch where tracks are detected, classified, engaged or allowed through.</li>
            <li>Use the debrief to explain the trade-off, the weakness and what evidence would be needed next.</li>
          </ol>
          <div className="simple-chain">
            <span>See</span><span>Understand</span><span>Decide</span><span>Act</span><span>Absorb</span><span>Keep going</span>
          </div>
        </div>
      )}
    </div>
  );
}
