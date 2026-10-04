// ============================================================
// js/systems/saveSystem.js
// Sistema de save com 3 slots — LocalStorage
// ============================================================

const SAVE_KEY = 'folclorevania_save';
const NUM_SLOTS = 3;

const SaveSystem = {

  // ── Lê todos os slots do localStorage ────────────────────
  loadAll() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return [null, null, null];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [null, null, null];
      while (parsed.length < NUM_SLOTS) parsed.push(null);
      return parsed.slice(0, NUM_SLOTS);
    } catch(e) {
      return [null, null, null];
    }
  },

  // ── Salva um slot específico ──────────────────────────────
  save(slotIndex) {
    const slots = this.loadAll();
    slots[slotIndex] = {
      version:        2,
      timestamp:      Date.now(),
      regionId:       GameState.currentRegionId,
      visitedRegions: [...GameState.visitedRegions],
      defeatedBosses: [...GameState.defeatedBosses],
      litCampfires:   CampfireSystem.campfires.filter(c => c.lit).map(c => c.regionId),
      player: {
        x: Player.x, y: Player.y,
        health: Player.health, maxHealth: Player.maxHealth,
        stamina: Player.stamina,
        abilities: { ...Player.abilities },
        equippedRelics: Player.equippedRelics.map(r =>
          Object.keys(RELICS).find(k => RELICS[k] === r) || null
        ).filter(Boolean),
        damageBonus:     Player.damageBonus,
        dashCostMod:     Player.dashCostMod,
        staminaRegenMod: Player.staminaRegenMod,
      },
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
      return true;
    } catch(e) {
      return false;
    }
  },

  // ── Carrega um slot e aplica ao estado do jogo ────────────
  load(slotIndex) {
    const slots  = this.loadAll();
    const data   = slots[slotIndex];
    if (!data) return false;
    try {
      // GameState
      const safeRegion = Number.isInteger(data.regionId) && Regions[data.regionId] ? data.regionId : 0;
      GameState.currentRegionId = safeRegion;
      GameState.visitedRegions  = new Set(Array.isArray(data.visitedRegions) ? data.visitedRegions.filter(id => Regions[id]) : [safeRegion]);
      GameState.visitedRegions.add(safeRegion);
      GameState.defeatedBosses  = new Set(Array.isArray(data.defeatedBosses) ? data.defeatedBosses : []);
      GameState.bossMode        = false;
      GameState.bossRegionId    = null;

      // Player
      const p = data.player || {};
      const region = Regions[safeRegion];
      Player.maxHealth    = Math.max(1, Number(p.maxHealth) || 6);
      Player.health       = Math.max(1, Math.min(Player.maxHealth, Number(p.health) || Player.maxHealth));
      Player.stamina      = Math.max(0, Math.min(100, Number(p.stamina) || 0));
      Player.x            = Number.isFinite(Number(p.x)) ? Math.max(region.bounds.left, Math.min(region.bounds.right - Player.width, Number(p.x))) : 80;
      Player.y            = Number.isFinite(Number(p.y)) ? Math.max(region.bounds.top, Math.min(region.bounds.bottom - Player.height, Number(p.y))) : 760;
      Player.abilities    = { ...Player.abilities, ...(p.abilities && typeof p.abilities === 'object' ? p.abilities : {}) };
      Player.vx = 0; Player.vy = 0;
      Player.state = 'idle';
      Player.invincible = false; Player.invincibleTimer = 0;
      Player.hitBox = null;

      // Relíquias — resetar e reaplicar
      Player.equippedRelics = [];
      Player.resetStats();
      for (const key of (Array.isArray(p.equippedRelics) ? p.equippedRelics : [])) {
        if (RELICS[key]) Player.equipRelic(RELICS[key]);
      }
      // Se salvo sem relíquias, aplica bonus diretamente
      if (!Array.isArray(p.equippedRelics) || p.equippedRelics.length === 0) {
        Player.damageBonus     = p.damageBonus     || 0;
        Player.dashCostMod     = p.dashCostMod     || 0;
        Player.staminaRegenMod = p.staminaRegenMod || 0;
      }

      // Inimigos não são serializados: ao carregar, reiniciam limpos na região atual.
      for (const r of Regions) r.enemies = [];
      spawnEnemies(Regions[safeRegion]);

      if (typeof BossSystem !== 'undefined') {
        BossSystem.active = false; BossSystem.boss = null;
        BossSystem.introActive = false; BossSystem.defeatActive = false;
        BossSystem.onDefeated = null;
      }

      // Fogueiras
      CampfireSystem.reset();
      CampfireSystem.restoreFromSave(Array.isArray(data.litCampfires) ? data.litCampfires : []);

      Player.updateHurtBox();
      Input.clear();
      Camera.x = 0;
      return true;
    } catch(e) {
      console.error('Erro ao carregar save:', e);
      return false;
    }
  },

  // ── Apaga um slot ─────────────────────────────────────────
  delete(slotIndex) {
    const slots = this.loadAll();
    slots[slotIndex] = null;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
      return true;
    } catch(e) { return false; }
  },

  // ── Formata timestamp legível ─────────────────────────────
  formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  // ── Resumo de progresso para exibir no slot ───────────────
  slotSummary(data) {
    if (!data || typeof data !== 'object') return null;
    const bossNames = {
      saci:'Saci', mula:'Mula', curupira:'Curupira',
      caipora:'Caipora', ancestral:'Ancestral', boitata:'Boitatá', cuca:'Cuca',
    };
    const bosses = Array.isArray(data.defeatedBosses) ? data.defeatedBosses : [];
    const visited = Array.isArray(data.visitedRegions) ? data.visitedRegions : [];
    const player = data.player && typeof data.player === 'object' ? data.player : {};
    const defeated = bosses.map(b => bossNames[b] || b).join(', ') || 'Nenhum';
    const regionNames = REGION_PALETTES.map(p => p.name);
    return {
      region:    regionNames[data.regionId] || `Região ${Number.isInteger(data.regionId) ? data.regionId : 0}`,
      bosses:    defeated,
      explored:  Math.max(1, Math.min(Regions.length, visited.length || 1)),
      date:      this.formatDate(data.timestamp),
      health:    Math.max(0, parseInt(player.health) || 0),
      maxHealth: Math.max(1, parseInt(player.maxHealth) || 6),
    };
  },
};

