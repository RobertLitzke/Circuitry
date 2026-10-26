// A live schematic: circuit-kit's parts drawn where a figure places them, with
// every wire coloured by its voltage and dots moving along it with the
// current. The colours run from ground's deep blue to the figure's top voltage
// in orange (COL.ground to COL.voltage), so the eye reads the circuit as a
// landscape of heights; across a resistor the colour slides from one end's to
// the other's, and that slide is the voltage dropped. The dots move at a speed
// set by the current through each part, in the direction conventional current
// flows, and stop dead where no current flows.
//
// A figure owns the parts and the solve: it builds the schematic once around
// its parts, changes their values in place, and calls `show(solution)`
// whenever one changes. Layout views (breadboard,
// perfboard, PCB) will draw the same parts with the same colours.

import { svg } from 'lesson-kit/dom';
import { label, type P } from 'lesson-kit/draw';
import type { Part } from 'circuit-kit/parts';
import type { Solution } from 'circuit-kit/solve';
import { animate, COL, type FigureContext } from '../figures/kit';

/** A part and where it is drawn: from its a terminal along `path` to its b terminal. Symbols sit on the first segment. */
export interface Placed {
  part: Part;
  path: P[];
  /** A name and value written beside the symbol, such as "R1 470 Ω". */
  tag?: string;
  /** Which side of the symbol the tag goes, from a to b: left or right of the direction of travel. */
  tagSide?: 'left' | 'right';
}

export interface SchematicOptions {
  /** The voltage drawn in full orange. */
  topVolts: number;
  /** The current at which dots move at their normal pace; more is faster, less slower. */
  typicalAmps: number;
  /** Points to draw a ground symbol at, hanging below. */
  grounds?: P[];
  /** Tapping a part's wire asks for its a node's voltage; a switch is toggled instead. */
  onProbe?: (node: string) => void;
  onToggle?: (id: string) => void;
}

export interface Schematic {
  node: SVGGElement;
  show(s: Solution): void;
}

/** Pixels between dots, and how fast they go at the typical current, in pixels a second. */
const SPACING = 16;
const PACE = 40;
/** How long a symbol is along its segment. */
const BODY = 36;

let gradients = 0;

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/** The colour of a voltage, from ground blue up to `top` in orange. Below ground stays blue; above the top stays orange. */
export function voltColour(v: number, top: number): string {
  return mix(COL.ground, COL.voltage, Math.max(0, Math.min(1, top > 0 ? v / top : 0)));
}

const lengthOf = (path: P[]) => path.slice(1).reduce((s, p, k) => s + Math.hypot(p[0] - path[k][0], p[1] - path[k][1]), 0);

