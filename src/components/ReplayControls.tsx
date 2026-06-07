export function ReplayControls({
  playing,
  tick,
  totalTicks,
  onToggle,
  onRestart,
  onSkip,
}: {
  playing: boolean;
  tick: number;
  totalTicks: number;
  onToggle: () => void;
  onRestart: () => void;
  onSkip: () => void;
}) {
  const pct = totalTicks > 0 ? Math.min(100, (tick / totalTicks) * 100) : 0;
  return (
    <div className="replay-controls">
      <button onClick={onToggle} style={{ minWidth: 92 }}>
        {playing ? "Pause" : "Play"}
      </button>
      <button className="btn-ghost" onClick={onRestart}>Restart</button>
      <div className="tick-bar">
        <div className="tick-fill" style={{ width: `${pct}%` }} />
      </div>
      <button className="btn-ghost" onClick={onSkip}>Skip to debrief</button>
    </div>
  );
}
