// Code-drawn props. Each drawer paints one object from a plain parameter bag,
// so a "difference" is just the same bag with one value changed.
import { hash01 } from './rng.js';

const TAU = Math.PI * 2;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowOn(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function glowOff(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// ---------------------------------------------------------------- buildings

function building(ctx, p) {
  const top = p.y - p.h;
  const shade = ctx.createLinearGradient(0, top, 0, p.y);
  shade.addColorStop(0, p.color);
  shade.addColorStop(1, p.color2 || '#14102e');
  ctx.fillStyle = shade;
  ctx.fillRect(p.x, top, p.w, p.h);

  // roof furniture
  if (p.roof === 'tank') {
    ctx.fillStyle = '#2a2145';
    ctx.fillRect(p.x + p.w * 0.3, top - 26, 22, 18);
    ctx.fillRect(p.x + p.w * 0.3 + 3, top - 8, 3, 8);
    ctx.fillRect(p.x + p.w * 0.3 + 16, top - 8, 3, 8);
    ctx.fillStyle = '#3d3160';
    ctx.fillRect(p.x + p.w * 0.3, top - 30, 22, 5);
  } else if (p.roof === 'dome') {
    ctx.fillStyle = p.trim;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, top, p.w * 0.28, Math.PI, 0);
    ctx.fill();
  } else if (p.roof === 'steps') {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x + 8, top - 12, p.w - 16, 12);
    ctx.fillRect(p.x + 22, top - 22, p.w - 44, 10);
  }
  if (p.ant) {
    ctx.strokeStyle = '#8d86b3';
    ctx.lineWidth = 2;
    const ax = p.x + p.w * 0.72;
    ctx.beginPath();
    ctx.moveTo(ax, top);
    ctx.lineTo(ax, top - 34);
    ctx.moveTo(ax - 7, top - 24);
    ctx.lineTo(ax + 7, top - 24);
    ctx.stroke();
    glowOn(ctx, '#ff3040', 8);
    disc(ctx, ax, top - 36, 2.6, '#ff5060');
    glowOff(ctx);
  }

  // neon trim along the roof edge
  glowOn(ctx, p.trim, 10);
  ctx.fillStyle = p.trim;
  ctx.fillRect(p.x, top, p.w, 3);
  glowOff(ctx);

  // windows
  const cols = Math.max(1, Math.floor((p.w - 12) / 18));
  const rows = Math.max(1, Math.floor((p.h - 56) / 26));
  const sx = p.x + (p.w - cols * 18) / 2 + 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let lit = hash01(p.seed || 1, c, r) < (p.lit ?? 0.55);
      const forced = p.force && p.force[c + ',' + r];
      if (forced !== undefined) lit = forced;
      const wx = sx + c * 18;
      const wy = top + 16 + r * 26;
      if (lit) {
        glowOn(ctx, p.win || '#ffd98a', 8);
        ctx.fillStyle = p.win || '#ffd98a';
      } else {
        ctx.fillStyle = '#17123a';
      }
      ctx.fillRect(wx, wy, 11, 15);
      glowOff(ctx);
    }
  }

  // ground floor: door plus optional awning
  ctx.fillStyle = '#0f0c26';
  ctx.fillRect(p.x + p.w / 2 - 9, p.y - 34, 18, 34);
  if (p.awning) {
    const aw = Math.min(p.w - 16, 70);
    const ax = p.x + (p.w - aw) / 2;
    const ay = p.y - 48;
    const stripes = 6;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#f6ecff' : p.awning;
      ctx.beginPath();
      ctx.moveTo(ax + (aw / stripes) * i + 2, ay);
      ctx.lineTo(ax + (aw / stripes) * (i + 1) - 2, ay);
      ctx.lineTo(ax + (aw / stripes) * (i + 1) + 3, ay + 16);
      ctx.lineTo(ax + (aw / stripes) * i - 3, ay + 16);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- signs

function sign(ctx, p) {
  const size = p.size || 14;
  ctx.font = `bold ${size}px "Trebuchet MS", Verdana, sans-serif`;
  const w = Math.ceil(ctx.measureText(p.text).width) + 18;
  const h = size + 12;
  const x = p.x - w / 2;
  const y = p.y - h / 2;
  const on = p.on !== false;
  if (p.pole) {
    ctx.fillStyle = '#3a3358';
    ctx.fillRect(p.x - 2, y + h, 4, p.pole);
  }
  ctx.fillStyle = '#120c2a';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  if (on) glowOn(ctx, p.color, 12);
  ctx.strokeStyle = on ? p.color : '#4a4560';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 6);
  ctx.stroke();
  ctx.fillStyle = on ? p.color : '#5a5478';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.text, p.x, p.y + 1);
  glowOff(ctx);
}

