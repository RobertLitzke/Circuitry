# circuit-kit

A small circuit solver for live lesson figures. Parts go in, each joined
between two named nodes (`parts.ts`); `solve(parts)` gives back every node's
voltage from ground, every part's current from its `a` terminal to its `b`,
and the power each takes (`solve.ts`). It is plain TypeScript with no DOM, so
it is tested on its own (`test/`), and the app draws the result.

For now it handles resistors, lamps, voltage sources (with an optional
internal resistance), current sources, wires (with an optional resistance, for
joints and traces) and switches, in steady state. A short across an ideal
source is reported as `short` rather than solved.
