// ============================================================
// js/core/gameLoop.js
// Fixed timestep 60 Hz: gameplay consistente em 60/120/144 Hz
// ============================================================

const FIXED_DT = 1 / 60;
const MAX_FRAME_TIME = 0.25;
const MAX_STEPS_PER_FRAME = 8;
let lastTime = 0;
let accumulator = 0;
let _loopStarted = false;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const frameTime = Math.min((timestamp - lastTime) / 1000, MAX_FRAME_TIME);
  lastTime = timestamp;

  if (GameState.started && !GameState.paused) {
    accumulator += frameTime;
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    render();
  } else if (GameState.started) {
    // mantém a tela visível durante pausa, sem avançar simulação
    render();
    accumulator = 0;
  }

  requestAnimationFrame(gameLoop);
}

function startGameLoop() {
  if (_loopStarted) return;
  _loopStarted = true;
  lastTime = 0;
  accumulator = 0;
  requestAnimationFrame(gameLoop);
}

document.addEventListener('visibilitychange', () => {
  lastTime = 0;
  accumulator = 0;
});