// ---------------------------------------------------------------- nature

function palm(ctx, p) {
  const lean = p.lean ?? 14;
  const tx = p.x + lean;
  const ty = p.y - p.h;
  const cx = p.x + lean * 0.1;
  const cy = p.y - p.h * 0.55;
  // trunk, drawn as tapering segments along a bend
  let px = p.x;
  let py = p.y;
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * tx;
    const y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * ty;
    ctx.strokeStyle = i % 2 ? (p.trunk || '#6b4a3a') : '#5a3d30';
    ctx.lineWidth = 9 - t * 4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    px = x;
    py = y;
  }
  const n = p.fronds ?? 7;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.08 + (0.84 * i) / Math.max(1, n - 1)) ;
    const len = 50 + (i % 2) * 8;
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.55 + 22;
    const mx = tx + Math.cos(a) * len * 0.55;
    const my = ty + Math.sin(a) * len * 0.9 - 6;
    ctx.fillStyle = i % 2 ? (p.leaf || '#1f9a72') : (p.leaf2 || '#157a5c');
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my - 7, ex, ey);
    ctx.quadraticCurveTo(mx, my + 8, tx, ty);
    ctx.fill();
  }
  const nuts = p.coconuts ?? 2;
  for (let i = 0; i < nuts; i++) {
    disc(ctx, tx + (i - (nuts - 1) / 2) * 8, ty + 8, 4.6, '#4a2f22');
  }
}

function orb(ctx, p) {
  const m = p.r + 40;
  const off = document.createElement('canvas');
  off.width = off.height = Math.ceil(m * 2);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, m - p.r, 0, m + p.r);
  g.addColorStop(0, p.color);
  g.addColorStop(1, p.color2 || p.color);
  o.fillStyle = g;
  o.beginPath();
  o.arc(m, m, p.r, 0, TAU);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (p.stripes || 0); i++) {
    const t = (i + 1) / (p.stripes + 1);
    o.fillRect(0, m + p.r * (0.05 + t * 0.9) - 1, m * 2, 1 + t * 5);
  }
  if (p.crescent) {
    o.beginPath();
    o.arc(m + p.r * p.crescent, m - p.r * 0.12, p.r * 0.86, 0, TAU);
    o.fill();
  }
  o.globalCompositeOperation = 'source-over';
  for (let i = 0; i < (p.craters || 0); i++) {
    const a = hash01(7, i) * TAU;
    const d = p.r * (0.25 + hash01(9, i) * 0.4);
    o.fillStyle = 'rgba(120,100,160,0.28)';
    o.beginPath();
    o.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, 3 + hash01(3, i) * 5, 0, TAU);
    o.fill();
  }
  glowOn(ctx, p.glow || p.color, 30);
  ctx.drawImage(off, p.x - m, p.y - m);
  glowOff(ctx);
}

function cloud(ctx, p) {
  const s = p.s || 1;
  ctx.fillStyle = p.color || 'rgba(255,170,205,0.45)';
  const bumps = [[0, 0, 26], [24, -8, 22], [48, 0, 24], [-22, 4, 18], [70, 6, 16]];
  for (const [bx, by, br] of bumps) {
    ctx.beginPath();
    ctx.ellipse(p.x + bx * s, p.y + by * s, br * s, br * s * 0.55, 0, 0, TAU);
    ctx.fill();
  }
}

function bird(ctx, p) {
  const s = p.s || 1;
  ctx.strokeStyle = p.color || '#1b1238';
  ctx.lineWidth = 2.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x - 12 * s, p.y - 4 * s);
  ctx.quadraticCurveTo(p.x - 5 * s, p.y - 10 * s, p.x, p.y);
  ctx.quadraticCurveTo(p.x + 5 * s, p.y - 10 * s, p.x + 12 * s, p.y - 4 * s);
  ctx.stroke();
}

