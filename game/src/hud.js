// Instruments the judge can read at a glance: speed and altitude tapes, a
// heading ribbon, an artificial horizon, fuel and damage, and the mission.

import { speedKnots, altitudeFeet, headingDeg } from './flight.js';
import { MISSIONS, activeRing } from './missions.js';

const INK = '#eef3ff';
const DIM = 'rgba(238,243,255,0.65)';
const GOLD = '#ffd98a';
const PANEL = 'rgba(14,20,32,0.55)';

function tape(ctx, x, y, wdt, hgt, value, step, label, format) {
  ctx.fillStyle = PANEL;
  ctx.fillRect(x, y, wdt, hgt);
  ctx.strokeStyle = 'rgba(200,185,138,0.6)';
  ctx.strokeRect(x, y, wdt, hgt);
  ctx.fillStyle = INK;
  ctx.font = `${Math.round(wdt * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  const mid = y + hgt / 2;
  const pxPer = hgt / (step * 6);
  const first = Math.floor((value - step * 3) / step) * step;
  for (let v = first; v <= value + step * 3; v += step) {
    if (v < 0) continue;
    const ty = mid - (v - value) * pxPer;
    if (ty < y + 6 || ty > y + hgt - 6) continue;
    ctx.fillText(format(v), x + wdt / 2, ty + 4);
  }
  ctx.fillStyle = GOLD;
  ctx.fillRect(x - 3, mid - 11, wdt + 6, 22);
  ctx.fillStyle = '#141a24';
  ctx.font = `bold ${Math.round(wdt * 0.34)}px sans-serif`;
  ctx.fillText(format(Math.round(value)), x + wdt / 2, mid + 6);
  ctx.fillStyle = DIM;
  ctx.font = `${Math.round(wdt * 0.26)}px sans-serif`;
  ctx.fillText(label, x + wdt / 2, y - 8);
}

function compass(ctx, w, heading) {
  const cx = w / 2;
  const wid = Math.min(420, w * 0.42);
  ctx.fillStyle = PANEL;
  ctx.fillRect(cx - wid / 2, 12, wid, 34);
  ctx.strokeStyle = 'rgba(200,185,138,0.6)';
  ctx.strokeRect(cx - wid / 2, 12, wid, 34);
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  for (let d = -60; d <= 60; d += 5) {
    const hd = ((Math.round(heading / 5) * 5 + d) % 360 + 360) % 360;
    const x = cx + (d - (heading % 5)) * (wid / 120);
    if (x < cx - wid / 2 + 4 || x > cx + wid / 2 - 4) continue;
    ctx.fillStyle = names[hd] ? GOLD : DIM;
    if (names[hd]) ctx.fillText(names[hd], x, 34);
    else if (hd % 10 === 0) ctx.fillRect(x, 36, 1.5, 6);
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx - 6, 12); ctx.lineTo(cx + 6, 12); ctx.lineTo(cx, 20);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${String(Math.round(heading)).padStart(3, '0')}°`, cx, 62);
}

function horizon(ctx, x, y, r, plane) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(-plane.roll);
  const pitchPx = plane.pitch * r * 1.6;
  ctx.fillStyle = '#6fa8d8';
  ctx.fillRect(-r * 1.4, -r * 1.4 + pitchPx, r * 2.8, r * 1.4);
  ctx.fillStyle = '#8a6b45';
  ctx.fillRect(-r * 1.4, pitchPx, r * 2.8, r * 1.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, pitchPx); ctx.lineTo(r * 1.4, pitchPx);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#c8b98a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y); ctx.lineTo(x - r * 0.18, y);
  ctx.moveTo(x + r * 0.18, y); ctx.lineTo(x + r * 0.55, y);
  ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
  ctx.stroke();
}

function bar(ctx, x, y, wdt, frac, color, label) {
  ctx.fillStyle = PANEL;
  ctx.fillRect(x, y, wdt, 14);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, (wdt - 2) * Math.max(0, Math.min(1, frac)), 12);
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 4);
}

