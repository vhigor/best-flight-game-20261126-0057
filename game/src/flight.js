// Arcade flight model: throttle and pitch trade speed for height, banked
// turns cost energy, and the ground is unforgiving about arrival angles.

import { terrainHeight, onRunway } from './world.js';

const G = 9.81;
const STALL_SPEED = 26;

export function newPlane() {
  return {
    x: 0, y: 4.4, z: 290,          // parked at the south threshold, facing north
    yaw: 0, pitch: 0, roll: 0,
    speed: 0, throttle: 0,
    fuel: 100, damage: 0,
    onGround: true, crashed: false, stalled: false,
    vspeed: 0,
  };
}

export function forwardOf(p) {
  const cp = Math.cos(p.pitch);
  return {
    x: Math.sin(p.yaw) * cp,
    y: Math.sin(p.pitch),
    z: -Math.cos(p.yaw) * cp,
  };
}

export function headingDeg(p) {
  return ((p.yaw * 180) / Math.PI % 360 + 360) % 360;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function stepFlight(p, input, dt) {
  if (p.crashed) return;
  const engineOn = p.fuel > 0;

  // Throttle spools toward the lever.
  const target = engineOn ? input.throttle : 0;
  p.throttle += clamp(target - p.throttle, -dt * 0.9, dt * 0.9);
  if (engineOn) p.fuel = Math.max(0, p.fuel - dt * (0.35 + p.throttle * 1.5));

  // Control authority grows with airspeed; below the stall it fades out.
  const authority = clamp(p.speed / 45, 0.15, 1);
  p.stalled = !p.onGround && p.speed < STALL_SPEED;

  p.roll += clamp(input.roll * 1.15 - p.roll, -dt * 3.2, dt * 3.2);
  const pitchRate = input.pitch * 0.85 * authority;
  p.pitch = clamp(p.pitch + pitchRate * dt, -0.62, 0.55);
  if (p.stalled) p.pitch = clamp(p.pitch - dt * 0.5, -0.62, 0.55); // nose drops

  // Banked turns: yaw follows the roll, paid for in speed.
  p.yaw += Math.sin(p.roll) * 0.62 * authority * dt;

  // Energy: thrust, drag, and gravity along the flight path.
  const thrust = p.throttle * 15.5;
  const drag = 0.0042 * p.speed * p.speed + Math.abs(Math.sin(p.roll)) * 1.6;
  const gravityAlong = -G * Math.sin(p.pitch) * 0.92;
  p.speed = clamp(p.speed + (thrust - drag + gravityAlong) * dt, 0, 118);

  const f = forwardOf(p);
  const liftSink = p.stalled ? -7.5 : 0;
  p.vspeed = f.y * p.speed + liftSink;
  p.x += f.x * p.speed * dt;
  p.z += f.z * p.speed * dt;
  p.y += p.vspeed * dt;

  // Keep the sortie inside the valley.
  p.x = clamp(p.x, -3400, 3400);
  p.z = clamp(p.z, -3400, 3400);
  p.y = Math.min(p.y, 900);

  const ground = terrainHeight(p.x, p.z) + 1.4;
  if (p.y <= ground) {
    const gentle =
      p.vspeed > -6.5 && Math.abs(p.pitch) < 0.16 && Math.abs(p.roll) < 0.35;
    if (gentle && p.speed < 62) {
      p.y = ground;
      p.onGround = true;
      p.pitch *= 0.6;
      p.roll *= 0.6;
      p.vspeed = 0;
      if (p.throttle < 0.25) p.speed = Math.max(0, p.speed - dt * 9);
      if (p.throttle < 0.05) p.speed = Math.max(0, p.speed - dt * 15); // wheel brakes
      if (p.speed > 30 && p.pitch > 0.05) { p.onGround = false; p.y = ground + 0.6; }
      if (onRunway(p.x, p.z) && p.speed < 3) {
        p.fuel = 100;                       // the ground crew tops her up
        p.damage = Math.max(0, p.damage - dt * 14);
      }
    } else {
      p.y = ground;
      p.crashed = true;
      p.damage = 100;
    }
  } else if (p.y > ground + 2.5) {
    p.onGround = false;
  }

  // Scraping the treetops hurts even when it does not end the flight.
  if (!p.onGround && !p.crashed && p.y < ground + 4 && p.vspeed < -3) {
    p.damage = Math.min(100, p.damage + dt * 22);
    if (p.damage >= 100) p.crashed = true;
  }
}

export function speedKnots(p) { return p.speed * 1.944; }
export function altitudeFeet(p) { return Math.max(0, p.y * 3.281); }