function star(ctx, p) {
  glowOn(ctx, p.color || '#fff6c8', 10);
  ctx.fillStyle = p.color || '#fff6c8';
  const r = p.r || 4;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 ? r * 0.28 : r;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    ctx.lineTo(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  glowOff(ctx);
}

// ---------------------------------------------------------------- critters

function gator(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale((p.flip ? -1 : 1) * s, s);
  if (p.swim) {
    ctx.beginPath();
    ctx.rect(-80, -90, 200, 72);
    ctx.clip();
  }
  const skin = p.color || '#3f9a4f';
  // tail
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-48, -22);
  ctx.quadraticCurveTo(-80, -22, -100, -4);
  ctx.quadraticCurveTo(-70, -8, -46, -2);
  ctx.fill();
  // legs
  ctx.fillStyle = '#2f7a3e';
  for (const lx of [-34, -12, 14, 30]) {
    roundRect(ctx, lx - 4, -10, 9, 12, 3);
    ctx.fill();
  }
  // body
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(-4, -15, 50, 17, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.belly || '#b9dc8c';
  ctx.beginPath();
  ctx.ellipse(-4, -6, 44, 7, 0, 0, Math.PI);
  ctx.fill();
  // back spikes
  ctx.fillStyle = '#2a6d38';
  for (let i = 0; i < 7; i++) {
    const bx = -40 + i * 11;
    ctx.beginPath();
    ctx.moveTo(bx - 4, -29);
    ctx.lineTo(bx, -37);
    ctx.lineTo(bx + 4, -29);
    ctx.fill();
  }
  // head and jaws
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(30, -30);
  ctx.quadraticCurveTo(60, -34, 82, -20);
  ctx.lineTo(82, -12);
  ctx.quadraticCurveTo(58, -4, 30, -6);
  ctx.fill();
  ctx.strokeStyle = '#1d4a27';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(40, -14);
  ctx.quadraticCurveTo(64, -14, 82, -15);
  ctx.stroke();
  ctx.fillStyle = '#fff8e6';
  const teeth = p.teeth ?? 5;
  for (let i = 0; i < teeth; i++) {
    const tx = 46 + i * (34 / Math.max(1, teeth));
    ctx.beginPath();
    ctx.moveTo(tx, -14);
    ctx.lineTo(tx + 2.6, -9);
    ctx.lineTo(tx + 5, -14);
    ctx.fill();
  }
  // eye
  disc(ctx, 42, -30, 6.5, skin);
  disc(ctx, 42, -30, 4.4, p.eye || '#ffe14d');
  ctx.fillStyle = '#10200f';
  ctx.fillRect(41.2, -33.4, 1.8, 6.8);
  if (p.shades) {
    ctx.fillStyle = '#0c0a14';
    roundRect(ctx, 33, -36, 17, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#ff7ac8';
    ctx.fillRect(36, -34, 5, 1.6);
  }
  if (p.hat) {
    ctx.fillStyle = p.hat;
    ctx.beginPath();
    ctx.ellipse(40, -38, 13, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(24, -39, 34, 3);
  }
  if (p.swim) {
    ctx.strokeStyle = 'rgba(210,240,255,0.7)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(10, -18, 56 + i * 12, 5 + i * 2, 0, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
    }
  }
}

function crab(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  ctx.strokeStyle = p.color || '#ef5a3c';
  ctx.lineWidth = 2;
  for (const d of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(d * 6, -4);
      ctx.lineTo(d * (13 + i * 3), -2 + i * 2.5);
      ctx.lineTo(d * (16 + i * 3), 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(d * 8, -8);
    ctx.lineTo(d * 15, -17);
    ctx.stroke();
    disc(ctx, d * 17, -19, 3.4, p.color || '#ef5a3c');
  }
  ctx.fillStyle = p.color || '#ef5a3c';
  ctx.beginPath();
  ctx.ellipse(0, -6, 11, 7, 0, 0, TAU);
  ctx.fill();
  disc(ctx, -4, -13, 2, '#fff');
  disc(ctx, 4, -13, 2, '#fff');
}

function flamingo(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale((p.flip ? -1 : 1) * s, s);
  const c = p.color || '#ff6fae';
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -38);
  ctx.stroke();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(0, -46, 15, 10, -0.2, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(9, -50);
  ctx.bezierCurveTo(24, -58, 6, -70, 18, -82);
  ctx.stroke();
  disc(ctx, 20, -83, 4.4, c);
  ctx.fillStyle = '#2a1830';
  ctx.beginPath();
  ctx.moveTo(23, -85);
  ctx.lineTo(32, -80);
  ctx.lineTo(23, -79);
  ctx.fill();
  disc(ctx, 21, -84, 1.3, '#fff');
}

// ---------------------------------------------------------------- street

function car(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale((p.flip ? -1 : 1) * s, s);
  const body = p.color || '#e8344e';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 56, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = body;
  roundRect(ctx, -52, -28, 104, 20, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-26, -27);
  ctx.lineTo(-16, -42);
  ctx.lineTo(20, -42);
  ctx.lineTo(32, -27);
  ctx.fill();
  ctx.fillStyle = '#a9ecff';
  ctx.beginPath();
  ctx.moveTo(-21, -29);
  ctx.lineTo(-14, -39);
  ctx.lineTo(-1, -39);
  ctx.lineTo(-1, -29);
  ctx.moveTo(3, -29);
  ctx.lineTo(3, -39);
  ctx.lineTo(18, -39);
  ctx.lineTo(27, -29);
  ctx.fill();
  if (p.stripe) {
    ctx.fillStyle = p.stripe;
    ctx.fillRect(-50, -20, 100, 3.5);
  }
  glowOn(ctx, '#fff2a8', 14);
  ctx.fillStyle = '#fff2a8';
  ctx.fillRect(46, -24, 6, 5);
  glowOff(ctx);
  ctx.fillStyle = p.tail || '#ff2e2e';
  ctx.fillRect(-52, -24, 5, 5);
  if (p.antenna) {
    ctx.strokeStyle = '#d8d0f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-40, -28);
    ctx.lineTo(-48, -52);
    ctx.stroke();
  }
  const wheels = p.wheels ?? 2;
  const spots = wheels >= 2 ? [-30, 30] : [30];
  for (const wx of spots) {
    disc(ctx, wx, -8, 10, '#14111f');
    disc(ctx, wx, -8, 5, p.hub || '#d3d9ea');
  }
}

function lamp(ctx, p) {
  const on = p.on !== false;
  ctx.strokeStyle = '#2b2442';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - p.h);
  ctx.quadraticCurveTo(p.x, p.y - p.h - 12, p.x + 14, p.y - p.h - 10);
  ctx.stroke();
  const hx = p.x + 14;
  const hy = p.y - p.h - 6;
  if (on) {
    const g = ctx.createRadialGradient(hx, hy, 2, hx, hy + 14, 58);
    g.addColorStop(0, (p.color || '#ffd27a') + 'cc');
    g.addColorStop(1, (p.color || '#ffd27a') + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy + 14, 58, 0, TAU);
    ctx.fill();
    glowOn(ctx, p.color || '#ffd27a', 14);
  }
  disc(ctx, hx, hy, 5.5, on ? (p.color || '#ffd27a') : '#524a6c');
  glowOff(ctx);
}

function hydrant(ctx, p) {
  ctx.fillStyle = p.color || '#e0405a';
  roundRect(ctx, p.x - 7, p.y - 24, 14, 24, 4);
  ctx.fill();
  ctx.fillRect(p.x - 10, p.y - 18, 20, 5);
  ctx.beginPath();
  ctx.arc(p.x, p.y - 24, 7, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f6ecff';
  ctx.fillRect(p.x - 3, p.y - 31, 6, 3);
}

function bench(ctx, p) {
  const w = p.w || 54;
  ctx.fillStyle = p.color || '#8a5a3a';
  for (let i = 0; i < 3; i++) ctx.fillRect(p.x - w / 2, p.y - 26 + i * 5, w, 3.4);
  ctx.fillRect(p.x - w / 2, p.y - 12, w, 4);
  ctx.fillStyle = '#2b2442';
  ctx.fillRect(p.x - w / 2 + 4, p.y - 8, 4, 8);
  ctx.fillRect(p.x + w / 2 - 8, p.y - 8, 4, 8);
}

function crate(ctx, p) {
  const s = p.s || 1;
  const w = 28 * s;
  ctx.fillStyle = p.color || '#b9803f';
  ctx.fillRect(p.x - w / 2, p.y - w, w, w);
  ctx.strokeStyle = '#6a4220';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - w / 2 + 1, p.y - w + 1, w - 2, w - 2);
  ctx.beginPath();
  ctx.moveTo(p.x - w / 2, p.y - w);
  ctx.lineTo(p.x + w / 2, p.y);
  ctx.moveTo(p.x + w / 2, p.y - w);
  ctx.lineTo(p.x - w / 2, p.y);
  ctx.stroke();
}

function flag(ctx, p) {
  ctx.strokeStyle = '#d8d0f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - p.h);
  ctx.stroke();
  ctx.fillStyle = p.color || '#ff4f7b';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - p.h);
  ctx.lineTo(p.x + (p.dir || 1) * 20, p.y - p.h + 6);
  ctx.lineTo(p.x, p.y - p.h + 12);
  ctx.fill();
}

// ---------------------------------------------------------------- beach and sea

function umbrella(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.tilt || 0);
  ctx.scale(s, s);
  ctx.strokeStyle = '#e8e0f8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -52);
  ctx.stroke();
  const n = p.segs || 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? (p.color2 || '#fff1f8') : p.color;
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.ellipse(0, -52, 32, 15, 0, Math.PI + (i * Math.PI) / n, Math.PI + ((i + 1) * Math.PI) / n);
    ctx.closePath();
    ctx.fill();
  }
}

