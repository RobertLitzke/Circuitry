// Every figure on one page, with its caption from the lessons, for checking
// drawings without playing through: `npm run dev`, then open /figures.html.
// Only the dev server serves it; the build ships index.html alone.

import '../../src/app/styles/app.css';
import { isDiagram, type DiagramBlock } from 'didactics/blocks';
import { el } from 'didactics/dom';
import { FIGURES } from '../../src/app/figures';
import { standaloneFigure } from 'didactics/figure';
import { emptySave } from '../../src/core/save';
import { LESSONS, type FigureId } from '../../src/core/lessons';

const save = emptySave();

const uses = new Map<FigureId, DiagramBlock<FigureId>>();
for (const l of LESSONS) for (const p of l.parts) for (const b of p.blocks) if (isDiagram(b) && !uses.has(b.id)) uses.set(b.id, b);

const only = new URLSearchParams(location.search).get('only');
const article = el('article.article');
for (const id of Object.keys(FIGURES) as FigureId[]) {
  if (only && only !== id) continue;
  const b = uses.get(id);
  const fig = standaloneFigure(FIGURES[id], { caption: `${id}: ${b?.caption ?? '(not in any lesson)'}`, save, goal: b?.goal, options: b?.options });
  fig.node.dataset.figure = id;
  article.append(fig.node);
}
document.getElementById('app')!.append(el('main.view', {}, el('div.paper', {}, article)));
