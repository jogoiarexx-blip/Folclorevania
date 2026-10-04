// ============================================================
// js/systems/particleSystem.js
// Sistema de partículas: impacto, poeira, habilidades especiais
// Depende de: camera.js
// ============================================================

const Particles = {
  pool: [],

  // ── Emissores ─────────────────────────────────────────────

  // Impacto de golpe (esparks amarelo-laranja)
  impact(x, y, facingDir) {
    for (let i = 0; i < 8; i++) {
      this._emit({
        x, y,
        vx: facingDir * (1.5 + Math.random() * 3) + (Math.random()-0.5)*2,
        vy: -2 - Math.random() * 3,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ffcc00' : '#ff6600',
        gravity: 0.18,
        fade: true,
      });
    }
  },

  // Poeira ao aterrissar
  land(x, y) {
    for (let i = 0; i < 6; i++) {
      this._emit({
        x: x + Math.random() * 30 - 5,
        y: y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -0.8 - Math.random() * 1.2,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 4 + Math.random() * 5,
        color: '#a0825a',
        gravity: 0.05,
        fade: true,
      });
    }
  },

  // Sangue/dano ao inimigo morrer
  death(x, y, color) {
    const c = color || '#44ff44';
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this._emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 3 + Math.random() * 5,
        color: c,
        gravity: 0.12,
        fade: true,
      });
    }
  },

  // Knockback faísca ao player tomar dano
  playerHit(x, y) {
    for (let i = 0; i < 10; i++) {
      this._emit({
        x: x + Math.random() * 30,
        y: y + Math.random() * 46,
        vx: (Math.random() - 0.5) * 5,
        vy: -1.5 - Math.random() * 3,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color: '#ff2222',
        gravity: 0.15,
        fade: true,
      });
    }
  },

  // Pulo duplo (anel de energia)
  doubleJump(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      this._emit({
        x: x + 15,
        y: y + 46,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 1.2 + 0.5,
        life: 0.35,
        maxLife: 0.35,
        size: 4,
        color: '#00eaff',
        gravity: 0,
        fade: true,
      });
    }
  },

  // Dash (rastro de partículas azuis)
  dash(x, y, facing) {
    for (let i = 0; i < 5; i++) {
      this._emit({
        x: x + (facing > 0 ? 0 : 30) + Math.random() * 10,
        y: y + 10 + Math.random() * 30,
        vx: -facing * (1 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 1.5,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        size: 3 + Math.random() * 3,
        color: '#00ccff',
        gravity: 0,
        fade: true,
      });
    }
  },

  // Investida (chamas horizontais)
  charge(x, y, facing) {
    for (let i = 0; i < 6; i++) {
      this._emit({
        x: x + (facing > 0 ? 0 : 30),
        y: y + 10 + Math.random() * 26,
        vx: -facing * (2 + Math.random() * 3),
        vy: (Math.random() - 0.5) * 2,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#ff8800' : '#ffcc00',
        gravity: -0.05,
        fade: true,
      });
    }
  },

  // Poder especial (explosão de energia roxa/dourada)
  special(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i;
      const speed = 3 + Math.random() * 4;
      this._emit({
        x: x + 15, y: y + 23,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        size: 4 + Math.random() * 6,
        color: i % 2 === 0 ? '#cc44ff' : '#ffdd00',
        gravity: 0.05,
        fade: true,
      });
    }
    // onda de choque
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i;
      this._emit({
        x: x + 15, y: y + 23,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        life: 0.2,
        maxLife: 0.2,
        size: 6,
        color: '#ffffff',
        gravity: 0,
        fade: true,
      });
    }
  },

  // ── Internos ──────────────────────────────────────────────
  _maxParticles() {
    const q = (typeof GameSettings !== 'undefined' && GameSettings.quality) || 'high';
    return q === 'low' ? 140 : q === 'medium' ? 260 : 420;
  },

  _emit(p) {
    const max = this._maxParticles();
    if (this.pool.length >= max) this.pool.splice(0, Math.max(1, this.pool.length - max + 1));
    this.pool.push(p);
  },

  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.life -= dt;
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.gravity;
      if (p.life <= 0) this.pool.splice(i, 1);
    }
  },

  draw(ctx) {
    ctx.save();
    const lowFx = typeof GameSettings !== 'undefined' && GameSettings.quality === 'low';
    for (const p of this.pool) {
      const sx = p.x - Camera.x;
      if (sx < -40 || sx > ctx.canvas.width + 40 || p.y < -40 || p.y > ctx.canvas.height + 40) continue;
      const alpha = p.fade ? Math.max(0, p.life / p.maxLife) : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = lowFx ? 0 : 4;
      ctx.beginPath();
      ctx.arc(sx, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  },
};
