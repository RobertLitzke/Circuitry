// Name, moving progress between devices, and the course's text to revise, all
// of it or one lesson (Didactics' settings page, in Circuitry's words).
// Electronics is metric, so there is no units switch.

import { courseSection } from 'didactics/course-view';
import { el } from 'didactics/dom';
import { settingsView as kitSettingsView } from 'didactics/settings';
import { emptySave } from '../../core/save';
import { COURSE } from '../../course';
import { asset } from '../asset';
import { lessonPieces } from '../course-pieces';
import { store } from '../store';

export const settingsView = kitSettingsView({
  store,
  empty: emptySave,
  appName: 'Circuitry',
  saveFile: 'circuitry-save.json',
  oneFile: { href: asset('circuitry.html'), name: 'circuitry.html' },
  sections: courseSection({ edits: COURSE, fileName: 'circuitry-course.json', pieces: lessonPieces() }),
  about: el('p', {}, el('a', { href: '#/credits' }, 'Credits'), ': type and sources.'),
});
