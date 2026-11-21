// Draws one level's picture. The left panel calls it with altered=false, the
// right panel with altered=true; the only thing that differs between the two
// calls is whether the level's difference list is applied to the props.
import { drawProp } from './props.js';
import { makeRng, between } from './rng.js';

export const SCENE_W = 600;
export const SCENE_H = 450;

// Merge the difference list into a copy of one prop layer.
function applyDifferences(list, diffs, layer) {
  const out = list.map((p) => ({ ...p }));
  for (const d of diffs) {
    if (d.add) {
      if ((d.add.layer || 'front') === layer) out.push({ ...d.add });
      continue;
    }
    const i = out.findIndex((p) => p.key === d.target);
    if (i < 0) continue;
    if (d.mod.hide) out.splice(i, 1);
    else Object.assign(out[i], d.mod);
  }
  return out;
}

function paintSky(ctx, level) {
  const g = ctx.createLinearGradient(0, 0, 0, level.horizon);
  for (const [at, color] of level.sky) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCENE_W, level.horizon + 2);
  const rng = makeRng(level.seed);
  for (let i = 0; i < level.stars; i++) {
    const x = rng() * SCENE_W;
    const y = rng() * level.horizon * 0.62;
    const r = 0.5 + rng() * 1.3;
    ctx.fillStyle = `rgba(255,248,225,${0.35 + rng() * 0.55})`;
    ctx.fillRect(x, y, r, r);
  }
}

function paintSkyline(ctx, level) {
  const sk = level.skyline;
  const rng = makeRng(level.seed + 11);
  ctx.fillStyle = sk.color;
  let x = -10;
  while (x < SCENE_W) {
    const w = between(rng, 18, 52);
    const h = between(rng, sk.hmin, sk.hmax);
    ctx.fillRect(x, level.horizon - h, w, h + 6);
    if (rng() < 0.35) ctx.fillRect(x + w * 0.4, level.horizon - h - 10, 3, 10);
    x += w + between(rng, 0, 6);
  }
}

function paintRoad(ctx, level) {
  const y0 = level.horizon;
  ctx.fillStyle = '#3a3360';
  ctx.fillRect(0, y0, SCENE_W, 36);
  ctx.fillStyle = '#524a82';
  ctx.fillRect(0, y0 + 34, SCENE_W, 4);
  const road = ctx.createLinearGradient(0, y0 + 38, 0, SCENE_H);
  road.addColorStop(0, '#2a2548');
  road.addColorStop(1, '#171230');
  ctx.fillStyle = road;
  ctx.fillRect(0, y0 + 38, SCENE_W, SCENE_H - y0 - 38);
  const wet = ctx.createLinearGradient(0, y0 + 38, 0, SCENE_H);
  wet.addColorStop(0, 'rgba(255,93,143,0.22)');
  wet.addColorStop(1, 'rgba(255,93,143,0)');
  ctx.fillStyle = wet;
  ctx.fillRect(0, y0 + 38, SCENE_W, SCENE_H - y0 - 38);
  ctx.fillStyle = '#ffd98a';
  for (let x = 6; x < SCENE_W; x += 70) ctx.fillRect(x, y0 + 86, 38, 4);
  ctx.fillStyle = '#e8e0ff';
  ctx.fillRect(0, SCENE_H - 14, SCENE_W, 3);
}

