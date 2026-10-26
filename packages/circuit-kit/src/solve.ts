// The DC solver: modified nodal analysis. Each node but ground gets an unknown
// voltage, and each part that fixes a voltage (a source, a 0 ohm wire, a
// closed switch) gets an unknown current. Kirchhoff's current law at every
// node, plus each fixed voltage, gives as many equations as unknowns, solved
// at once by Gaussian elimination. A lesson circuit has a few dozen parts at
// most, so this runs every animation frame without trouble.
//
// Capacitors, inductors and nonlinear parts (diodes, LEDs, transistors, a
// solar cell) come later: a time step for the first two, Newton's method
// around this same solve for the rest.

import { GROUND, nodesOf, type Part } from './parts';

export interface Solution {
  /** Volts at every node, from ground. */
  v: Record<string, number>;
  /** Amps through every part, from its a terminal to its b (see parts.ts). */
  i: Record<string, number>;
  /** Watts every part takes in: positive for a load, negative for a source that is giving power out. */
  p: Record<string, number>;
  /** True when sources are shorted with nothing to limit the current: no voltages or currents are given. */
  short: boolean;
}

/** A leak from every node to ground, so a node left floating (an open switch) settles at 0 V instead of having no answer. */
const GMIN = 1e-9;

/**
 * Solve a circuit in its steady state. Ground is the node named GROUND if one
 * is used, otherwise the − terminal of the first source, otherwise the first
 * node named.
 */
export function solve(parts: readonly Part[]): Solution {
  const names = nodesOf(parts);
  const firstSource = parts.find((p) => p.kind === 'source');
  const ground = names.includes(GROUND) ? GROUND : (firstSource?.b ?? names[0]);

  // Sources with an internal resistance get a hidden node between the two.
  const inner = (id: string) => `${id}#inner`;
  const all = [...names];
  for (const p of parts) if (p.kind === 'source' && (p.ohms ?? 0) > 0) all.push(inner(p.id));

  const index = new Map<string, number>();
  for (const n of all) if (n !== ground) index.set(n, index.size);
  const nodeCount = index.size;

  // Parts that fix a voltage between two nodes, each with its own current unknown.
  const fixed: { id: string; a: string; b: string; volts: number }[] = [];
  for (const p of parts) {
    if (p.kind === 'source') fixed.push({ id: p.id, a: (p.ohms ?? 0) > 0 ? inner(p.id) : p.a, b: p.b, volts: p.volts });
    else if (p.kind === 'wire' && !(p.ohms && p.ohms > 0)) fixed.push({ id: p.id, a: p.a, b: p.b, volts: 0 });
    else if (p.kind === 'switch' && p.closed) fixed.push({ id: p.id, a: p.a, b: p.b, volts: 0 });
  }

  const size = nodeCount + fixed.length;
  const A = Array.from({ length: size }, () => new Float64Array(size));
  const z = new Float64Array(size);
  const at = (n: string) => index.get(n) ?? -1;

  const conductance = (a: string, b: string, g: number) => {
    const ia = at(a);
    const ib = at(b);
    if (ia >= 0) A[ia][ia] += g;
    if (ib >= 0) A[ib][ib] += g;
    if (ia >= 0 && ib >= 0) {
      A[ia][ib] -= g;
      A[ib][ia] -= g;
    }
  };

  for (let k = 0; k < nodeCount; k++) A[k][k] += GMIN;
  for (const p of parts) {
    switch (p.kind) {
      case 'resistor':
      case 'lamp':
        conductance(p.a, p.b, 1 / p.ohms);
        break;
      case 'wire':
        if (p.ohms && p.ohms > 0) conductance(p.a, p.b, 1 / p.ohms);
        break;
      case 'source':
        if ((p.ohms ?? 0) > 0) conductance(p.a, inner(p.id), 1 / p.ohms!);
        break;
      case 'current': {
        const ia = at(p.a);
        const ib = at(p.b);
        if (ia >= 0) z[ia] -= p.amps;
        if (ib >= 0) z[ib] += p.amps;
        break;
      }
      case 'switch':
        break;
    }
  }
  fixed.forEach((f, j) => {
    const k = nodeCount + j;
    const ia = at(f.a);
    const ib = at(f.b);
    if (ia >= 0) {
      A[ia][k] += 1;
      A[k][ia] += 1;
    }
    if (ib >= 0) {
      A[ib][k] -= 1;
      A[k][ib] -= 1;
    }
    z[k] = f.volts;
  });

  const x = gauss(A, z);
  const v: Record<string, number> = {};
  const i: Record<string, number> = {};
  const p: Record<string, number> = {};
  if (!x) {
    for (const n of names) v[n] = 0;
    for (const part of parts) i[part.id] = p[part.id] = 0;
    return { v, i, p, short: true };
  }

  const volts = (n: string) => (n === ground ? 0 : x[index.get(n)!]);
  for (const n of names) v[n] = volts(n);
  const fixedCurrent = new Map(fixed.map((f, j) => [f.id, x[nodeCount + j]]));
  for (const part of parts) {
    let amps: number;
    switch (part.kind) {
      case 'resistor':
      case 'lamp':
        amps = (volts(part.a) - volts(part.b)) / part.ohms;
        break;
      case 'current':
        amps = part.amps;
        break;
      case 'source':
        amps = (part.ohms ?? 0) > 0 ? (volts(part.a) - volts(inner(part.id))) / part.ohms! : fixedCurrent.get(part.id)!;
        break;
      case 'wire':
        amps = part.ohms && part.ohms > 0 ? (volts(part.a) - volts(part.b)) / part.ohms : fixedCurrent.get(part.id)!;
        break;
      case 'switch':
        amps = part.closed ? fixedCurrent.get(part.id)! : 0;
        break;
    }
    i[part.id] = amps;
    p[part.id] = (volts(part.a) - volts(part.b)) * amps;
  }
  return { v, i, p, short: false };
}

/** Solve A x = z by Gaussian elimination with partial pivoting; null if A is singular. A and z are overwritten. */
function gauss(A: Float64Array[], z: Float64Array): Float64Array | null {
  const n = z.length;
  for (let col = 0; col < n; col++) {
    let best = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[best][col])) best = r;
    if (Math.abs(A[best][col]) < 1e-12) return null;
    if (best !== col) {
      [A[best], A[col]] = [A[col], A[best]];
      [z[best], z[col]] = [z[col], z[best]];
    }
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      if (f === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      z[r] -= f * z[col];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = z[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / A[r][r];
  }
  return x;
}
