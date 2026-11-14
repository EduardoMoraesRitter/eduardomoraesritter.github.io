// Automatic frame-rate control, decided on the sender from the receiver's own measurements.
// Pure: no DOM, no timers, no storage. The app feeds it one sample per receiver report.
//
// The signal is efficiency: new blocks the receiver accepted per second, divided by the
// blocks the sender could have shown at the current rate (3 colour channels, and one
// metadata frame in every 12 frames is not a data frame). Near 1 means the phone keeps up.
// A camera that cannot keep up shows up as efficiency falling, whether it stalls or not.

export const CONTROL = Object.freeze({
  MIN_FPS: 2,
  MAX_FPS: 12,
  STEP_UP: 1,
  STEP_DOWN: 2,
  UP_AT: 0.9,         // efficiency at or above this counts as "keeping up"
  DOWN_AT: 0.7,       // below this counts as "falling behind"; between the two, hold
  CONFIRM: 2,         // samples in a row before acting, so one noisy report does not move it
  COOLDOWN_MS: 6000,  // minimum time between two changes
});

const DATA_FRAMES_PER_SECOND = (fps) => fps * 3 * 11 / 12;

export function newControlState(fps, learnedCeiling = null) {
  const ceiling = Number.isInteger(learnedCeiling)
    ? Math.min(CONTROL.MAX_FPS, Math.max(CONTROL.MIN_FPS, learnedCeiling))
    : CONTROL.MAX_FPS;
  // Start no higher than the learned ceiling, so a known-bad rate is never tried again.
  return { fps: Math.min(fps, ceiling), ceiling, good: 0, bad: 0, lastChange: -Infinity, lastFailedFps: null };
}

// sample: { fresh: blocks/s accepted, stalled: boolean, active: boolean }
// active=false (paused, camera off, transfer complete) means: do nothing.
export function decideSpeed(state, sample, now) {
  if (!sample || !sample.active) {
    return { state: { ...state, good: 0, bad: 0 }, fps: state.fps, reason: 'inactive' };
  }
  // A stall is the recovery rule's job (slow down, then pause). Never count it as "keeping up".
  if (sample.stalled) {
    return { state: { ...state, good: 0, bad: CONTROL.CONFIRM }, fps: state.fps, reason: 'stalled' };
  }

  const expected = DATA_FRAMES_PER_SECOND(state.fps);
  const efficiency = expected > 0 ? Math.min(1, Math.max(0, sample.fresh) / expected) : 0;

  let good = state.good, bad = state.bad;
  if (efficiency >= CONTROL.UP_AT) { good += 1; bad = 0; }
  else if (efficiency < CONTROL.DOWN_AT) { bad += 1; good = 0; }
  else { good = 0; bad = 0; }

  const next = { ...state, good, bad };
  const cooling = now - state.lastChange < CONTROL.COOLDOWN_MS;

  if (!cooling && bad >= CONTROL.CONFIRM && state.fps > CONTROL.MIN_FPS) {
    const fps = Math.max(CONTROL.MIN_FPS, state.fps - CONTROL.STEP_DOWN);
    // Remember where it stopped working, so the next transfer does not start there again.
    return {
      state: { ...next, fps, bad: 0, lastChange: now, lastFailedFps: state.fps,
               ceiling: Math.min(state.ceiling, Math.max(CONTROL.MIN_FPS, state.fps - 1)) },
      fps, reason: 'down',
    };
  }

  if (!cooling && good >= CONTROL.CONFIRM && state.fps < state.ceiling) {
    const fps = Math.min(state.ceiling, state.fps + CONTROL.STEP_UP);
    return { state: { ...next, fps, good: 0, lastChange: now }, fps, reason: 'up' };
  }

  return { state: next, fps: state.fps, reason: cooling ? 'cooldown' : 'hold' };
}
