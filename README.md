# Circuitry

A workbook on circuits for someone who has soldered and wants to design:
short illustrated lessons, in the manner of Bartosz Ciechanowski's
explainers, on what voltage and current really are, how parts shape them,
and how to find out why a board doesn't work. Every circuit is live: wires
are coloured by their voltage and dots move along them with the current.

Built on `packages/lesson-kit`, copied from
[Dirt](https://github.com/RobertLitzke/Dirt) (which copied it from
[Clouds](https://github.com/RobertLitzke/CloudsWhatAreTheyUpTo)); fixes to
the kit are copied between the three by hand. There is no story or radio
mentor (the kit's radio is off). The circuit engine is our own,
`packages/circuit-kit`.

## What is built

- The shell: a vanilla TypeScript PWA on Vite, inlined into one `index.html`,
  with a service worker, an update banner, and progress in `localStorage` with
  save-to-file and load. Nav: Home, Reference, Quiz, Settings (and Credits).
- The look: a drawn circuit board (`src/app/scene/board.ts`), solder-mask
  green, datasheet paper, amber-LED buttons and copper accents; Space Grotesk
  for headings and JetBrains Mono for part labels.
- **The lesson map**, as stubs (title and one line each, no parts yet), in
  three tracks:
  - **The core path**, in order: 1 what is actually flowing, 2 splitting the
    flow, 3 power, heat and wire, 4 storing energy over time, 5 one-way
    valves and switches, 6 from schematic to board, and back.
  - **Guitar pedals**, after the core: 7 inside a Fuzz Face, 8 inside a Tube
    Screamer. Sound, when it comes, is off by default and only in this track.
  - **Off-grid solar**, after the core: 9 solar panels, 10 wiring an off-grid
    system.
- **The circuit engine**: `packages/circuit-kit` solves a circuit of
  resistors, lamps, sources, wires and switches (DC, modified nodal analysis),
  and `src/app/circuit/schematic.ts` draws it live. The first figure, `loop`
  (a battery, resistor, lamp and switch), is on the reference page.
- The **reference page**: a glossary, Ohm's law with the live loop, and a
  section per topic still to fill (symbols, parts, wire, capacitors,
  semiconductors, the multimeter, solder faults, pedal standards, solar
  sizing, off-grid safety).
- A **quiz** of flash cards with spaced repetition (`src/data/quiz.json`),
  empty until the first lesson is written.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5450. http://localhost:5450/figures.html shows every
figure on one page (dev server only); add `?frozen` for the same picture every
load, or `?only=<figure id>` for one figure.

| Command | What it does |
|---|---|
| `npm test` | Vitest: the solver, lesson and reference content, every figure built, the views, the save |
| `npm run build` | Typecheck, then build `dist/` |
| `npm run preview` | Serve `dist/` on http://localhost:5451 |
| `npm run icons` | Regenerate the PNG icons (drawn in `tools/icons.mjs`) |

## The circuit engine

A figure lists its parts (`packages/circuit-kit/src/parts.ts`), each between
two named nodes, solves them (`solve.ts`), and hands the solution to a
schematic that draws each part along a path the figure gives it. When a slider
moves, the figure changes the part in place and solves again. The colours
always mean the same thing (`src/app/figures/kit.ts`): voltage runs from
ground's deep blue to orange, current is the yellow of the dots, resistance
violet, power red.

Still to come, roughly in the order the lessons need them: capacitors and
inductors (a time step), diodes, LEDs and transistors (Newton's method around
the same solve), a solar cell, an op-amp, a breadboard and PCB view of the
same parts, faults (cold joints, bridges, lifted pads, reversed parts) and a
virtual multimeter, audio for the pedals, and a free-play bench.

## Adding a lesson

1. Fill its `src/data/lessons/<id>.json` (the format is in
   `packages/lesson-kit/README.md`); a lesson with no parts shows as coming.
2. Put its figures in `src/app/figures/<id>.ts`, add their ids to
   `FIGURE_IDS` in `src/core/lessons.ts`, and name them in
   `src/app/figures/index.ts`.
3. Fill its sections in `src/data/reference.json` and add cards to
   `src/data/quiz.json`.
4. `npm test` catches unknown figures, goals no figure meets, and bad answers.

## Layout

```
packages/circuit-kit/  the solver: parts, nodes, solve (pure TypeScript)
packages/lesson-kit/   the lesson engine, figures, quiz, shell and build
src/core/     pure TypeScript, no DOM
  lessons.ts    the tracks and lessons, figure ids
  reference.ts  the reference page's shape
  save.ts       the save, on top of lesson-kit's progress.ts
src/data/     lessons/*.json, reference.json, glossary.json, quiz.json
src/app/      store.ts, asset.ts
  circuit/      schematic.ts (a live circuit drawing), units.ts (4.7 kΩ, 23 mA)
  scene/        board.ts (the home page's board)
  figures/      kit.ts (palette), one file per lesson, check.ts, index.ts
  views/        home, lesson, reference, quiz, settings, credits
tools/        gallery/, icons.mjs
```

## Deploy

Pushes to `main` build and deploy to GitHub Pages
(`.github/workflows/pages.yml`) at https://robertlitzke.github.io/Circuitry/.
In the repository's settings, Pages must be set to deploy from GitHub Actions.
