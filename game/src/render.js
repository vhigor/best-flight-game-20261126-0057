// A small 3D projector on a 2D canvas: heightfield terrain with flat
// shading, a runway, ring gates, trees, barns and late-afternoon light.

import { terrainHeight, terrainColor, sceneryAt, hashCell, CLOUDS, RUNWAY, WATER_Y } from './world.js';
import { forwardOf } from './flight.js';

const SUN = { x: -0.55, y: 0.42, z: -0.72 };

export function makeCamera(plane, view) {
  const f = forwardOf(plane);
  const roll = view === 'cockpit' ? plane.roll : plane.roll * 0.55;
  let right = { x: -f.z, y: 0, z: f.x };
  const rl = Math.hypot(right.x, right.z) || 1;
  right = { x: right.x / rl, y: 0, z: right.z / rl };
  let up = {
    x: right.y * f.z - right.z * f.y,
    y: right.z * f.x - right.x * f.z,
    z: right.x * f.y - right.y * f.x,
  };
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const r2 = { x: right.x * cr + up.x * sr, y: right.y * cr + up.y * sr, z: right.z * cr + up.z * sr };
  const u2 = { x: up.x * cr - right.x * sr, y: up.y * cr - right.y * sr, z: up.z * cr - right.z * sr };

  let pos;
  if (view === 'cockpit') {
    pos = { x: plane.x + f.x * 1.6, y: plane.y + 1.1, z: plane.z + f.z * 1.6 };
  } else {
    pos = {
      x: plane.x - f.x * 17 + u2.x * 5.2,
      y: plane.y - f.y * 17 + 5.2,
      z: plane.z - f.z * 17 + u2.z * 5.2,
    };
  }
  return { pos, f, right: r2, up: u2 };
}

export function makeProjector(cam, w, h) {
  const focal = (h / 2) / Math.tan((62 * Math.PI) / 360);
  return (x, y, z) => {
    const dx = x - cam.pos.x;
    const dy = y - cam.pos.y;
    const dz = z - cam.pos.z;
    const cz = dx * cam.f.x + dy * cam.f.y + dz * cam.f.z;
    if (cz < 1.2) return null;
    const cx = dx * cam.right.x + dy * cam.right.y + dz * cam.right.z;
    const cy = dx * cam.up.x + dy * cam.up.y + dz * cam.up.z;
    return { x: w / 2 + (cx / cz) * focal, y: h / 2 - (cy / cz) * focal, z: cz };
  };
}

export function drawSky(ctx, cam, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2c4a7c');
  g.addColorStop(0.42, '#7fa8cf');
  g.addColorStop(0.62, '#e8c9a0');
  g.addColorStop(0.78, '#f4b183');
  g.addColorStop(1, '#e8906f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // The sun, wherever the camera says it is.
  const p = makeProjector(cam, w, h)(
    cam.pos.x + SUN.x * 4000, cam.pos.y + SUN.y * 4000, cam.pos.z + SUN.z * 4000);
  if (p) {
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, h * 0.42);
    glow.addColorStop(0, 'rgba(255,236,190,0.95)');
    glow.addColorStop(0.12, 'rgba(255,214,140,0.55)');
    glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(10, h * 0.028), 0, Math.PI * 2);
    ctx.fill();
  }
}

function shadeOf(x, z, h) {
  const e = 26;
  const hx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const hz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const nx = -hx / (2 * e);
  const nz = -hz / (2 * e);
  const inv = 1 / Math.hypot(nx, 1, nz);
  const dot = (nx * SUN.x + SUN.y + nz * SUN.z) * inv;
  return { shade: Math.max(0, Math.min(1, dot * 1.15)), slope: Math.hypot(nx, nz) };
}

