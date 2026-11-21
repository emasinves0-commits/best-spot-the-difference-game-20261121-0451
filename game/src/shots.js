// Deterministic screenshot states, selected with ?shot=<name>&seed=<n>.
// Each state is built by driving the real game logic (clicks, hints, ticks)
// with fixed times, so nothing here depends on the wall clock or randomness.
import { LEVELS } from './levels.js';
import { clickPicture, startLevel, tick, useHint } from './game.js';

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

const SHOTS = {
  // Level 1, three found, four to go.
  cover(g) {
    startLevel(g, 0);
    findAt(g, [0, 2, 3], [14, 29, 47]);
    g.elapsed = 52;
    tick(g, 1.2);
    settle(g);
  },
  // Level 2, two found after a fast first level.
  level2(g) {
    startLevel(g, 1);
    g.results = [{ score: 596, time: 52, stars: 3 }];
    g.carried = 596;
    findAt(g, [0, 5], [22, 41]);
    g.elapsed = 46;
    tick(g, 1.2);
    settle(g);
  },
  // Level 3 with two found, handy for checking the hardest scene.
  level3(g) {
    startLevel(g, 2);
    g.results = [{ score: 596, time: 52, stars: 3 }, { score: 880, time: 90, stars: 2 }];
    g.carried = 1476;
    findAt(g, [3, 9], [19, 38]);
    g.elapsed = 44;
    tick(g, 1.2);
    settle(g);
  },
  // Level 1 with a golden hint ring pulsing on the first unfound difference.
  hint(g) {
    startLevel(g, 0);
    findAt(g, [1, 3], [21, 44]);
    g.elapsed = 71;
    useHint(g);
    tick(g, 0.45);
    g.popups = [];
    g.events.length = 0;
  },
  // Level 1 fully cleared, result card up.
  win(g) {
    startLevel(g, 0);
    findAt(g, [0, 1, 2, 3, 4, 5, 6], [6, 13, 21, 29, 38, 46, 54]);
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
