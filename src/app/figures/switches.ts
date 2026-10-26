// Lesson 8, a small current steering a big one: a bipolar transistor
// switching a lamp, hard on or wastefully half on; a MOSFET switching a pump
// from a microcontroller's 3.3 V; a relay's coil kicking back at the
// transistor that drives it, and the diode that catches it; and a transistor
// that has failed shorted.

import { el } from 'lesson-kit/dom';
import { small } from 'lesson-kit/draw';
import type { Part } from 'circuit-kit/parts';
import { simulate } from 'circuit-kit/sim';
import { solve } from 'circuit-kit/solve';
import { wire } from '../circuit/build';
import { schematic } from '../circuit/schematic';
import { amps, ohms, volts, watts } from '../circuit/units';
import { hunt } from './bench';
import { guess, stars } from './guess';
import { COL, figure, frame } from './kit';
import { scope } from './scope';

/** A row of chips, one picked, which calls `pick` with the chosen value. */
function chipRow<T>(values: readonly T[], show: (v: T) => string, at: () => T, pick: (v: T) => void): HTMLElement {
  const row = el('div.chips');
  const paint = () => row.replaceChildren(...values.map((v) => el('button.chip', { type: 'button', className: v === at() ? 'chip on' : 'chip', onclick: () => { pick(v); paint(); } }, show(v))));
  paint();
  return row;
}

// ---------------------------------------------------------------------------
// A transistor switching a lamp: choose the base resistor.

const BASE_RS = [1e6, 100000, 22000, 4700, 1000];

export const bjtSwitchFigure = figure(['hard'], (ctx, t) => {
  const f = frame(400, 230, 4);
  const bat = { id: 'bat', kind: 'source' as const, a: 'v9', b: 'gnd', volts: 9 };
  const w1 = wire('w1', 'v9', 'lt');
  const lamp = { id: 'lamp', kind: 'lamp' as const, a: 'lt', b: 'c', ohms: 90, rated: 9 };
  const ctl = { id: 'ctl', kind: 'source' as const, a: 'ctl', b: 'gnd', volts: 5 };
  const rb = { id: 'rb', kind: 'resistor' as const, a: 'ctl', b: 'b', ohms: 100000 };
  const q = { id: 'q', kind: 'bjt' as const, type: 'npn' as const, c: 'c', b: 'b', e: 'gnd', beta: 200 };
  const parts: Part[] = [bat, w1, lamp, ctl, rb, q];
  const sch = schematic(ctx, [
    { part: bat, path: [[350, 95], [350, 155]], tag: '9 V', tagSide: 'right' },
    { part: w1, path: [[350, 95], [350, 30], [260, 30], [260, 50]] },
    { part: lamp, path: [[260, 50], [260, 110], [260, 120]], tag: '9 V lamp', tagSide: 'left' },
    { part: q, at: [250, 146], leads: { c: [[260, 120]], b: [[224, 146], [170, 146]], e: [[260, 172], [260, 200]] } },
    { part: rb, path: [[170, 146], [100, 146], [60, 146], [60, 110]], tag: 'R base', tagSide: 'left' },
    { part: ctl, path: [[60, 110], [60, 160]], tag: '5 V', tagSide: 'right' },
  ], { topVolts: 9, typicalAmps: 0.05, grounds: [[60, 160], [260, 200], [350, 155]] });
  f.svg.append(sch.node, small(60, 200, 'control', { anchor: 'middle', soft: true }));
  const earned = el('div');
  let done = false;
  let leanest = Infinity;

  const paint = () => {
    const s = solve(parts);
    sch.show(s);
    const ib = s.i.rb;
    const ic = s.i.q;
    const vce = s.v.c;
    const pq = vce * ic;
    const hard = vce < 0.25;
    f.readout.textContent =
      `${ohms(rb.ohms)} lets ${amps(ib)} into the base, and the transistor lets ${amps(ic)} through the lamp, ${Math.round(ic / Math.max(ib, 1e-12))} times as much. It drops ${volts(vce)} and turns ${watts(pq)} into heat. ` +
      (hard ? 'Hard on: the lamp gets nearly all of the 9 V, and the transistor barely warms.' : ic < 0.002 ? 'Off, or nearly.' : 'Half on: the lamp is dim, and the transistor is taking the rest as heat. As a switch, that is the worst place to be.');
    if (hard) {
      leanest = Math.min(leanest, ib);
      done = true;
      t.done();
    }
    if (done) earned.replaceChildren(stars([
      { text: 'Switched hard on', got: true },
      { text: 'With no more base current than it needs, under 2 mA', got: leanest < 0.002 },
    ]));
  };
  f.controls.append(chipRow(BASE_RS, (r) => ohms(r), () => rb.ohms, (r) => { rb.ohms = r; paint(); }), earned);
  paint();
  return f.node;
});

