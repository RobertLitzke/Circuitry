import './app/styles/app.css';
import { el } from 'lesson-kit/dom';
import { Router } from 'lesson-kit/router';
import { watchForUpdates } from 'lesson-kit/update';
import { creditsView } from './app/views/credits';
import { homeView } from './app/views/home';
import { lessonView } from './app/views/lesson';
import { quizView } from './app/views/quiz';
import { referenceView } from './app/views/reference';
import { settingsView } from './app/views/settings';

const NAV: readonly [string, string][] = [
  ['/home', 'Home'],
  ['/reference', 'Reference'],
  ['/quiz', 'Quiz'],
  ['/settings', 'Settings'],
];

/** A lit LED on a board, for the update banner: drawn inline so it shows offline. */
const LED =
  '<svg viewBox="0 0 44 44"><path d="M6 34h32" stroke="#c8793a" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M17 34V24M27 34V24" stroke="#b9bec4" stroke-width="2.4"/>' +
  '<path d="M13 25V17a9 9 0 0 1 18 0v8Z" fill="#ffb21c"/><circle cx="18" cy="15" r="2.5" fill="#fff4cf"/></svg>';

function boot(): void {
  const app = document.getElementById('app')!;
  const links = NAV.map(([path, label]) => el('a', { href: `#${path}` }, label));
  const header = el(
    'header.topbar',
    {},
    el('a.wordmark', { href: '#/home' }, 'Circuitry', el('span', {}, 'A circuits workbook')),
    el('nav', {}, links),
  );
  const outlet = el('main');
  app.replaceChildren(header, outlet);

  const markHere = () => {
    const here = location.hash.replace(/^#/, '');
    links.forEach((a, i) => a.classList.toggle('here', here.startsWith(NAV[i][0])));
  };
  window.addEventListener('hashchange', markHere);

  const router = new Router(outlet, {
    // A lesson fills the screen: the header would only be in the way.
    before: (path) => document.body.classList.toggle('in-lesson', path.startsWith('/lesson/')),
  });
  router
    .add('/home', homeView)
    .add('/lesson/:id', lessonView)
    .add('/reference', referenceView)
    .add('/quiz', quizView)
    .add('/credits', creditsView)
    .add('/settings', settingsView)
    .start('/home');
  markHere();

  if (import.meta.env.DEV) void import('lesson-kit/overflow').then((m) => m.watchOverflow());

  // The page also runs straight from disk, where there is no service worker.
  if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    watchForUpdates({ title: 'New revision', text: 'A new version of Circuitry is ready.', icon: LED });
  }
}

boot();