export function drawTerrain(ctx, cam, project, w, h) {
  const step = 55;
  const radius = 1750;
  const gx = Math.round(cam.pos.x / step);
  const gz = Math.round(cam.pos.z / step);
  const span = Math.ceil(radius / step);
  const quads = [];

  for (let iz = gz - span; iz < gz + span; iz++) {
    for (let ix = gx - span; ix < gx + span; ix++) {
      const x0 = ix * step;
      const z0 = iz * step;
      const cxm = x0 + step / 2;
      const czm = z0 + step / 2;
      const dist = Math.hypot(cxm - cam.pos.x, czm - cam.pos.z);
      if (dist > radius) continue;
      const h00 = terrainHeight(x0, z0);
      const h10 = terrainHeight(x0 + step, z0);
      const h11 = terrainHeight(x0 + step, z0 + step);
      const h01 = terrainHeight(x0, z0 + step);
      const hAvg = (h00 + h10 + h11 + h01) / 4;
      const corners = [
        project(x0, Math.max(h00, WATER_Y), z0),
        project(x0 + step, Math.max(h10, WATER_Y), z0),
        project(x0 + step, Math.max(h11, WATER_Y), z0 + step),
        project(x0, Math.max(h01, WATER_Y), z0 + step),
      ];
      if (corners.some((c) => !c)) continue;
      const depth = (corners[0].z + corners[1].z + corners[2].z + corners[3].z) / 4;
      const { shade, slope } = shadeOf(cxm, czm, hAvg);
      const tint = 0.96 + hashCell(ix, iz) * 0.08;
      quads.push({ corners, depth, color: terrainColor(hAvg, slope, shade * tint, cxm), dist });
    }
  }

  quads.sort((a, b) => b.depth - a.depth);
  for (const q of quads) {
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.moveTo(q.corners[0].x, q.corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(q.corners[i].x, q.corners[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // A breath of haze on the far field.
    if (q.dist > 900) {
      ctx.fillStyle = `rgba(232,201,160,${Math.min(0.34, (q.dist - 900) / 2600)})`;
      ctx.fill();
    }
  }
}

export function drawRunway(ctx, project) {
  const y = 3.15;
  const hw = RUNWAY.width / 2;
  const hl = RUNWAY.length / 2;
  const strip = [
    project(-hw, y, -hl), project(hw, y, -hl),
    project(hw, y, hl), project(-hw, y, hl),
  ];
  if (strip.some((p) => !p)) return;
  ctx.fillStyle = '#33383f';
  ctx.beginPath();
  ctx.moveTo(strip[0].x, strip[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(strip[i].x, strip[i].y);
  ctx.closePath();
  ctx.fill();

  // Centreline dashes and threshold bars.
  ctx.strokeStyle = 'rgba(245,245,240,0.9)';
  for (let z = -hl + 30; z < hl - 20; z += 46) {
    const a = project(0, y + 0.05, z);
    const b = project(0, y + 0.05, z + 22);
    if (!a || !b) continue;
    ctx.lineWidth = Math.max(1, 260 / a.z);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const zEdge of [-hl + 12, hl - 12]) {
    for (let i = -3; i <= 3; i++) {
      const a = project(i * 5.4, y + 0.05, zEdge - 7);
      const b = project(i * 5.4, y + 0.05, zEdge + 7);
      if (!a || !b) continue;
      ctx.lineWidth = Math.max(1, 200 / a.z);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  // Edge lights, lit for the evening.
  ctx.fillStyle = '#ffd98a';
  for (let z = -hl; z <= hl; z += 53) {
    for (const x of [-hw - 2, hw + 2]) {
      const p = project(x, y + 0.4, z);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, 90 / p.z), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTree(ctx, p, s) {
  const hgt = (900 / p.z) * s;
  if (hgt < 2) return;
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(p.x - hgt * 0.03, p.y - hgt * 0.22, hgt * 0.06, hgt * 0.22);
  ctx.fillStyle = '#2e6b3a';
  for (let i = 0; i < 3; i++) {
    const wdt = hgt * (0.42 - i * 0.1);
    const yb = p.y - hgt * (0.18 + i * 0.24);
    ctx.beginPath();
    ctx.moveTo(p.x - wdt / 2, yb);
    ctx.lineTo(p.x + wdt / 2, yb);
    ctx.lineTo(p.x, yb - hgt * 0.34);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBarn(ctx, project, item) {
  const { x, z, y } = item;
  const c = [
    project(x - 9, y, z - 6), project(x + 9, y, z - 6),
    project(x + 9, y + 7, z - 6), project(x - 9, y + 7, z - 6),
    project(x, y + 11, z - 6),
  ];
  if (c.some((p) => !p)) return;
  ctx.fillStyle = '#9c4a38';
  ctx.beginPath();
  ctx.moveTo(c[0].x, c[0].y); ctx.lineTo(c[1].x, c[1].y);
  ctx.lineTo(c[2].x, c[2].y); ctx.lineTo(c[3].x, c[3].y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6e3a2c';
  ctx.beginPath();
  ctx.moveTo(c[3].x, c[3].y); ctx.lineTo(c[2].x, c[2].y); ctx.lineTo(c[4].x, c[4].y);
  ctx.closePath(); ctx.fill();
}

export function drawProps(ctx, cam, project, rings, activeIdx, time) {
  const items = [];
  const cell = 90;
  const gx = Math.round(cam.pos.x / cell);
  const gz = Math.round(cam.pos.z / cell);
  const span = 14;
  for (let iz = gz - span; iz <= gz + span; iz++) {
    for (let ix = gx - span; ix <= gx + span; ix++) {
      const item = sceneryAt(ix, iz);
      if (!item) continue;
      const p = project(item.x, item.y, item.z);
      if (p) items.push({ depth: p.z, kind: item.kind, p, item });
    }
  }
  rings.forEach((r, i) => {
    const p = project(r.x, r.y, r.z);
    if (p) items.push({ depth: p.z, kind: 'ring', p, ring: r, active: i === activeIdx });
  });
  items.sort((a, b) => b.depth - a.depth);

  for (const it of items) {
    if (it.kind === 'tree') drawTree(ctx, it.p, it.item.s);
    else if (it.kind === 'barn') drawBarn(ctx, project, it.item);
    else if (it.kind === 'ring') drawRing(ctx, project, it.ring, it.active, time);
  }
}

function drawRing(ctx, project, r, active, time) {
  const seg = 26;
  const pts = [];
  // Ring plane: perpendicular to its course normal, upright.
  const px = -r.nz;
  const pz = r.nx;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const ox = Math.cos(a) * r.r;
    const oy = Math.sin(a) * r.r;
    pts.push(project(r.x + px * ox, r.y + oy, r.z + pz * ox));
  }
  if (pts.some((p) => !p)) return;
  const depth = pts[0].z;
  const pulse = active ? 0.75 + 0.25 * Math.sin(time * 4) : 1;
  const color = r.passed ? 'rgba(120,220,140,0.55)' : active ? `rgba(255,205,80,${pulse})` : 'rgba(140,210,255,0.75)';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, 1500 / depth);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, 520 / depth);
  ctx.stroke();
  // Corner beacons so the gate reads from far off.
  ctx.fillStyle = color;
  for (let i = 0; i < seg; i += 6) {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, Math.max(1.5, 260 / depth), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawClouds(ctx, cam, project) {
  const sorted = CLOUDS
    .map((c) => ({ c, p: project(c.x, c.y, c.z) }))
    .filter((e) => e.p)
    .sort((a, b) => b.p.z - a.p.z);
  for (const { c, p } of sorted) {
    const wdt = (c.w * 900) / p.z;
    if (wdt < 8) continue;
    ctx.fillStyle = 'rgba(255,244,228,0.34)';
    for (const [ox, oy, s] of [[0, 0, 1], [-0.35, 0.08, 0.7], [0.36, 0.06, 0.75], [0.05, -0.14, 0.6], [-0.12, -0.1, 0.55], [0.2, 0.12, 0.5]]) {
      ctx.beginPath();
      ctx.ellipse(p.x + ox * wdt, p.y + oy * wdt * 0.3, wdt * 0.32 * s, wdt * 0.11 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
