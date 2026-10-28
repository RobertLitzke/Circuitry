import './app/styles/app.css';
import { Router } from 'didactics/router';
import { appShell, type NavLink } from 'didactics/shell';
import { watchForUpdates } from 'didactics/update';
import { creditsView } from './app/views/credits';
import { homeView } from './app/views/home';
import { lessonView } from './app/views/lesson';
import { quizView } from './app/views/quiz';
import { referenceView } from './app/views/reference';
import { settingsView } from './app/views/settings';

const NAV: readonly NavLink[] = [
  { path: '/home', label: 'Home' },
  { path: '/reference', label: 'Reference' },
  { path: '/quiz', label: 'Quiz' },
  { path: '/settings', label: 'Settings' },
];

/** A lit LED on a board, for the update banner: drawn inline so it shows offline. */
const LED =
  '<svg viewBox="0 0 44 44"><path d="M6 34h32" stroke="#c8793a" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M17 34V24M27 34V24" stroke="#b9bec4" stroke-width="2.4"/>' +
  '<path d="M13 25V17a9 9 0 0 1 18 0v8Z" fill="#ffb21c"/><circle cx="18" cy="15" r="2.5" fill="#fff4cf"/></svg>';

function boot(): void {
  const shell = appShell({
    mount: document.getElementById('app')!,
    title: 'Circuitry',
    subtitle: 'A circuits workbook',
    nav: NAV,
    // A lesson fills the screen: the header would only be in the way.
    fullScreen: (path) => path.startsWith('/lesson/'),
  });
  const router = new Router(shell.outlet, { before: shell.before });
  router
    .add('/home', homeView)
    .add('/lesson/:id', lessonView)
    .add('/reference', referenceView)
    .add('/quiz', quizView)
    .add('/credits', creditsView)
    .add('/settings', settingsView)
    .start('/home');

  if (import.meta.env.DEV) void import('didactics/overflow').then((m) => m.watchOverflow());

  // The page also runs straight from disk, where there is no service worker.
  if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    watchForUpdates({ title: 'New revision', text: 'A new version of Circuitry is ready.', icon: LED });
  }
}

boot();
