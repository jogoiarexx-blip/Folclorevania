// ============================================================
// js/core/input.js
// Gerenciador de input por teclado + controles touch
// ============================================================

const Input = {
  keys: {},
  _jp: {},
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) this._jp[e.code] = true;
      this.keys[e.code] = true;
      if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].includes(e.code))
        e.preventDefault();
    }, { passive:false });

    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });

    this._bindTouchControls();
  },

  _bindTouchControls() {
    document.querySelectorAll('[data-code]').forEach(btn => {
      const code = btn.dataset.code;
      const press = e => {
        e.preventDefault();
        this.press(code);
        btn.classList.add('pressed');
        try { btn.setPointerCapture?.(e.pointerId); } catch (_) {}
      };
      const release = e => {
        e.preventDefault();
        this.release(code);
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', press, { passive:false });
      btn.addEventListener('pointerup', release, { passive:false });
      btn.addEventListener('pointercancel', release, { passive:false });
      btn.addEventListener('lostpointercapture', release, { passive:false });
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
  },

  press(code) {
    if (!this.keys[code]) this._jp[code] = true;
    this.keys[code] = true;
  },
  release(code) { this.keys[code] = false; },
  clear() { this.keys = {}; this._jp = {}; },
  down(c) { return !!this.keys[c]; },
  downAny(...codes) { return codes.some(c => !!this.keys[c]); },
  jp(c)   { const v = !!this._jp[c]; this._jp[c] = false; return v; },
  jpAny(...codes) {
    for (const c of codes) {
      if (this._jp[c]) { this._jp[c] = false; return true; }
    }
    return false;
  },
};
