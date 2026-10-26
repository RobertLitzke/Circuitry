import { defineConfig } from 'vite';
import { lessonApp } from 'lesson-kit/vite';
import pkg from './package.json';

// The build is lesson-kit's (packages/lesson-kit/src/vite.ts): everything
// inlined into dist/index.html, the same page again as dist/circuitry.html for
// Settings' download link, and a service worker.
export default defineConfig(
  lessonApp({
    root: __dirname,
    version: pkg.version,
    // Ports follow the local-dev port scheme: one block of ten per web project.
    port: 5450,
    oneFile: 'circuitry.html',
    manifest: {
      name: 'Circuitry: a workbook on circuits',
      short_name: 'Circuitry',
      description: 'Short interactive lessons on circuits: voltage and current you can watch, parts, debugging boards, guitar pedals and off-grid solar.',
      // Keep in sync with --bg in src/app/styles/tokens.css.
      theme_color: '#0f2a22',
    },
  }),
);
