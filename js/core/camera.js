// ============================================================
// js/core/camera.js
// Câmera lateral com lerp, limitada aos bounds da região
// ============================================================

const Camera = {
  x: 0,
  follow(target, regionWidth, canvasWidth) {
    const tx = target.x - canvasWidth / 2;
    this.x += (tx - this.x) * 0.12;
    this.x = Math.max(0, Math.min(regionWidth - canvasWidth, this.x));
  }
};