export function drawHud(ctx, w, h, plane, progress, time, project, view = 'chase') {
  const knots = speedKnots(plane);
  const feet = altitudeFeet(plane);
  const heading = headingDeg(plane);

  compass(ctx, w, heading);
  tape(ctx, 18, h * 0.3, 58, h * 0.34, knots, 10, 'SPEED kt', (v) => String(v));
  tape(ctx, w - 76, h * 0.3, 58, h * 0.34, feet, 100, 'ALT ft', (v) => String(v));
  if (view !== 'cockpit') horizon(ctx, w / 2, h - 86, 46, plane);

  bar(ctx, 18, h - 52, 130, plane.throttle, '#ffb347', `THROTTLE ${Math.round(plane.throttle * 100)}%`);
  bar(ctx, w - 148, h - 78, 130, plane.fuel / 100, plane.fuel < 20 ? '#ff5a4a' : '#7fd08a', `FUEL ${Math.round(plane.fuel)}%`);
  bar(ctx, w - 148, h - 52, 130, 1 - plane.damage / 100, plane.damage > 60 ? '#ff5a4a' : '#7fb2d9', `HULL ${Math.round(100 - plane.damage)}%`);

  // Vertical speed readout under the altitude tape.
  ctx.fillStyle = INK;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  const vs = Math.round(plane.vspeed * 196.85);
  ctx.fillText(`VS ${vs > 0 ? '+' : ''}${vs}`, w - 47, h * 0.3 + h * 0.34 + 22);

  // Mission card.
  const m = MISSIONS[progress.mission];
  ctx.fillStyle = PANEL;
  ctx.fillRect(14, 12, 252, 74);
  ctx.strokeStyle = 'rgba(200,185,138,0.6)';
  ctx.strokeRect(14, 12, 252, 74);
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(m ? `Mission ${progress.mission + 1}: ${m.name}` : 'Sortie complete', 24, 34);
  ctx.fillStyle = INK;
  ctx.font = '12.5px sans-serif';
  if (m) {
    const done = m.rings.filter((r) => r.passed).length;
    ctx.fillText(m.brief, 24, 53);
    ctx.fillText(m.landAfter && done === m.rings.length
      ? 'Now land on runway 36 and stop.'
      : `Rings ${done}/${m.rings.length}   Score ${progress.score}`, 24, 71);
  } else {
    ctx.fillText(`Final score ${progress.score}`, 24, 53);
  }

  // Next-ring guide: distance, and an arrow when it leaves the frame.
  const target = activeRing(progress);
  if (target && project) {
    const dist = Math.round(Math.hypot(plane.x - target.x, plane.y - target.y, plane.z - target.z));
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Next ring ${dist} m`, w / 2, 88);
    const p = project(target.x, target.y, target.z);
    if (!p || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
      const bearing = Math.atan2(target.x - plane.x, -(target.z - plane.z));
      let rel = bearing - plane.yaw;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      const ax = w / 2 + Math.sin(rel) * (w * 0.36);
      const ay = h / 2 - Math.cos(rel) * (h * 0.3);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(rel);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(10, 8); ctx.lineTo(-10, 8);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  if (progress.messageT > 0) {
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(progress.message, w / 2, h * 0.24);
  }
  if (plane.stalled && Math.sin(time * 10) > 0) {
    ctx.fillStyle = '#ff5a4a';
    ctx.font = `bold ${Math.round(h * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STALL', w / 2, h * 0.32);
  }
  if (plane.fuel < 20 && !plane.crashed) {
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOW FUEL — land on the runway to refuel', w / 2, h * 0.38);
  }
}

export function drawTitle(ctx, w, h, time) {
  ctx.fillStyle = 'rgba(10,16,28,0.45)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `bold ${Math.round(h * 0.085)}px sans-serif`;
  ctx.fillText('SKYHAVEN COURIER', w / 2, h * 0.3);
  ctx.fillStyle = INK;
  ctx.font = `${Math.round(h * 0.03)}px sans-serif`;
  ctx.fillText('Thread the rings, mind your fuel, and bring her home.', w / 2, h * 0.38);
  ctx.font = `${Math.round(h * 0.026)}px sans-serif`;
  const lines = [
    'W / S — throttle        Arrow keys — pitch and bank',
    'C — cockpit view        M — mouse steering        P — pause',
    'Land gently on runway 36 to refuel and repair.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.5 + i * h * 0.045));
  if (Math.sin(time * 3) > -0.2) {
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${Math.round(h * 0.034)}px sans-serif`;
    ctx.fillText('Press ENTER or click to fly', w / 2, h * 0.72);
  }
}

export function drawEnd(ctx, w, h, won, score) {
  ctx.fillStyle = 'rgba(10,16,28,0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? GOLD : '#ff8a7a';
  ctx.font = `bold ${Math.round(h * 0.07)}px sans-serif`;
  ctx.fillText(won ? 'SORTIE COMPLETE' : 'DOWN IN THE VALLEY', w / 2, h * 0.4);
  ctx.fillStyle = INK;
  ctx.font = `${Math.round(h * 0.032)}px sans-serif`;
  ctx.fillText(won ? 'Every ring threaded, and she is home safe.' : 'The valley keeps another courier. The rings remain.', w / 2, h * 0.48);
  ctx.fillText(`Score ${score}`, w / 2, h * 0.55);
  ctx.fillStyle = GOLD;
  ctx.font = `bold ${Math.round(h * 0.03)}px sans-serif`;
  ctx.fillText('Press R to fly again', w / 2, h * 0.66);
}
