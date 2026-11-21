// Hand-in step for "Neon Palms - Spot the Difference".
// Stages the playable game and its screenshots into the output folder, then
// asks the platform library to describe the result in a dossier.json.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const here: string = import.meta.dirname;
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Limits the bounty's gate applies to what we hand in.
const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Start each run from a clean slate so repeated runs give identical output.
function stage(folder: string): void {
  const from = join(here, folder);
  if (!existsSync(from)) {
    throw new Error(`missing folder: ${folder}`);
  }
  const to = join(outDir, folder);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, dereference: false });
}

mkdirSync(outDir, { recursive: true });
stage('game');
stage('screenshots');

const dossier = buildDossier(outDir, limits);
writeFileSync(join(outDir, 'dossier.json'), dossier);
const kinds = (folder: string): number => readdirSync(join(outDir, folder), { recursive: true }).length;
console.log(
  `neon palms staged in ${outDir}: ${kinds('game')} game entries, ${kinds('screenshots')} screenshots, dossier ${dossier.length} bytes`,
);