function boat(ctx, p) {
  const s = p.s || 1;
  ctx.translate(p.x, p.y);
  ctx.scale((p.flip ? -1 : 1) * s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 40, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#d8d0f0';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -78);
  ctx.stroke();
  ctx.fillStyle = p.sail || '#fff1f6';
  ctx.beginPath();
  ctx.moveTo(3, -76);
  ctx.lineTo(3, -10);
  ctx.lineTo(34, -10);
  ctx.fill();
  ctx.fillStyle = p.jib || '#ffd6e4';
  ctx.beginPath();
  ctx.moveTo(-3, -70);
  ctx.lineTo(-3, -10);
  ctx.lineTo(-26, -10);
  ctx.fill();
  ctx.fillStyle = p.hull || '#2c2a55';
  ctx.beginPath();
  ctx.moveTo(-38, -8);
  ctx.lineTo(42, -8);
  ctx.lineTo(30, 4);
  ctx.lineTo(-28, 4);
  ctx.fill();
  if (p.stripe) {
    ctx.fillStyle = p.stripe;
    ctx.fillRect(-35, -6, 74, 2.6);
  }
  if (p.pennant) {
    ctx.fillStyle = p.pennant;
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(14, -74);
    ctx.lineTo(0, -70);
    ctx.fill();
  }
}

function buoy(ctx, p) {
  const r = p.r || 10;
  const n = p.stripes || 3;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#fff1f6' : (p.color || '#ff5a4a');
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r, r * 1.2, 0, Math.PI * (0.5 + i / n * 2), Math.PI * (0.5 + (i + 1) / n * 2));
    ctx.lineTo(p.x, p.y);
    ctx.fill();
  }
  ctx.fillStyle = '#2b2442';
  ctx.fillRect(p.x - 2, p.y - r * 1.2 - 9, 4, 9);
  if (p.light !== false) {
    glowOn(ctx, p.lightColor || '#ffe27a', 12);
    disc(ctx, p.x, p.y - r * 1.2 - 11, 3.4, p.lightColor || '#ffe27a');
    glowOff(ctx);
  }
}

