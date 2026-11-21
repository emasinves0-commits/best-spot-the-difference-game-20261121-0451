// Everything on screen except the two pictures themselves: backdrop, HUD,
// timer bar, markers, hint pulse, buttons and the menu / result screens.
// drawFrame() repaints the whole 1280x800 canvas and returns the clickable
// buttons it drew so the input code can hit-test them.
import { LEVELS } from './levels.js';
import { SCENE_W, SCENE_H } from './scene.js';
import {
  HINTS_PER_LEVEL, HINT_SECONDS, currentLevel, differencesLeft, timeLeft, totalScore, totalTime,
} from './game.js';
import { isMuted } from './audio.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const PANEL_L = { x: 30, y: 112, w: SCENE_W, h: SCENE_H };
export const PANEL_R = { x: 650, y: 112, w: SCENE_W, h: SCENE_H };

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
const CYAN = '#4fe3ff';
const PINK = '#ff4fa3';
const GOLD = '#ffd23f';
const GREEN = '#3dff9c';

// Map a canvas point onto a picture: which side, and the picture coordinates.
export function panelAt(x, y) {
  for (const [side, r] of [['left', PANEL_L], ['right', PANEL_R]]) {
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
      return { side, px: x - r.x, py: y - r.y };
    }
  }
  return null;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ---------------------------------------------------------------- small helpers

function pill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold', glow = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(str, x, y);
  ctx.shadowBlur = 0;
}

