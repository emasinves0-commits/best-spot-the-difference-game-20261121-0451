// Props for the Rooftop Sunrise level: water tank, satellite dish, air-con
// unit, string lights and a deck chair. Same contract as props.js: one
// drawer per object, one parameter bag, one changed value per difference.
import { TAU, roundRect, glowOn, glowOff, disc } from './paint.js';

// x = centre, y = where the legs touch the roof
function watertank(ctx, p) {
  const w = p.w || 54;
  const h = p.h || 44;
  const legH = p.legH || 30;
  const top = p.y - legH - h;
  ctx.strokeStyle = '#2b2442';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const lx of [p.x - w / 2 + 6, p.x + w / 2 - 6]) {
    ctx.moveTo(lx, p.y);
    ctx.lineTo(lx, p.y - legH);
  }
  ctx.moveTo(p.x - w / 2 + 6, p.y - 4);
  ctx.lineTo(p.x + w / 2 - 6, p.y - legH + 4);
  ctx.moveTo(p.x + w / 2 - 6, p.y - 4);
  ctx.lineTo(p.x - w / 2 + 6, p.y - legH + 4);
  ctx.stroke();
  const g = ctx.createLinearGradient(p.x - w / 2, 0, p.x + w / 2, 0);
  g.addColorStop(0, '#5a4585');
  g.addColorStop(0.5, p.color || '#7a60a8');
  g.addColorStop(1, '#43336a');
  ctx.fillStyle = g;
  roundRect(ctx, p.x - w / 2, top, w, h, 5);
  ctx.fill();
  ctx.fillStyle = '#3a2d5c';
  ctx.beginPath();
  ctx.moveTo(p.x - w / 2 - 3, top + 2);
  ctx.lineTo(p.x, top - 16);
  ctx.lineTo(p.x + w / 2 + 3, top + 2);
  ctx.fill();
  ctx.fillStyle = p.band || '#ffd84f';
  ctx.fillRect(p.x - w / 2, top + h * 0.42, w, 7);
  ctx.fillStyle = 'rgba(20,10,40,0.35)';
  for (let i = 1; i < 4; i++) ctx.fillRect(p.x - w / 2 + (w / 4) * i, top + 4, 1.5, h - 8);
}

// x = mast foot, y = roof; angle tilts the bowl
function dish(ctx, p) {
  ctx.strokeStyle = '#8d86b3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - 26);
  ctx.stroke();
  ctx.translate(p.x, p.y - 30);
  ctx.rotate(p.angle ?? -0.75);
  ctx.fillStyle = '#d8d0f0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 12, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#8d86b3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -20);
  ctx.stroke();
  glowOn(ctx, '#ff4f6a', 8);
  disc(ctx, 0, -21, 3, '#ff6a80');
  glowOff(ctx);
}

// x = centre, y = base; the status LED changes colour
function acunit(ctx, p) {
  const w = p.w || 66;
  const h = p.h || 42;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 1, w / 2 + 4, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4a4470';
  roundRect(ctx, p.x - w / 2, p.y - h, w, h, 4);
  ctx.fill();
  ctx.fillStyle = '#6a62a0';
  ctx.fillRect(p.x - w / 2, p.y - h, w, 5);
  const fx = p.x - w / 2 + 22;
  const fy = p.y - h / 2 + 2;
  disc(ctx, fx, fy, 15, '#1b1636');
  ctx.strokeStyle = '#8d86b3';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const a = 0.4 + (i * TAU) / 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(15,10,35,0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(p.x + 8 + i * 6, p.y - h + 12);
    ctx.lineTo(p.x + 8 + i * 6, p.y - 8);
    ctx.stroke();
  }
  glowOn(ctx, p.led || '#4dff88', 8);
  disc(ctx, p.x + w / 2 - 8, p.y - h + 9, 3, p.led || '#4dff88');
  glowOff(ctx);
}

// A sagging string of party lights between two posts; dark = index of a dead bulb
function bulbs(ctx, p) {
  const n = p.n || 14;
  const cols = p.colors || ['#ff4fa3', '#ffd84f', '#4fe3ff', '#7dff9a'];
  ctx.strokeStyle = '#2b2442';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x1, p.y1 + (p.post || 60));
  ctx.lineTo(p.x1, p.y1);
  ctx.moveTo(p.x2, p.y2 + (p.post || 60));
  ctx.lineTo(p.x2, p.y2);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#6f68a0';
  ctx.beginPath();
  ctx.moveTo(p.x1, p.y1);
  ctx.quadraticCurveTo((p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2 + p.sag * 2, p.x2, p.y2);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = p.x1 + (p.x2 - p.x1) * t;
    const y = p.y1 + (p.y2 - p.y1) * t + p.sag * 4 * t * (1 - t) + 4;
    if (i === p.dark) {
      disc(ctx, x, y, 4.2, '#3a3358');
    } else {
      glowOn(ctx, cols[i % cols.length], 12);
      disc(ctx, x, y, 4.6, cols[i % cols.length]);
      glowOff(ctx);
    }
  }
}

function deckchair(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale((p.flip ? -1 : 1) * s, s);
  ctx.strokeStyle = '#d8d0f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-26, -10);
  ctx.lineTo(-30, 0);
  ctx.moveTo(14, -10);
  ctx.lineTo(18, 0);
  ctx.stroke();
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(-32, -13);
  ctx.lineTo(-24, -40);
  ctx.lineTo(-15, -38);
  ctx.lineTo(-20, -13);
  ctx.fill();
  ctx.fillStyle = p.color2 || '#fff1f8';
  ctx.beginPath();
  ctx.moveTo(-20, -13);
  ctx.lineTo(-15, -38);
  ctx.lineTo(-9, -36);
  ctx.lineTo(-10, -13);
  ctx.fill();
  ctx.fillStyle = p.color;
  ctx.fillRect(-20, -13, 36, 5);
  ctx.beginPath();
  ctx.moveTo(16, -13);
  ctx.lineTo(36, -22);
  ctx.lineTo(36, -17);
  ctx.lineTo(16, -8);
  ctx.fill();
}

export const ROOF_DRAWERS = { watertank, dish, acunit, bulbs, deckchair };
