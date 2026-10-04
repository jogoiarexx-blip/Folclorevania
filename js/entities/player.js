// ============================================================
// js/entities/player.js
// ============================================================

const Player = {
  x: 80, y: 760,
  width: 30, height: 46,
  vx: 0, vy: 0,
  gravity: 0.55,
  jumpForce: -12.5,
  speed: 3.2,
  dashSpeed: 7.5,
  chargeSpeed: 9,
  onGround: false,
  wasOnGround: false,
  facing: 1,

  baseDamage: 1, baseDashCost: 20, baseStaminaRegen: 0.4,
  damageBonus: 0, dashCostMod: 0, staminaRegenMod: 0,

  health: 6, maxHealth: 6,
  stamina: 100,
  invincible: false, invincibleTimer: 0,

  dashTimer: 0,
  attackTimer: 0,
  chargeTimer: 0,
  specialTimer: 0,
  specialCooldown: 0,
  knockbackTimer: 0,

  // Controles de plataforma: pulo duplo + tolerância de borda/buffer.
  jumpsLeft: 0,
  _wasOnGroundForJump: false,
  coyoteDuration: 0.10,
  coyoteTimer: 0,
  jumpBufferDuration: 0.12,
  jumpBufferTimer: 0,

  state: 'idle',
  equippedRelics: [],

  abilities: {
    dash:        true,
    doubleJump:  false,
    charge:      false,
    special:     false,
    _confused:   false,  // flag temporária do Curupira
  },

  hurtBox: { x:80, y:760, width:30, height:46 },
  hitBox: null,
  _hitSpec: null,

  // ── stats ────────────────────────────────────────────────
  resetStats() { this.damageBonus=0; this.dashCostMod=0; this.staminaRegenMod=0; },
  equipRelic(r) {
    if (this.equippedRelics.length >= 3) return false;
    this.equippedRelics.push(r); r.apply(this); return true;
  },
  getDamage()   { return this.baseDamage + this.damageBonus; },
  getDashCost() { return Math.max(5, this.baseDashCost - this.dashCostMod); },

  unlockAbility(name) {
    if (Object.prototype.hasOwnProperty.call(this.abilities, name)) {
      this.abilities[name] = true;
      Particles.special(this.x, this.y);
    }
  },

  // ── dano ─────────────────────────────────────────────────
  takeDamage(n, sourceX) {
    if (this.invincible || this.state === 'dash') return;
    this.health = Math.max(0, this.health - n);
    this.invincible      = true;
    this.invincibleTimer = 0.9;
    const dir = (sourceX !== undefined && sourceX < this.x) ? 1 : -1;
    this.vx = dir * 5;
    this.vy = -4;
    this.knockbackTimer = 0.18;
    this.state = 'hurt';
    Particles.playerHit(this.x, this.y);
    if (typeof triggerScreenShake === 'function') triggerScreenShake(5, 0.16);
  },

  setHit(ox, oy, w, h) {
    this._hitSpec = { ox, oy, w, h };
    this._syncHitBox();
  },
  _syncHitBox() {
    if (!this._hitSpec) return;
    const h=this._hitSpec;
    this.hitBox = { x:this.x+h.ox, y:this.y+h.oy, width:h.w, height:h.h };
  },
  clearHit() { this.hitBox = null; this._hitSpec = null; },
  updateHurtBox() { this.hurtBox.x = this.x; this.hurtBox.y = this.y; },

  // ── input ────────────────────────────────────────────────
  handleInput() {
    if (this.state === 'hurt') return;
    const i = Input;
    const right = i.downAny('ArrowRight','KeyD');
    const left  = i.downAny('ArrowLeft','KeyA');
    const dashPressed = i.jpAny('ShiftLeft','ShiftRight');
    if (i.jpAny('Space','KeyW','ArrowUp')) this.jumpBufferTimer = this.jumpBufferDuration;

    switch (this.state) {
      case 'idle':
      case 'run':
        if (right)     { this.vx= this.speed;  this.facing= 1;  this.state='run'; }
        else if (left) { this.vx=-this.speed;  this.facing=-1;  this.state='run'; }
        else { this.vx=0; this.state='idle'; }

        if (this.jumpBufferTimer > 0 && (this.onGround || this.coyoteTimer > 0)) {
          this.vy = this.jumpForce; this.onGround = false; this.state = 'jump';
          this.jumpsLeft = this.abilities.doubleJump ? 1 : 0;
          this._wasOnGroundForJump = false;
          this.jumpBufferTimer = 0; this.coyoteTimer = 0;
        }
        if (dashPressed && this.abilities.dash && this.stamina >= this.getDashCost()) this.startDash();
        if (i.jp('KeyZ')) this.startAttack();
        if (i.jp('KeyX') && this.abilities.charge && this.stamina >= 15) this.startCharge();
        if (i.jp('KeyC') && this.abilities.special && this.specialCooldown <= 0) this.startSpecial();
        break;

      case 'jump':
        if (right)     { this.vx= this.speed;  this.facing= 1; }
        else if (left) { this.vx=-this.speed;  this.facing=-1; }
        else this.vx = 0;

        // Coyote time primeiro; depois, se disponível, pulo duplo.
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
          this.vy = this.jumpForce; this.jumpBufferTimer = 0; this.coyoteTimer = 0;
        } else if (this.jumpBufferTimer > 0 && this.abilities.doubleJump && this.jumpsLeft > 0) {
          this.vy = this.jumpForce * 0.88;
          this.jumpsLeft--; this.jumpBufferTimer = 0;
          Particles.doubleJump(this.x, this.y);
        }

        if (this.onGround) this.state = 'idle';
        if (dashPressed && this.abilities.dash && this.stamina >= this.getDashCost()) this.startDash();
        if (i.jp('KeyZ')) this.startAttack();
        if (i.jp('KeyC') && this.abilities.special && this.specialCooldown <= 0) this.startSpecial();
        break;

      case 'dash':
        this.vx = this.facing * this.dashSpeed;
        Particles.dash(this.x, this.y, this.facing);
        break;

      case 'attack':
        this.vx = 0;
        break;

      case 'charge':
        this.vx = this.facing * this.chargeSpeed;
        Particles.charge(this.x, this.y, this.facing);
        break;

      case 'special':
        this.vx = 0;
        break;
    }
  },

  startDash() {
    this.stamina -= this.getDashCost();
    this.invincible = true;
    this.dashTimer  = 0.18;
    this.vx = this.facing * this.dashSpeed;
    this.state = 'dash';
    Particles.dash(this.x, this.y, this.facing);
  },

  startAttack() {
    this.attackTimer = 0.25;
    this.vx = 0;
    const ox = this.facing > 0 ? this.width : -36;
    this.setHit(ox, 8, 36, 28);
    this.state = 'attack';
  },

  startCharge() {
    this.stamina    -= 15;
    this.chargeTimer = 0.32;
    this.invincible  = true;
    this.vx = this.facing * this.chargeSpeed;
    const ox = this.facing > 0 ? this.width : -this.width - 6;
    this.setHit(ox, 4, this.width + 6, this.height - 8);
    this.state = 'charge';
    Particles.charge(this.x, this.y, this.facing);
  },

  startSpecial() {
    this.specialTimer    = 0.4;
    this.specialCooldown = 8.0;
    this.setHit(-50, -20, this.width + 100, this.height + 40);
    this.state = 'special';
    Particles.special(this.x, this.y);
  },

  // ── update ───────────────────────────────────────────────
  update(dt, region, enemies) {
    this.wasOnGround = this.onGround;
    if (this.onGround) this.coyoteTimer = this.coyoteDuration;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    this.handleInput();

    // BUG 8 FIX: confusão do Curupira inverte vx aqui, nunca mexe em Input.keys
    if (this.abilities._confused) this.vx = -this.vx;

    resolvePhysics(this, region);
    this.updateHurtBox();
    this._syncHitBox();

    // BUG 9 FIX: ao sair do chão sem pular (cair de borda), entra no estado jump
    // e garante jumpsLeft correto
    if (this.wasOnGround && !this.onGround && (this.state === 'idle' || this.state === 'run')) {
      this.state = 'jump';
      this.jumpsLeft = this.abilities.doubleJump ? 1 : 0;
    }

    // BUG 6 FIX: reseta onGround=false durante dash/charge para não ficar travado
    if (this.state === 'dash' || this.state === 'charge') {
      // onGround só é true se physics acabou de detectar chão neste frame
      // já está correto pelo resolvePhysics — não forçar aqui
    }

    // Altura variável: soltar o botão cedo encurta o salto.
    if (this.state === 'jump' && this.vy < -5 && !Input.downAny('Space','KeyW','ArrowUp')) this.vy *= 0.55;

    // aterrissagem
    if (!this.wasOnGround && this.onGround) {
      Particles.land(this.x, this.y + this.height);
      if (this.state === 'jump') this.state = 'idle';
    }

    // stamina regen
    if (this.stamina < 100)
      this.stamina = Math.min(100, this.stamina + (this.baseStaminaRegen + this.staminaRegenMod) * dt * 60);

    if (this.specialCooldown > 0) this.specialCooldown -= dt;

    // timers
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) { this.invincible = false; this.invincibleTimer = 0; }
    }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      if (this.knockbackTimer <= 0) { this.knockbackTimer = 0; if (this.state === 'hurt') this.state = 'idle'; }
    }
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.dashTimer = 0; this.invincible = false;
        if (this.state === 'dash') this.state = this.onGround ? 'idle' : 'jump';
      }
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) { this.clearHit(); if (this.state === 'attack') this.state = 'idle'; }
    }
    if (this.chargeTimer > 0) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.chargeTimer = 0; this.invincible = false; this.clearHit();
        if (this.state === 'charge') this.state = this.onGround ? 'idle' : 'jump';
      }
    }
    if (this.specialTimer > 0) {
      this.specialTimer -= dt;
      if (this.specialTimer <= 0) {
        this.specialTimer = 0; this.clearHit();
        if (this.state === 'special') this.state = 'idle';
      }
    }

    // acertos em inimigos
    if (this.hitBox) {
      let hitAny = false;
      for (const e of enemies) {
        if (e.health > 0 && boxHits(this.hitBox, e.hurtBox)) {
          e.takeDamage(this.getDamage(), this.x + this.width / 2);
          Particles.impact((this.x + e.x) / 2, (this.y + e.y) / 2 + 10, this.facing);
          if (this.state === 'special' && this.health < this.maxHealth)
            this.health = Math.min(this.maxHealth, this.health + 1);
          hitAny = true;
        }
      }
      // acerto no boss (Saci, Mula sem Cabeça, Curupira)
      if (typeof BossSystem !== 'undefined' && BossSystem.boss && BossSystem.boss.health > 0) {
        const boss = BossSystem.boss;
        if (boxHits(this.hitBox, boss.hurtBox)) {
          boss.takeDamage(this.getDamage(), this.x + this.width / 2);
          Particles.impact((this.x + boss.x) / 2, (this.y + boss.y) / 2 + 10, this.facing);
          if (this.state === 'special' && this.health < this.maxHealth)
            this.health = Math.min(this.maxHealth, this.health + 1);
          hitAny = true;
        }
      }
      if (hitAny && this.state !== 'special' && this.state !== 'charge')
        this.clearHit();
    }
  },

  // ── render ───────────────────────────────────────────────
  draw(ctx) {
    const sx=this.x-Camera.x,sy=this.y,w=this.width,h=this.height,st=this.state;
    const time=(typeof MapSystem!=='undefined'?MapSystem._time:Date.now()/1000);
    const runBob=st==='run'?Math.sin(time*15)*1.6:0;
    const step=st==='run'?Math.sin(time*15):0;
    const dir=this.facing;

    ctx.save();
    if(this.invincible && st!=='dash' && st!=='charge') ctx.globalAlpha=(Math.floor(Date.now()/75)%2===0)?.38:1;

    // sombra no chão
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(sx+w/2,sy+h+5,17,4,0,0,Math.PI*2);ctx.fill();

    // rastro de ações rápidas
    if(st==='dash'||st==='charge'){
      const color=st==='dash'?'#37dfff':'#ff8a2a';
      ctx.globalAlpha=.14;ctx.fillStyle=color;
      for(let i=1;i<=3;i++){ctx.beginPath();ctx.ellipse(sx+w/2-dir*i*15,sy+h*.55,13-i*2,21-i*3,0,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;
    }

    // capa com movimento
    const capeColor=st==='dash'?'#0a729d':st==='charge'?'#9d3d0a':st==='special'?'#6f2399':st==='hurt'?'#6f1724':'#681a28';
    const capeWave=Math.sin(time*7)*3 + (st==='run'?dir*-4:0);
    ctx.fillStyle=capeColor;ctx.strokeStyle='rgba(255,180,200,.12)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sx+w*.28,sy+15+runBob);ctx.quadraticCurveTo(sx-dir*8,sy+31+capeWave,sx-dir*12,sy+h+2);ctx.quadraticCurveTo(sx+w*.5,sy+h-2,sx+w*.72,sy+16+runBob);ctx.closePath();ctx.fill();ctx.stroke();

    // pernas e botas
    ctx.strokeStyle='#2a1d22';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(sx+w*.4,sy+h*.72+runBob);ctx.lineTo(sx+w*.37-step*3,sy+h-3);ctx.moveTo(sx+w*.62,sy+h*.72+runBob);ctx.lineTo(sx+w*.65+step*3,sy+h-3);ctx.stroke();
    ctx.strokeStyle='#0e0c10';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(sx+w*.3-step*3,sy+h-2);ctx.lineTo(sx+w*.43-step*3,sy+h-2);ctx.moveTo(sx+w*.58+step*3,sy+h-2);ctx.lineTo(sx+w*.74+step*3,sy+h-2);ctx.stroke();

    // torso / túnica
    const bodyG=ctx.createLinearGradient(sx,sy+15,sx,sy+h);
    if(st==='dash'){bodyG.addColorStop(0,'#59ebff');bodyG.addColorStop(1,'#12507e');}
    else if(st==='attack'){bodyG.addColorStop(0,'#efd07a');bodyG.addColorStop(1,'#8d5a24');}
    else if(st==='charge'){bodyG.addColorStop(0,'#ff9c42');bodyG.addColorStop(1,'#7f2713');}
    else if(st==='special'){bodyG.addColorStop(0,'#dda0ff');bodyG.addColorStop(1,'#54236e');}
    else if(st==='hurt'){bodyG.addColorStop(0,'#ff818d');bodyG.addColorStop(1,'#701d2a');}
    else{bodyG.addColorStop(0,'#d8bd74');bodyG.addColorStop(.55,'#9b6a32');bodyG.addColorStop(1,'#5e3d21');}
    ctx.fillStyle=bodyG;ctx.beginPath();ctx.roundRect(sx+6,sy+17+runBob,w-12,h*.55,5);ctx.fill();
    // faixa
    ctx.fillStyle='#552235';ctx.fillRect(sx+5,sy+34+runBob,w-10,5);ctx.fillStyle='#bf7f50';ctx.fillRect(sx+w*.47,sy+34+runBob,3,5);

    // pescoço + cabeça
    ctx.fillStyle='#c89867';ctx.fillRect(sx+w*.43,sy+13+runBob,w*.15,7);
    const skin=st==='hurt'?'#ffb3a9':'#ddb27d';ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(sx+w/2,sy+11+runBob,9,10,0,0,Math.PI*2);ctx.fill();
    // cabelo
    ctx.fillStyle='#24171b';ctx.beginPath();ctx.arc(sx+w/2-dir*1.5,sy+7+runBob,9,Math.PI,Math.PI*2);ctx.fill();

    // chapéu/cobertura: silhueta mais própria
    ctx.fillStyle='#38231d';ctx.beginPath();ctx.ellipse(sx+w/2,sy+3+runBob,14,3.5,0,0,Math.PI*2);ctx.fill();ctx.fillRect(sx+w/2-7,sy-5+runBob,14,9);
    ctx.fillStyle='#6c3b25';ctx.fillRect(sx+w/2-7,sy+1+runBob,14,2);

    // olho direcionado
    const eyeX=sx+w/2+dir*3.5,eyeY=sy+11+runBob;const eyeC=st==='special'?'#f1a7ff':st==='dash'?'#71efff':'#241820';
    ctx.fillStyle=eyeC;if(st==='special'||st==='dash'){ctx.shadowColor=eyeC;ctx.shadowBlur=7;}ctx.beginPath();ctx.arc(eyeX,eyeY,1.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

    // braço/arma
    ctx.strokeStyle=skin;ctx.lineWidth=4;ctx.lineCap='round';
    const shoulderX=sx+w/2+dir*8, shoulderY=sy+25+runBob;
    if(st==='attack'||st==='charge'){
      const ext=st==='charge'?38:27;ctx.beginPath();ctx.moveTo(shoulderX,shoulderY);ctx.lineTo(shoulderX+dir*15,shoulderY+2);ctx.stroke();
      ctx.strokeStyle=st==='charge'?'#ffb253':'#d8d7d5';ctx.lineWidth=3;ctx.shadowColor=st==='charge'?'#ff7722':'#e9e9ff';ctx.shadowBlur=st==='charge'?9:4;ctx.beginPath();ctx.moveTo(shoulderX+dir*13,shoulderY+1);ctx.lineTo(shoulderX+dir*ext,shoulderY-5);ctx.stroke();ctx.shadowBlur=0;
      ctx.strokeStyle='#70512d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(shoulderX+dir*10,shoulderY+2);ctx.lineTo(shoulderX+dir*15,shoulderY+1);ctx.stroke();
    }else{
      ctx.beginPath();ctx.moveTo(shoulderX,shoulderY);ctx.lineTo(shoulderX+dir*4,shoulderY+14);ctx.stroke();
    }

    // aura especial
    if(st==='special'&&this.specialTimer>0.08){const pulse=.5+.5*Math.sin(time*12);ctx.strokeStyle=`rgba(217,120,255,${.35+pulse*.28})`;ctx.lineWidth=2;ctx.shadowColor='#bb44ff';ctx.shadowBlur=12;for(let r=0;r<2;r++){ctx.beginPath();ctx.arc(sx+w/2,sy+h/2,26+r*10+pulse*6,0,Math.PI*2);ctx.stroke();}ctx.shadowBlur=0;}

    // stamina local somente quando baixa/ação
    if(this.stamina<35||st==='dash'||st==='charge'){
      ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.roundRect(sx-3,sy+h+7,w+6,4,2);ctx.fill();ctx.fillStyle=st==='charge'?'#ff8a2a':'#4bdfff';ctx.beginPath();ctx.roundRect(sx-3,sy+h+7,(w+6)*(this.stamina/100),4,2);ctx.fill();
    }

    ctx.restore();
  },
};
