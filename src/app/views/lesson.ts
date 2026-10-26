// A lesson (lesson-kit's lesson view), with a board at the top. A lesson that
// is planned but not written yet goes home.

import { lessonView as kitLessonView } from 'lesson-kit/lesson';
import type { View } from 'lesson-kit/router';
import { isWritten, lesson, LESSONS } from '../../core/lessons';
import { FIGURES } from '../figures';
import { prose } from '../figures/kit';
import { makeBoard } from '../scene/board';
import { store } from '../store';

const view = kitLessonView({
  lessons: LESSONS,
  figures: FIGURES,
  store,
  prose,
  hero: (l) => makeBoard({ seed: 30 + l.n, h: 220 }),
});

export const lessonView: View = (root, nav) => {
  const l = lesson(nav.params.id);
  if (!l || !isWritten(l)) {
    nav.replace('/home');
    return;
  }
  return view(root, nav);
};
