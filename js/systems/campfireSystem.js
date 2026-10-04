// ============================================================
// js/systems/campfireSystem.js
// Fogueiras — pontos de save visuais no mapa
// Jogador se aproxima e pressiona E para salvar
// ============================================================

// Uma fogueira por região, posicionada em plataforma segura
const CAMPFIRE_DEFS = [
  { regionId:0, x: 200, y: 808 },  // Vila Abandonada — início, chão
  { regionId:1, x: 280, y: 808 },  // Floresta — entrada
  { regionId:2, x: 200, y: 808 },  // Campo das Chamas
  { regionId:3, x: 200, y: 808 },  // Raízes Enganadoras
  { regionId:4, x: 200, y: 808 },  // Mata Viva
  { regionId:5, x: 200, y: 808 },  // Templo Ancestral
];

const CAMPFIRE_WIDTH  = 28;
const CAMPFIRE_HEIGHT = 32;
const INTERACT_RANGE  = 64; // pixels para ativar

const CampfireSystem = {
  campfires: [],   // instâncias ativas (mesma região)
  _time: 0,
  _prompt: null,   // { timer } quando mostra "E — Salvar"

  init() {
    this.campfires = CAMPFIRE_DEFS.map(def => ({
      ...def,
      lit:      false,   // acesa = já foi usada como save
      animTime: Math.random() * Math.PI * 2,
    }));
  },

  // Marca fogueira da região como acesa (chamado ao salvar)
  lightInRegion(regionId) {
    const cf = this.campfires.find(c => c.regionId === regionId);
    if (cf) cf.lit = true;
  },

  // Apaga todas (reset de novo jogo)
  reset() {
    this.campfires.forEach(c => { c.lit = false; });
  },

  // Restaura estado de um save
  restoreFromSave(litRegions) {
    if (!litRegions) return;
    for (const rid of litRegions) {
      this.lightInRegion(rid);
    }
  },

  update(dt, regionId, player) {
    this._time += dt;
    this._prompt = null;

    const cf = this.campfires.find(c => c.regionId === regionId);
    if (!cf) return;

    cf.animTime += dt;

    const dist = Math.hypot(
      (player.x + player.width  / 2) - (cf.x + CAMPFIRE_WIDTH  / 2),
      (player.y + player.height / 2) - (cf.y + CAMPFIRE_HEIGHT / 2)
    );

    if (dist < INTERACT_RANGE) {
      this._prompt = { cf };
      // Pressiona E → salva
      if (Input.jp('KeyE')) {
        cf.lit = true;
        return 'save'; // sinaliza ao main.js
      }
    }
  },

  draw(ctx, regionId) {
    const cf = this.campfires.find(c => c.regionId === regionId);
    if (!cf) return;

    const sx  = cf.x - Camera.x;
    const sy  = cf.y;
    const t   = cf.animTime;
    const lit = cf.lit;

    ctx.save();

    // ── Base / pedras ────────────────────────────────────────
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath();
    ctx.ellipse(sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT - 4, 16, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // pedrinhas ao redor
    const stones = [[0,0],[22,2],[4,6],[-2,4],[20,6]];
    for (const [ox, oy] of stones) {
      ctx.fillStyle = '#5a4a38';
      ctx.beginPath();
      ctx.ellipse(sx + 3 + ox, sy + CAMPFIRE_HEIGHT - 5 + oy, 4, 3, ox*0.1, 0, Math.PI*2);
      ctx.fill();
    }

    // ── Lenhas ───────────────────────────────────────────────
    ctx.strokeStyle = '#5c3a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + 6,  sy + CAMPFIRE_HEIGHT - 4);
    ctx.lineTo(sx + 22, sy + CAMPFIRE_HEIGHT - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 22, sy + CAMPFIRE_HEIGHT - 4);
    ctx.lineTo(sx + 6,  sy + CAMPFIRE_HEIGHT - 10);
    ctx.stroke();

    if (lit) {
      // ── Fogueira ACESA ───────────────────────────────────────

      // brilho no chão
      const glow = ctx.createRadialGradient(
        sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT - 2, 0,
        sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT - 2, 34
      );
      glow.addColorStop(0, 'rgba(255,140,0,0.25)');
      glow.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT, 34, 10, 0, 0, Math.PI*2);
      ctx.fill();

      // chamas — várias camadas
      const flames = [
        { ox:0,  baseH:20, color0:'#ffffff', color1:'#ffcc00', w:0.28, phase:0    },
        { ox:-5, baseH:14, color0:'#ffcc00', color1:'#ff6600', w:0.22, phase:1.1  },
        { ox: 5, baseH:16, color0:'#ff8800', color1:'#ff2200', w:0.20, phase:2.3  },
        { ox:-2, baseH:10, color0:'#ff4400', color1:'#880000', w:0.14, phase:0.7  },
        { ox: 3, baseH:12, color0:'#ffaa00', color1:'#ff5500', w:0.16, phase:1.8  },
      ];

      for (const fl of flames) {
        const flicker = Math.sin(t * 9 + fl.phase) * 4 + Math.cos(t * 13 + fl.phase) * 2;
        const fh = fl.baseH + flicker;
        const fw = CAMPFIRE_WIDTH * fl.w;
        const cx = sx + CAMPFIRE_WIDTH/2 + fl.ox;
        const baseY = sy + CAMPFIRE_HEIGHT - 8;

        const grad = ctx.createLinearGradient(cx, baseY - fh, cx, baseY);
        grad.addColorStop(0,   fl.color0 + '00');
        grad.addColorStop(0.3, fl.color0 + 'cc');
        grad.addColorStop(1,   fl.color1);
        ctx.fillStyle = grad;
        ctx.shadowColor = fl.color1; ctx.shadowBlur = 10;

        // forma de chama
        ctx.beginPath();
        ctx.moveTo(cx - fw, baseY);
        ctx.quadraticCurveTo(
          cx - fw * 0.8 + Math.sin(t * 7 + fl.phase) * 3,
          baseY - fh * 0.5,
          cx + Math.sin(t * 5 + fl.phase) * 2,
          baseY - fh
        );
        ctx.quadraticCurveTo(
          cx + fw * 0.8 + Math.cos(t * 6 + fl.phase) * 3,
          baseY - fh * 0.5,
          cx + fw, baseY
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // brasas / faíscas subindo
      const numEmbers = 5;
      for (let i = 0; i < numEmbers; i++) {
        const ep = ((t * 0.8 + i * 0.4) % 1);   // 0→1 subindo
        const ex = sx + CAMPFIRE_WIDTH/2 + Math.sin(t * 3 + i * 1.3) * 10;
        const ey = (sy + CAMPFIRE_HEIGHT - 10) - ep * 30;
        const alpha = (1 - ep) * 0.9;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ep < 0.4 ? '#ffcc00' : '#ff6600';
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    } else {
      // ── Fogueira APAGADA — só brasas mortas ──────────────────
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath();
      ctx.ellipse(sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT - 8, 8, 4, 0, 0, Math.PI*2);
      ctx.fill();
      // fio de fumaça fria
      ctx.strokeStyle = 'rgba(120,100,80,0.3)';
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx + CAMPFIRE_WIDTH/2, sy + CAMPFIRE_HEIGHT - 10);
      ctx.quadraticCurveTo(
        sx + CAMPFIRE_WIDTH/2 + Math.sin(t*0.8)*6,
        sy + CAMPFIRE_HEIGHT - 22,
        sx + CAMPFIRE_WIDTH/2 + Math.sin(t*0.5)*10,
        sy + CAMPFIRE_HEIGHT - 34
      );
      ctx.stroke();
    }

    // ── Prompt de interação ───────────────────────────────────
    if (this._prompt && this._prompt.cf === cf) {
      const pulse = 0.7 + 0.3 * Math.sin(this._time * 6);
      ctx.globalAlpha = pulse;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = lit ? '#ffcc66' : '#aaaaaa';
      ctx.shadowColor = lit ? '#ff8800' : '#555';
      ctx.shadowBlur  = 8;
      const label = lit ? '[ E ]  Salvar' : '[ E ]  Acender e Salvar';
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, sx + CAMPFIRE_WIDTH/2 - lw/2, sy - 6);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },
};
