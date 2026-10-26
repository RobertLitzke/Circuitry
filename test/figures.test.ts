// @vitest-environment happy-dom
// Every figure builds, the ones in lessons with their lesson's options, and the board draws.
import { describe, expect, it } from 'vitest';
import { FIGURES } from '../src/app/figures';
import { makeBoard } from '../src/app/scene/board';
import { LESSONS, type FigureId } from '../src/core/lessons';
import { emptySave } from '../src/core/save';

const ctx = () => ({ save: emptySave(), closed: new AbortController().signal, score: () => {} });

describe('figures', () => {
  it('all build on their own', () => {
    for (const id of Object.keys(FIGURES) as FigureId[]) {
      if (FIGURES[id].quiz) continue;
      expect(FIGURES[id](ctx()).node, id).toBeInstanceOf(HTMLElement);
    }
  });

  it('all build as the lessons use them', () => {
    for (const l of LESSONS) for (const p of l.parts) for (const b of p.blocks) {
      if (b.kind !== 'figure') continue;
      expect(FIGURES[b.figure](ctx(), b.goal, b.options).node, b.figure).toBeInstanceOf(HTMLElement);
    }
  });

  it('the loop dims its lamp, and stops when the switch opens', async () => {
    const loop = FIGURES.loop(ctx(), 'dim');
    const [, resistor] = loop.node.querySelectorAll('input');
    resistor.value = '150';
    resistor.dispatchEvent(new Event('input'));
    await expect(loop.done).resolves.toBeUndefined();
    expect(loop.node.textContent).toContain('50 mA');
    loop.node.querySelector('.switch')!.dispatchEvent(new Event('click'));
    expect(loop.node.textContent).toContain('switch is open');
  });
});

describe('the board', () => {
  it('draws the same board from the same seed', () => {
    expect(makeBoard({ seed: 3 }).outerHTML).toBe(makeBoard({ seed: 3 }).outerHTML);
  });
});

describe('lesson 1', () => {
  const click = (el: Element) => el.dispatchEvent(new Event('click', { bubbles: true }));
  const chip = (node: HTMLElement, text: string) => [...node.querySelectorAll('.chip')].find((c) => c.textContent?.includes(text))!;

  it('keeps the bulbs covered until a guess is locked in', async () => {
    const fig = FIGURES['series-bulbs'](ctx(), 'reveal');
    expect(fig.node.querySelector('.glow')!.getAttribute('opacity')).toBe('0');
    click(chip(fig.node, 'A, the first'));
    click([...fig.node.querySelectorAll('button')].find((b) => b.textContent === 'Lock it in')!);
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('Most people guess A');
    expect(Number(fig.node.querySelector('.glow')!.getAttribute('opacity'))).toBeGreaterThan(0);
  });

  it('measures volts across and blows its fuse in amps across a part', async () => {
    const fig = FIGURES.meter(ctx(), 'amps');
    click(chip(fig.node, 'Amps'));
    const hits = fig.node.querySelectorAll('polyline[stroke="transparent"]');
    click(hits[2]); // the resistor
    expect(fig.node.textContent).toContain('fuse blew');
    click([...fig.node.querySelectorAll('button')].find((b) => b.textContent === 'Fit a new fuse')!);
    click(hits[1]); // a plain wire
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toMatch(/\d+ mA flows through the meter/);
  });

  it('hits 20 mA with a 470 Ω resistor', async () => {
    const fig = FIGURES['ohm-target'](ctx(), 'hit');
    const input = fig.node.querySelector('input')!;
    input.value = '8'; // 100, 120, … 470 is the ninth value
    input.dispatchEvent(new Event('input'));
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('470 Ω');
    expect(fig.node.querySelectorAll('.star.got').length).toBe(3);
  });

  it('traces a straight resistor, then a lamp that bends over', async () => {
    const fig = FIGURES['iv-curve'](ctx(), 'lamp');
    const sweep = () => {
      const input = fig.node.querySelector('input')!;
      for (let v = 0; v <= 12; v += 0.5) {
        input.value = String(v);
        input.dispatchEvent(new Event('input'));
      }
    };
    sweep();
    expect(fig.node.textContent).toContain('A straight line');
    click([...fig.node.querySelectorAll('button')].find((b) => b.textContent === 'Swap in the lamp')!);
    click(chip(fig.node, 'bends over'));
    click([...fig.node.querySelectorAll('button')].find((b) => b.textContent === 'Lock it in')!);
    sweep();
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('bends over');
  });
});

describe('lesson 2', () => {
  const click = (el: Element) => el.dispatchEvent(new Event('click', { bubbles: true }));
  const chip = (node: HTMLElement, text: string) => [...node.querySelectorAll('.chip')].find((c) => c.textContent?.includes(text))!;
  const button = (node: HTMLElement, text: string) => [...node.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  const lockGuess = (node: HTMLElement, option: string) => {
    click(chip(node, option));
    click([...node.querySelectorAll('button')].find((b) => b.textContent === 'Lock it in' && !b.disabled)!);
  };

  it('doubles the battery current when a parallel bulb goes in', async () => {
    const fig = FIGURES['parallel-bulbs'](ctx(), 'reveal');
    lockGuess(fig.node, 'stays the same');
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('twice as much');
  });

  it('ranks A brightest, then dims A when C comes out', async () => {
    const fig = FIGURES.ranking(ctx(), 'rank');
    lockGuess(fig.node, 'A, then B and C equal');
    expect(fig.node.textContent).toContain('splits into');
    lockGuess(fig.node, 'A dims');
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('With C out');
  });

  it('sets three branches to draw 30 mA', async () => {
    const fig = FIGURES.junction(ctx(), 'target');
    const [r1, r2, r3] = fig.node.querySelectorAll('input');
    // 470 Ω, 1 kΩ, 4.7 kΩ: 19.1 + 9 + 1.9 = 30 mA.
    for (const [input, k] of [[r1, 8], [r2, 12], [r3, 20]] as const) {
      input.value = String(k);
      input.dispatchEvent(new Event('input'));
    }
    await expect(fig.done).resolves.toBeUndefined();
  });

  it('joins cells three ways, and the flat one takes current', async () => {
    const fig = FIGURES.cells(ctx(), 'all');
    click(chip(fig.node, 'Side by side'));
    expect(fig.node.textContent).toContain('last twice as long');
    click(chip(fig.node, 'one flat'));
    expect(fig.node.textContent).toContain('takes');
    await expect(fig.done).resolves.toBeUndefined();
  });

  it('finds the broken wire with the meter', async () => {
    const fig = FIGURES['broken-wire'](ctx(), 'find');
    const hits = fig.node.querySelectorAll('polyline[stroke="transparent"]');
    click(button(fig.node, 'Mark the fault'));
    click(hits[6]); // bulb B: wrong
    expect(fig.node.textContent).toContain('Not that one');
    click(button(fig.node, 'Mark the fault'));
    click(hits[7]); // the wire under B
    await expect(fig.done).resolves.toBeUndefined();
    expect(fig.node.textContent).toContain('Found it');
  });
});
