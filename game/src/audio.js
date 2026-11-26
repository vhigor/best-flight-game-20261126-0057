// A small WebAudio engine: propeller hum that follows the throttle, a chime
// for rings, and a thud that ends arguments with the ground.

export function newAudio() {
  let ctx = null;
  let osc = null;
  let gain = null;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type = 'sine', vol = 0.16) {
    if (!ensure()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); },
    engine(throttle, speed) {
      if (!ctx) return;
      osc.frequency.value = 48 + throttle * 95 + speed * 0.25;
      gain.gain.value = 0.015 + throttle * 0.05;
    },
    ring() { blip(880, 0.18); setTimeout(() => blip(1318, 0.24), 70); },
    mission() { blip(659, 0.2); setTimeout(() => blip(988, 0.3), 110); },
    crash() { blip(70, 0.5, 'triangle', 0.3); },
    stall() { blip(1175, 0.09, 'square', 0.05); },
  };
}