// ── Tela de seleção de slots ──────────────────────────────
const SaveScreen = {
  mode: 'load',   // 'load' ou 'save'
  slots: [],
  pendingSlot: -1,
  confirmDelete: -1,
  _onSelect: null,
  _pauseBeforeOpen: false,
  _pausedByScreen: false,

  // Abre a tela para carregar ou salvar
  open(mode, onSelect) {
    this.mode       = mode;
    this.slots      = SaveSystem.loadAll();
    this._onSelect  = onSelect;
    this.confirmDelete = -1;
    this._pauseBeforeOpen = !!GameState.paused;
    this._pausedByScreen = !!GameState.started;
    if (this._pausedByScreen) {
      GameState.paused = true;
      document.body.classList.add('game-paused');
      Input.clear();
    }
    document.getElementById('saveScreen').classList.remove('hidden');
    this._render();
  },

  close() {
    document.getElementById('saveScreen').classList.add('hidden');
    if (this._pausedByScreen) {
      GameState.paused = this._pauseBeforeOpen;
      document.body.classList.toggle('game-paused', GameState.paused);
      Input.clear();
    }
    this._pausedByScreen = false;
  },

  _render() {
    const screen  = document.getElementById('saveScreen');
    const title   = this.mode === 'save' ? '💾 Salvar Jogo' : '📂 Carregar Jogo';
    const isNew   = this.mode === 'load';

    let html = `<h2 style="margin-bottom:18px;letter-spacing:2px;color:#cc99ff;text-shadow:0 0 12px #9944ff">${title}</h2>`;

    for (let i = 0; i < NUM_SLOTS; i++) {
      const data    = this.slots[i];
      const summary = SaveSystem.slotSummary(data);
      const isDel   = this.confirmDelete === i;

      html += `<div class="save-slot ${data ? 'filled' : 'empty'}" id="slot-${i}">`;
      html += `<div class="slot-header">SLOT ${i + 1}</div>`;

      if (summary) {
        const displayHealth = Math.max(0, Math.min(summary.health, summary.maxHealth));
        const displayMaxHealth = Math.max(0, summary.maxHealth);
        const hpBar = `<span style="color:#ff4444">${'♥'.repeat(displayHealth)}</span><span style="color:#333">${'♥'.repeat(displayMaxHealth - displayHealth)}</span>`;
        html += `
          <div class="slot-info">
            <span class="slot-region">📍 ${summary.region}</span>
            <span class="slot-bosses">⚔ Chefes: ${summary.bosses}</span>
            <span class="slot-explore">🗺 Regiões: ${summary.explored}/${Regions.length}</span>
            <span class="slot-hp">${hpBar}</span>
            <span class="slot-date">🕐 ${summary.date}</span>
          </div>`;
      } else {
        html += `<div class="slot-empty-label">— Vazio —</div>`;
      }

      html += `<div class="slot-buttons">`;

      if (isDel) {
        html += `
          <span style="color:#ff4444;font-size:11px">Apagar este save?</span><br>
          <button class="btn-danger"  onclick="SaveScreen._confirmDelete(${i})">Sim, apagar</button>
          <button class="btn-cancel"  onclick="SaveScreen._cancelDelete()">Cancelar</button>`;
      } else {
        if (this.mode === 'save') {
          html += `<button class="btn-primary" onclick="SaveScreen._selectSlot(${i})">${data ? 'Sobrescrever' : 'Salvar aqui'}</button>`;
        } else {
          if (data) {
            html += `<button class="btn-primary" onclick="SaveScreen._selectSlot(${i})">Carregar</button>`;
          } else {
            html += `<button class="btn-primary" onclick="SaveScreen._selectSlot(${i})">Novo Jogo</button>`;
          }
        }
        if (data) {
          html += `<button class="btn-danger btn-small" onclick="SaveScreen._askDelete(${i})">🗑</button>`;
        }
      }

      html += `</div></div>`;
    }

    html += `<button class="btn-cancel" style="margin-top:14px" onclick="SaveScreen.close()">Voltar</button>`;
    screen.innerHTML = html;
  },

  _selectSlot(i) {
    this.close();
    if (this._onSelect) this._onSelect(i, this.slots[i]);
  },

  _askDelete(i) {
    this.confirmDelete = i;
    this._render();
  },

  _cancelDelete() {
    this.confirmDelete = -1;
    this._render();
  },

  _confirmDelete(i) {
    SaveSystem.delete(i);
    this.slots = SaveSystem.loadAll();
    this.confirmDelete = -1;
    this._render();
  },
};

