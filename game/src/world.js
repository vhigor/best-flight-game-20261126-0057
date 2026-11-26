// The Skyhaven valley: one deterministic heightfield with a coast, a canyon,
// a northern ridge and a flat airfield, plus the scenery scattered over it.

export const RUNWAY = { x: 0, z: 0, length: 640, width: 44, heading: 0 };
export const WATER_Y = 0;

function ridge(x, z) {
  // A mountain wall across the north of the valley.
  const d = Math.max(0, -z - 1500) / 900;
  return Math.min(1, d) * 190 * (0.75 + 0.25 * Math.sin(x / 420));
}

function canyon(x, z) {
  // A carved gorge in the east, running north-south.
  const wall = Math.exp(-Math.pow((x - 1500) / 260, 2));
  const along = Math.exp(-Math.pow((z + 300) / 1400, 2));
  return -wall * along * 85;
}

export function terrainHeight(x, z) {
  let h =
    26 * Math.sin(x / 520) * Math.cos(z / 460) +
    15 * Math.sin(x / 210 + 1.7) * Math.sin(z / 260 - 0.6) +
    7 * Math.sin(x / 83) * Math.cos(z / 97 + 2.1) +
    46;
  h += ridge(x, z);
  h += canyon(x, z);
  // The sea takes the west.
  const coast = Math.min(1, Math.max(0, (-x - 900) / 700));
  h = h * (1 - coast) - coast * 26;
  // Flatten the airfield shelf around the runway.
  const dx = Math.max(0, Math.abs(x - RUNWAY.x) - 130);
  const dz = Math.max(0, Math.abs(z - RUNWAY.z) - 430);
  const d = Math.hypot(dx, dz);
  const flat = Math.min(1, d / 260);
  return 3 * (1 - flat) + h * flat;
}

export function terrainColor(h, slope, shade, x = 0) {
  // One late-afternoon palette, from seabed to snowcap.
  let rgb;
  if (h < 1.2 && x < -500) rgb = [46, 110, 150]; // the western sea
  else if (h < 5) rgb = [214, 196, 140];        // sand
  else if (h < 34) rgb = [96, 160, 84];         // meadow
  else if (h < 78) rgb = [58, 122, 66];         // forest floor
  else if (h < 128) rgb = [122, 108, 92];       // rock
  else if (h < 175) rgb = [150, 142, 138];      // high rock
  else rgb = [238, 240, 244];                   // snow
  if (slope > 0.55 && h >= 5) rgb = [128, 112, 96];
  const s = 0.72 + shade * 0.38;
  return `rgb(${Math.round(rgb[0] * s)},${Math.round(rgb[1] * s)},${Math.round(rgb[2] * s)})`;
}

export function hashCell(ix, iz) {
  let n = (ix * 374761393 + iz * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function sceneryAt(ix, iz) {
  // Deterministic trees and farm buildings, one decision per 90 m cell.
  const x = ix * 90 + 45;
  const z = iz * 90 + 45;
  const h = terrainHeight(x, z);
  const roll = hashCell(ix, iz);
  if (h < 6 || h > 120) return null;
  if (Math.abs(x) < 190 && Math.abs(z) < 500) return null; // keep the airfield clear
  if (roll < 0.34) return { kind: 'tree', x, z, y: h, s: 0.8 + roll * 2.2 };
  if (roll > 0.965) return { kind: 'barn', x, z, y: h, s: 1 };
  return null;
}

export const CLOUDS = (() => {
  const list = [];
  for (let i = 0; i < 46; i++) {
    const a = hashCell(i * 7 + 3, 91);
    const b = hashCell(17, i * 11 + 5);
    const c = hashCell(i * 13 + 1, 7);
    list.push({
      x: -3200 + a * 6400,
      y: 330 + b * 260,
      z: -3200 + c * 6400,
      w: 180 + a * 320,
    });
  }
  return list;
})();

export function onRunway(x, z) {
  return (
    Math.abs(x - RUNWAY.x) <= RUNWAY.width / 2 &&
    Math.abs(z - RUNWAY.z) <= RUNWAY.length / 2
  );
}
