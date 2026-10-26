// The lessons: short illustrated articles on how circuits work, for someone
// who has soldered and wants to design. Each is paragraphs and live figures to
// play with, in parts; the next part opens once the figures in this one have
// had their small task done. The last part is a check, and the lesson ends
// with a log to sign.
//
// They come in tracks. The core path builds the intuition every circuit
// needs, in order; the pedal and solar tracks branch off it once the core is
// done, and each leans on it. A lesson with no parts is planned and not yet
// written; it shows as coming soon and its route goes home. Each lesson's
// words are a JSON file in data/lessons.
//
// The lesson format and the view that reads it are lesson-kit's lesson.ts.
// Text takes a little markup (see app/figures/kit.ts prose): **bold**,
// *italic*, [[words|colour]] to tie a word to the same colour in a figure, and
// [^id] for a note from the lesson's `footnotes`, which opens in a popup.

import type { Block as KitBlock, Lesson as KitLesson, Part as KitPart } from 'lesson-kit/lesson';
import whatFlows from '../data/lessons/what-flows.json';
import splitting from '../data/lessons/splitting.json';
import power from '../data/lessons/power.json';
import time from '../data/lessons/time.json';
import valves from '../data/lessons/valves.json';
import boards from '../data/lessons/boards.json';
import fuzzFace from '../data/lessons/fuzz-face.json';
import tubeScreamer from '../data/lessons/tube-screamer.json';
import solarPanels from '../data/lessons/solar-panels.json';
import offGrid from '../data/lessons/off-grid.json';

export const FIGURE_IDS = [
  'loop',
  'check',
] as const;
export type FigureId = (typeof FIGURE_IDS)[number];

export type TrackId = 'core' | 'pedals' | 'solar';

export interface Track {
  id: TrackId;
  title: string;
  /** A line on the home page under the title. */
  blurb: string;
}

export const TRACKS: readonly Track[] = [
  { id: 'core', title: 'The core path', blurb: 'How electricity behaves in a circuit, from one battery and a resistor to a populated board. Take these in order.' },
  { id: 'pedals', title: 'Guitar pedals', blurb: 'After the core path: two classic circuits taken apart, with the sound of each knob.' },
  { id: 'solar', title: 'Off-grid solar', blurb: 'After the core path: panels, batteries and controllers, and wiring them into a system that is safe to leave running.' },
];

export type Block = KitBlock<FigureId>;
export type Part = KitPart<FigureId>;
export interface Lesson extends KitLesson<FigureId> {
  track: TrackId;
}

export const LESSONS: readonly Lesson[] = [
  whatFlows as Lesson,
  splitting as Lesson,
  power as Lesson,
  time as Lesson,
  valves as Lesson,
  boards as Lesson,
  fuzzFace as Lesson,
  tubeScreamer as Lesson,
  solarPanels as Lesson,
  offGrid as Lesson,
];

export const isWritten = (l: Lesson): boolean => l.parts.length > 0;

export function lesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export const lessonsIn = (track: TrackId): Lesson[] => LESSONS.filter((l) => l.track === track);

/** A multiple-choice question in a lesson's check. */
export interface Question {
  question: string;
  options: string[];
  answer: number;
  why: string;
}
