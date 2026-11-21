// Tiny canvas helpers shared by the prop drawers.
export const TAU = Math.PI * 2;

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function glowOn(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

export function glowOff(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

export function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
