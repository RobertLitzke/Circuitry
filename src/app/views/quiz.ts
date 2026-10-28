// The quiz: flash cards on the ideas in the written lessons (data/quiz.json),
// shown by Didactics' quiz page with spaced repetition. Until a lesson is
// written there are no cards, and the page says so.

import { el } from 'didactics/dom';
import { conceptCard, type Concept } from 'didactics/quiz';
import { quizView as kitQuizView } from 'didactics/quiz-view';
import type { View } from 'didactics/router';
import ideas from '../../data/quiz.json';
import { store } from '../store';

export const DECK = (ideas.cards as Concept[]).map((c) => conceptCard(c));

const kitView = kitQuizView({
  deck: DECK,
  store,
  blurb: 'Flash cards on the ideas in the lessons. Cards you get right come back after longer and longer gaps; cards you miss come back soon.',
});

export const quizView: View = (root, nav) => {
  if (DECK.length) return kitView(root, nav);
  root.append(el('div.page', {}, el('h1', {}, 'Quiz'), el('p', {}, 'Flash cards arrive with the first written lesson.')));
};