// ---------------------------------------------------------------------------
// A MOSFET switching a pump from a microcontroller.

const FETS = {
  standard: { vth: 3, k: 5, name: 'Standard MOSFET' },
  logic: { vth: 1.2, k: 6, name: 'Logic-level MOSFET' },
} as const;
type Fet = keyof typeof FETS;

export const mosfetSwitchFigure = figure(['logic'], (ctx, t) => {
  const f = frame(400, 230, 4);
  const bat = { id: 'bat', kind: 'source' as const, a: 'v12', b: 'gnd', volts: 12 };
  const w1 = wire('w1', 'v12', 'pt');
  const pump = { id: 'pump', kind: 'resistor' as const, a: 'pt', b: 'd', ohms: 6 };
  const gate = { id: 'gate', kind: 'source' as const, a: 'g', b: 'gnd', volts: 3.3 };
  const fet = { id: 'fet', kind: 'mosfet' as const, type: 'n' as const, d: 'd', g: 'g', s: 'gnd', vth: 3, k: 5 };
  const parts: Part[] = [bat, w1, pump, gate, fet];
  const sch = schematic(ctx, [
    { part: bat, path: [[350, 95], [350, 155]], tag: '12 V', tagSide: 'right' },
    { part: w1, path: [[350, 95], [350, 30], [260, 30], [260, 50]] },
    { part: pump, path: [[260, 50], [260, 120]], tag: 'Pump, 2 A', tagSide: 'left' },
    { part: fet, at: [250, 146], leads: { d: [[260, 120]], g: [[224, 146], [90, 146]], s: [[260, 172], [260, 200]] } },
    { part: gate, path: [[90, 146], [90, 196]], tag: 'Gate drive', tagSide: 'right' },
  ], { topVolts: 12, typicalAmps: 1, grounds: [[90, 196], [260, 200], [350, 155]] });
  f.svg.append(sch.node);
  let kind: Fet = 'standard';
  let guessed = false;
  let fresh = false;

  const paint = () => {
    Object.assign(fet, { vth: FETS[kind].vth, k: FETS[kind].k });
    const s = solve(parts);
    sch.show(s);
    const id = s.i.fet;
    const vp = s.v.pt - s.v.d;
    const pf = s.v.d * id;
    if (!guessed) {
      sch.cover({ colour: true, dots: true });
      f.readout.textContent = 'A MOSFET’s gate is insulated: it takes no current at all, only a voltage. A microcontroller puts 3.3 V on the gate of a standard MOSFET, to switch a 12 V pump that draws 2 A.';
      return;
    }
    sch.cover({});
    const full = vp > 11.5;
    f.readout.textContent =
      (fresh ? `${q.reply()} ` : '') +
      `${FETS[kind].name}, ${volts(gate.volts)} on its gate: ${amps(id)} flows, the pump gets ${volts(vp)}, and the MOSFET turns ${watts(pf)} into heat. ` +
      (full ? (pf < 0.5 ? 'Fully on, and cool.' : 'Fully on.') : id < 0.05 ? 'Off.' : 'Only partly on, and the MOSFET is cooking.');
    fresh = false;
    if (full && gate.volts === 3.3) t.done();
  };
  const q = guess({
    question: 'The pump…',
    options: ['runs weakly, and the MOSFET gets hot', 'runs fully', 'doesn’t run at all'],
    answer: 0,
    replies: [
      'Right.',
      'A standard MOSFET needs about 10 V on its gate to be fully on. 3.3 V is barely past its threshold.',
      '3.3 V is a little past this one’s threshold, so it lets some current through. Not enough.',
    ],
    onLock: () => {
      guessed = fresh = true;
      knobs.style.display = '';
      paint();
    },
  });
  const knobs = el('div', {},
    chipRow([3.3, 5, 10], (v) => `${v} V gate`, () => gate.volts, (v) => { gate.volts = v; paint(); }),
    chipRow(Object.keys(FETS) as Fet[], (k) => FETS[k].name, () => kind, (k) => { kind = k; paint(); }),
  );
  knobs.style.display = 'none';
  f.controls.append(q.node, knobs);
  paint();
  return f.node;
});

