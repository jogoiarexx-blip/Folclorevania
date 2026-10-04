// ============================================================
// js/main.js
// Ponto de entrada: init, update, render, portas, chefes e fluxo de UI
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d', { alpha:false });
canvas.width  = 1600;
canvas.height = 900;

document.body.classList.add('game-menu');

// Preferências visuais persistentes (não afetam a lógica do jogo)
const SETTINGS_KEY = 'folclorevania_settings_v21';
const GameSettings = {
  quality: 'high',
  ambientFx: true,
  screenShake: true,
  hud: true,
};

function loadGameSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (['high','medium','low'].includes(saved.quality)) GameSettings.quality = saved.quality;
    if (typeof saved.ambientFx === 'boolean') GameSettings.ambientFx = saved.ambientFx;
    if (typeof saved.screenShake === 'boolean') GameSettings.screenShake = saved.screenShake;
    if (typeof saved.hud === 'boolean') GameSettings.hud = saved.hud;
  } catch (_) {}
  applyGameSettingsToUI();
}
function saveGameSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(GameSettings)); } catch (_) {}
}
function applyGameSettingsToUI() {
  const q=document.getElementById('graphicsQuality'); if(q) q.value=GameSettings.quality;
  const a=document.getElementById('ambientFxToggle'); if(a) a.checked=GameSettings.ambientFx;
  const s=document.getElementById('screenShakeToggle'); if(s) s.checked=GameSettings.screenShake;
  const h=document.getElementById('hudToggle'); if(h) h.checked=GameSettings.hud;
  ctx.imageSmoothingEnabled = GameSettings.quality !== 'low';
}
function updateGameSetting(key, value) {
  if (!(key in GameSettings)) return;
  GameSettings[key] = value;
  saveGameSettings();
  applyGameSettingsToUI();
}
function resetGameSettings() {
  Object.assign(GameSettings,{quality:'high',ambientFx:true,screenShake:true,hud:true});
  saveGameSettings(); applyGameSettingsToUI();
}
let _optionsOrigin = 'menu';
function openOptions(origin='menu') {
  _optionsOrigin = origin;
  applyGameSettingsToUI();
  if (origin === 'pause') document.getElementById('pauseMenu').classList.add('hidden');
  else document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('optionsScreen').classList.remove('hidden');
}
function closeOptions() {
  document.getElementById('optionsScreen').classList.add('hidden');
  if (_optionsOrigin === 'pause' && GameState.started) document.getElementById('pauseMenu').classList.remove('hidden');
  else document.getElementById('mainMenu').classList.remove('hidden');
}
loadGameSettings();

const GameState = {
  started:          false,
  paused:           false,
  currentRegionId:  0,
  visitedRegions:   new Set([0]),
  showMinimap:      true,
  bossMode:         false,
  bossRegionId:     null,
  defeatedBosses:   new Set(),
  playerDead:       false,
  deathTimer:       0,
  _deathTransitionStarted:false,
  shakeTimer:        0,
  shakePower:        0,
  regionTitleTimer:  2.8,
};

function triggerScreenShake(power=5, duration=0.16) {
  if (!GameSettings.screenShake) return;
  GameState.shakePower = Math.max(GameState.shakePower, power);
  GameState.shakeTimer = Math.max(GameState.shakeTimer, duration);
}

