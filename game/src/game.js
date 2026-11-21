// Game rules and state machine. No drawing and no DOM in here: the loop feeds
// it time (tick) and picture-space clicks (clickPicture), and it reports what
// happened through game.events so the caller can play sounds.
import { LEVELS } from './levels.js';

export const HINT_SECONDS = 2.5;
export const HINTS_PER_LEVEL = 3;
export const FOUND_POINTS = 100;
export const TIME_BONUS_MAX = 50;
export const WRONG_PENALTY = 25;
export const HINT_COST = 50;

export function createGame(bestTimes = {}) {
  return {
    mode: 'menu', // menu | playing | clear | timeup | victory
    levelIndex: 0,
    found: [], // [{id, x, y, radius, age}]
    levelScore: 0,
    carried: 0, // points banked from cleared levels
    elapsed: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hint: null, // {id, age}
    flashes: [], // wrong-click crosses
    popups: [], // floating score text
    shake: { side: 'left', age: 99 },
    results: [], // one per cleared level: {score, time, stars}
    bestTimes,
    newBest: false,
    events: [],
    clock: 0,
  };
}

export function currentLevel(g) {
  return LEVELS[g.levelIndex];
}

export function differencesLeft(g) {
  return currentLevel(g).diffs.length - g.found.length;
}

export function timeLeft(g) {
  return Math.max(0, currentLevel(g).timeLimit - g.elapsed);
}

export function totalScore(g) {
  return g.carried + g.levelScore;
}

export function totalTime(g) {
  return g.results.reduce((sum, r) => sum + r.time, 0);
}

export function starsFor(level, seconds) {
  if (seconds <= level.starTimes[0]) return 3;
  if (seconds <= level.starTimes[1]) return 2;
  return 1;
}

export function startLevel(g, index) {
  g.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
  g.mode = 'playing';
  g.found = [];
  g.levelScore = 0;
  g.elapsed = 0;
  g.hintsLeft = HINTS_PER_LEVEL;
  g.hint = null;
  g.flashes = [];
  g.popups = [];
  g.newBest = false;
  if (g.levelIndex === 0) {
    g.carried = 0;
    g.results = [];
  } else {
    // jumping straight to a later level keeps only honest earlier results
    g.results = g.results.slice(0, g.levelIndex);
    g.carried = g.results.reduce((s, r) => s + r.score, 0);
  }
}

export function restartLevel(g) {
  startLevel(g, g.levelIndex);
}

export function goToMenu(g) {
  g.mode = 'menu';
  g.hint = null;
}

export function nextLevel(g) {
  if (g.levelIndex + 1 < LEVELS.length) startLevel(g, g.levelIndex + 1);
  else g.mode = 'victory';
}

export function playAgain(g) {
  g.results = [];
  g.carried = 0;
  startLevel(g, 0);
}

function finishLevel(g) {
  const level = currentLevel(g);
  const stars = starsFor(level, g.elapsed);
  g.results[g.levelIndex] = { score: g.levelScore, time: g.elapsed, stars };
  const prev = g.bestTimes[level.id];
  g.newBest = prev === undefined || g.elapsed < prev;
  if (g.newBest) g.bestTimes[level.id] = g.elapsed;
  g.carried += g.levelScore;
  g.levelScore = 0;
  g.hint = null;
  g.events.push('win');
  g.mode = g.levelIndex === LEVELS.length - 1 ? 'victory' : 'clear';
}

export function tick(g, dt) {
  g.clock += dt;
  for (const f of g.found) f.age += dt;
  for (const p of g.popups) p.age += dt;
  g.popups = g.popups.filter((p) => p.age < 1.2);
  for (const f of g.flashes) f.age += dt;
  g.flashes = g.flashes.filter((f) => f.age < 0.6);
  g.shake.age += dt;
  if (g.hint) {
    g.hint.age += dt;
    if (g.hint.age >= HINT_SECONDS) g.hint = null;
  }
  if (g.mode !== 'playing') return;
  const wholeBefore = Math.ceil(timeLeft(g));
  g.elapsed += dt;
  if (Math.ceil(timeLeft(g)) < wholeBefore && timeLeft(g) <= 10 && timeLeft(g) > 0) g.events.push('tick');
  if (g.elapsed >= currentLevel(g).timeLimit) {
    g.elapsed = currentLevel(g).timeLimit;
    g.hint = null;
    g.mode = 'timeup';
    g.events.push('timeup');
  }
}

// A click in picture coordinates (0..600 x 0..450) on either panel.
// Returns 'found', 'again', 'wrong' or 'ignored'.
export function clickPicture(g, x, y, side) {
  if (g.mode !== 'playing') return 'ignored';
  const level = currentLevel(g);
  for (const d of level.diffs) {
    if (Math.hypot(x - d.x, y - d.y) > d.radius) continue;
    if (g.found.some((f) => f.id === d.id)) return 'again';
    g.found.push({ id: d.id, x: d.x, y: d.y, radius: d.radius, age: 0 });
    const bonus = Math.round((TIME_BONUS_MAX * timeLeft(g)) / level.timeLimit);
    const points = FOUND_POINTS + bonus;
    g.levelScore += points;
    g.popups.push({ x: d.x, y: d.y - d.radius - 6, text: '+' + points, age: 0, color: '#6dffb2', side: 'both' });
    if (g.hint && g.hint.id === d.id) g.hint = null;
    g.events.push('found');
    if (g.found.length === level.diffs.length) finishLevel(g);
    return 'found';
  }
  g.levelScore = Math.max(0, g.levelScore - WRONG_PENALTY);
  g.flashes.push({ x, y, side, age: 0 });
  g.popups.push({ x, y: y - 14, text: '-' + WRONG_PENALTY, age: 0, color: '#ff6b7a', side });
  g.shake = { side, age: 0 };
  g.events.push('wrong');
  return 'wrong';
}

export function useHint(g) {
  if (g.mode !== 'playing' || g.hintsLeft <= 0 || g.hint) return false;
  const target = currentLevel(g).diffs.find((d) => !g.found.some((f) => f.id === d.id));
  if (!target) return false;
  g.hintsLeft -= 1;
  g.levelScore = Math.max(0, g.levelScore - HINT_COST);
  g.hint = { id: target.id, age: 0 };
  g.events.push('hint');
  return true;
}
