import { useMemo } from "react";
import type { PlacedAsset, Scenario, TutorialStep } from "../types/game";
import { ASSET_CATALOGUE } from "../config/assetCatalogue";

/**
 * Computes the index of the current tutorial step from what's been placed.
 * A step with `requireAssetType` is satisfied once that type appears in `placed`.
 */
export function useTutorialProgress(
  steps: TutorialStep[] | undefined,
  placed: PlacedAsset[],
  freeformAdvanced: number
): number {
  return useMemo(() => {
    if (!steps || steps.length === 0) return -1;
    let i = 0;
    let freeUsed = 0;
    while (i < steps.length) {
      const step = steps[i];
      if (step.freeform) {
        if (freeUsed < freeformAdvanced) {
          freeUsed++;
          i++;
          continue;
        }
        break;
      }
      if (step.requireAssetType) {
        const satisfied = placed.some(
          (p) =>
            p.type === step.requireAssetType &&
            (!step.requireNodeId || p.nodeId === step.requireNodeId)
        );
        if (satisfied) {
          i++;
          continue;
        }
      }
      break;
    }
    return i; // i === steps.length means tutorial complete
  }, [steps, placed, freeformAdvanced]);
}

export function TutorialCoach({
  scenario,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: {
  scenario: Scenario;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const step = scenario.tutorial?.[stepIndex];
  if (!step) return null;
  const isFreeform = !!step.freeform;
  const waitingFor = step.requireAssetType
    ? ASSET_CATALOGUE[step.requireAssetType].displayName
    : null;

  return (
    <div className="tutorial-coach">
      <div className="tutorial-head">
        <span className="coach-avatar">OCSA</span>
        <span className="tutorial-step-count">
          Guided step {stepIndex + 1} of {totalSteps}
        </span>
        <span style={{ flex: 1 }} />
        <button className="btn-ghost tutorial-skip" onClick={onSkip}>
          Skip tutorial
        </button>
      </div>
      <div className="tutorial-text">{step.text}</div>
      {isFreeform ? (
        <button className="btn-primary" onClick={onNext} style={{ marginTop: 10 }}>
          Got it →
        </button>
      ) : (
        <div className="tutorial-waiting">
          Waiting for you to place: <b>{waitingFor}</b>
        </div>
      )}
    </div>
  );
}
