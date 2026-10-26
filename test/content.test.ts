// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { lessonProblems } from 'lesson-kit/lesson';
import { FIGURES } from '../src/app/figures';
import { FIGURE_IDS, isWritten, LESSONS, TRACKS, type Question } from '../src/core/lessons';
import { REFERENCE } from '../src/core/reference';
import { SYMBOLS } from '../src/app/circuit/symbols';
import { DECK } from '../src/app/views/quiz';
import quiz from '../src/data/quiz.json';
import type { Concept } from 'lesson-kit/quiz';

describe('lessons', () => {
  it('use only figures and goals that exist', () => {
    expect(lessonProblems(LESSONS, FIGURES)).toEqual([]);
  });

  it('are numbered 1 to n, with unique ids', () => {
    expect(LESSONS.map((l) => l.n)).toEqual(LESSONS.map((_, i) => i + 1));
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it('each end in a check, once written', () => {
    for (const l of LESSONS.filter(isWritten)) {
      const last = l.parts[l.parts.length - 1];
      expect(last.blocks.some((b) => b.kind === 'figure' && FIGURES[b.figure].quiz), l.id).toBe(true);
      expect(l.learned.length, l.id).toBeGreaterThan(0);
    }
  });

  it('each belong to a track, the core path first', () => {
    const ids = TRACKS.map((t) => t.id);
    for (const l of LESSONS) expect(ids, l.id).toContain(l.track);
    // Numbered through: the core lessons, then each branch in the order TRACKS lists them.
    const order = LESSONS.map((l) => ids.indexOf(l.track));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('ask questions with a real answer', () => {
    for (const l of LESSONS) for (const p of l.parts) for (const b of p.blocks) {
      if (b.kind !== 'figure' || b.figure !== 'check') continue;
      const items = (b.options?.items ?? []) as Question[];
      expect(items.length).toBeGreaterThan(0);
      for (const q of items) {
        expect(q.answer, q.question).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.question).toBeLessThan(q.options.length);
        expect(q.why.length, q.question).toBeGreaterThan(10);
      }
    }
  });

  it('have every figure in the list built', () => {
    expect(Object.keys(FIGURES).sort()).toEqual([...FIGURE_IDS].sort());
  });
});

describe('the reference page', () => {
  it('names real lessons and figures', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    for (const s of REFERENCE) {
      expect(ids.has(s.lesson), s.id).toBe(true);
      for (const b of s.blocks) {
        if (b.kind === 'figure') expect(FIGURE_IDS.includes(b.figure), b.figure).toBe(true);
        if (b.kind === 'symbols') for (const sym of b.items) {
          expect(sym.symbol in SYMBOLS, sym.symbol).toBe(true);
          expect(ids.has(sym.lesson), sym.lesson).toBe(true);
        }
        if (b.kind === 'table') for (const r of b.rows) expect(r.length, `${s.id} row ${r[0]}`).toBe(b.columns.length);
      }
    }
    expect(new Set(REFERENCE.map((s) => s.id)).size).toBe(REFERENCE.length);
  });

  it('has something for every written lesson', () => {
    for (const l of LESSONS.filter(isWritten)) expect(REFERENCE.some((s) => s.lesson === l.id && s.blocks.length), l.id).toBe(true);
  });
});

describe('the quiz deck', () => {
  it('has unique cards about written lessons, with real answers', () => {
    expect(new Set(DECK.map((c) => c.id)).size).toBe(DECK.length);
    const written = new Set(LESSONS.filter(isWritten).map((l) => l.id));
    for (const c of quiz.cards as (Concept & { lesson: string })[]) {
      expect(written.has(c.lesson), c.id).toBe(true);
      expect(c.answer).toBeLessThan(c.options.length);
    }
  });
});
