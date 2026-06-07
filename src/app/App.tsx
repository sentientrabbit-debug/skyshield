import { useEffect, useMemo, useRef, useState } from "react";
import { SyntheticBanner } from "../components/SyntheticBanner";
import { StartScreen } from "../components/StartScreen";
import { ScenarioSelect } from "../components/ScenarioSelect";
import { BuildPanel } from "../components/BuildPanel";
import { StatusPanel } from "../components/StatusPanel";
import { CoachPanel } from "../components/CoachPanel";
import { ThreatBrief } from "../components/ThreatBrief";
import { MapView } from "../components/MapView";
import { ReplayControls } from "../components/ReplayControls";
import { useReplay } from "../components/useReplay";
import { DebriefPanel } from "../components/DebriefPanel";
import { ScoreScreen } from "../components/ScoreScreen";
import { TutorialCoach, useTutorialProgress } from "../components/TutorialCoach";
import { LearningPoints } from "../components/LearningPoints";
import { TopBar, type Spend } from "../components/TopBar";
import { TooltipProvider, useTooltip } from "../components/Tooltip";
import { loadScenarios } from "../config/loadScenario";
import { ASSET_CATALOGUE } from "../config/assetCatalogue";
import { simulateScenario } from "../engine/simulateScenario";
import { playCue, setMuted, isMuted, unlockAudio } from "../engine/sound";
import type { AssetType, PlacedAsset, Scenario } from "../types/game";
import type { SimulationResult } from "../types/results";

type Phase = "start" | "select" | "build" | "run" | "score" | "debrief";

let instanceCounter = 0;

export function App() {
  return (
    <TooltipProvider>
      <Game />
    </TooltipProvider>
  );
}