function lighthouse(ctx, p) {
  const w0 = p.w || 34;
  const w1 = w0 * 0.62;
  const top = p.y - p.h;
  const bands = p.stripes || 4;
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands;
    const t1 = (i + 1) / bands;
    const wa = w0 + (w1 - w0) * t0;
    const wb = w0 + (w1 - w0) * t1;
    ctx.fillStyle = i % 2 ? '#f6ecff' : (p.color || '#e8344e');
    ctx.beginPath();
    ctx.moveTo(p.x - wa / 2, p.y - p.h * t0);
    ctx.lineTo(p.x + wa / 2, p.y - p.h * t0);
    ctx.lineTo(p.x + wb / 2, p.y - p.h * t1);
    ctx.lineTo(p.x - wb / 2, p.y - p.h * t1);
    ctx.fill();
  }
  ctx.fillStyle = '#2b2442';
  ctx.fillRect(p.x - w1 / 2 - 5, top - 4, w1 + 10, 5);
  glowOn(ctx, '#ffe27a', 18);
  ctx.fillStyle = '#ffe27a';
  ctx.fillRect(p.x - w1 / 2 + 2, top - 18, w1 - 4, 14);
  glowOff(ctx);
  ctx.fillStyle = '#2b2442';
  ctx.beginPath();
  ctx.moveTo(p.x - w1 / 2, top - 18);
  ctx.lineTo(p.x, top - 30);
  ctx.lineTo(p.x + w1 / 2, top - 18);
  ctx.fill();
  if (p.beam !== false) {
    const g = ctx.createLinearGradient(p.x, 0, p.x - 220, 0);
    g.addColorStop(0, 'rgba(255,230,140,0.4)');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(p.x - 4, top - 11);
    ctx.lineTo(p.x - 230, top - 40);
    ctx.lineTo(p.x - 230, top + 14);
    ctx.fill();
  }
}