function starShape(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

function drawStars(ctx, cx, cy, size, count, total = 3) {
  const gap = size * 1.15;
  for (let i = 0; i < total; i++) {
    const x = cx + (i - (total - 1) / 2) * gap;
    starShape(ctx, x, cy, size / 2);
    if (i < count) {
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawButton(ctx, b, mouse) {
  const hot = mouse && mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;
  const color = b.color || CYAN;
  const off = b.disabled;
  pill(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = off ? 'rgba(255,255,255,0.05)' : hot ? color + '55' : 'rgba(20,10,50,0.85)';
  ctx.fill();
  ctx.lineWidth = hot ? 3 : 2;
  ctx.strokeStyle = off ? 'rgba(255,255,255,0.2)' : color;
  if (!off) {
    ctx.shadowColor = color;
    ctx.shadowBlur = hot ? 18 : 8;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  const size = b.size || 20;
  const lift = b.sub ? 8 : 0;
  text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + size * 0.35 - lift, size, off ? '#7a7498' : '#fff', 'center');
  if (b.sub) text(ctx, b.sub, b.x + b.w / 2, b.y + b.h - 10, 12, off ? '#6a6488' : color, 'center', 'normal');
}

// ---------------------------------------------------------------- backdrop

function drawBackdrop(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, '#0b0620');
  g.addColorStop(0.6, '#1b0b3d');
  g.addColorStop(1, '#2d0f47');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = 'rgba(255,79,163,0.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const y = 600 + i * i * 0.95 + ((t * 12) % 1);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 + i * 30, 600);
    ctx.lineTo(CANVAS_W / 2 + i * 150, CANVAS_H);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- pictures and markers

function ring(ctx, x, y, r, color, width, blur) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPanel(ctx, g, bitmap, rect, side, accent, ui) {
  const shakeAmount = g.shake.side === side && g.shake.age < 0.4 ? Math.sin(g.shake.age * 70) * 7 * (1 - g.shake.age / 0.4) : 0;
  ctx.save();
  ctx.translate(rect.x + shakeAmount, rect.y);
  ctx.beginPath();
  ctx.rect(0, 0, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(bitmap, 0, 0);

  const level = currentLevel(g);
  if (ui.debug && side === 'right') {
    ctx.font = '10px monospace';
    for (const d of level.diffs) {
      ring(ctx, d.x, d.y, d.radius, 'rgba(255,255,255,0.8)', 1, 0);
      ctx.fillStyle = '#fff';
      ctx.fillText(d.id, d.x - 20, d.y + d.radius + 10);
    }
  }
  for (const f of g.found) {
    const grow = Math.min(1, f.age / 0.25);
    ring(ctx, f.x, f.y, f.radius * (0.8 + 0.2 * grow), GREEN, 4, 14);
    ring(ctx, f.x, f.y, f.radius * (0.8 + 0.2 * grow) + 5, 'rgba(255,255,255,0.55)', 1.5, 0);
    if (f.age < 0.7) {
      ctx.globalAlpha = 1 - f.age / 0.7;
      ring(ctx, f.x, f.y, f.radius * (1 + f.age * 2.2), '#ffffff', 3, 10);
      ctx.globalAlpha = 1;
    }
  }
  if (g.hint) {
    const d = level.diffs.find((e) => e.id === g.hint.id);
    if (d) {
      const fade = g.hint.age > HINT_SECONDS - 0.4 ? (HINT_SECONDS - g.hint.age) / 0.4 : 1;
      ctx.globalAlpha = Math.max(0, fade);
      const pulse = Math.sin(g.hint.age * 9);
      ring(ctx, d.x, d.y, d.radius + 6 + pulse * 5, GOLD, 5, 22);
      ring(ctx, d.x, d.y, d.radius + 18 + pulse * 5, 'rgba(255,210,63,0.5)', 2.5, 10);
      ctx.globalAlpha = 1;
    }
  }
  for (const f of g.flashes) {
    if (f.side !== side) continue;
    ctx.globalAlpha = 1 - f.age / 0.6;
    ctx.strokeStyle = '#ff3b55';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ff3b55';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(f.x - 13, f.y - 13);
    ctx.lineTo(f.x + 13, f.y + 13);
    ctx.moveTo(f.x + 13, f.y - 13);
    ctx.lineTo(f.x - 13, f.y + 13);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  for (const p of g.popups) {
    if (p.side !== 'both' && p.side !== side) continue;
    ctx.globalAlpha = 1 - p.age / 1.2;
    text(ctx, p.text, p.x, p.y - p.age * 28, 22, p.color, 'center', 'bold', 8);
    ctx.globalAlpha = 1;
  }
  // corner tag
  const tag = side === 'left' ? 'ORIGINAL' : 'SPOT THE CHANGES';
  ctx.font = `bold 12px ${FONT}`;
  const tw = ctx.measureText(tag).width + 18;
  pill(ctx, 8, 8, tw, 22, 11);
  ctx.fillStyle = 'rgba(10,4,30,0.72)';
  ctx.fill();
  text(ctx, tag, 17, 24, 12, accent, 'left');
  ctx.restore();

  pill(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 10);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------- HUD

function barColor(frac, clock) {
  if (frac > 0.5) return GREEN;
  if (frac > 0.25) return GOLD;
  return Math.floor(clock * 4) % 2 || frac > 0.12 ? '#ff4f5e' : '#ff9aa5';
}

function drawHud(ctx, g, ui, buttons) {
  const level = currentLevel(g);
  text(ctx, 'NEON PALMS', 30, 46, 32, PINK, 'left', 'bold', 18);
  text(ctx, `Level ${level.id} · ${level.name}`, 32, 78, 17, '#d9ccff', 'left', 'normal');

  const left = differencesLeft(g);
  text(ctx, `Differences left: ${left}`, 640, 56, 38, left === 0 ? GREEN : CYAN, 'center', 'bold', 16);
  const n = level.diffs.length;
  const pipGap = 22;
  for (let i = 0; i < n; i++) {
    const x = 640 + (i - (n - 1) / 2) * pipGap;
    ctx.beginPath();
    ctx.arc(x, 85, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < g.found.length ? GREEN : 'rgba(255,255,255,0.12)';
    if (i < g.found.length) {
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 8;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  text(ctx, 'SCORE', 1250, 34, 14, '#d9ccff', 'right', 'bold');
  text(ctx, String(totalScore(g)), 1250, 74, 40, GOLD, 'right', 'bold', 12);

  // countdown: big digits plus a draining bar
  const frac = timeLeft(g) / level.timeLimit;
  const col = barColor(frac, g.clock);
  text(ctx, 'TIME LEFT', 30, 596, 13, '#d9ccff', 'left', 'bold');
  text(ctx, formatTime(Math.ceil(timeLeft(g))), 30, 646, 58, col, 'left', 'bold', 14);
  const bx = 210;
  const bw = 1040;
  pill(ctx, bx, 598, bw, 38, 19);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  if (frac > 0.005) {
    ctx.save();
    pill(ctx, bx, 598, bw, 38, 19);
    ctx.clip();
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, col);
    grad.addColorStop(1, col + 'aa');
    ctx.fillStyle = grad;
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;
    ctx.fillRect(bx, 598, bw * frac, 38);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  pill(ctx, bx, 598, bw, 38, 19);
  ctx.stroke();
  ctx.fillStyle = 'rgba(8,2,24,0.55)';
  for (let s = 30; s < level.timeLimit; s += 30) ctx.fillRect(bx + (bw * s) / level.timeLimit, 604, 2, 26);
  const best = g.bestTimes[level.id];
  text(
    ctx,
    `Elapsed ${formatTime(g.elapsed)}   ·   Best ${best === undefined ? '--' : formatTime(best)}   ·   Limit ${formatTime(level.timeLimit)}`,
    bx, 668, 17, '#d9ccff', 'left', 'normal',
  );

  const y = 692;
  const hintLabel = g.hintsLeft > 0 ? `HINT  [H]` : 'NO HINTS';
  buttons.push({ id: 'hint', x: 30, y, w: 330, h: 56, label: hintLabel, sub: `${g.hintsLeft} of ${HINTS_PER_LEVEL} left · costs 50`, color: GOLD, disabled: g.hintsLeft <= 0 });
  buttons.push({ id: 'restart', x: 376, y, w: 280, h: 56, label: 'RESTART  [R]', color: CYAN });
  buttons.push({ id: 'menu', x: 672, y, w: 280, h: 56, label: 'MENU  [Esc]', color: PINK });
  buttons.push({ id: 'mute', x: 968, y, w: 282, h: 56, label: isMuted() ? 'SOUND OFF  [M]' : 'SOUND ON  [M]', color: GREEN });
  text(ctx, 'Click a difference on either picture   ·   wrong clicks cost 25 points   ·   keys 1 2 3 jump to a level', 640, 780, 15, '#a99ad6', 'center', 'normal');
}

// ---------------------------------------------------------------- screens

function dim(ctx) {
  ctx.fillStyle = 'rgba(6,2,22,0.76)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function card(ctx, x, y, w, h, accent) {
  pill(ctx, x, y, w, h, 22);
  ctx.fillStyle = 'rgba(18,8,46,0.96)';
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawClear(ctx, g, buttons) {
  dim(ctx);
  const level = currentLevel(g);
  const r = g.results[g.levelIndex];
  card(ctx, 320, 150, 640, 500, GREEN);
  text(ctx, 'LEVEL CLEAR!', 640, 226, 58, GREEN, 'center', 'bold', 20);
  text(ctx, `Level ${level.id} · ${level.name}`, 640, 262, 20, '#d9ccff', 'center', 'normal');
  drawStars(ctx, 640, 340, 84, r.stars);
  text(ctx, `Score  +${r.score}`, 640, 428, 34, GOLD, 'center', 'bold', 10);
  text(ctx, `Time  ${formatTime(r.time)}${g.newBest ? '   NEW BEST!' : ''}`, 640, 468, 24, g.newBest ? GREEN : '#fff', 'center');
  text(ctx, `Total score  ${totalScore(g)}`, 640, 502, 20, '#d9ccff', 'center', 'normal');
  buttons.push({ id: 'next', x: 380, y: 530, w: 520, h: 56, label: 'NEXT LEVEL  ▶', color: GREEN, size: 24 });
  buttons.push({ id: 'restart', x: 380, y: 596, w: 250, h: 40, label: 'Replay  [R]', color: CYAN, size: 17 });
  buttons.push({ id: 'menu', x: 650, y: 596, w: 250, h: 40, label: 'Menu  [Esc]', color: PINK, size: 17 });
}

function drawTimeUp(ctx, g, buttons) {
  dim(ctx);
  const level = currentLevel(g);
  card(ctx, 340, 200, 600, 400, '#ff4f5e');
  text(ctx, "TIME'S UP!", 640, 290, 62, '#ff4f5e', 'center', 'bold', 22);
  text(ctx, `Level ${level.id} · ${level.name}`, 640, 330, 20, '#d9ccff', 'center', 'normal');
  text(ctx, `You found ${g.found.length} of ${level.diffs.length} differences`, 640, 394, 28, '#fff', 'center');
  text(ctx, 'The clock beat you this time. Go again!', 640, 432, 18, '#d9ccff', 'center', 'normal');
  buttons.push({ id: 'restart', x: 400, y: 476, w: 480, h: 58, label: 'TRY AGAIN  [R]', color: GOLD, size: 24 });
  buttons.push({ id: 'menu', x: 400, y: 544, w: 480, h: 40, label: 'Menu  [Esc]', color: PINK, size: 17 });
}

function drawVictory(ctx, g, buttons) {
  dim(ctx);
  card(ctx, 300, 90, 680, 620, GOLD);
  text(ctx, 'YOU SPOTTED THEM ALL!', 640, 168, 44, GOLD, 'center', 'bold', 20);
  text(ctx, 'Neon Palms is yours: three scenes, 29 differences.', 640, 202, 19, '#d9ccff', 'center', 'normal');
  LEVELS.forEach((lv, i) => {
    const y = 254 + i * 74;
    const r = g.results[i];
    text(ctx, `${lv.id}. ${lv.name}`, 350, y + 14, 24, '#fff', 'left');
    if (r) {
      text(ctx, `${formatTime(r.time)}   ${r.score} pts`, 700, y + 12, 19, '#d9ccff', 'left', 'normal');
      drawStars(ctx, 900, y + 6, 36, r.stars);
    }
  });
  text(ctx, `Total score  ${totalScore(g)}`, 640, 500, 44, GOLD, 'center', 'bold', 16);
  text(ctx, `Total time  ${formatTime(totalTime(g))}`, 640, 546, 28, CYAN, 'center', 'bold', 10);
  buttons.push({ id: 'again', x: 400, y: 586, w: 480, h: 58, label: 'PLAY AGAIN', color: GREEN, size: 26 });
  buttons.push({ id: 'menu', x: 400, y: 654, w: 480, h: 38, label: 'Menu  [Esc]', color: PINK, size: 17 });
}

function drawMenu(ctx, g, bitmaps, ui, buttons) {
  text(ctx, 'NEON PALMS', 640, 118, 92, PINK, 'center', 'bold', 34);
  text(ctx, 'S P O T   T H E   D I F F E R E N C E', 640, 168, 28, CYAN, 'center', 'bold', 14);
  text(ctx, 'Two pictures. A handful of sneaky changes. Find them before the clock runs dry.', 640, 206, 19, '#d9ccff', 'center', 'normal');
  LEVELS.forEach((lv, i) => {
    const x = 40 + i * 410;
    const y = 232;
    const b = { id: 'card' + i, x, y, w: 380, h: 388, label: '' };
    const hot = ui.mouse && ui.mouse.x >= b.x && ui.mouse.x <= b.x + b.w && ui.mouse.y >= b.y && ui.mouse.y <= b.y + b.h;
    card(ctx, x, y, 380, 388, hot ? GOLD : [CYAN, PINK, GREEN][i]);
    ctx.save();
    pill(ctx, x + 14, y + 14, 352, 264, 12);
    ctx.clip();
    ctx.drawImage(bitmaps[i].right, x + 14, y + 14, 352, 264);
    ctx.restore();
    text(ctx, `LEVEL ${lv.id}`, x + 20, y + 312, 15, [CYAN, PINK, GREEN][i], 'left', 'bold');
    text(ctx, lv.name, x + 20, y + 342, 28, '#fff', 'left');
    text(ctx, `${lv.diffs.length} differences · ${lv.timeLimit}s`, x + 20, y + 370, 16, '#d9ccff', 'left', 'normal');
    const best = g.bestTimes[lv.id];
    text(ctx, best === undefined ? 'Best  --' : `Best  ${formatTime(best)}`, x + 360, y + 370, 16, GOLD, 'right', 'bold');
    buttons.push(b);
  });
  text(ctx, 'Click a level or press 1 / 2 / 3', 640, 668, 22, '#fff', 'center', 'bold', 6);
  text(ctx, 'H hint  ·  R restart  ·  Esc menu  ·  M mute  ·  3 hints per level, each costs 50 points', 640, 704, 16, '#a99ad6', 'center', 'normal');
  buttons.push({ id: 'mute', x: 500, y: 726, w: 280, h: 46, label: isMuted() ? 'SOUND OFF  [M]' : 'SOUND ON  [M]', color: GREEN, size: 17 });
}

export function drawFrame(ctx, g, bitmaps, ui) {
  const buttons = [];
  drawBackdrop(ctx, g.clock);
  if (g.mode === 'menu') {
    drawMenu(ctx, g, bitmaps, ui, buttons);
  } else {
    const pair = bitmaps[g.levelIndex];
    drawPanel(ctx, g, pair.left, PANEL_L, 'left', CYAN, ui);
    drawPanel(ctx, g, pair.right, PANEL_R, 'right', PINK, ui);
    const hud = [];
    drawHud(ctx, g, ui, hud);
    for (const b of hud) drawButton(ctx, b, g.mode === 'playing' ? ui.mouse : null);
    // while a result card is up, only the card's own buttons are live
    if (g.mode === 'playing') buttons.push(...hud);
    if (g.mode === 'clear') drawClear(ctx, g, buttons);
    else if (g.mode === 'timeup') drawTimeUp(ctx, g, buttons);
    else if (g.mode === 'victory') drawVictory(ctx, g, buttons);
  }
  for (const b of buttons) {
    if (b.id.startsWith('card')) continue;
    if (g.mode === 'playing' && ['hint', 'restart', 'menu', 'mute'].includes(b.id)) continue;
    drawButton(ctx, b, ui.mouse);
  }
  return buttons;
}
