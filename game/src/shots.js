// Deterministic screenshot scenes: each one parks the Courier mid-sortie so
// the maker's screenshots show the game exactly as it plays.

import { MISSIONS } from './missions.js';

export const SHOT_NAMES = ['cover', 'cockpit', 'landing', 'canyon'];

export function applyShot(name, plane, progress) {
  const scenes = {
    // Chase view over the meadow: a gold ring ahead, the airfield beyond.
    cover: () => {
      plane.x = -506; plane.y = 165; plane.z = -316;
      plane.yaw = 2.2; plane.pitch = 0.03; plane.roll = 0.18;
      plane.speed = 58; plane.throttle = 0.72; plane.fuel = 86; plane.damage = 4;
      plane.onGround = false; plane.vspeed = 2;
      progress.mission = 0;
      for (let i = 0; i < 5; i++) MISSIONS[0].rings[i].passed = true;
      progress.score = 2500;
      return 'chase';
    },
    // From the pilot's seat, instruments lit, coast on the left.
    cockpit: () => {
      plane.x = -700; plane.y = 230; plane.z = -900;
      plane.yaw = 0.5; plane.pitch = -0.02; plane.roll = -0.12;
      plane.speed = 64; plane.throttle = 0.8; plane.fuel = 73; plane.damage = 0;
      plane.onGround = false; plane.vspeed = -1;
      progress.mission = 0;
      MISSIONS[0].rings[0].passed = true;
      progress.score = 500;
      return 'cockpit';
    },
    // Short final for runway 36, threshold lights ahead.
    landing: () => {
      plane.x = 6; plane.y = 58; plane.z = 640;
      plane.yaw = 0.02; plane.pitch = -0.06; plane.roll = 0.03;
      plane.speed = 38; plane.throttle = 0.34; plane.fuel = 41; plane.damage = 9;
      plane.onGround = false; plane.vspeed = -3;
      progress.mission = 2;
      for (const r of MISSIONS[2].rings) r.passed = true;
      progress.score = 4650;
      return 'chase';
    },
    // Low in the gorge, threading the canyon rings.
    canyon: () => {
      plane.x = 1500; plane.y = 88; plane.z = 60;
      plane.yaw = 0.05; plane.pitch = 0.01; plane.roll = -0.22;
      plane.speed = 66; plane.throttle = 0.85; plane.fuel = 64; plane.damage = 12;
      plane.onGround = false; plane.vspeed = 0;
      progress.mission = 1;
      MISSIONS[1].rings[0].passed = true;
      MISSIONS[1].rings[1].passed = true;
      progress.score = 2750;
      return 'chase';
    },
  };
  const scene = scenes[name] || scenes.cover;
  return scene();
}
