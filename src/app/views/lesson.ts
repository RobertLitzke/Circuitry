// A lesson (Didactics' lesson view), with a board at the top. A lesson that
// is planned but not written yet (no parts) goes home, which Didactics does
// by itself.

import { lessonView as kitLessonView } from 'didactics/lesson';
import { LESSONS } from '../../core/lessons';
import { FIGURES } from '../figures';
import { prose } from '../figures/kit';
import { makeBoard } from '../scene/board';
import { store } from '../store';

export const lessonView = kitLessonView({
  lessons: LESSONS,
  figures: FIGURES,
  store,
  prose,
  hero: (l) => makeBoard({ seed: 30 + l.n, h: 220 }),
});