function paintBoardwalk(ctx, level) {
  const y0 = level.horizon;
  const sea = ctx.createLinearGradient(0, y0, 0, y0 + 62);
  sea.addColorStop(0, '#16507a');
  sea.addColorStop(1, '#0a1f45');
  ctx.fillStyle = sea;
  ctx.fillRect(0, y0, SCENE_W, 62);
  const rng = makeRng(level.seed + 5);
  ctx.fillStyle = 'rgba(255,244,200,0.35)';
  for (let i = 0; i < 16; i++) {
    const wy = y0 + 4 + i * 3.6;
    const half = 6 + i * 2.4;
    ctx.fillRect(404 - half + (rng() - 0.5) * 8, wy, half * 2, 1.4);
  }
  const base = y0 + 62;
  ctx.fillStyle = '#6a4a54';
  ctx.fillRect(0, base - 6, SCENE_W, 6);
  const wood = ctx.createLinearGradient(0, base, 0, SCENE_H);
  wood.addColorStop(0, '#7c5a62');
  wood.addColorStop(1, '#3b2438');
  ctx.fillStyle = wood;
  ctx.fillRect(0, base, SCENE_W, SCENE_H - base);
  ctx.strokeStyle = 'rgba(20,8,30,0.55)';
  ctx.lineWidth = 2;
  for (let y = base + 14; y < SCENE_H; y += 15 + (y - base) * 0.12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCENE_W, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#d7c9ff';
  ctx.fillRect(0, base - 22, SCENE_W, 3);
  for (let x = 4; x < SCENE_W; x += 40) ctx.fillRect(x, base - 22, 3, 18);
}

function paintMarina(ctx, level) {
  const y0 = level.horizon;
  const sea = ctx.createLinearGradient(0, y0, 0, SCENE_H);
  sea.addColorStop(0, '#f5a07a');
  sea.addColorStop(0.35, '#3f8fa0');
  sea.addColorStop(1, '#0f4466');
  ctx.fillStyle = sea;
  ctx.fillRect(0, y0, SCENE_W, SCENE_H - y0);
  const rng = makeRng(level.seed + 3);
  for (let i = 0; i < 60; i++) {
    const y = y0 + 6 + rng() * (SCENE_H - y0 - 8);
    const w = 8 + rng() * 30 * (0.4 + (y - y0) / 160);
    ctx.fillStyle = `rgba(255,235,205,${0.08 + rng() * 0.18})`;
    ctx.fillRect(rng() * SCENE_W, y, w, 1.6);
  }
  // a thin dark embankment where the far shore meets the water
  ctx.fillStyle = '#4b3f66';
  ctx.fillRect(0, y0, SCENE_W, 8);
  ctx.fillStyle = 'rgba(255,200,150,0.35)';
  ctx.fillRect(0, y0 + 8, SCENE_W, 2);
  // wooden jetty across the middle of the water
  const jy = 372;
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(0, jy, SCENE_W, 34);
  ctx.fillStyle = '#8a6448';
  ctx.fillRect(0, jy, SCENE_W, 7);
  ctx.strokeStyle = 'rgba(30,14,10,0.6)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < SCENE_W; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, jy + 7);
    ctx.lineTo(x - 3, jy + 34);
    ctx.stroke();
  }
}

// A parapet wall along the far edge of a roof, then a warm tiled deck.
function paintRooftop(ctx, level) {
  const y0 = level.horizon;
  const wall = ctx.createLinearGradient(0, y0, 0, y0 + 36);
  wall.addColorStop(0, '#3a2a68');
  wall.addColorStop(1, '#241848');
  ctx.fillStyle = wall;
  ctx.fillRect(0, y0, SCENE_W, 36);
  ctx.strokeStyle = 'rgba(12,6,30,0.5)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < SCENE_W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, y0 + 4);
    ctx.lineTo(x, y0 + 34);
    ctx.stroke();
  }
  ctx.fillStyle = '#6a58a8';
  ctx.fillRect(0, y0 + 32, SCENE_W, 5);
  ctx.save();
  ctx.shadowColor = '#4fe3ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#4fe3ff';
  ctx.fillRect(0, y0 - 1, SCENE_W, 3);
  ctx.restore();
  const deck = ctx.createLinearGradient(0, y0 + 37, 0, SCENE_H);
  deck.addColorStop(0, '#5b3f7e');
  deck.addColorStop(1, '#2a1a46');
  ctx.fillStyle = deck;
  ctx.fillRect(0, y0 + 37, SCENE_W, SCENE_H - y0 - 37);
  const glow = ctx.createLinearGradient(0, y0 + 37, 0, SCENE_H);
  glow.addColorStop(0, 'rgba(255,140,90,0.28)');
  glow.addColorStop(1, 'rgba(255,140,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, y0 + 37, SCENE_W, SCENE_H - y0 - 37);
  // deck tiles converging on the sunrise
  ctx.strokeStyle = 'rgba(15,6,32,0.5)';
  ctx.lineWidth = 1.5;
  for (let y = y0 + 52; y < SCENE_H; y += 14 + (y - y0) * 0.1) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCENE_W, y);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(300 + i * 24, y0 + 37);
    ctx.lineTo(300 + i * 110, SCENE_H);
    ctx.stroke();
  }
}

const GROUND = { road: paintRoad, boardwalk: paintBoardwalk, marina: paintMarina, rooftop: paintRooftop };

export function drawScene(ctx, level, altered) {
  const diffs = altered ? level.diffs : [];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SCENE_W, SCENE_H);
  ctx.clip();
  paintSky(ctx, level);
  for (const p of applyDifferences(level.back, diffs, 'back')) drawProp(ctx, p);
  paintSkyline(ctx, level);
  GROUND[level.ground](ctx, level);
  for (const p of applyDifferences(level.props, diffs, 'front')) drawProp(ctx, p);
  // dusk haze to unify the layers
  const haze = ctx.createLinearGradient(0, 0, 0, SCENE_H);
  haze.addColorStop(0, level.haze[0]);
  haze.addColorStop(1, level.haze[1]);
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  ctx.restore();
}

// Pre-render both pictures of a level once; the game blits these every frame.
export function renderLevelBitmaps(level) {
  const make = (altered) => {
    const c = document.createElement('canvas');
    c.width = SCENE_W;
    c.height = SCENE_H;
    drawScene(c.getContext('2d'), level, altered);
    return c;
  };
  return { left: make(false), right: make(true) };
}