let _streamUiRaf = 0;
function _refreshStreamLoadingUI() {
  const screen = document.getElementById('streamLoadingScreen');
  if (!screen || screen.classList.contains('hidden')) { _streamUiRaf = 0; return; }
  const title = document.getElementById('streamLoadingTitle');
  const bar = document.getElementById('streamLoadingBar');
  const status = document.getElementById('streamLoadingStatus');
  const windowInfo = document.getElementById('streamLoadedWindow');
  const pct = Math.round(Math.max(0, Math.min(1, RegionStream.progress || 0)) * 100);
  if (title) title.textContent = RegionStream.label || 'Preparando região...';
  if (bar) bar.style.width = pct + '%';
  if (status) status.textContent = pct + '% • carregamento real dos assets';
  if (windowInfo) {
    const ids = RegionStream.loadedIds();
    const names = ids.map(id => REGION_ASSET_MANIFEST[id]?.name || ('Região '+id));
    windowInfo.textContent = names.length ? 'Na memória: ' + names.join(' • ') : 'Preparando primeiro pacote visual...';
  }
  _streamUiRaf = requestAnimationFrame(_refreshStreamLoadingUI);
}
function showStreamLoading(label='Preparando região...') {
  const screen = document.getElementById('streamLoadingScreen');
  if (!screen) return;
  RegionStream.label = label;
  screen.classList.remove('hidden');
  if (!_streamUiRaf) _streamUiRaf = requestAnimationFrame(_refreshStreamLoadingUI);
}
function hideStreamLoading() {
  const screen = document.getElementById('streamLoadingScreen');
  if (screen) screen.classList.add('hidden');
}

// ── Init ──────────────────────────────────────────────────
async function _beginSlot(slotIndex, data) {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('creditsScreen').classList.add('hidden');
  document.body.classList.remove('game-menu');

  _initEngine();
  const requestedRegion = data && Number.isInteger(data.regionId) ? data.regionId : 0;
  const safeRegion = Math.max(0, Math.min(Regions.length - 1, requestedRegion));
  showStreamLoading(`Carregando ${REGION_ASSET_MANIFEST[safeRegion].name}`);
  await RegionStream.prepareInitial(safeRegion);

  if (data) {
    const ok = SaveSystem.load(slotIndex);
    if (!ok) _freshStart();
  } else {
    _freshStart();
    SaveSystem.save(slotIndex);
  }

  RegionStream.focus(GameState.currentRegionId);
  GameState._activeSlot = slotIndex;
  GameState.started = true;
  GameState.paused = false;
  GameState.playerDead = false;
  GameState.regionTitleTimer = 2.8;
  document.body.classList.remove('game-paused');
  Input.clear();
  hideStreamLoading();
  startGameLoop();
}

function openLoadScreen() {
  SaveScreen.open('load', (slotIndex, data) => _beginSlot(slotIndex, data));
}

function continueLatestGame() {
  const slots=SaveSystem.loadAll();
  let best=-1,bestTime=-1;
  slots.forEach((data,i)=>{ if(data && Number(data.timestamp)>bestTime){best=i;bestTime=Number(data.timestamp)||0;} });
  if(best<0){ openLoadScreen(); return; }
  _beginSlot(best, slots[best]);
}

function _initEngine() {
  if (!GameState._engineReady) {
    Input.init();
    CampfireSystem.init();
    GameState._engineReady = true;
  }
}

function _freshStart() {
  _initEngine();
  GameState.currentRegionId = 0;
  GameState.visitedRegions  = new Set([0]);
  GameState.defeatedBosses  = new Set();
  GameState.bossMode        = false;
  GameState.bossRegionId    = null;
  GameState.playerDead      = false;
  GameState.deathTimer      = 0;
  GameState._deathTransitionStarted = false;
  if (typeof BossSystem !== 'undefined') { BossSystem.active=false; BossSystem.boss=null; BossSystem.introActive=false; BossSystem.defeatActive=false; }

  Player.health    = Player.maxHealth = 6;
  Player.stamina   = 100;
  Player.x = 80; Player.y = 760;
  Player.vx = 0; Player.vy = 0;
  Player.state = 'idle';
  Player.invincible = false;
  Player.invincibleTimer = 0;
  Player.equippedRelics = [];
  Player.resetStats();
  Player.abilities = { dash:true, doubleJump:false, charge:false, special:false, _confused:false };
  Player.hitBox = null; Player._hitSpec = null;
  Player.coyoteTimer = 0; Player.jumpBufferTimer = 0;
  Player.updateHurtBox();
  Camera.x = 0;
  Input.clear();
  CampfireSystem.reset();
  for (const r of Regions) r.enemies = [];
  spawnEnemies(Regions[0]);
}

function startGame() { openLoadScreen(); }

