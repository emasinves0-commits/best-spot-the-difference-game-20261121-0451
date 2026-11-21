// Boots the game: builds the pictures, wires mouse and keyboard to the game
// rules, plays sounds for what happened and runs the animation loop.
import { LEVELS } from './levels.js';
import { renderLevelBitmaps } from './scene.js';
import {
  createGame, tick, clickPicture, useHint, startLevel, restartLevel, goToMenu, nextLevel, playAgain,
} from './game.js';
import { drawFrame, panelAt, CANVAS_W, CANVAS_H } from './render.js';
import {
  unlockAudio, toggleMute, playChime, playBuzz, playShimmer, playWin, playTimeUp, playTick,
} from './audio.js';
import { readShotRequest, applyShot } from './shots.js';

const STORE_KEY = 'neonpalms.besttimes.v1';

function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function saveBest(best) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(best));
  } catch {
    // private mode or blocked storage: best times just last for this visit
  }
}

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(location.search);
const shot = readShotRequest(location.search);
const bitmaps = LEVELS.map(renderLevelBitmaps);
const game = createGame(shot ? {} : loadBest());
const ui = { mouse: null, debug: params.get('debug') === '1', frozen: false };
let buttons = [];

if (shot) {
  ui.frozen = applyShot(game, shot);
}

const SOUNDS = {
  found: playChime, wrong: playBuzz, hint: playShimmer, win: playWin, timeup: playTimeUp, tick: playTick,
};

function flushEvents() {
  for (const name of game.events) {
    if (name === 'win' && !shot) saveBest(game.bestTimes);
    const play = SOUNDS[name];
    if (play) play();
  }
  game.events.length = 0;
}

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * CANVAS_W) / r.width, y: ((e.clientY - r.top) * CANVAS_H) / r.height };
}

function pressButton(id) {
  if (id.startsWith('card')) startLevel(game, Number(id.slice(4)));
  else if (id === 'hint') useHint(game);
  else if (id === 'restart') restartLevel(game);
  else if (id === 'menu') goToMenu(game);
  else if (id === 'mute') toggleMute();
  else if (id === 'next') nextLevel(game);
  else if (id === 'again') playAgain(game);
}

function buttonAt(p) {
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b;
  }
  return null;
}

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  const p = toCanvas(e);
  const b = buttonAt(p);
  if (b) {
    if (!b.disabled) pressButton(b.id);
  } else if (game.mode === 'playing') {
    const hit = panelAt(p.x, p.y);
    if (hit) clickPicture(game, hit.px, hit.py, hit.side);
  }
  flushEvents();
});

canvas.addEventListener('pointermove', (e) => {
  ui.mouse = toCanvas(e);
  const over = buttonAt(ui.mouse);
  canvas.style.cursor = over && !over.disabled ? 'pointer' : game.mode === 'playing' && panelAt(ui.mouse.x, ui.mouse.y) ? 'crosshair' : 'default';
});

canvas.addEventListener('pointerleave', () => {
  ui.mouse = null;
});

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  unlockAudio();
  const k = e.key.toLowerCase();
  if (k === 'h') useHint(game);
  else if (k === 'r' && game.mode !== 'menu' && game.mode !== 'victory') restartLevel(game);
  else if (k === 'escape') goToMenu(game);
  else if (k === 'm') toggleMute();
  else if (k >= '1' && k <= String(LEVELS.length)) startLevel(game, Number(k) - 1);
  else if (k === 'enter' && game.mode === 'clear') nextLevel(game);
  else if (k === 'enter' && game.mode === 'victory') playAgain(game);
  else return;
  e.preventDefault();
  flushEvents();
});

// Coming back to a hidden tab must not count as time spent playing.
document.addEventListener('visibilitychange', () => {
  last = performance.now();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!ui.frozen) tick(game, dt);
  flushEvents();
  buttons = drawFrame(ctx, game, bitmaps, ui);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handle for tests and curious players: read-only peek at the game state.
window.neonPalms = { game, levels: LEVELS };
