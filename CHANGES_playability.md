# SKYSHIELD — playability update

Built on top of your reviewed/accessible version. Your diagnosis (the game
briefed the player instead of teaching through play) drove all of this. Your
Coach panel, Mission Brief, and plain-language relabelling are kept as the
foundation; this round adds the "fun" and feedback layer on top.

## What changed

### 1. Three-star score screen + per-mission objectives
- New `ScoreScreen` shown immediately after a run, before the full debrief.
- Three honest axes: **Protection** (how well priority sites came through),
  **Efficiency** (value protected per resource spent), **Evidence** (reliance on
  proven vs emerging kit).
- Plain headline ("Solid defence", "Held, but with gaps", "Overwhelmed").
- Each scenario now has concrete objectives, e.g. "Keep the Central Command Node
  under 4 damage", "Detect at least 70% of incoming tracks", "Survive all three
  waves with munitions left".
- "Try this next" block: specific, node-named suggestions drawn from the weakest
  link in the run.
- Engine: new `src/engine/scoring.ts` (`computeStars`, `evaluateObjectives`,
  `buildTips`); `SimulationResult` now carries `stars`, `objectives`, `tips`.

### 2. Live drama during the run
- Real-time HUD: Incoming / Stopped / Got through, counting up as the attack plays.
- Impact feedback: brief red flash + screen-shake on a leak (respects
  `prefers-reduced-motion`).
- Sound cues (synthesised via WebAudio — no audio files): detect, classify,
  engage, hit, impact, and a clean-win chime. Sound on/off toggle in the run bar.
- New `src/engine/sound.ts`. Still auto-plays but stays pausable/scrubbable.

### 3. Guided tutorial mission
- "Drone Pressure" is now a step-by-step first mission (`TutorialCoach`) that walks
  see -> decide -> act -> absorb, advancing only as each required layer is placed,
  then hands control back so the player presses Run themselves.
- "Skip tutorial" available at any point. Difficulty pill shows "Tutorial".
- Scenario JSON gained optional `objectives` and `tutorial` fields; the loader
  passes them through untouched (PUBLIC_SYNTHETIC gate unchanged).

## Unchanged on purpose
- Calm command aesthetic — no arcade noise, just clearer and more alive.
- Synthetic / non-operational framing, the PUBLIC SYNTHETIC banner, and the
  no-overclaiming debrief/advice language.
- Deterministic engine: same architecture -> same result (re-verified).

## Verified
- `npm run typecheck` -> clean.
- `npm run build` -> passes (59 modules).
- Clean-room extract -> install -> typecheck -> build -> passes.
- Scoring gradient sanity-checked: a one-sensor build scores 2/9 with 1/3
  objectives; a well-targeted layered build scores 7/9 with all objectives, and
  only 1 efficiency star because it spent heavily — the intended trade-off.
- Tutorial step-gating unit-checked end to end.
