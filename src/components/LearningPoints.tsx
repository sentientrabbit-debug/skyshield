const POINTS: [string, string][] = [
  ["Seeing is only step one", "A sensor can warn you, but it cannot make a decision or stop a threat by itself."],
  ["Understanding matters", "A radar track or sensor return still needs classification before people can act with confidence."],
  ["Time is a weapon", "Fast threats punish slow decisions. command and control and integration reduce delay in this teaching model."],
  ["Cheap threats can create expensive problems", "A swarm can force a defender to spend attention, people and munitions."],
  ["Munitions are a design constraint", "A plan that wins the first wave may still fail the second or third."],
  ["Resilience changes the result", "Hardening, dispersal and recovery reduce the consequence when something gets through."],
  ["Integration has a cost", "Connected systems perform better, but they also depend on networks, interfaces and governance."],
  ["Evidence quality matters", "Reported or emerging performance should be treated as something to test, not something to assume."],
  ["Good advice says what is still unknown", "The debrief should explain the result and the next evidence gap."],
];

export function LearningPoints() {
  return (
    <div className="learning-points">
      <div className="panel-title">Plain-English learning points</div>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {POINTS.map(([h, b]) => (
          <li key={h}><b>{h}.</b> {b}</li>
        ))}
      </ul>
    </div>
  );
}