function pointAt(path: P[], d: number): P {
  for (let k = 1; k < path.length; k++) {
    const [x0, y0] = path[k - 1];
    const [x1, y1] = path[k];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (d <= seg || k === path.length - 1) {
      const t = seg ? Math.min(1, d / seg) : 0;
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
    d -= seg;
  }
  return path[0];
}

/** The symbol for a part, drawn along +x from 0 to BODY, centred on y = 0. */
function symbol(part: Part, stroke: string): SVGElement {
  const w = 2.2;
  switch (part.kind) {
    case 'resistor': {
      const pts: string[] = ['0,0'];
      for (let k = 0; k < 6; k++) pts.push(`${4 + k * 5.6},${k % 2 ? 6 : -6}`);
      pts.push(`${BODY},0`);
      return svg('polyline', { points: pts.join(' '), fill: 'none', stroke, 'stroke-width': w, 'stroke-linejoin': 'round' });
    }
    case 'lamp':
      return svg('g', {},
        svg('circle', { class: 'glow', cx: BODY / 2, cy: 0, r: 16, fill: COL.current, opacity: 0 }),
        svg('circle', { cx: BODY / 2, cy: 0, r: 12, fill: COL.paper, stroke: COL.ink, 'stroke-width': 1.6 }),
        svg('path', { d: `M${BODY / 2 - 8.5},-8.5 L${BODY / 2 + 8.5},8.5 M${BODY / 2 - 8.5},8.5 L${BODY / 2 + 8.5},-8.5`, stroke: COL.ink, 'stroke-width': 1.4 }),
        svg('line', { x1: 0, y1: 0, x2: BODY / 2 - 12, y2: 0, stroke, 'stroke-width': w }),
        svg('line', { x1: BODY / 2 + 12, y1: 0, x2: BODY, y2: 0, stroke, 'stroke-width': w }),
      );
    case 'source': {
      // The long plate is +, at the a end.
      const m = BODY / 2;
      return svg('g', {},
        svg('line', { x1: 0, y1: 0, x2: m - 3, y2: 0, stroke, 'stroke-width': w }),
        svg('line', { x1: m - 3, y1: -13, x2: m - 3, y2: 13, stroke: COL.ink, 'stroke-width': 2.4 }),
        svg('line', { x1: m + 3, y1: -6, x2: m + 3, y2: 6, stroke: COL.ink, 'stroke-width': 4 }),
        svg('line', { x1: m + 3, y1: 0, x2: BODY, y2: 0, stroke, 'stroke-width': w }),
      );
    }
    case 'current':
      return svg('g', {},
        svg('circle', { cx: BODY / 2, cy: 0, r: 12, fill: COL.paper, stroke: COL.ink, 'stroke-width': 1.6 }),
        svg('path', { d: `M${BODY / 2 - 6},0 H${BODY / 2 + 6} M${BODY / 2 + 2},-4 L${BODY / 2 + 6},0 L${BODY / 2 + 2},4`, fill: 'none', stroke: COL.ink, 'stroke-width': 1.6 }),
        svg('line', { x1: 0, y1: 0, x2: BODY / 2 - 12, y2: 0, stroke, 'stroke-width': w }),
        svg('line', { x1: BODY / 2 + 12, y1: 0, x2: BODY, y2: 0, stroke, 'stroke-width': w }),
      );
    case 'switch': {
      const open = !part.closed;
      return svg('g', { class: 'switch', style: 'cursor: pointer' },
        svg('rect', { x: -4, y: -16, width: BODY + 8, height: 24, fill: 'transparent' }),
        svg('line', { x1: 0, y1: 0, x2: 6, y2: 0, stroke, 'stroke-width': w }),
        svg('line', { class: 'lever', x1: 6, y1: 0, x2: BODY - 6, y2: open ? -12 : 0, stroke: COL.ink, 'stroke-width': 2 }),
        svg('circle', { cx: 6, cy: 0, r: 2.6, fill: COL.paper, stroke: COL.ink, 'stroke-width': 1.4 }),
        svg('circle', { cx: BODY - 6, cy: 0, r: 2.6, fill: COL.paper, stroke: COL.ink, 'stroke-width': 1.4 }),
        svg('line', { x1: BODY - 6, y1: 0, x2: BODY, y2: 0, stroke, 'stroke-width': w }),
      );
    }
    case 'wire':
      return svg('g');
  }
}

function groundSymbol([x, y]: P): SVGElement {
  return svg('g', { stroke: COL.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round' },
    svg('line', { x1: x, y1: y, x2: x, y2: y + 8 }),
    svg('line', { x1: x - 10, y1: y + 8, x2: x + 10, y2: y + 8 }),
    svg('line', { x1: x - 6, y1: y + 12, x2: x + 6, y2: y + 12 }),
    svg('line', { x1: x - 2.5, y1: y + 16, x2: x + 2.5, y2: y + 16 }),
  );
}

interface Drawn {
  placed: Placed;
  /** The leads and runs of wire, coloured by the voltage at each end. */
  leadA: SVGElement;
  leadB: SVGElement;
  stops: [SVGElement, SVGElement];
  glow: SVGElement | null;
  lever: SVGElement | null;
  dots: SVGElement[];
  length: number;
  phase: number;
}

export function schematic(ctx: FigureContext, placed: readonly Placed[], o: SchematicOptions): Schematic {
  const defs = svg('defs');
  const wires = svg('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const bodies = svg('g');
  const dotLayer = svg('g', { fill: COL.current, stroke: COL.ink, 'stroke-width': 0.6 });
  const labels = svg('g');
  const node = svg('g', { class: 'schematic' }, defs, wires, bodies, dotLayer, labels, ...(o.grounds ?? []).map(groundSymbol)) as SVGGElement;

  const drawn: Drawn[] = placed.map((pl) => {
    const { part, path } = pl;
    const [ax, ay] = path[0];
    const [bx, by] = path[1];
    const isWire = part.kind === 'wire';
    const seg = Math.hypot(bx - ax, by - ay);
    const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    // Where the symbol starts and ends along the first segment.
    const t0 = isWire ? 0.5 : Math.max(0, (seg - BODY) / 2 / seg);
    const t1 = isWire ? 0.5 : 1 - t0;
    const s0: P = [ax + (bx - ax) * t0, ay + (by - ay) * t0];
    const s1: P = [ax + (bx - ax) * t1, ay + (by - ay) * t1];

    const id = `v-grad-${++gradients}`;
    const stopA = svg('stop', { offset: 0 });
    const stopB = svg('stop', { offset: 1 });
    defs.append(svg('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1] }, stopA, stopB));

    const width = 3.2;
    const leadA = svg('polyline', { points: [path[0], s0].map((p) => p.join(',')).join(' '), 'stroke-width': width });
    const leadB = svg('polyline', { points: [s1, ...path.slice(1)].map((p) => p.join(',')).join(' '), 'stroke-width': width });
    wires.append(leadA, leadB);
    // A fat clear line along the whole path, to tap.
    const hit = svg('polyline', { points: path.map((p) => p.join(',')).join(' '), stroke: 'transparent', 'stroke-width': 14, style: 'cursor: crosshair' });
    hit.addEventListener('click', () => o.onProbe?.(part.a));
    wires.append(hit);

    let glow: SVGElement | null = null;
    let lever: SVGElement | null = null;
    if (!isWire) {
      const sym = symbol(part, `url(#${id})`);
      sym.setAttribute('transform', `translate(${s0[0]} ${s0[1]}) rotate(${angle})`);
      if (part.kind === 'switch') sym.addEventListener('click', () => o.onToggle?.(part.id));
      glow = sym.querySelector('.glow');
      lever = sym.querySelector('.lever');
      bodies.append(sym);
      if (pl.tag) {
        const mx = (s0[0] + s1[0]) / 2;
        const my = (s0[1] + s1[1]) / 2;
        // Perpendicular to the segment, to the chosen side.
        const side = pl.tagSide === 'left' ? -1 : 1;
        const nx = (-(by - ay) / seg) * side;
        const ny = ((bx - ax) / seg) * side;
        const off = part.kind === 'lamp' || part.kind === 'current' ? 26 : 20;
        const anchor = Math.abs(nx) > 0.5 ? (nx > 0 ? undefined : 'end') : 'middle';
        labels.append(label(mx + nx * off, my + ny * off + 4, pl.tag, { anchor, bold: true }));
      }
    }
    const length = lengthOf(path);
    const dots = Array.from({ length: Math.max(1, Math.floor(length / SPACING)) }, () => svg('circle', { r: 2.6, opacity: 0 }));
    dotLayer.append(...dots);
    return { placed: pl, leadA, leadB, stops: [stopA, stopB], glow, lever, dots, length, phase: 0 };
  });

  let last: Solution | null = null;

  const placeDots = (d: Drawn) => {
    const n = d.dots.length;
    const gap = d.length / n;
    const moving = last && !last.short && Math.abs(last.i[d.placed.part.id]) > o.typicalAmps * 1e-4;
    d.dots.forEach((dot, k) => {
      const at = (((k * gap + d.phase) % d.length) + d.length) % d.length;
      const [x, y] = pointAt(d.placed.path, at);
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));
      dot.setAttribute('opacity', moving ? '1' : '0');
    });
  };

  animate(node, ctx, (dt) => {
    if (!last || last.short) return;
    for (const d of drawn) {
      const amps = last.i[d.placed.part.id];
      // Speed grows with the current, but slowly enough that ten times the current is still watchable.
      const rel = amps / o.typicalAmps;
      const speed = Math.sign(rel) * PACE * Math.min(6, Math.abs(rel) < 1 ? Math.abs(rel) : 1 + Math.log(Math.abs(rel)));
      d.phase = (d.phase + speed * dt) % d.length;
      placeDots(d);
    }
  });

  return {
    node,
    show(s) {
      last = s;
      for (const d of drawn) {
        const { a, b } = d.placed.part;
        const ca = s.short ? COL.power : voltColour(s.v[a], o.topVolts);
        const cb = s.short ? COL.power : voltColour(s.v[b], o.topVolts);
        d.leadA.setAttribute('stroke', ca);
        d.leadB.setAttribute('stroke', cb);
        d.stops[0].setAttribute('stop-color', ca);
        d.stops[1].setAttribute('stop-color', cb);
        if (d.glow) {
          const watts = Math.max(0, s.p[d.placed.part.id]);
          d.glow.setAttribute('opacity', (Math.min(1, watts / Math.max(1e-9, o.topVolts * o.typicalAmps)) * 0.85).toFixed(2));
        }
        const part = d.placed.part;
        if (d.lever && part.kind === 'switch') d.lever.setAttribute('y2', part.closed ? '0' : '-12');
        placeDots(d);
      }
    },
  };
}