// ── Salvar em jogo (tecla F5 / botão no HUD) ─────────────
function quickSavePrompt() {
  if (!GameState.started || GameState.bossMode) return;
  SaveScreen.open('save', (slotIndex) => {
    const ok = SaveSystem.save(slotIndex);
    if (ok) GameState._activeSlot = slotIndex;
    showSaveFeedback(ok ? '✅ Jogo salvo!' : '❌ Erro ao salvar');
  });
}

// Feedback visual de save na tela
let _saveFeedback = null;
function showSaveFeedback(msg) {
  _saveFeedback = { msg, timer: 2.5 };
}
function updateSaveFeedback(dt) {
  if (!_saveFeedback) return;
  _saveFeedback.timer -= dt;
  if (_saveFeedback.timer <= 0) _saveFeedback = null;
}
function drawSaveFeedback(ctx) {
  if (!_saveFeedback) return;
  const alpha = Math.min(1, _saveFeedback.timer * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#cc99ff';
  ctx.shadowColor = '#9944ff'; ctx.shadowBlur = 10;
  const w = ctx.measureText(_saveFeedback.msg).width;
  ctx.fillText(_saveFeedback.msg, ctx.canvas.width/2 - w/2, 30);
  ctx.shadowBlur = 0; ctx.restore();
}