function Game() {
  const tooltip = useTooltip();
  const scenarios = useMemo(() => loadScenarios(), []);
  const facilitator = useMemo(
    () => new URLSearchParams(window.location.search).get("mode") === "facilitator",
    []
  );

  const [phase, setPhase] = useState<Phase>("start");
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedAsset[]>([]);
  const [selected, setSelected] = useState<AssetType | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showLearning, setShowLearning] = useState(false);
  const [tutorialOn, setTutorialOn] = useState(true);
  const [freeformAdvanced, setFreeformAdvanced] = useState(0);
  const [muted, setMutedState] = useState(isMuted());

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  const scenario: Scenario | null = useMemo(
    () => scenarios.find((s) => s.id === scenarioId)?.scenario ?? null,
    [scenarios, scenarioId]
  );

  const spend: Spend = useMemo(() => {
    let budget = 0, workforce = 0, integration = 0;
    for (const p of placed) {
      const d = ASSET_CATALOGUE[p.type];
      budget += d.cost; workforce += d.workforce; integration += d.integrationLoad;
    }
    return { budget, workforce, integration };
  }, [placed]);

  function affordable(t: AssetType): boolean {
    if (!scenario) return false;
    const d = ASSET_CATALOGUE[t];
    return (
      spend.budget + d.cost <= scenario.budget.budget &&
      spend.workforce + d.workforce <= scenario.budget.workforce &&
      spend.integration + d.integrationLoad <= scenario.budget.integration
    );
  }

  function startScenario(id: string) {
    setScenarioId(id);
    setPlaced([]);
    setSelected(null);
    setResult(null);
    setFreeformAdvanced(0);
    setTutorialOn(true);
    setPhase("build");
  }

  function placeAsset(nodeId: string) {
    if (!selected || !affordable(selected)) return;
    setPlaced((p) => [...p, { instanceId: `i${instanceCounter++}`, type: selected, nodeId }]);
  }
  function removeAsset(instanceId: string) {
    setPlaced((p) => p.filter((x) => x.instanceId !== instanceId));
  }

  function run() {
    if (!scenario) return;
    unlockAudio();
    setResult(simulateScenario(scenario, placed));
    setPhase("run");
  }

  // Guided tutorial progress (only for scenarios that define a tutorial).
  const tutorialSteps = scenario?.tutorial;
  const tutorialIndex = useTutorialProgress(tutorialSteps, placed, freeformAdvanced);
  const tutorialActive =
    tutorialOn &&
    phase === "build" &&
    !!tutorialSteps &&
    tutorialIndex < (tutorialSteps?.length ?? 0);

  return (
    <div className="app-shell">
      <SyntheticBanner />
      {facilitator && (
        <div className="facilitator-bar">
          <span className="ftag">Facilitator mode</span>
          <span style={{ flex: 1 }} />
          {scenario && phase !== "select" && phase !== "start" && (
            <button style={{ padding: "4px 10px" }} onClick={() => startScenario(scenarioId!)}>Quick reset</button>
          )}
          <button style={{ padding: "4px 10px" }} onClick={() => setPhase("select")}>Scenarios</button>
          {result && (
            <button style={{ padding: "4px 10px" }} onClick={() => setShowLearning((v) => !v)}>
              {showLearning ? "Hide" : "Show"} learning points
            </button>
          )}
        </div>
      )}

      {phase === "start" && <StartScreen onStart={() => setPhase("select")} />}

      {phase === "select" && (
        <ScenarioSelect scenarios={scenarios} onSelect={startScenario} />
      )}

      {phase === "build" && scenario && (
        <>
          <TopBar budget={scenario.budget} spend={spend} onBack={() => setPhase("select")} />
          <div className="page">
            <div className="eyebrow">Step 2 · Build your defence plan</div>
            <h2>{scenario.metadata.scenarioName}</h2>
            <p className="muted" style={{ maxWidth: 680 }}>{scenario.metadata.description}</p>
            <div className="build-layout" style={{ marginTop: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {tutorialActive && tutorialSteps && (
                  <TutorialCoach
                    scenario={scenario}
                    stepIndex={tutorialIndex}
                    totalSteps={tutorialSteps.length}
                    onNext={() => setFreeformAdvanced((n) => n + 1)}
                    onSkip={() => setTutorialOn(false)}
                  />
                )}
                <CoachPanel scenario={scenario} selectedAsset={selected} placed={placed} />
                <ThreatBrief scenario={scenario} />
                <BuildPanel
                  available={scenario.availableDefenceAssets}
                  selected={selected}
                  affordable={affordable}
                  onSelect={(t) => setSelected((s) => (s === t ? null : t))}
                />
                <StatusPanel
                  scenario={scenario}
                  selectedAsset={selected}
                  placed={placed}
                  onRemove={removeAsset}
                />
              </div>
              <div className="panel">
                <MapView
                  scenario={scenario}
                  placed={placed}
                  tooltip={tooltip}
                  selectedAsset={selected}
                  onPlace={placeAsset}
                  onRemove={removeAsset}
                />
                <div className="hint-bar">
                  <span className="muted">
                    {selected
                      ? `Placing: ${ASSET_CATALOGUE[selected].displayName}. Click the node you want it to protect or support.`
                      : "Select a layer, then click a map node. Stars are the sites you are trying to protect."}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button className="btn-primary" disabled={placed.length === 0} onClick={run}>
                    Run Scenario →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {phase === "run" && scenario && result && (
        <RunScreen
          scenario={scenario}
          placed={placed}
          result={result}
          spend={spend}
          muted={muted}
          onToggleMute={toggleMute}
          onDebrief={() => setPhase("score")}
          onBack={() => setPhase("build")}
        />
      )}

      {phase === "score" && scenario && result && (
        <>
          <TopBar budget={scenario.budget} spend={spend} onBack={() => setPhase("select")} />
          <ScoreScreen
            scenario={scenario}
            result={result}
            onSeeDebrief={() => setPhase("debrief")}
            onReplay={() => setPhase("build")}
            onScenarios={() => setPhase("select")}
          />
        </>
      )}

      {phase === "debrief" && scenario && result && (
        <>
          <TopBar budget={scenario.budget} spend={spend} onBack={() => setPhase("score")} />
          <DebriefPanel
            scenario={scenario}
            result={result}
            onReplay={() => setPhase("build")}
            onScenarios={() => setPhase("select")}
          />
          {(!facilitator || showLearning) && (
            <div className="page" style={{ paddingTop: 0 }}><LearningPoints /></div>
          )}
        </>
      )}
    </div>
  );
}

function RunScreen({
  scenario, placed, result, spend, muted, onToggleMute, onDebrief, onBack,
}: {
  scenario: Scenario;
  placed: PlacedAsset[];
  result: SimulationResult;
  spend: Spend;
  muted: boolean;
  onToggleMute: () => void;
  onDebrief: () => void;
  onBack: () => void;
}) {
  const tooltip = useTooltip();
  const { tick, playing, done, pause, restart } = useReplay(result.totalTicks);
  const lastTick = useRef(-1);
  const [flash, setFlash] = useState(false);

  // Live tally up to the current tick.
  const live = useMemo(() => {
    let stopped = 0, through = 0, spawned = 0;
    for (const e of result.events) {
      if (e.t > tick) continue;
      if (e.kind === "spawn") spawned++;
      else if (e.kind === "engage_hit") stopped++;
      else if (e.kind === "consequence") through++;
    }
    return { stopped, through, spawned };
  }, [result.events, tick]);

  // Fire sound cues + impact flash as the clock crosses each tick once.
  useEffect(() => {
    if (tick === lastTick.current) return;
    const crossed = result.events.filter((e) => e.t === tick);
    let impacted = false;
    for (const e of crossed) {
      switch (e.kind) {
        case "detect": playCue("detect"); break;
        case "classify": playCue("classify"); break;
        case "engage_attempt": playCue("engage"); break;
        case "engage_hit": playCue("hit"); break;
        case "consequence": playCue("impact"); impacted = true; break;
      }
    }
    if (impacted) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 280);
      lastTick.current = tick;
      return () => clearTimeout(id);
    }
    lastTick.current = tick;
  }, [tick, result.events]);

  // A small win cue the first time the run completes cleanly.
  useEffect(() => {
    if (done && result.scores.totalConsequence === 0) playCue("win");
  }, [done, result.scores.totalConsequence]);

  return (
    <>
      <TopBar
        budget={scenario.budget}
        spend={spend}
        onBack={onBack}
        right={
          <button className="btn-ghost mute-btn" onClick={onToggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? "Sound off" : "Sound on"}
          </button>
        }
      />
      <div className={`page run-page ${flash ? "impact-flash" : ""}`}>
        <div className="eyebrow">Step 3 · Watch the attack unfold</div>
        <h2>{scenario.metadata.scenarioName}</h2>

        {/* Live HUD */}
        <div className="run-hud">
          <div className="hud-stat hud-incoming">
            <span className="hud-num">{live.spawned}</span>
            <span className="hud-label">Incoming</span>
          </div>
          <div className="hud-stat hud-stopped">
            <span className="hud-num">{live.stopped}</span>
            <span className="hud-label">Stopped</span>
          </div>
          <div className="hud-stat hud-through">
            <span className="hud-num">{live.through}</span>
            <span className="hud-label">Got through</span>
          </div>
          <span style={{ flex: 1 }} />
          <div className="hud-stat">
            <span className="hud-num">{tick}/{result.totalTicks}</span>
            <span className="hud-label">Timeline</span>
          </div>
        </div>

        <p className="muted run-legend">
          <span className="lg lg-track">Red</span> incoming track ·
          <span className="lg lg-detect"> Cyan ring</span> detected ·
          <span className="lg lg-classify"> Purple pulse</span> identified ·
          <span className="lg lg-stop"> Green</span> stopped ·
          <span className="lg lg-impact"> ✕</span> got through.
          This shows the teaching logic, not physics.
        </p>

        <div className="panel run-stage" style={{ marginTop: 12 }}>
          <MapView scenario={scenario} placed={placed} tooltip={tooltip} result={result} tick={tick} />
          <ReplayControls
            playing={playing}
            tick={tick}
            totalTicks={result.totalTicks}
            onToggle={pause}
            onRestart={() => { lastTick.current = -1; restart(); }}
            onSkip={onDebrief}
          />
        </div>

        {done && (
          <div className="start-actions" style={{ justifyContent: "flex-start", marginTop: 16 }}>
            <button className="btn-primary" onClick={onDebrief}>See your result →</button>
            <button className="btn-ghost" onClick={() => { lastTick.current = -1; restart(); }}>Watch again</button>
          </div>
        )}
      </div>
    </>
  );
}
