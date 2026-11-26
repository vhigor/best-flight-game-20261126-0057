// Three sorties over Skyhaven: learn the rings, thread the canyon, come home.

function ring(x, y, z, nx, nz) {
  const len = Math.hypot(nx, nz) || 1;
  return { x, y, z, nx: nx / len, nz: nz / len, r: 26, passed: false };
}

export const MISSIONS = [
  {
    name: 'Ring Run',
    brief: 'Fly through all 8 rings over the meadow.',
    rings: [
      ring(0, 120, -700, 0, -1),
      ring(-260, 150, -1250, -0.4, -1),
      ring(-620, 170, -1750, -0.7, -0.7),
      ring(-950, 140, -1150, -0.2, 1),
      ring(-760, 180, -500, 0.6, 0.8),
      ring(-320, 160, -180, 0.8, 0.4),
      ring(180, 150, -260, 1, -0.2),
      ring(420, 170, -760, 0.4, -1),
    ],
    landAfter: false,
  },
  {
    name: 'Canyon Thread',
    brief: 'Six rings down the gorge. Stay low, stay honest.',
    rings: [
      ring(1050, 150, -900, 0.7, -0.7),
      ring(1420, 95, -620, 0.2, -1),
      ring(1520, 80, -180, 0, -1),
      ring(1470, 85, 260, -0.1, -1),
      ring(1380, 110, 700, -0.4, 0.9),
      ring(950, 150, 900, -0.8, 0.6),
    ],
    landAfter: false,
  },
  {
    name: 'Homecoming',
    brief: 'Two last rings, then land on runway 36 and stop.',
    rings: [
      ring(500, 200, 1300, -0.4, -1),
      ring(60, 150, 820, -0.1, -1),
    ],
    landAfter: true,
  },
];

export function newProgress() {
  return { mission: 0, score: 0, ringsDone: 0, finished: false, message: '', messageT: 0 };
}

export function activeRing(progress) {
  const m = MISSIONS[progress.mission];
  if (!m) return null;
  return m.rings.find((r) => !r.passed) || null;
}

export function checkProgress(progress, plane, dt) {
  const m = MISSIONS[progress.mission];
  progress.messageT = Math.max(0, progress.messageT - dt);
  if (!m || progress.finished) return;

  const target = activeRing(progress);
  if (target) {
    const dx = plane.x - target.x;
    const dy = plane.y - target.y;
    const dz = plane.z - target.z;
    const along = dx * target.nx + dz * target.nz;
    const radial = Math.hypot(dx - along * target.nx, dy, dz - along * target.nz);
    if (Math.abs(along) < 9 && radial < target.r) {
      target.passed = true;
      progress.ringsDone += 1;
      progress.score += 500;
      progress.message = 'Ring! +500';
      progress.messageT = 1.6;
      return 'ring';
    }
    return null;
  }

  if (m.landAfter) {
    const stopped = plane.onGround && plane.speed < 2.5;
    const onStrip = Math.abs(plane.x) <= 22 && Math.abs(plane.z) <= 320;
    if (stopped && onStrip) {
      progress.score += 1000;
      progress.finished = true;
      progress.message = 'Down safe. Sortie complete!';
      progress.messageT = 4;
      return 'finished';
    }
    return null;
  }

  progress.score += 750;
  progress.mission += 1;
  progress.message = `${m.name} complete! +750`;
  progress.messageT = 2.6;
  return 'mission';
}

export function resetMissions() {
  for (const m of MISSIONS) for (const r of m.rings) r.passed = false;
}
