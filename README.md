# SKYSHIELD

**Public Synthetic Training Version: Not an Operational Model.**

SKYSHIELD is a browser-based educational game about **integrated air and missile
defence (IAMD)** as a *system-of-systems* problem. It is built for OCSA staff to
build intuition about the advice problem: sensing, decision-making, effectors,
resilience, sustainment, people, integration, and: crucially: **evidence
confidence**.

> All data in this application is **fictional**. There are no real sites, systems,
> capabilities, or numeric values. Nothing here is operational modelling, and no
> result should be read as a claim about real-world defence performance. Every
> bundled scenario is labelled `PUBLIC_SYNTHETIC`; the app refuses to load any
> scenario that is not.


## Accessibility and gameplay review pass

This version includes a readability and game-loop pass. The UI now explains the
player task in simpler terms: see, understand, decide, act, absorb damage and keep
going. Scenario cards, build menu text, tooltips, replay commentary and debrief
messages have been rewritten for players who are new to IAMD.

A new OCSA Coach panel gives contextual advice during the build phase, and a
Mission Brief panel tells the player what is coming, what must be protected and
how to judge success. See `REVIEW_NOTES.md` for the game-design and radar/IAMD
review notes.

## What it teaches

The game deliberately reinforces a set of advisory lessons:

- Coverage is not protection; detection is not classification; classification is
  not authority to act.
- Active defence can be saturated, and first-wave success says little about
  endurance: munitions depth and sustainment matter.
- Passive resilience (hardening, dispersal, redundancy) changes the *consequence*
  even when interception fails.
- Integration improves combined performance but creates dependencies.
- Emerging technology should be judged by evidence, not vendor promise.
- Good advice states what a run shows **and** what still needs to be tested.

## How it works

1. **Start** → pick one of three synthetic scenarios (Drone Pressure,
   Cruise-Type Warning, Mixed Salvo).
2. **Build** → spend budget, workforce and integration capacity on ten families of
   defensive layer, placing each on a node of a fictional map.
3. **Run** → a deterministic simulation walks each threat wave through a
   Sense → Classify → Decide → Act → Sustain → Recover pipeline, with an animated
   replay.
4. **Debrief** → a rule-based, plain-English debrief and an **OCSA Advice Card**
   summarise the architecture's strengths, weaknesses, what can responsibly be
   said, and what would need further validation.

The simulation is **deterministic and explainable**: the same architecture always
produces the same result. The numbers are coherent teaching heuristics, not
physics.

### Facilitator mode

Append `?mode=facilitator` to the URL for a facilitator bar with quick reset,
scenario jump, and a toggle for the on-screen learning points.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build locally
```

## Deploy to Netlify

The repo includes `netlify.toml`. Either connect the repo in the Netlify UI or use
the CLI:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

SPA redirects are configured so all routes serve `index.html`.

## Project structure

```
src/
  app/         App shell + screen state machine
  components/  Start, ScenarioSelect, Build/Map, Replay, Debrief, Advice, Tooltip
  config/      Asset catalogue, scenario JSON, PUBLIC_SYNTHETIC loader/gate
  engine/      Deterministic simulation, calculators, debrief + advice rules, RNG
  types/       Domain and result types
  styles/      Global design system
```

## License / use

Internal educational use. Synthetic content only.
