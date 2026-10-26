// Every figure a lesson can use, by the id core/lessons.ts names it with.

import type { FigureId } from '../../core/lessons';
import { checkFigure } from './check';
import type { FigureFactory } from './kit';
import { loopFigure } from './loop';
import { ivCurveFigure, meterFigure, ohmTargetFigure, seriesBulbsFigure, trueSpeedFigure } from './what-flows';

export const FIGURES: Record<FigureId, FigureFactory> = {
  loop: loopFigure,
  check: checkFigure,
  'series-bulbs': seriesBulbsFigure,
  'true-speed': trueSpeedFigure,
  meter: meterFigure,
  'ohm-target': ohmTargetFigure,
  'iv-curve': ivCurveFigure,
};
