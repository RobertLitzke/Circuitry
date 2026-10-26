// Name, and moving progress between devices (lesson-kit's settings page, in
// Circuitry's words). Electronics is metric, so there is no units switch.

import { el } from 'lesson-kit/dom';
import { settingsView as kitSettingsView } from 'lesson-kit/settings';
import { emptySave } from '../../core/save';
import { asset } from '../asset';
import { store } from '../store';

export const settingsView = kitSettingsView({
  store,
  empty: emptySave,
  appName: 'Circuitry',
  saveFile: 'circuitry-save.json',
  oneFile: { href: asset('circuitry.html'), name: 'circuitry.html' },
  about: el('p', {}, el('a', { href: '#/credits' }, 'Credits'), ': type and sources.'),
});