// ---------------------------------------------------------------------------
// A relay driven by a transistor: the kick when it turns off, and the diode that catches it.

const WINDOW_RELAY = 0.01;
const SAMPLES_RELAY = 200;

export const relayFigure = figure(['safe'], (ctx, t) => {
  const f = frame(400, 300, 4);
  const bat = { id: 'bat', kind: 'source' as const, a: 'v12', b: 'gnd', volts: 12 };
  const w1 = wire('w1', 'v12', 'kt');
  const coil = { id: 'coil', kind: 'inductor' as const, a: 'kt', b: 'c', henries: 0.1, ohms: 120 };
  const ctl = { id: 'ctl', kind: 'source' as const, a: 'ctl', b: 'gnd', volts: 5 };
  const rb = { id: 'rb', kind: 'resistor' as const, a: 'ctl', b: 'b', ohms: 2200 };
  const q = { id: 'q', kind: 'bjt' as const, type: 'npn' as const, c: 'c', b: 'b', e: 'gnd', beta: 200 };
  // A real transistor's collector breaks down past its rating and conducts: not drawn, but it is where the coil's current goes without the diode.
  const breakdown = { id: 'breakdown', kind: 'resistor' as const, a: 'c', b: 'gnd', ohms: 4700 };
  const diode = { id: 'flyback', kind: 'diode' as const, a: 'c', b: 'kt', model: 'silicon' as const };
  const base: Part[] = [bat, w1, coil, ctl, rb, q, breakdown];
  let withDiode = false;
  const sch = schematic(ctx, [
    { part: bat, path: [[360, 95], [360, 140]], tag: '12 V', tagSide: 'right' },
    { part: w1, path: [[360, 95], [360, 24], [260, 24], [260, 40]] },
    { part: coil, path: [[260, 40], [260, 100], [260, 110]], tag: 'Relay coil', tagSide: 'left' },
    { part: q, at: [250, 136], leads: { c: [[260, 110]], b: [[224, 136], [160, 136]], e: [[260, 162], [260, 172]] } },
    { part: rb, path: [[160, 136], [70, 136], [70, 100]], tag: '2.2 kΩ', tagSide: 'left' },
    { part: ctl, path: [[70, 100], [70, 140]], tag: 'Control', tagSide: 'right' },
  ], { topVolts: 12, typicalAmps: 0.1, grounds: [[70, 140], [260, 172], [360, 140]] });
  const diodeDraw = schematic(ctx, [{ part: diode, path: [[260, 110], [215, 110], [215, 40], [260, 40]] }], { topVolts: 12, typicalAmps: 0.1 });
  const scr = scope({ x: 14, y: 190, w: 372, h: 95, vmin: 0, vmax: 500, window: WINDOW_RELAY });
  f.svg.append(sch.node, diodeDraw.node, scr.node, small(282, 166, 'scope on the', { soft: true }), small(282, 178, 'collector', { soft: true }));
  const seen = new Set<boolean>();

  const run = () => {
    const parts = withDiode ? [...base, diode] : base;
    ctl.volts = 5;
    const sim = simulate(parts, { settled: true });
    const trace: number[] = [];
    const per = WINDOW_RELAY / SAMPLES_RELAY;
    // Peak detect, as in lesson 6: each point shows the highest voltage in its slice of time.
    for (let k = 0; k < SAMPLES_RELAY; k++) {
      if (k === SAMPLES_RELAY / 5) ctl.volts = 0;
      let peak = -Infinity;
      for (let j = 0; j < 20; j++) peak = Math.max(peak, sim.step(per / 20).v.c);
      trace.push(peak);
    }
    sch.show(sim.now);
    diodeDraw.show(sim.now);
    scr.range(0, withDiode ? 20 : 500);
    scr.draw([{ volts: trace, colour: COL.power }]);
    const top = Math.max(...trace);
    seen.add(withDiode);
    f.readout.textContent = withDiode
      ? `With the diode, the coil’s current has somewhere to go: round through the diode and back into the coil, dying away in a few milliseconds. The collector only rises to ${volts(top)}, a diode’s drop above the supply. The transistor is safe, and the relay lets go a little more slowly.`
      : `The transistor turns off, the coil keeps pushing, and the collector shoots to ${volts(Math.round(top))}, against a rating of 40 V. A real transistor breaks down, and after a few hundred of those it fails for good, often shorted.`;
    if (seen.has(true) && seen.has(false)) t.done();
  };
  const paintDiode = () => (diodeDraw.node.style.display = withDiode ? '' : 'none');
  const offBtn = el('button.btn.btn-small', { type: 'button', onclick: run }, 'Switch the relay off') as HTMLButtonElement;
  f.controls.append(chipRow([false, true], (d) => (d ? 'Flyback diode' : 'No diode'), () => withDiode, (d) => { withDiode = d; paintDiode(); }), el('div.fig-buttons', {}, offBtn));
  paintDiode();
  sch.show(solve(base));
  scr.hide('Switch it off to see');
  const unhide = () => scr.hide(null);
  offBtn.addEventListener('click', unhide);
  f.readout.textContent = 'A transistor drives a relay’s coil from 12 V; 0.1 A builds its magnetic field. The scope watches the transistor’s collector as the control turns it off.';
  return f.node;
});