function showCredits() {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('creditsScreen').classList.remove('hidden');
}
function backToMenu() {
  document.getElementById('creditsScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('optionsScreen').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

function togglePause() {
  if (!GameState.started || GameState.playerDead) return;
  const saveScreen = document.getElementById('saveScreen');
  if (!saveScreen.classList.contains('hidden')) return;

  GameState.paused = !GameState.paused;
  if (GameState.paused) {
    const pr=document.getElementById('pauseRegion');
    if (pr) pr.textContent = REGION_PALETTES[GameState.currentRegionId].name + '  •  ' + GameState.visitedRegions.size + '/' + Regions.length + ' regiões';
  }
  document.getElementById('pauseMenu').classList.toggle('hidden', !GameState.paused);
  document.body.classList.toggle('game-paused', GameState.paused);
  Input.clear();
}

function resumeGame() {
  if (!GameState.started) return;
  GameState.paused = false;
  document.getElementById('pauseMenu').classList.add('hidden');
  document.body.classList.remove('game-paused');
  Input.clear();
}

function returnToTitle() {
  GameState.started = false;
  GameState.paused = false;
  GameState.playerDead = false;
  GameState.bossMode = false;
  Input.clear();
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('saveScreen').classList.add('hidden');
  document.getElementById('creditsScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('optionsScreen').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  document.body.classList.remove('game-paused');
  document.body.classList.add('game-menu');
  RegionStream.reset();
}

function showEnding() {
  const explored = Math.round((GameState.visitedRegions.size / Regions.length) * 100);
  const bosses = GameState.defeatedBosses.size;
  document.getElementById('endingStats').innerHTML =
    `<b>${bosses}/${Object.keys(BOSS_TRIGGERS).length}</b> chefes derrotados &nbsp;•&nbsp; <b>${explored}%</b> do mapa explorado`;
  GameState.paused = true;
  document.body.classList.add('game-paused');
  document.getElementById('endingScreen').classList.remove('hidden');
  Input.clear();
}

function continueAfterEnding() {
  document.getElementById('endingScreen').classList.add('hidden');
  GameState.paused = false;
  document.body.classList.remove('game-paused');
  Input.clear();
}

window.addEventListener('keydown', e => {
  if (e.repeat && ['KeyM','KeyH','Escape','KeyP','KeyF'].includes(e.code)) return;

  if (e.code === 'Escape' && !document.getElementById('optionsScreen').classList.contains('hidden')) {
    e.preventDefault(); closeOptions(); return;
  }

  if (e.code === 'KeyF') {
    e.preventDefault();
    toggleFullscreen();
    return;
  }

  if ((e.code === 'Escape' || e.code === 'KeyP') && GameState.started) {
    e.preventDefault();
    togglePause();
    return;
  }

  if (e.code === 'KeyM' && GameState.started) {
    e.preventDefault();
    GameState.showMinimap = !GameState.showMinimap;
  }

  if (e.code === 'KeyH' && GameState.started) {
    e.preventDefault();
    GameSettings.hud = !GameSettings.hud;
    saveGameSettings(); applyGameSettingsToUI();
  }

  if (e.code === 'F5') {
    if (GameState.started) e.preventDefault();
    if (GameState.started && !GameState.bossMode && !GameState.playerDead) quickSavePrompt();
  }

  if (e.code === 'F9') {
    if (GameState.started) e.preventDefault();
    if (GameState.started && !GameState.bossMode && !GameState.playerDead) {
      SaveScreen.open('load', (slotIndex, data) => {
        if (data) {
          Transition.start(async () => {
            const target = Number.isInteger(data.regionId) ? data.regionId : 0;
            await RegionStream.prepareTransition(target);
            SaveSystem.load(slotIndex);
            RegionStream.focus(GameState.currentRegionId);
            GameState._activeSlot = slotIndex;
            showSaveFeedback('📂 Jogo carregado!');
          }, { loadingText:'Carregando save e assets da região' });
        }
      });
    }
  }
});

// ── Unlock pós-chefe ──────────────────────────────────────
const BOSS_UNLOCKS = {
  saci:     'doubleJump',
  mula:     'charge',
  curupira: 'special',
  caipora:   null,
  ancestral: null,
  boitata:   null,
  cuca:      null,
};
const BOSS_SPAWN_AFTER = {
  saci:     { x:1440, y:760 },
  mula:     { x:1440, y:760 },
  curupira: { x:1440, y:760 },
  caipora:  { x:1440, y:760 },
  ancestral:{ x:1440, y:760 },
  boitata:  { x:1440, y:760 },
  cuca:     { x:780,  y:760 },
};

function onBossDefeated(bossId) {
  GameState.bossMode = false;
  GameState.currentRegionId = GameState.bossRegionId;
  GameState.defeatedBosses.add(bossId);
  const ability = BOSS_UNLOCKS[bossId];
  if (ability) Player.unlockAbility(ability);
  const spawn = BOSS_SPAWN_AFTER[bossId] || { x:100, y:300 };
  Transition.start(() => {
    Player.x  = spawn.x; Player.y = spawn.y;
    Player.vx = 0;       Player.vy = 0;
    Player.updateHurtBox();
    Camera.x  = 0;
    if (GameState._activeSlot !== undefined) {
      SaveSystem.save(GameState._activeSlot);
      showSaveFeedback('✅ Progresso salvo!');
    }
    if (bossId === 'cuca') showEnding();
  });
}

// ── Entrar na sala do chefe ───────────────────────────────
function tryEnterBossRoom() {
  if (GameState.bossMode || Transition.active) return;
  const rid = GameState.currentRegionId;
  const trig = BOSS_TRIGGERS[rid];
  if (!trig || GameState.defeatedBosses.has(trig.bossId)) return;

  if (
    Player.x + Player.width  > trig.x && Player.x < trig.x + trig.w &&
    Player.y + Player.height > trig.y && Player.y < trig.y + trig.h
  ) {
    Transition.start(() => {
      GameState.bossMode     = true;
      GameState.bossRegionId = rid;
      Player.x = 80; Player.y = 760;
      Player.vx = 0; Player.vy = 0;
      Player.updateHurtBox();
      Camera.x = 0;
      BossSystem.start(trig.bossId, BOSS_ROOMS[trig.bossId], onBossDefeated);
    });
  }
}

function doorReqMet(req) {
  if (!req) return true;
  if (req.startsWith('boss:')) return GameState.defeatedBosses.has(req.slice(5));
  return !!Player.abilities[req];
}

function checkDoors() {
  if (Transition.active || GameState.bossMode) return;
  const region = Regions[GameState.currentRegionId];
  for (const door of region.doors) {
    const t = door.trigger;
    if (
      Player.x + Player.width  > t.x && Player.x < t.x + t.w &&
      Player.y + Player.height > t.y && Player.y < t.y + t.h
    ) {
      if (!doorReqMet(door.req)) return;
      Transition.start(async () => {
        await RegionStream.prepareTransition(door.to);
        GameState.currentRegionId = door.to;
        GameState.visitedRegions.add(door.to);
        GameState.regionTitleTimer = 2.8;
        Player.x = door.spawnX; Player.y = door.spawnY;
        Player.vx = 0; Player.vy = 0;
        Player.updateHurtBox();
        Camera.x = 0;
        if (Regions[door.to].enemies.length === 0) spawnEnemies(Regions[door.to]);
        RegionStream.focus(door.to);
      }, { loadingText: `Abrindo ${REGION_ASSET_MANIFEST[door.to].name}` });
      return;
    }
  }
}

function getCurrentRegionForPhysics() {
  if (GameState.bossMode) {
    return {
      solidTiles: BOSS_ROOMS[BossSystem.boss ? BossSystem.boss.id : 'saci'],
      oneWayTiles: [],
      bounds: { left:0, right:1600, top:0, bottom:900 },
    };
  }
  return Regions[GameState.currentRegionId];
}

// ── Morte / respawn ───────────────────────────────────────
function _startPlayerDeath() {
  if (GameState.playerDead) return;
  GameState.playerDead = true;
  GameState.deathTimer = 0.7;
  GameState._deathTransitionStarted = false;
  Player.health = 0;
  Player.vx = 0; Player.vy = 0;
  Player.clearHit();
  Input.clear();
  Particles.death(Player.x + Player.width/2, Player.y + Player.height/2, '#c36cff');
}

function _updatePlayerDeath(dt) {
  GameState.deathTimer -= dt;
  MapSystem.update(dt);
  Particles.update(dt);
  Transition.update(dt);
  updateSaveFeedback(dt);

  if (GameState.deathTimer <= 0 && !GameState._deathTransitionStarted) {
    GameState._deathTransitionStarted = true;
    Transition.start(async () => {
      let restored = false;
      if (GameState._activeSlot !== undefined) {
        const slot = SaveSystem.loadAll()[GameState._activeSlot];
        const target = slot && Number.isInteger(slot.regionId) ? slot.regionId : 0;
        await RegionStream.prepareTransition(target);
        restored = SaveSystem.load(GameState._activeSlot);
      }
      if (!restored) {
        await RegionStream.prepareTransition(0);
        _freshStart();
      }
      RegionStream.focus(GameState.currentRegionId);
      GameState.playerDead = false;
      GameState.deathTimer = 0;
      GameState._deathTransitionStarted = false;
      showSaveFeedback('🕯 Você retornou ao último save');
    }, { loadingText:'Retornando ao último ponto salvo' });
  }
}

// ── Update ────────────────────────────────────────────────
function update(dt) {
  if (GameState.playerDead) {
    _updatePlayerDeath(dt);
    return;
  }

  // Transições congelam a simulação. Durante um loading real o jogador e os
  // inimigos não continuam se movendo/levando dano atrás da tela preta.
  if (Transition.active) {
    MapSystem.update(dt);
    Particles.update(dt);
    Transition.update(dt);
    updateSaveFeedback(dt);
    return;
  }

  const region = getCurrentRegionForPhysics();
  Player.update(dt, region, GameState.bossMode ? [] : Regions[GameState.currentRegionId].enemies);

  if (GameState.bossMode) {
    BossSystem.update(dt);
  } else {
    for (const e of Regions[GameState.currentRegionId].enemies) e.update(dt, region, Player);
    tryEnterBossRoom();
    checkDoors();

    const cfResult = CampfireSystem.update(dt, GameState.currentRegionId, Player);
    if (cfResult === 'save' && GameState._activeSlot !== undefined) {
      CampfireSystem.lightInRegion(GameState.currentRegionId);
      SaveSystem.save(GameState._activeSlot);
      showSaveFeedback('🔥 Jogo salvo na fogueira!');
    }
  }

  if (Player.health <= 0) _startPlayerDeath();

  MapSystem.update(dt);
  Particles.update(dt);
  if (GameState.shakeTimer > 0) {
    GameState.shakeTimer = Math.max(0, GameState.shakeTimer - dt);
    if (GameState.shakeTimer === 0) GameState.shakePower = 0;
  }
  if (GameState.regionTitleTimer > 0) GameState.regionTitleTimer = Math.max(0, GameState.regionTitleTimer - dt);
  Camera.follow(Player, GameState.bossMode ? 1600 : Regions[GameState.currentRegionId].width, canvas.width);
  Transition.update(dt);
  updateSaveFeedback(dt);
}

// ── Render ────────────────────────────────────────────────
function render() {
  const rid = GameState.currentRegionId;
  const pal = REGION_PALETTES[rid];
  const shakeActive = GameSettings.screenShake && GameState.shakeTimer > 0;
  const shakeX = shakeActive ? (Math.random()-0.5)*GameState.shakePower*2 : 0;
  const shakeY = shakeActive ? (Math.random()-0.5)*GameState.shakePower*1.4 : 0;

  ctx.save();
  if (shakeActive) ctx.translate(shakeX, shakeY);
  MapSystem.drawBackground(ctx, pal, rid);

  if (GameState.bossMode) {
    const fakeRegion = {
      solidTiles: BOSS_ROOMS[BossSystem.boss ? BossSystem.boss.id : 'saci'],
      oneWayTiles: [], palette:pal, doors:[], id:rid,
    };
    MapSystem.drawTiles(ctx, fakeRegion);
    ctx.save();
    const gateGlow = 0.45 + Math.sin(MapSystem._time*4)*0.2;
    ctx.fillStyle = `rgba(90,0,20,${gateGlow})`;
    ctx.fillRect(0, 100, 40, 700);
    ctx.fillRect(canvas.width - 40, 100, 40, 700);
    ctx.strokeStyle='#ff3f62'; ctx.lineWidth=2; ctx.shadowColor='#ff224f'; ctx.shadowBlur=12;
    ctx.strokeRect(10,120,20,660); ctx.strokeRect(canvas.width-30,120,20,660);
    ctx.restore();
  } else {
    const region = Regions[rid];
    MapSystem.drawTiles(ctx, region);
    MapSystem.drawDoors(ctx, region);
    CampfireSystem.draw(ctx, rid);

    const trig = BOSS_TRIGGERS[rid];
    if (trig && !GameState.defeatedBosses.has(trig.bossId)) {
      const sx = trig.x - Camera.x;
      ctx.save();
      const pulse = 0.18 + (0.5 + Math.sin(MapSystem._time * 4)*0.5)*0.18;
      const portalGrad=ctx.createLinearGradient(sx,0,sx+trig.w,0);
      portalGrad.addColorStop(0,'rgba(120,0,180,0)'); portalGrad.addColorStop(.5,`rgba(177,55,255,${pulse})`); portalGrad.addColorStop(1,'rgba(120,0,180,0)');
      ctx.fillStyle=portalGrad; ctx.fillRect(sx,trig.y,trig.w,trig.h);
      ctx.strokeStyle='rgba(220,150,255,.6)'; ctx.lineWidth=2; ctx.shadowColor='#b02cff';ctx.shadowBlur=18;
      ctx.beginPath();ctx.ellipse(sx+trig.w/2,trig.y+trig.h/2,28,trig.h*.34,0,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0; ctx.font='bold 10px monospace';ctx.fillStyle='#efc8ff';ctx.textAlign='center';ctx.fillText('PORTAL DA ENTIDADE',sx+trig.w/2,trig.y+trig.h/2+4);
      ctx.restore();
    }
  }

  Particles.draw(ctx);
  if (GameState.bossMode) BossSystem.draw(ctx);
  else for (const e of Regions[rid].enemies) e.draw(ctx);
  Player.draw(ctx);
  if (GameSettings.ambientFx) MapSystem.drawForeground(ctx, pal, rid);
  MapSystem.drawFog(ctx, pal);
  ctx.restore();

  if (GameSettings.hud) HUD.draw(ctx, pal.name, GameState.visitedRegions, GameState.showMinimap);
  BossHUD.draw(ctx);
  Transition.draw(ctx);
  drawSaveFeedback(ctx);
  if (GameState.playerDead) drawDeathOverlay(ctx);
}

function drawDeathOverlay(ctx) {
  ctx.save();
  const alpha = Math.min(0.72, 0.28 + (0.7 - Math.max(0, GameState.deathTimer)) * 0.6);
  ctx.fillStyle = `rgba(5,0,10,${alpha})`;
  ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.textAlign='center';
  ctx.font='bold 28px monospace';
  ctx.fillStyle='#e0bdff';
  ctx.shadowColor='#9d44ff'; ctx.shadowBlur=18;
  ctx.fillText('VOCÊ CAIU', ctx.canvas.width/2, ctx.canvas.height/2 - 8);
  ctx.shadowBlur=0;
  ctx.font='12px monospace'; ctx.fillStyle='#9b87ad';
  ctx.fillText('Retornando ao último ponto salvo...', ctx.canvas.width/2, ctx.canvas.height/2 + 24);
  ctx.restore();
}
