// Keyboard first, mouse if you like: arrows fly, W/S work the throttle,
// the mouse can steer, and C swaps between chase and cockpit views.

export function newInput(canvas) {
  const keys = new Set();
  const state = {
    throttle: 0, pitch: 0, roll: 0,
    mouseSteer: false, mouseX: 0, mouseY: 0,
    pressed: new Set(),
  };

  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) state.pressed.add(e.code);
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => {
    state.mouseX = (e.clientX / innerWidth) * 2 - 1;
    state.mouseY = (e.clientY / innerHeight) * 2 - 1;
  });
  canvas.addEventListener('mousedown', () => state.pressed.add('MouseDown'));

  state.sample = (dt) => {
    if (keys.has('KeyW') || keys.has('ShiftLeft')) state.throttle = Math.min(1, state.throttle + dt * 0.7);
    if (keys.has('KeyS') || keys.has('ControlLeft')) state.throttle = Math.max(0, state.throttle - dt * 0.7);

    let pitch = 0;
    let roll = 0;
    if (keys.has('ArrowUp')) pitch -= 1;      // push: nose down
    if (keys.has('ArrowDown')) pitch += 1;    // pull: nose up
    if (keys.has('ArrowLeft')) roll -= 1;
    if (keys.has('ArrowRight')) roll += 1;
    if (state.mouseSteer) {
      roll = Math.max(-1, Math.min(1, state.mouseX * 1.4));
      pitch = Math.max(-1, Math.min(1, -state.mouseY * 1.2));
    }
    state.pitch = pitch;
    state.roll = roll;
    return state;
  };

  state.takePressed = () => {
    const out = new Set(state.pressed);
    state.pressed.clear();
    return out;
  };

  return state;
}