// ---------------------------------------------------------------------------
// The fault: the lamp stays on with the control off.

export const shortedTransistorFigure = figure(['find'], (ctx, t) => {
  const bat = { id: 'bat', kind: 'source' as const, a: 'v9', b: 'gnd', volts: 9 };
  const w1 = wire('w1', 'v9', 'lt');
  const lamp = { id: 'lamp', kind: 'lamp' as const, a: 'lt', b: 'c', ohms: 90, rated: 9 };
  const ctl = { id: 'ctl', kind: 'source' as const, a: 'ctl', b: 'gnd', volts: 5 };
  const sw = { id: 'sw', kind: 'switch' as const, a: 'ctl', b: 's', closed: false };
  const rb = { id: 'rb', kind: 'resistor' as const, a: 's', b: 'b', ohms: 4700 };
  const q = { id: 'q', kind: 'bjt' as const, type: 'npn' as const, c: 'c', b: 'b', e: 'e', beta: 200 };
  const we = wire('we', 'e', 'gnd');
  // As it really is: the transistor has failed, its collector joined to its emitter inside.
  const inside = wire('inside', 'c', 'e', 0.2);
  const parts: Part[] = [bat, w1, lamp, ctl, sw, rb, q, we, inside];
  return hunt(ctx, t, {
    parts,
    places: [
      { part: bat, path: [[350, 95], [350, 155]], tag: '9 V', tagSide: 'right' },
      { part: w1, path: [[350, 95], [350, 30], [260, 30], [260, 50]] },
      { part: lamp, path: [[260, 50], [260, 120]], tag: 'Lamp', tagSide: 'left' },
      { part: q, at: [250, 146], leads: { c: [[260, 120]], b: [[224, 146], [190, 146]], e: [[260, 172], [260, 182]] } },
      { part: we, path: [[260, 182], [260, 205], [350, 205], [350, 155]] },
      { part: rb, path: [[190, 146], [130, 146]], tag: '4.7 kΩ', tagSide: 'left' },
      { part: sw, path: [[130, 146], [90, 146], [60, 146], [60, 120]] },
      { part: ctl, path: [[60, 120], [60, 170]], tag: '5 V', tagSide: 'right' },
    ],
    schematic: { topVolts: 9, typicalAmps: 0.05, grounds: [[60, 170], [350, 205]] },
    size: [400, 240],
    face: [20, 20],
    brief: 'The control switch is open, so the transistor should be off and the lamp dark. The lamp is lit.',
    culprit: 'q',
    found: 'Found it: the transistor has failed shorted. Its base is at 0 V, so it should be off, yet it drops nothing from collector to emitter. Transistors that drive coils without a flyback diode often die exactly like this.',
    hints: ['Is the base getting any voltage to turn it on?', 'With no base voltage, what should the collector read?'],
    par: 5,
  });
});
