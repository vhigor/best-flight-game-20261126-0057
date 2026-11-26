// The Skyhaven Courier herself: a cream-and-crimson taildragger drawn from
// behind in chase view, and a lit instrument panel in cockpit view.

export function drawPlaneChase(ctx, w, h, plane, time) {
  const cx = w / 2;
  const cy = h * 0.62 + Math.sin(time * 1.7) * 2;
  const s = Math.min(w, h) / 46;
  const bank = plane.roll * 0.45;
  const pitchShift = -plane.pitch * s * 6;

  ctx.save();
  ctx.translate(cx, cy + pitchShift);
  ctx.rotate(bank);

  // Wing, seen from above and behind.
  ctx.fillStyle = '#e8ddc4';
  ctx.beginPath();
  ctx.moveTo(-13 * s, -0.4 * s);
  ctx.lineTo(-2.2 * s, -2.1 * s);
  ctx.lineTo(2.2 * s, -2.1 * s);
  ctx.lineTo(13 * s, -0.4 * s);
  ctx.lineTo(12.2 * s, 1.4 * s);
  ctx.lineTo(-12.2 * s, 1.4 * s);
  ctx.closePath();
  ctx.fill();
  // Crimson wing stripes.
  ctx.fillStyle = '#b23a2e';
  ctx.fillRect(-12.6 * s, 0.1 * s, 3.4 * s, 1.1 * s);
  ctx.fillRect(9.2 * s, 0.1 * s, 3.4 * s, 1.1 * s);
  // Aileron hinge lines.
  ctx.strokeStyle = 'rgba(90,70,50,0.5)';
  ctx.lineWidth = Math.max(1, s * 0.16);
  ctx.beginPath();
  ctx.moveTo(-11.8 * s, 0.9 * s); ctx.lineTo(-3 * s, 0.9 * s);
  ctx.moveTo(11.8 * s, 0.9 * s); ctx.lineTo(3 * s, 0.9 * s);
  ctx.stroke();

  // Fuselage tapering to the tail.
  ctx.fillStyle = '#f2e9d4';
  ctx.beginPath();
  ctx.moveTo(-2.1 * s, -4.6 * s);
  ctx.quadraticCurveTo(0, -5.6 * s, 2.1 * s, -4.6 * s);
  ctx.lineTo(1.1 * s, 5.6 * s);
  ctx.lineTo(-1.1 * s, 5.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b23a2e';
  ctx.fillRect(-1.7 * s, 1.8 * s, 3.4 * s, 0.9 * s);

  // Canopy bubble with evening glint.
  ctx.fillStyle = '#7fb2d9';
  ctx.beginPath();
  ctx.ellipse(0, -2.4 * s, 1.35 * s, 2.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,0.75)';
  ctx.beginPath();
  ctx.ellipse(-0.4 * s, -3 * s, 0.45 * s, 0.9 * s, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Tailplane and fin.
  ctx.fillStyle = '#e8ddc4';
  ctx.beginPath();
  ctx.moveTo(-5.2 * s, 5.2 * s);
  ctx.lineTo(5.2 * s, 5.2 * s);
  ctx.lineTo(4.4 * s, 6.6 * s);
  ctx.lineTo(-4.4 * s, 6.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b23a2e';
  ctx.beginPath();
  ctx.moveTo(-0.5 * s, 4.2 * s);
  ctx.lineTo(0.5 * s, 4.2 * s);
  ctx.lineTo(0.35 * s, 6.8 * s);
  ctx.lineTo(-0.35 * s, 6.8 * s);
  ctx.closePath();
  ctx.fill();

  // Propeller blur at the nose, spinning with the throttle.
  const blur = 0.1 + plane.throttle * 0.22;
  ctx.fillStyle = `rgba(60,50,40,${blur})`;
  ctx.beginPath();
  ctx.ellipse(0, -5.4 * s, 3.6 * s, 0.7 * s, Math.sin(time * 40) * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function gauge(ctx, x, y, r, value, min, max, label, unit) {
  ctx.fillStyle = '#141a24';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8b98a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8ddc4';
  ctx.font = `${Math.round(r * 0.34)}px sans-serif`;
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const a = Math.PI * 0.75 + (i / 4) * Math.PI * 1.5;
    const tx = x + Math.cos(a) * r * 0.78;
    const ty = y + Math.sin(a) * r * 0.78;
    ctx.beginPath();
    ctx.arc(tx, ty, Math.max(1, r * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const na = Math.PI * 0.75 + frac * Math.PI * 1.5;
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(na) * r * 0.72, y + Math.sin(na) * r * 0.72);
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.font = `bold ${Math.round(r * 0.3)}px sans-serif`;
  ctx.fillText(label, x, y + r * 0.52);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = `${Math.round(r * 0.24)}px sans-serif`;
  ctx.fillText(unit, x, y + r * 0.78);
}

export function drawCockpit(ctx, w, h, plane, knots, feet, heading) {
  // Cowling and windshield frame.
  ctx.fillStyle = '#8c2f24';
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h);
  ctx.lineTo(w * 0.44, h * 0.78);
  ctx.lineTo(w * 0.56, h * 0.78);
  ctx.lineTo(w * 0.64, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,26,36,0.9)';
  ctx.lineWidth = Math.max(4, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h);
  ctx.lineTo(w * 0.3, h * 0.52);
  ctx.moveTo(w * 0.94, h);
  ctx.lineTo(w * 0.7, h * 0.52);
  ctx.stroke();

  // The lit panel.
  const panelY = h * 0.8;
  ctx.fillStyle = '#1c2431';
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h);
  ctx.lineTo(w * 0.2, panelY);
  ctx.lineTo(w * 0.8, panelY);
  ctx.lineTo(w * 0.86, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c8b98a';
  ctx.lineWidth = 2;
  ctx.stroke();

  const r = Math.min(w, h) * 0.085;
  const gy = panelY + r * 1.15;
  gauge(ctx, w * 0.32, gy, r, knots, 0, 200, 'SPEED', 'kt');
  gauge(ctx, w * 0.5, gy, r, feet, 0, 3000, 'ALT', 'ft');
  gauge(ctx, w * 0.68, gy, r, heading, 0, 360, 'HDG', 'deg');

  // Panel lamps.
  ctx.fillStyle = plane.stalled ? '#ff5a4a' : '#3a4a3a';
  ctx.beginPath();
  ctx.arc(w * 0.24, panelY + r * 0.5, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plane.fuel < 20 ? '#ffb347' : '#3a4a3a';
  ctx.beginPath();
  ctx.arc(w * 0.76, panelY + r * 0.5, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}
