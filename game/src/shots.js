// Deterministic screenshot states, selected with ?shot=<name>&seed=<n>.
// Each state is built by driving the real game logic (clicks, hints, ticks)
// with fixed times, so nothing here depends on the wall clock or randomness.
import { LEVELS } from './levels.js';
import { clickPicture, goToMenu, startLevel, tick, useHint } from './game.js';

export function readShotRequest(search) {
  const q = new URLSearchParams(search);
  const name = q.get('shot');
  if (!name) return null;
  const seed = Number.parseInt(q.get('seed') || '1', 10);
  return { name, seed: Number.isFinite(seed) ? seed : 1 };
}

// Find the differences at the given list positions, as if the player clicked
// them at the given elapsed times.
function findAt(g, indexes, times) {
  const diffs = LEVELS[g.levelIndex].diffs;
  indexes.forEach((di, n) => {
    g.elapsed = times[n];
    clickPicture(g, diffs[di].x, diffs[di].y, n % 2 ? 'right' : 'left');
  });
}

function settle(g) {
  g.popups = [];
  g.flashes = [];
  g.events.length = 0;
}

// Play levels 1..count for real (every difference found, spread evenly over
// clearTime seconds), with an optional wrong click on the way. Leaves the game
// on the result of the last level played, with honest scores and best times.
function playThrough(g, count, plan) {
  for (let i = 0; i < count; i++) {
    startLevel(g, i);
    const n = LEVELS[i].diffs.length;
    const { clearTime, missAt } = plan[i];
    for (let k = 0; k < n; k++) {
      g.elapsed = 5 + ((clearTime - 5) * k) / (n - 1);
      if (k === missAt) clickPicture(g, 4, 4, 'left');
      clickPicture(g, LEVELS[i].diffs[k].x, LEVELS[i].diffs[k].y, k % 2 ? 'right' : 'left');
    }
  }
}

const RUN = [
  { clearTime: 52, missAt: -1 },
  { clearTime: 96, missAt: 5 },
  { clearTime: 88, missAt: 7 },
  { clearTime: 74, missAt: 8 },
];

const SHOTS = {
  // Level select after a full run: four levels, best score and time on each card.
  cover(g) {
    playThrough(g, LEVELS.length, RUN);
    goToMenu(g);
    settle(g);
  },
  // Level 4 in play after three cleared levels: six found, a x3 combo running.
  level4(g) {
    playThrough(g, 3, RUN);
    startLevel(g, 3);
    findAt(g, [0, 2, 4, 5, 6, 10], [9, 15, 22, 27, 33, 41]);
    g.elapsed = 46;
    tick(g, 1.2);
    settle(g);
  },
  // Level 3, handy for checking the marina scene.
  level3(g) {
    playThrough(g, 2, RUN);
    startLevel(g, 2);
    findAt(g, [3, 9], [19, 38]);
    g.elapsed = 44;
    tick(g, 1.2);
    settle(g);
  },
  // Level 2 with the golden hint pulsing on the first unfound difference.
  hint(g) {
    playThrough(g, 1, RUN);
    startLevel(g, 1);
    findAt(g, [1, 2, 3], [20, 33, 45]);
    g.elapsed = 61;
    useHint(g);
    tick(g, 0.45);
    g.popups = [];
    g.events.length = 0;
  },
  // All four levels cleared: the victory screen.
  win(g) {
    playThrough(g, LEVELS.length, RUN);
    tick(g, 2);
    settle(g);
  },
};

export function applyShot(g, request) {
  const build = SHOTS[request.name];
  if (!build) return false;
  g.clock = request.seed;
  build(g);
  return true;
}
