// Skyhaven Courier: boot, the frame loop, and the sortie state machine.

import { newPlane, stepFlight, speedKnots, altitudeFeet, headingDeg } from './flight.js';
import { newProgress, checkProgress, resetMissions, MISSIONS, activeRing } from './missions.js';
import { makeCamera, makeProjector, drawSky, drawTerrain, drawRunway, drawProps, drawClouds } from './render.js';
import { drawPlaneChase, drawCockpit } from './aircraft.js';
import { drawHud, drawTitle, drawEnd } from './hud.js';
import { newInput } from './input.js';
import { newAudio } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
const boot = document.getElementById('boot');

let W = 0;
let H = 0;
function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');

const input = newInput(canvas);
const audio = newAudio();
let plane = newPlane();
let progress = newProgress();
let view = 'chase';
let mode = 'title'; // title | fly | paused | over | won
let time = 0;
let stallBeepT = 0;

function restart() {
  resetMissions();
  plane = newPlane();
  progress = newProgress();
  input.throttle = 0;
  mode = 'fly';
}

if (shotName) {
  view = applyShot(shotName, plane, progress);
  mode = 'fly';
}
boot.remove();

function frame(now) {
  requestAnimationFrame(frame);
  if (canvas.width !== innerWidth || canvas.height !== innerHeight) resize();
  const dt = Math.min(0.05, frame.last ? (now - frame.last) / 1000 : 0.016);
  frame.last = now;
  time += dt;

  const pressed = input.takePressed();
  if (pressed.has('Enter') || pressed.has('MouseDown')) {
    audio.unlock();
    if (mode === 'title') mode = 'fly';
  }
  if (pressed.has('KeyC')) view = view === 'chase' ? 'cockpit' : 'chase';
  if (pressed.has('KeyM')) input.mouseSteer = !input.mouseSteer;
  if (pressed.has('KeyP') || pressed.has('Escape')) {
    if (mode === 'fly') mode = 'paused';
    else if (mode === 'paused') mode = 'fly';
  }
  if (pressed.has('KeyR') && (mode === 'over' || mode === 'won' || mode === 'paused')) restart();

  if (mode === 'fly' && !shotName) {
    input.sample(dt);
    stepFlight(plane, input, dt);
    const event = checkProgress(progress, plane, dt);
    if (event === 'ring') audio.ring();
    if (event === 'mission' || event === 'finished') audio.mission();
    if (plane.crashed) { mode = 'over'; audio.crash(); }
    if (progress.finished) mode = 'won';
    audio.engine(plane.throttle, plane.speed);
    stallBeepT -= dt;
    if (plane.stalled && stallBeepT <= 0) { audio.stall(); stallBeepT = 0.7; }
  } else if (mode === 'fly' && shotName) {
    // Hold the screenshot pose with a gentle bob.
    plane.y += Math.sin(time * 1.3) * dt * 0.6;
    progress.messageT = Math.max(0, progress.messageT - dt);
  }

  const cam = makeCamera(plane, view);
  const project = makeProjector(cam, W, H);

  drawSky(ctx, cam, W, H);
  drawTerrain(ctx, cam, project, W, H);
  drawRunway(ctx, project);
  drawClouds(ctx, cam, project);

  const mission = MISSIONS[progress.mission];
  const rings = mission ? mission.rings : [];
  const active = activeRing(progress);
  drawProps(ctx, cam, project, rings, active ? rings.indexOf(active) : -1, time);

  if (view === 'chase') drawPlaneChase(ctx, W, H, plane, time);
  else drawCockpit(ctx, W, H, plane, speedKnots(plane), altitudeFeet(plane), headingDeg(plane));

  if (mode !== 'title') drawHud(ctx, W, H, plane, progress, time, project, view);
  if (mode === 'title') drawTitle(ctx, W, H, time);
  if (mode === 'paused') {
    ctx.fillStyle = 'rgba(10,16,28,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd98a';
    ctx.font = `bold ${Math.round(H * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — P to resume, R to restart', W / 2, H / 2);
  }
  if (mode === 'over') drawEnd(ctx, W, H, false, progress.score);
  if (mode === 'won') drawEnd(ctx, W, H, true, progress.score);
}
requestAnimationFrame(frame);
