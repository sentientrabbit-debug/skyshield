import type { AdviceCard as AdviceCardData } from "../types/results";

const FIELDS: [keyof AdviceCardData, string][] = [
  ["architectureJudgement", "Architecture judgement"],
  ["strongestArea", "Strongest area"],
  ["mainWeakness", "Main weakness"],
  ["whatWeCanSay", "What we can responsibly say"],
  ["whatWeNeedNext", "What we need to know next"],
];

export function AdviceCard({ card }: { card: AdviceCardData }) {
  return (
    <div className="advice-card">
      <div className="ac-head">SKYSHIELD Advice Card · OCSA</div>
      {FIELDS.map(([key, label]) => (
        <div className="ac-field" key={key}>
          <div className="ac-label">{label}</div>
          <div className="ac-value">{card[key]}</div>
        </div>
      ))}
    </div>
  );
}
