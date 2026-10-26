// What a circuit is made of: parts, each joined between two named nodes. A
// node is a name for one stretch of copper at one voltage; every terminal
// that names it is joined to every other. The node called GROUND is 0 V, and
// every other voltage is measured from it.
//
// Every part runs from its terminal `a` to its terminal `b`, and the solver
// reports its current in that direction: positive when conventional current
// flows through it from a to b. For a source, `a` is the + terminal.

export const GROUND = 'gnd';

export type Part =
  /** A resistor, `ohms` from a to b. */
  | { id: string; kind: 'resistor'; a: string; b: string; ohms: number }
  /** A filament lamp, for now a plain resistance. It glows with the power it takes. */
  | { id: string; kind: 'lamp'; a: string; b: string; ohms: number }
  /** A battery or bench supply: a (+) sits `volts` above b (−), through an internal resistance `ohms` (0 is ideal). */
  | { id: string; kind: 'source'; a: string; b: string; volts: number; ohms?: number }
  /** A current source: pushes `amps` through itself from a to b, whatever it takes. */
  | { id: string; kind: 'current'; a: string; b: string; amps: number }
  /** A length of wire or trace. 0 ohms unless given, so solder joints and thin traces can be given some. */
  | { id: string; kind: 'wire'; a: string; b: string; ohms?: number }
  /** A switch: a wire when closed, nothing when open. */
  | { id: string; kind: 'switch'; a: string; b: string; closed: boolean };

export type PartKind = Part['kind'];

/** Every node the parts name, in the order they first appear. */
export function nodesOf(parts: readonly Part[]): string[] {
  const seen = new Set<string>();
  for (const p of parts) {
    seen.add(p.a);
    seen.add(p.b);
  }
  return [...seen];
}
