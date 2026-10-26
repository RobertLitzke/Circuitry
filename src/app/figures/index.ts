// Every figure a lesson can use, by the id core/lessons.ts names it with.

import type { FigureId } from '../../core/lessons';
import { checkFigure } from './check';
import type { FigureFactory } from './kit';
import { loopFigure } from './loop';
import { dividerFigure, mysteryBoxFigure, potFigure, sagFigure, wrongValueFigure } from './sources';
import { brokenWireFigure, cellsFigure, junctionFigure, parallelBulbsFigure, rankingFigure } from './series-parallel';
import { ivCurveFigure, meterFigure, ohmTargetFigure, seriesBulbsFigure, trueSpeedFigure } from './what-flows';

export const FIGURES: Record<FigureId, FigureFactory> = {
  loop: loopFigure,
  check: checkFigure,
  'series-bulbs': seriesBulbsFigure,
  'true-speed': trueSpeedFigure,
  meter: meterFigure,
  'ohm-target': ohmTargetFigure,
  'iv-curve': ivCurveFigure,
  'parallel-bulbs': parallelBulbsFigure,
  junction: junctionFigure,
  ranking: rankingFigure,
  cells: cellsFigure,
  'broken-wire': brokenWireFigure,
  divider: dividerFigure,
  pot: potFigure,
  sag: sagFigure,
  'mystery-box': mysteryBoxFigure,
  'wrong-value': wrongValueFigure,
};