function ball(ctx, p) {
  const r = p.r || 9;
  const cols = p.colors || ['#ff5a8a', '#fff1f6', '#4fd8ff', '#ffd84f'];
  for (let i = 0; i < cols.length; i++) {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, r, (i * TAU) / cols.length, ((i + 1) * TAU) / cols.length);
    ctx.fill();
  }
}

function ferris(ctx, p) {
  const n = p.n || 8;
  ctx.strokeStyle = '#2b2a58';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(p.x - 46, p.baseY);
  ctx.lineTo(p.x, p.y);
  ctx.lineTo(p.x + 46, p.baseY);
  ctx.stroke();
  glowOn(ctx, p.rim || '#4fe3ff', 10);
  ctx.strokeStyle = p.rim || '#4fe3ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, TAU);
  ctx.stroke();
  glowOff(ctx);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#6f78c8';
  for (let i = 0; i < n; i++) {
    const a = (i * TAU) / n;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r);
    ctx.stroke();
  }
  const cols = p.cars || ['#ff5a8a', '#ffd84f', '#4fd8ff'];
  for (let i = 0; i < n; i++) {
    if (p.missing === i) continue;
    const a = (i * TAU) / n + 0.2;
    const gx = p.x + Math.cos(a) * p.r;
    const gy = p.y + Math.sin(a) * p.r;
    ctx.fillStyle = cols[i % cols.length];
    roundRect(ctx, gx - 6, gy - 2, 12, 11, 3);
    ctx.fill();
  }
  disc(ctx, p.x, p.y, 5, '#ffe27a');
}

function stall(ctx, p) {
  ctx.fillStyle = '#1b1640';
  ctx.fillRect(p.x, p.y - p.h, p.w, p.h);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(p.x + 8, p.y - p.h + 20, p.w - 16, p.h - 44);
  ctx.fillStyle = '#5a3d30';
  ctx.fillRect(p.x, p.y - 22, p.w, 22);
  const n = p.stripes || 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#fff1f6' : p.awning;
    ctx.beginPath();
    ctx.moveTo(p.x + (p.w / n) * i - 4, p.y - p.h);
    ctx.lineTo(p.x + (p.w / n) * (i + 1) + 4, p.y - p.h);
    ctx.lineTo(p.x + (p.w / n) * (i + 1) + 8, p.y - p.h + 20);
    ctx.lineTo(p.x + (p.w / n) * i - 8, p.y - p.h + 20);
    ctx.fill();
  }
  glowOn(ctx, p.bulb || '#ffd27a', 8);
  for (let i = 0; i <= n; i++) disc(ctx, p.x + (p.w / n) * i, p.y - p.h + 22, 2.4, p.bulb || '#ffd27a');
  glowOff(ctx);
}

function piling(ctx, p) {
  ctx.fillStyle = p.color || '#5a4030';
  roundRect(ctx, p.x - 5, p.y - p.h, 10, p.h, 3);
  ctx.fill();
  ctx.strokeStyle = '#e8d8b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y - p.h + 10);
  ctx.lineTo(p.x + 5, p.y - p.h + 14);
  ctx.stroke();
}

const DRAWERS = {
  building, sign, palm, orb, cloud, bird, star, gator, crab, flamingo, car, lamp, hydrant,
  bench, crate, flag, umbrella, boat, buoy, lighthouse, ball, ferris, stall, piling,
};

export function drawProp(ctx, p) {
  const fn = DRAWERS[p.type];
  if (!fn) throw new Error('unknown prop type: ' + p.type);
  ctx.save();
  fn(ctx, p);
  ctx.restore();
}
