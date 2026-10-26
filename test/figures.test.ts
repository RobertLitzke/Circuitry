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
