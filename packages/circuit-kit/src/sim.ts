// A circuit stepped through time. Each step solves the circuit with every
// capacitor standing in for the charge it holds and every inductor for the
// current it carries (solve.ts, backward Euler), then remembers the new
// charge and current for the next step. Sources with a wave move as time
// goes on, so a scope can be drawn by recording a node at each step.

import type { Part } from './parts';
import { solve, type Solution, type SolveOptions } from './solve';

export interface Sim {
  /** Seconds since the start. */
  readonly t: number;
  /** The latest solution. */
  readonly now: Solution;
  /** Step forward `dt` seconds, in `substeps` equal steps; returns the solution at the end. */
  step(dt: number, substeps?: number): Solution;
  /** Back to the start: capacitors empty and inductors still, or the steady state if `settled`. */
  reset(settled?: boolean): void;
}

export interface SimOptions {
  celsius?: number;
  /** Start from the steady state instead of from rest (capacitors empty, no current in inductors). */
  settled?: boolean;
}

/** A simulation of `parts`, which a figure may change in place between steps. */
export function simulate(parts: readonly Part[], o: SimOptions = {}): Sim {
  let t = 0;
  let volts: Record<string, number> = {};
  let amps: Record<string, number> = {};
  let now: Solution;

  const remember = (s: Solution) => {
    for (const p of parts) {
      if (p.kind === 'capacitor') volts[p.id] = s.v[p.a] - s.v[p.b];
      if (p.kind === 'inductor') amps[p.id] = s.i[p.id];
    }
  };

  const reset = (settled = o.settled ?? false) => {
    t = 0;
    volts = {};
    amps = {};
    if (settled) {
      now = solve(parts, { celsius: o.celsius, t: 0 });
      remember(now);
    } else {
      // From rest: one tiny step with empty capacitors and still inductors.
      now = solve(parts, { celsius: o.celsius, t: 0, memory: { dt: 1e-9, volts, amps } });
    }
  };
  reset();

  return {
    get t() {
      return t;
    },
    get now() {
      return now;
    },
    step(dt, substeps = 1) {
      // One step of h seconds; where the circuit changes too fast for Newton's method to follow (a blinker
      // flipping over), it is taken again as two half steps, down to an eighth.
      const advance = (h: number, depth: number): void => {
        const opts: SolveOptions = { celsius: o.celsius, t: t + h, guess: now.v, memory: { dt: h, volts, amps } };
        const s = solve(parts, opts);
        if (!s.converged && depth < 3) {
          advance(h / 2, depth + 1);
          if (!now.short) advance(h / 2, depth + 1);
          return;
        }
        t += h;
        now = s;
        if (!now.short) remember(now);
      };
      const h = dt / substeps;
      for (let k = 0; k < substeps && !now.short; k++) advance(h, 0);
      return now;
    },
    reset,
  };
}
