// ============================================================
// js/entities/bossSystem.js
// Sistema de chefes: Saci, Mula sem Cabeça, Curupira, Caipora, Entidade Ancestral
// ============================================================

const BossSystem = {
  active:false, boss:null,
  introTimer:0, introActive:false,
  defeatTimer:0, defeatActive:false,
  onDefeated:null, roomTiles:[],

  start(bossId, roomTiles, onDefeated) {
    this.boss         = createBoss(bossId);
    this.roomTiles    = roomTiles;
    this.active       = true;
    this.introActive  = true;
    this.introTimer   = 2.8;
    this.defeatActive = false;
    this.defeatTimer  = 0;
    this.onDefeated   = onDefeated;
  },

  update(dt) {
    if (!this.active) return;
    if (this.introActive) {
      this.introTimer -= dt;
      this.boss.introUpdate(dt);
      if (this.introTimer <= 0) this.introActive = false;
      return;
    }
    if (this.defeatActive) {
      this.defeatTimer -= dt;
      this.boss.defeatUpdate(dt);
      if (this.defeatTimer <= 0) {
        this.active=false; this.defeatActive=false;
        if (this.onDefeated) this.onDefeated(this.boss.id);
      }
      return;
    }
    const region = {
      solidTiles: this.roomTiles, oneWayTiles:[],
      bounds:{ left:0, right:1600, top:0, bottom:900 },
    };
    this.boss.update(dt, region, Player);
    if (this.boss.health <= 0 && !this.defeatActive) {
      this.defeatActive=true; this.defeatTimer=2.5;
      this.boss.startDefeat();
    }
  },

  draw(ctx) {
    if (!this.active) return;
    this.boss.draw(ctx);
    if (this.introActive) this._drawIntro(ctx);
  },

  _drawIntro(ctx) {
    const t = 1 - (this.introTimer / 2.8);
    const alpha = Math.min(1, t * 3) * (1 - Math.max(0, (t-0.7)*3));
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0, ctx.canvas.height/2-40, ctx.canvas.width, 80);
    ctx.font='bold 32px monospace'; ctx.fillStyle=this.boss.nameColor;
    ctx.shadowColor=this.boss.nameColor; ctx.shadowBlur=18;
    const nw=ctx.measureText(this.boss.displayName).width;
    ctx.fillText(this.boss.displayName, ctx.canvas.width/2-nw/2, ctx.canvas.height/2-6);
    ctx.font='14px monospace'; ctx.fillStyle='#aaa'; ctx.shadowBlur=0;
    const sw=ctx.measureText(this.boss.subtitle).width;
    ctx.fillText(this.boss.subtitle, ctx.canvas.width/2-sw/2, ctx.canvas.height/2+20);
    ctx.restore();
  },
};

function createBoss(id) {
  switch(id) {
    case 'saci':      return new BossSaci();
    case 'mula':      return new BossMula();
    case 'curupira':  return new BossCurupira();
    case 'caipora':   return new BossCaipora();
    case 'ancestral': return new BossAncestral();
    case 'boitata':   return new BossBoitata();
    case 'cuca':      return new BossCuca();
    default: throw new Error('Boss desconhecido: '+id);
  }
}

// ── BASE ─────────────────────────────────────────────────────
function bossBase(cfg) {
  return {
    id:cfg.id, displayName:cfg.displayName, subtitle:cfg.subtitle, nameColor:cfg.nameColor,
    x:cfg.x, y:cfg.y, width:cfg.width||60, height:cfg.height||80,
    vx:0, vy:0, gravity:cfg.gravity!==undefined?cfg.gravity:0.45, onGround:false,
    health:cfg.maxHealth, maxHealth:cfg.maxHealth,
    phase:1, phaseThreshold:cfg.phaseThreshold||0.5,
    invincible:false, invincibleTimer:0,
    attackTimer:0, attackCooldown:0,
    hitBox:null, _hitSpec:null,
    hurtBox:{ x:cfg.x, y:cfg.y, width:cfg.width||60, height:cfg.height||80 },
    _stateTimer:0, _defeatTimer:0, _introAnim:0,

    setHit(ox,oy,w,h){ this._hitSpec={ox,oy,w,h}; this.syncHitBox(); },
    syncHitBox(){ if(this._hitSpec){const h=this._hitSpec;this.hitBox={x:this.x+h.ox,y:this.y+h.oy,width:h.w,height:h.h};} },
    clearHit(){ this.hitBox=null; this._hitSpec=null; },
    updateHurtBox(){ this.hurtBox.x=this.x; this.hurtBox.y=this.y; },

    // BUG 3 FIX: tickTimers NÃO checa hitbox do player — isso é feito
    // no player.update para evitar dupla detecção. Só checa hitbox do boss → player.
    tickTimers(dt) {
      this.updateHurtBox();
      if (this.invincibleTimer>0){ this.invincibleTimer-=dt; if(this.invincibleTimer<=0) this.invincible=false; }
      if (this.attackTimer>0)    { this.attackTimer-=dt;    if(this.attackTimer<=0)     this.clearHit(); }
      if (this.attackCooldown>0)   this.attackCooldown-=dt;
      this._stateTimer+=dt;
      // boss acerta player
      if (this.hitBox && !Player.invincible && boxHits(this.hitBox, Player.hurtBox))
        Player.takeDamage(1, this.x+this.width/2);
    },

    takeDamage(n, srcX) {
      if (this.invincible) return;
      this.health -= n;
      this.invincible=true; this.invincibleTimer=0.25;
      const dir = srcX < this.x ? 1 : -1;
      this.vx=dir*3; this.vy=-2;
      Particles.impact(this.x+this.width/2, this.y+this.height/2, dir);
      if (typeof triggerScreenShake === 'function') triggerScreenShake(3.5, 0.11);
      if (this.phase===1 && this.health/this.maxHealth <= this.phaseThreshold) {
        this.phase=2; this.onPhase2();
      }
    },

    checkPhysics(region){ resolvePhysics(this, region); this.updateHurtBox(); this.syncHitBox(); },
    introUpdate(dt){ this._introAnim+=dt; },
    onPhase2(){},
    startDefeat(){ Particles.death(this.x+this.width/2, this.y+this.height/2, this.nameColor); },
    defeatUpdate(dt){
      this._defeatTimer+=dt;
      if (Math.floor(this._defeatTimer*8)%2===0)
        Particles.death(this.x+Math.random()*this.width, this.y+Math.random()*this.height, this.nameColor);
    },
  };
}

// ════════════════════════════════════════════════════════════
// SACI
// ════════════════════════════════════════════════════════════
class BossSaci {
  constructor() {
    Object.assign(this, bossBase({
      id:'saci', displayName:'SACI', subtitle:'Espírito do Vento',
      nameColor:'#44ff44',
      x:700, y:700, width:52, height:64,
      maxHealth:18, phaseThreshold:0.5, gravity:0.3,
    }));
    this._aiState='idle';
    // BUG 4 FIX: inicializar _teleportTimer com valor positivo
    this._teleportTimer=2.0;
    this._windBalls=[];
    this._spinAngle=0;
  }

  introUpdate(dt) { this._introAnim+=dt; this.y=700+Math.sin(this._introAnim*4)*12; }

  onPhase2() { this._teleport(); Particles.special(this.x, this.y); }

  _teleport() {
    const positions=[150,350,550,750,1000,1200];
    this.x=positions[Math.floor(Math.random()*positions.length)];
    this.y=680+Math.random()*80;
    this.vx=0; this.vy=0;
    Particles.doubleJump(this.x, this.y);
  }

  _shootWind(dir) {
    this._windBalls.push({
      x:this.x+this.width/2, y:this.y+this.height/2,
      vx:dir*(5+(this.phase===2?2:0)), vy:-1+Math.random()*2,
      life:1.8, maxLife:1.8, width:18, height:18,
    });
  }

  update(dt, region, player) {
    this._spinAngle+=dt*(this.phase===2?6:3);
    this.tickTimers(dt);
    const dx=player.x-this.x, dist=Math.abs(dx);

    if (this.phase===1) {
      if (this._aiState==='idle' && this.attackCooldown<=0) {
        this.vx=Math.sign(dx)*4.5; this._aiState='dash';
        this.attackCooldown=1.8; this._stateTimer=0;
      }
      if (this._aiState==='dash') {
        if (this._stateTimer>0.6) this.vx*=0.7;
        if (this._stateTimer>1.0) { this.vx=0; this._aiState='idle'; }
        this.setHit(0,8,this.width,this.height-16);
      } else {
        this.clearHit();
      }
      if (this._aiState==='idle' && this.attackCooldown<=0 && dist<350) {
        this._shootWind(Math.sign(dx)||1);
        this.attackCooldown=2.0;
      }
    }

    if (this.phase===2) {
      this._teleportTimer-=dt;
      if (this._teleportTimer<=0) { this._teleport(); this._teleportTimer=1.8; }
      if (this.attackCooldown<=0 && dist<500) {
        this._shootWind(1); this._shootWind(-1);
        this.attackCooldown=1.0;
      }
    }

    this.vy+=Math.sin(this._stateTimer*2)*0.08;
    this.checkPhysics(region);

    for (let i=this._windBalls.length-1;i>=0;i--) {
      const b=this._windBalls[i];
      b.x+=b.vx; b.y+=b.vy; b.life-=dt;
      Particles.dash(b.x, b.y, Math.sign(b.vx));
      if (!player.invincible && boxHits(b, player.hurtBox)) {
        player.takeDamage(1, b.x);
        this._windBalls.splice(i,1); continue;
      }
      if (b.life<=0) this._windBalls.splice(i,1);
    }
  }

  startDefeat() { this._windBalls=[]; for(let i=0;i<5;i++) Particles.death(this.x+Math.random()*52,this.y+Math.random()*64,'#44ff44'); }

  draw(ctx) {
    if (this.health<=0 && !BossSystem.defeatActive) return;
    const sx=this.x-Camera.x, sy=this.y, w=this.width, h=this.height;
    const ph2=this.phase===2;
    ctx.save();
    if (this.invincible) ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?0.2:1;
    // chapéu
    ctx.save(); ctx.translate(sx+w/2, sy); ctx.rotate(this._spinAngle*(ph2?1.5:0.5));
    ctx.fillStyle=ph2?'#ff2222':'#cc1111';
    ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(18,0); ctx.lineTo(8,-22); ctx.lineTo(-8,-22); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,-24,5,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // corpo
    const bounce=Math.sin(this._stateTimer*6)*3;
    ctx.fillStyle=ph2?'#222200':'#1a1a00';
    ctx.beginPath(); ctx.ellipse(sx+w/2,sy+h*.6+bounce,w*.45,h*.42,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3a2a10';
    ctx.beginPath(); ctx.arc(sx+w/2,sy+h*.35+bounce,w*.28,0,Math.PI*2); ctx.fill();
    // olho único
    const ec=ph2?'#ff4400':'#ffcc00';
    ctx.shadowColor=ec; ctx.shadowBlur=ph2?14:8; ctx.fillStyle=ec;
    ctx.beginPath(); ctx.arc(sx+w/2+4,sy+h*.32+bounce,5,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // perna
    ctx.strokeStyle='#1a1000'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(sx+w/2,sy+h*.8+bounce); ctx.lineTo(sx+w/2+4,sy+h+bounce); ctx.stroke();
    // redemoinho fase 2
    if (ph2) {
      for (let j=0;j<6;j++) {
        const a=this._spinAngle+(Math.PI*2/6)*j;
        ctx.fillStyle=`rgba(100,255,100,${0.15+0.1*Math.sin(a)})`;
        ctx.beginPath(); ctx.arc(sx+w/2+Math.cos(a)*30,sy+h/2+Math.sin(a)*20,5,0,Math.PI*2); ctx.fill();
      }
    }
    // projéteis
    for (const b of this._windBalls) {
      const bsx=b.x-Camera.x;
      ctx.save(); ctx.translate(bsx,b.y); ctx.rotate(this._spinAngle*2);
      ctx.strokeStyle=ph2?'#88ffaa':'#44ff44'; ctx.shadowColor=ctx.strokeStyle; ctx.shadowBlur=8; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,5,0.3,Math.PI*1.8); ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════
// MULA SEM CABEÇA
// ════════════════════════════════════════════════════════════
class BossMula {
  constructor() {
    Object.assign(this, bossBase({
      id:'mula', displayName:'MULA SEM CABEÇA', subtitle:'O Galope Flamejante',
      nameColor:'#ff6600',
      x:200, y:740, width:88, height:68,
      maxHealth:24, phaseThreshold:0.45, gravity:0.55,
    }));
    this._aiState='idle'; this._facing=1; this._flames=[]; this._stomps=0;
  }

  introUpdate(dt) { this._introAnim+=dt; this.x=200+Math.sin(this._introAnim*8)*6; }

  onPhase2() {
    this._aiState='idle'; this.attackCooldown=0.5;
    for(let i=0;i<12;i++) Particles.impact(this.x+Math.random()*88,this.y+Math.random()*68,i%2===0?1:-1);
  }

  _emitFlame() {
    const num=this.phase===2?4:2;
    for(let i=0;i<num;i++) {
      this._flames.push({
        x:this.x+this.width/2+(Math.random()-.5)*20, y:this.y+Math.random()*this.height,
        vx:-this._facing*(0.5+Math.random()*1.5), vy:-1.5-Math.random()*2,
        life:0.5+Math.random()*.3, maxLife:0.8,
        size:8+Math.random()*10, color:Math.random()>.5?'#ff6600':'#ffcc00',
        width:12, height:12,
      });
    }
  }

  _startCharge(player) {
    this._facing=Math.sign(player.x-this.x)||1;
    this._aiState='charge'; this.vx=this._facing*(this.phase===2?8.5:6);
    this._stateTimer=0; this.setHit(0,0,this.width,this.height);
    this.invincible=true;
  }

  update(dt, region, player) {
    this.tickTimers(dt);
    this._emitFlame();
    switch(this._aiState) {
      case 'idle':
        this.vx*=0.85;
        if (this.attackCooldown<=0) {
          if (this._stomps<2) { this._aiState='stomp'; this._stateTimer=0; this._stomps++; }
          else { this._startCharge(player); this._stomps=0; }
        }
        break;
      case 'stomp':
        if (this._stateTimer<0.3) this.vy=-7;
        if (this.onGround && this._stateTimer>0.3) {
          for(let i=0;i<10;i++) Particles.impact(this.x+Math.random()*this.width,this.y+this.height,i%2===0?1:-1);
          this.setHit(-20,this.height-10,this.width+40,12);
          this.attackTimer=0.2; this.attackCooldown=this.phase===2?0.8:1.4;
          this._aiState='idle';
        }
        break;
      case 'charge':
        this.vx=this._facing*(this.phase===2?8.5:6);
        if (this._stateTimer>(this.phase===2?0.8:1.0)) {
          this.vx=0; this.invincible=false; this.clearHit();
          this.attackCooldown=this.phase===2?0.6:1.2;
          this._aiState='idle'; this._stateTimer=0;
        }
        if (this.x<=40)                                { this._facing= 1; this.vx= Math.abs(this.vx); }
        if (this.x+this.width>=region.bounds.right-40) { this._facing=-1; this.vx=-Math.abs(this.vx); }
        break;
    }
    this.checkPhysics(region);
    // chamas causam dano ao player
    for(let i=this._flames.length-1;i>=0;i--) {
      const f=this._flames[i];
      f.x+=f.vx; f.y+=f.vy; f.vy-=0.04; f.life-=dt;
      if (f.life<=0){ this._flames.splice(i,1); continue; }
      if (!player.invincible && boxHits(f, player.hurtBox)) {
        player.takeDamage(1,f.x); this._flames.splice(i,1);
      }
    }
  }

  startDefeat() { this._flames=[]; for(let i=0;i<8;i++) Particles.death(this.x+Math.random()*88,this.y+Math.random()*68,'#ff6600'); }

  draw(ctx) {
    if (this.health<=0 && !BossSystem.defeatActive) return;
    const sx=this.x-Camera.x, sy=this.y, w=this.width, h=this.height;
    const charging=this._aiState==='charge', ph2=this.phase===2;
    ctx.save();
    if (this.invincible && !charging) ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?0.2:1;
    // chamas
    for(const f of this._flames){
      const pct=f.life/f.maxLife;
      ctx.globalAlpha=pct*.8; ctx.fillStyle=f.color; ctx.shadowColor=f.color; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(f.x-Camera.x,f.y,f.size*(.5+pct*.5),0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    if (this.invincible && !charging) ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?0.2:1;
    // corpo
    const bg=ctx.createLinearGradient(sx,sy,sx,sy+h);
    bg.addColorStop(0,ph2?'#331100':'#1a0a00'); bg.addColorStop(1,'#0a0500');
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(sx+4,sy+h*.3,w-8,h*.65,8); ctx.fill();
    // pescoço sem cabeça
    ctx.fillStyle='#1a0800'; ctx.beginPath(); ctx.roundRect(sx+w*.35,sy,w*.3,h*.45,6); ctx.fill();
    // fogo no pescoço
    const nf=ph2?6:4;
    for(let i=0;i<nf;i++){
      const a=Date.now()*.003+i*(Math.PI/nf);
      const fx=sx+w*.35+w*.3*(i/nf)+Math.sin(a)*4, fy=sy-10+Math.sin(a+1)*6;
      ctx.fillStyle=i%2===0?'#ff6600':'#ffcc00'; ctx.shadowColor='#ff4400'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(fx,fy,8+Math.sin(a*2)*3,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0;
    // pernas
    ctx.strokeStyle='#1a0a00'; ctx.lineWidth=7; ctx.lineCap='round';
    [0.15,0.32,0.62,0.79].forEach((lx,li)=>{
      const lb=Math.sin(Date.now()*.015+li)*(charging?8:3);
      ctx.beginPath(); ctx.moveTo(sx+w*lx,sy+h*.88); ctx.lineTo(sx+w*lx,sy+h+lb); ctx.stroke();
    });
    // olho de chamas
    ctx.fillStyle=ph2?'#ff2200':'#ff8800'; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(sx+w*.5,sy+h*.5,8,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    if (this.hitBox){
      ctx.strokeStyle='rgba(255,100,0,0.4)'; ctx.lineWidth=1.5;
      ctx.strokeRect(this.hitBox.x-Camera.x,this.hitBox.y,this.hitBox.width,this.hitBox.height);
    }
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════
// CURUPIRA
// ════════════════════════════════════════════════════════════
class BossCurupira {
  constructor() {
    Object.assign(this, bossBase({
      id:'curupira', displayName:'CURUPIRA', subtitle:'Guardião da Floresta',
      nameColor:'#aa44ff',
      x:600, y:700, width:56, height:72,
      maxHealth:20, phaseThreshold:0.5, gravity:0.4,
    }));
    this._aiState='idle'; this._confused=false; this._confuseTimer=0;
    this._roots=[]; this._clones=[]; this._footAngle=0;
  }

  introUpdate(dt) { this._introAnim+=dt; this.x=600+Math.sin(this._introAnim*3)*20; }

  onPhase2() {
    this._setConfuse(5.0);
    this._spawnClones();
    Particles.special(this.x, this.y);
  }

  _setConfuse(duration) {
    this._confused=true; this._confuseTimer=duration;
    Player.abilities._confused=true;
  }

  _spawnRoots() {
    const px=Player.x;
    for(let i=0;i<(this.phase===2?5:3);i++) {
      const rx=px-120+i*60+(Math.random()-.5)*30;
      this._roots.push({ x:rx, y:760, width:16, height:80, life:2.5, maxLife:2.5, growTimer:0.4 });
    }
  }

  _spawnClones() {
    this._clones=[
      { x:this.x-200, y:this.y, width:56, height:72, vx:0, vy:0, onGround:false, gravity:0.4, _t:0 },
      { x:this.x+200, y:this.y, width:56, height:72, vx:0, vy:0, onGround:false, gravity:0.4, _t:0 },
    ];
  }

  update(dt, region, player) {
    this._footAngle+=dt*3;
    this.tickTimers(dt);

    if (this._confuseTimer>0) {
      this._confuseTimer-=dt;
      if (this._confuseTimer<=0) { this._confused=false; player.abilities._confused=false; }
    }

    const dx=player.x-this.x, dist=Math.abs(dx);
    switch(this._aiState) {
      case 'idle':
        this.vx*=0.9;
        if (this.attackCooldown<=0) {
          const r=Math.random();
          if (r<0.4) { this._setConfuse(this.phase===2?4.5:3.0); this.attackCooldown=5.0; Particles.special(this.x,this.y); }
          else if (r<0.75) { this._spawnRoots(); this.attackCooldown=2.5; }
          else { this._aiState='jump'; this.vy=-10; this.vx=Math.sign(dx)*5; this.attackCooldown=2.0; }
        }
        if (dist>80) this.vx+=Math.sign(dx)*0.08;
        this.vx=Math.max(-2.5,Math.min(2.5,this.vx));
        break;
      case 'jump':
        this.setHit(0,0,this.width,this.height);
        if (this.onGround && this._stateTimer>0.3) {
          this.clearHit(); this._spawnRoots(); this._aiState='idle';
        }
        break;
    }

    this.checkPhysics(region);

    // raízes
    for(let i=this._roots.length-1;i>=0;i--) {
      const r=this._roots[i]; r.life-=dt; r.growTimer-=dt;
      if (r.life<=0){ this._roots.splice(i,1); continue; }
      if (r.growTimer<=0 && !player.invincible && boxHits(r, player.hurtBox))
        player.takeDamage(1, r.x+r.width/2);
    }

    // clones
    for(const c of this._clones) {
      c._t+=dt; c.vx=-player.vx*(0.7+Math.sin(c._t)*.3);
      c.vy+=c.gravity; c.x+=c.vx; c.y+=c.vy;
      for(const t of region.solidTiles) {
        if (_overlap(c,t) && c.vy>=0){ c.y=t.y-c.height; c.vy=0; c.onGround=true; }
      }
      if (!player.invincible && boxHits(c, player.hurtBox))
        player.takeDamage(1, c.x+c.width/2);
    }
  }

  startDefeat() {
    this._roots=[]; this._clones=[];
    Player.abilities._confused=false;
    for(let i=0;i<6;i++) Particles.death(this.x+Math.random()*56,this.y+Math.random()*72,'#aa44ff');
  }

  draw(ctx) {
    if (this.health<=0 && !BossSystem.defeatActive) return;
    const sx=this.x-Camera.x, sy=this.y, w=this.width, h=this.height;
    const ph2=this.phase===2;
    ctx.save();
    if (this.invincible) ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?0.2:1;
    // raízes
    for(const r of this._roots){
      const rx=r.x-Camera.x, growPct=Math.max(0,1-(r.growTimer/r.maxLife));
      const rh=r.height*growPct;
      ctx.fillStyle='#2a5c00'; ctx.beginPath(); ctx.roundRect(rx,r.y+r.height-rh,r.width,rh,3); ctx.fill();
      if (growPct>0.6){ ctx.fillStyle='#1a3a00'; ctx.beginPath(); ctx.moveTo(rx-6,r.y+4); ctx.lineTo(rx+r.width/2,r.y-10); ctx.lineTo(rx+r.width+6,r.y+4); ctx.fill(); }
    }
    // clones
    for(const c of this._clones){
      ctx.globalAlpha=0.35; ctx.fillStyle='#aa44ff';
      ctx.beginPath(); ctx.ellipse(c.x-Camera.x+c.width/2,c.y+c.height*.6,c.width*.4,c.height*.45,0,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=this.invincible?(Math.floor(Date.now()/60)%2===0?0.2:1):1;
    // corpo
    const bg=ctx.createRadialGradient(sx+w/2,sy+h*.5,2,sx+w/2,sy+h*.5,w*.6);
    bg.addColorStop(0,ph2?'#5522aa':'#331166'); bg.addColorStop(1,'#160030');
    ctx.fillStyle=bg;
    ctx.beginPath(); ctx.moveTo(sx+w*.1,sy+h); ctx.bezierCurveTo(sx-5,sy+h*.5,sx+2,sy,sx+w*.5,sy+2); ctx.bezierCurveTo(sx+w-2,sy,sx+w+5,sy+h*.5,sx+w*.9,sy+h); ctx.closePath(); ctx.fill();
    // cabelo
    ctx.fillStyle='#cc2200'; ctx.shadowColor='#ff4400'; ctx.shadowBlur=8;
    ctx.beginPath();
    for(let i=0;i<5;i++){ const hx=sx+w*.1+i*(w*.2), ht=sy-12-Math.sin(this._footAngle+i)*6; ctx.moveTo(hx,sy+4); ctx.lineTo(hx+5,ht); ctx.lineTo(hx+10,sy+4); }
    ctx.fill(); ctx.shadowBlur=0;
    // olhos
    const ec=ph2?'#ff44ff':'#cc44ff';
    ctx.shadowColor=ec; ctx.shadowBlur=10; ctx.fillStyle=ec;
    ctx.beginPath(); ctx.arc(sx+w*.32,sy+h*.32,4,0,Math.PI*2); ctx.arc(sx+w*.68,sy+h*.32,4,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // pés ao contrário
    ctx.strokeStyle='#2a1060'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(sx+w*.3,sy+h); ctx.lineTo(sx+w*.3+Math.cos(Math.PI+this._footAngle*.3)*14,sy+h+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+w*.7,sy+h); ctx.lineTo(sx+w*.7+Math.cos(this._footAngle*.3)*14,sy+h+8); ctx.stroke();
    ctx.strokeStyle='#1a0840'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(sx+w*.18,sy+h+8); ctx.lineTo(sx+w*.42,sy+h+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+w*.58,sy+h+8); ctx.lineTo(sx+w*.82,sy+h+8); ctx.stroke();
    // indicador confusão
    if (this._confused){
      ctx.font='bold 14px monospace'; ctx.fillStyle='#ff44ff'; ctx.shadowColor='#aa00ff'; ctx.shadowBlur=8;
      const t='?! CONFUSÃO !?'; ctx.fillText(t,sx+w/2-ctx.measureText(t).width/2,sy-20); ctx.shadowBlur=0;
    }
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════
// CAIPORA
// Guardiã da Mata Viva — controla animais e invoca súditos
// Fase 1: lança javalis e usa bumerangue de osso
// Fase 2: invoca enxame de morcegos e carrega com montaria
// ════════════════════════════════════════════════════════════
class BossCaipora {
  constructor() {
    Object.assign(this, bossBase({
      id:'caipora', displayName:'CAIPORA', subtitle:'Guardiã da Mata Viva',
      nameColor:'#00ff88',
      x:600, y:700, width:54, height:70,
      maxHealth:26, phaseThreshold:0.45, gravity:0.42,
    }));
    this._aiState    = 'idle';
    this._facing     = -1;
    this._boomerangs = [];   // { x,y,vx,vy,angle,phase,life,width,height }
    this._boars      = [];   // { x,y,vx,width,height,life }
    this._bats       = [];   // { x,y,vx,vy,angle,width,height }
    this._mountTimer = 0;
    this._footAngle  = 0;
    this._tailAngle  = 0;
  }

  introUpdate(dt) {
    this._introAnim += dt;
    this.y = 700 + Math.sin(this._introAnim * 3) * 10;
  }

  onPhase2() {
    this._aiState = 'enxame';
    this._spawnBats(8);
    this.attackCooldown = 1.0;
    Particles.special(this.x, this.y);
    for (let i = 0; i < 10; i++)
      Particles.impact(this.x + Math.random()*54, this.y + Math.random()*70, i%2===0?1:-1);
  }

  _shootBoomerang(player) {
    const dx = player.x - this.x;
    const dir = Math.sign(dx) || 1;
    this._boomerangs.push({
      x: this.x + this.width/2, y: this.y + this.height*.3,
      vx: dir * 6, vy: -2,
      angle: 0, returning: false,
      life: 3.0, width: 20, height: 8,
    });
    this._facing = dir;
  }

  _spawnBoar(player) {
    const side = player.x < this.x ? 1 : -1; // spawn do lado oposto ao player
    const spawnX = side === 1 ? 40 : 1540;
    this._boars.push({
      x: spawnX, y: 780,
      vx: -side * 5.5,
      width: 36, height: 26, life: 4.0,
    });
  }

  _spawnBats(n) {
    for (let i = 0; i < n; i++) {
      this._bats.push({
        x: this.x + (Math.random()-0.5)*80,
        y: this.y - 20 - Math.random()*60,
        vx: (Math.random()-0.5)*3,
        vy: (Math.random()-0.5)*2,
        angle: Math.random()*Math.PI*2,
        width: 18, height: 12,
      });
    }
  }

  update(dt, region, player) {
    this._footAngle += dt * 4;
    this._tailAngle += dt * 2;
    this.tickTimers(dt);

    const dx = player.x - this.x;
    const dist = Math.abs(dx);

    // ── IA ───────────────────────────────────────────────────
    switch (this._aiState) {
      case 'idle':
        this.vx *= 0.88;
        if (this.attackCooldown <= 0) {
          const r = Math.random();
          if (this.phase === 1) {
            if (r < 0.45) {
              this._shootBoomerang(player);
              this.attackCooldown = 2.2;
            } else {
              this._spawnBoar(player);
              this.attackCooldown = 2.8;
            }
          } else {
            if (r < 0.35) {
              this._spawnBats(4);
              this.attackCooldown = 1.6;
            } else if (r < 0.65) {
              this._shootBoomerang(player);
              this.attackCooldown = 1.4;
            } else {
              this._aiState = 'charge';
              this._facing  = Math.sign(dx) || 1;
              this.vx       = this._facing * 8;
              this._stateTimer = 0;
              this.setHit(0, 0, this.width, this.height);
            }
          }
        }
        if (dist > 100) this.vx += Math.sign(dx) * 0.1;
        this.vx = Math.max(-2.5, Math.min(2.5, this.vx));
        break;

      case 'charge':
        this.vx = this._facing * 8;
        if (this._stateTimer > 0.9) {
          this.vx = 0; this.clearHit();
          this.attackCooldown = 1.8; this._aiState = 'idle'; this._stateTimer = 0;
        }
        if (this.x <= 40)                                { this._facing = 1;  this.vx =  Math.abs(this.vx); }
        if (this.x + this.width >= region.bounds.right-40) { this._facing = -1; this.vx = -Math.abs(this.vx); }
        break;

      case 'enxame':
        // pausa para enxame de morcegos entrar
        this.vx *= 0.7;
        if (this._stateTimer > 1.2) this._aiState = 'idle';
        break;
    }

    this.checkPhysics(region);

    // ── Bumerangues ──────────────────────────────────────────
    for (let i = this._boomerangs.length-1; i >= 0; i--) {
      const b = this._boomerangs[i];
      b.angle += dt * 12 * Math.sign(b.vx);
      b.life  -= dt;

      if (!b.returning) {
        b.x += b.vx;
        b.vy += 0.12;
        b.y  += b.vy;
        // retorna após 0.7s
        if (b.life < 2.3) {
          b.returning = true;
          b.vy = 0;
        }
      } else {
        // retorna ao boss
        const rdx = this.x + this.width/2 - b.x;
        const rdy = this.y + this.height/2 - b.y;
        const rdist = Math.hypot(rdx, rdy);
        b.vx = (rdx / rdist) * 7;
        b.vy = (rdy / rdist) * 7;
        b.x += b.vx;
        b.y += b.vy;
        if (rdist < 20 || b.life <= 0) { this._boomerangs.splice(i,1); continue; }
      }

      if (!player.invincible && boxHits(b, player.hurtBox)) {
        player.takeDamage(1, b.x);
        this._boomerangs.splice(i,1);
      }
    }

    // ── Javalis ──────────────────────────────────────────────
    for (let i = this._boars.length-1; i >= 0; i--) {
      const b = this._boars[i];
      b.life -= dt;
      b.x    += b.vx;
      if (b.life <= 0 || b.x < -60 || b.x > 1660) { this._boars.splice(i,1); continue; }
      if (!player.invincible && boxHits(b, player.hurtBox)) {
        player.takeDamage(1, b.x);
        this._boars.splice(i,1);
      }
    }

    // ── Morcegos (fase 2) ────────────────────────────────────
    for (let i = this._bats.length-1; i >= 0; i--) {
      const bat = this._bats[i];
      bat.angle += dt * 2;
      // orbita ao redor do player
      const tx = player.x + Math.cos(bat.angle) * 120;
      const ty = player.y - 40 + Math.sin(bat.angle * 0.7) * 60;
      bat.vx += (tx - bat.x) * 0.04;
      bat.vy += (ty - bat.y) * 0.04;
      bat.vx *= 0.9;
      bat.vy *= 0.9;
      bat.x  += bat.vx;
      bat.y  += bat.vy;

      if (!player.invincible && boxHits(bat, player.hurtBox)) {
        player.takeDamage(1, bat.x);
        this._bats.splice(i,1);
      }
    }
    // reforça morcegos na fase 2
    if (this.phase === 2 && this._bats.length < 3 && this.attackCooldown <= 0) {
      this._spawnBats(3); this.attackCooldown = 2.0;
    }
  }

  startDefeat() {
    this._boomerangs = []; this._boars = []; this._bats = [];
    for (let i=0; i<8; i++)
      Particles.death(this.x+Math.random()*54, this.y+Math.random()*70, '#00ff88');
  }

  draw(ctx) {
    if (this.health <= 0 && !BossSystem.defeatActive) return;
    const sx = this.x - Camera.x, sy = this.y, w = this.width, h = this.height;
    const ph2 = this.phase === 2;
    ctx.save();
    if (this.invincible) ctx.globalAlpha = (Math.floor(Date.now()/60)%2===0) ? 0.2 : 1;

    // ── Morcegos ─────────────────────────────────────────────
    for (const bat of this._bats) {
      const bsx = bat.x - Camera.x;
      ctx.save();
      ctx.fillStyle = ph2 ? '#006644' : '#004422';
      ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
      // corpo
      ctx.beginPath(); ctx.ellipse(bsx, bat.y, 7, 5, 0, 0, Math.PI*2); ctx.fill();
      // asas
      const wf = Math.sin(bat.angle * 6) * 0.4;
      ctx.beginPath();
      ctx.moveTo(bsx, bat.y); ctx.lineTo(bsx - 14, bat.y - 8 + wf*10); ctx.lineTo(bsx - 6, bat.y+2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bsx, bat.y); ctx.lineTo(bsx + 14, bat.y - 8 + wf*10); ctx.lineTo(bsx + 6, bat.y+2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }

    // ── Bumerangues ──────────────────────────────────────────
    for (const b of this._boomerangs) {
      const bsx = b.x - Camera.x;
      ctx.save();
      ctx.translate(bsx, b.y); ctx.rotate(b.angle);
      ctx.strokeStyle = ph2 ? '#00ffaa' : '#00dd66';
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -8, 12, 0); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    }

    // ── Javalis ──────────────────────────────────────────────
    for (const b of this._boars) {
      const bsx = b.x - Camera.x;
      const dir = Math.sign(b.vx);
      ctx.save();
      ctx.fillStyle = ph2 ? '#3a2010' : '#2a1508';
      // corpo
      ctx.beginPath(); ctx.ellipse(bsx, b.y + b.height/2, b.width/2, b.height/2, 0, 0, Math.PI*2); ctx.fill();
      // presa
      ctx.fillStyle = '#eeeecc';
      ctx.beginPath(); ctx.moveTo(bsx + dir*b.width*.4, b.y + b.height*.5); ctx.lineTo(bsx + dir*b.width*.55, b.y + b.height*.3); ctx.lineTo(bsx + dir*b.width*.3, b.y + b.height*.4); ctx.fill();
      // olho
      ctx.fillStyle = '#ff3300'; ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(bsx + dir*b.width*.25, b.y + b.height*.3, 3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }

    // ── Corpo da Caipora ──────────────────────────────────────
    ctx.globalAlpha = this.invincible ? (Math.floor(Date.now()/60)%2===0 ? 0.2 : 1) : 1;

    // cocar de penas
    const featherColors = ph2 ? ['#00ffaa','#00ddff','#00ff44'] : ['#00cc66','#009944','#00aa33'];
    for (let i = 0; i < 5; i++) {
      const fa = (i - 2) * 0.28 + Math.sin(this._tailAngle + i) * 0.06;
      const flen = 22 - Math.abs(i-2)*2;
      ctx.strokeStyle = featherColors[i % featherColors.length];
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx + w/2, sy + 4);
      ctx.lineTo(sx + w/2 + Math.sin(fa)*flen, sy + 4 - Math.cos(fa)*flen);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // corpo
    const bg = ctx.createRadialGradient(sx+w/2, sy+h*.5, 3, sx+w/2, sy+h*.5, w*.6);
    bg.addColorStop(0, ph2 ? '#004433' : '#002211');
    bg.addColorStop(1, '#000d07');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(sx+w*.12, sy+h);
    ctx.bezierCurveTo(sx-4, sy+h*.6, sx+2, sy+8, sx+w*.5, sy+8);
    ctx.bezierCurveTo(sx+w-2, sy+8, sx+w+4, sy+h*.6, sx+w*.88, sy+h);
    ctx.closePath(); ctx.fill();

    // rosto
    ctx.fillStyle = ph2 ? '#003322' : '#002211';
    ctx.beginPath(); ctx.arc(sx+w/2, sy+h*.3, w*.28, 0, Math.PI*2); ctx.fill();

    // olhos
    const ec = ph2 ? '#00ffaa' : '#00ff88';
    ctx.shadowColor = ec; ctx.shadowBlur = 12; ctx.fillStyle = ec;
    ctx.beginPath();
    ctx.arc(sx+w*.32, sy+h*.27, 4.5, 0, Math.PI*2);
    ctx.arc(sx+w*.68, sy+h*.27, 4.5, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur = 0;

    // pintura facial (listras verdes)
    ctx.strokeStyle = '#00cc55'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx+w*.4, sy+h*.4); ctx.lineTo(sx+w*.3, sy+h*.52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+w*.6, sy+h*.4); ctx.lineTo(sx+w*.7, sy+h*.52); ctx.stroke();

    // pernas
    ctx.strokeStyle = '#001a0c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const lk = this._aiState === 'charge' ? 14 : 6;
    ctx.beginPath(); ctx.moveTo(sx+w*.3, sy+h); ctx.lineTo(sx+w*.3 + Math.cos(this._footAngle)*lk, sy+h+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+w*.7, sy+h); ctx.lineTo(sx+w*.7 + Math.cos(this._footAngle+Math.PI)*lk, sy+h+10); ctx.stroke();

    // bumerangue na mão (quando idle)
    if (this._aiState === 'idle' && this._boomerangs.length === 0) {
      const hx = sx + (this._facing > 0 ? w*.85 : w*.15);
      ctx.strokeStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx - 8, sy+h*.55); ctx.quadraticCurveTo(hx, sy+h*.45, hx + 8, sy+h*.55); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // fase 2 — aura
    if (ph2) {
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(this._tailAngle * 3);
      ctx.fillStyle = '#00ff88';
      ctx.beginPath(); ctx.ellipse(sx+w/2, sy+h*.5, w*.75, h*.6, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════
// ENTIDADE ANCESTRAL
// O espírito que criou o folclore — chefe final
// Fase 1: projéteis de energia ancestral em padrões geométricos
// Fase 2: portais que teletransportam projéteis + raio descendente
// ════════════════════════════════════════════════════════════
class BossAncestral {
  constructor() {
    Object.assign(this, bossBase({
      id:'ancestral', displayName:'ENTIDADE ANCESTRAL', subtitle:'A Origem de Tudo',
      nameColor:'#cc99ff',
      x:640, y:400, width:80, height:96,
      maxHealth:40, phaseThreshold:0.5, gravity:0,   // flutua — sem gravidade
    }));
    this._aiState   = 'float';
    this._orbs      = [];   // projéteis de energia
    this._beams     = [];   // raios descendentes { x, timer, maxTimer, width }
    this._portals   = [];   // portais de teletransporte { x, y, angle, life }
    this._runeAngle = 0;
    this._pulseTime = 0;
    this._floatTime = 0;
    this._facing    = 1;
    this._targetX   = 640;
    this._targetY   = 180;
  }

  introUpdate(dt) {
    this._introAnim += dt;
    this.y = 400 + Math.sin(this._introAnim * 2) * 20;
    this.x = 640 + Math.cos(this._introAnim * 1.5) * 40;
  }

  onPhase2() {
    this._aiState = 'rage';
    this._spawnPortals(3);
    // flash de partículas
    for (let i = 0; i < 20; i++)
      Particles.death(this.x + Math.random()*80, this.y + Math.random()*96, '#cc99ff');
    Particles.special(this.x + 40, this.y + 48);
  }

  _spawnPortals(n) {
    this._portals = [];
    const positions = [200, 500, 800, 1100, 1380];
    for (let i = 0; i < n; i++) {
      const px = positions[Math.floor(Math.random() * positions.length)];
      this._portals.push({ x: px, y: 120 + Math.random()*180, angle: 0, life: 6.0 + Math.random()*2 });
    }
  }

  _shootOrbs(n, pattern) {
    // pattern: 'spread', 'ring', 'aimed'
    for (let i = 0; i < n; i++) {
      let angle;
      if (pattern === 'ring') {
        angle = (Math.PI * 2 / n) * i;
      } else if (pattern === 'spread') {
        angle = -Math.PI/4 + (Math.PI/2 / (n-1)) * i + Math.PI/2; // leque para baixo
      } else {
        // aimed ao player
        const dx = Player.x - this.x;
        const dy = Player.y - this.y;
        const base = Math.atan2(dy, dx);
        angle = base + (i - Math.floor(n/2)) * 0.28;
      }
      const spd = this.phase === 2 ? 4.5 : 3.2;
      this._orbs.push({
        x: this.x + this.width/2, y: this.y + this.height/2,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        life: 4.0, width: 14, height: 14,
        glow: Math.random() > 0.5 ? '#cc99ff' : '#9944ff',
        spin: Math.random() * Math.PI * 2,
      });
    }
  }

  _spawnBeam(x) {
    this._beams.push({ x, timer: 0, maxTimer: 1.6, width: 24, warned: false });
  }

  update(dt, region, player) {
    this._runeAngle += dt * (this.phase === 2 ? 1.8 : 1.0);
    this._pulseTime += dt * 3;
    this._floatTime += dt;
    this.tickTimers(dt);

    // ── Movimento flutuante ──────────────────────────────────
    const floatY = 400 + Math.sin(this._floatTime * 0.8) * 80;
    const floatX = 640 + Math.cos(this._floatTime * 0.5) * 120;
    if (this._aiState !== 'teleporting') {
      this._targetX = floatX;
      this._targetY = floatY;
    }
    this.x += (this._targetX - this.x) * 0.04;
    this.y += (this._targetY - this.y) * 0.04;
    this.vx = 0; this.vy = 0; // sobrescreve física — flutua

    // ── IA ───────────────────────────────────────────────────
    if (this._aiState === 'float' || this._aiState === 'rage') {
      if (this.attackCooldown <= 0) {
        const r = Math.random();
        if (this.phase === 1) {
          if (r < 0.3) {
            this._shootOrbs(5, 'ring');
            this.attackCooldown = 2.5;
          } else if (r < 0.6) {
            this._shootOrbs(3, 'aimed');
            this.attackCooldown = 1.8;
          } else if (r < 0.85) {
            this._shootOrbs(7, 'spread');
            this.attackCooldown = 2.2;
          } else {
            this._spawnBeam(player.x + (Math.random()-0.5)*80);
            this.attackCooldown = 2.0;
          }
        } else {
          // fase 2 — mais agressiva
          if (r < 0.25) {
            this._shootOrbs(8, 'ring');
            this.attackCooldown = 1.6;
          } else if (r < 0.5) {
            this._shootOrbs(5, 'aimed');
            this.attackCooldown = 1.2;
          } else if (r < 0.7) {
            // 2 raios simultâneos
            this._spawnBeam(player.x - 60 + Math.random()*40);
            this._spawnBeam(player.x + 20 + Math.random()*40);
            this.attackCooldown = 1.8;
          } else if (r < 0.85) {
            // reposiciona portais e dispara pelos portais
            this._spawnPortals(3);
            this._shootOrbs(6, 'ring');
            this.attackCooldown = 2.0;
          } else {
            // tempestade de orbs
            this._shootOrbs(12, 'ring');
            this.attackCooldown = 3.0;
          }
        }
      }
    }

    // Teleporte na fase 2 periodicamente
    if (this.phase === 2 && this._floatTime % 5 < dt) {
      const tx = [200, 400, 700, 1000, 1200][Math.floor(Math.random()*5)];
      this._targetX = tx; this._targetY = 350 + Math.random()*200;
      Particles.doubleJump(this.x, this.y);
    }

    // ── Portais ──────────────────────────────────────────────
    for (let i = this._portals.length-1; i >= 0; i--) {
      const p = this._portals[i];
      p.angle += dt * 3;
      p.life  -= dt;
      if (p.life <= 0) { this._portals.splice(i,1); continue; }
    }

    // ── Orbs ─────────────────────────────────────────────────
    for (let i = this._orbs.length-1; i >= 0; i--) {
      const o = this._orbs[i];
      o.spin += dt * 5;
      o.life -= dt;
      o.x += o.vx;
      o.y += o.vy;

      // ricochete nos portais (fase 2)
      if (this.phase === 2) {
        for (const p of this._portals) {
          if (Math.hypot(o.x - p.x, o.y - p.y) < 30) {
            // sai do portal oposto na direção do player
            const op = this._portals.find(pp => pp !== p);
            if (op) {
              o.x = op.x; o.y = op.y;
              const dx = Player.x - op.x, dy = Player.y - op.y;
              const spd = Math.hypot(o.vx, o.vy);
              const ang = Math.atan2(dy, dx);
              o.vx = Math.cos(ang) * spd * 1.15;
              o.vy = Math.sin(ang) * spd * 1.15;
            }
            break;
          }
        }
      }

      if (o.life <= 0 || o.x < -20 || o.x > 1620 || o.y < -20 || o.y > 500) {
        this._orbs.splice(i,1); continue;
      }
      if (!player.invincible && boxHits(o, player.hurtBox)) {
        player.takeDamage(1, o.x);
        this._orbs.splice(i,1);
      }
    }

    // ── Raios descendentes ───────────────────────────────────
    for (let i = this._beams.length-1; i >= 0; i--) {
      const b = this._beams[i];
      b.timer += dt;
      if (b.timer >= b.maxTimer) { this._beams.splice(i,1); continue; }

      // na metade do tempo, causa dano
      if (b.timer > b.maxTimer * 0.55) {
        const beamHurt = { x: b.x - b.width/2, y: 0, width: b.width, height: 900 };
        if (!player.invincible && boxHits(beamHurt, player.hurtBox)) {
          player.takeDamage(1, b.x);
        }
      }
    }
  }

  startDefeat() {
    this._orbs = []; this._beams = []; this._portals = [];
    for (let i = 0; i < 16; i++)
      Particles.death(this.x + Math.random()*80, this.y + Math.random()*96, '#cc99ff');
  }

  draw(ctx) {
    if (this.health <= 0 && !BossSystem.defeatActive) return;
    const sx = this.x - Camera.x, sy = this.y, w = this.width, h = this.height;
    const ph2 = this.phase === 2;
    const now  = Date.now();
    ctx.save();
    if (this.invincible) ctx.globalAlpha = (Math.floor(now/60)%2===0) ? 0.2 : 1;

    // ── Portais ──────────────────────────────────────────────
    for (const p of this._portals) {
      const psx = p.x - Camera.x;
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (let r = 3; r >= 1; r--) {
        ctx.strokeStyle = r===3 ? '#cc99ff' : r===2 ? '#9944ff' : '#6600cc';
        ctx.shadowColor = '#cc99ff'; ctx.shadowBlur = 14;
        ctx.lineWidth = r * 1.5;
        ctx.beginPath(); ctx.ellipse(psx, p.y, 20+r*4, 30+r*4, p.angle, 0, Math.PI*2); ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.restore();
    }

    // ── Raios ────────────────────────────────────────────────
    for (const b of this._beams) {
      const pct = b.timer / b.maxTimer;
      const bsx = b.x - Camera.x;
      ctx.save();
      if (pct < 0.5) {
        // aviso — linha pontilhada vermelha
        ctx.globalAlpha = pct * 2 * 0.7;
        ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2; ctx.setLineDash([6,6]);
        ctx.beginPath(); ctx.moveTo(bsx, 0); ctx.lineTo(bsx, 900); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // raio ativo
        ctx.globalAlpha = (1 - (pct - 0.5) * 2) * 0.9 + 0.3;
        const grd = ctx.createLinearGradient(bsx - b.width/2, 0, bsx + b.width/2, 0);
        grd.addColorStop(0, 'rgba(204,153,255,0)');
        grd.addColorStop(0.5, ph2 ? '#ffffff' : '#cc99ff');
        grd.addColorStop(1, 'rgba(204,153,255,0)');
        ctx.fillStyle = grd;
        ctx.shadowColor = '#cc99ff'; ctx.shadowBlur = 20;
        ctx.fillRect(bsx - b.width/2, 0, b.width, 900);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // ── Orbs ─────────────────────────────────────────────────
    for (const o of this._orbs) {
      const osx = o.x - Camera.x;
      ctx.save();
      ctx.translate(osx, o.y); ctx.rotate(o.spin);
      ctx.shadowColor = o.glow; ctx.shadowBlur = 14;
      ctx.fillStyle = o.glow;
      // losango
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0);
      ctx.closePath(); ctx.fill();
      // anel
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    }

    // ── Corpo da Entidade ────────────────────────────────────
    ctx.globalAlpha = this.invincible ? (Math.floor(now/60)%2===0 ? 0.2 : 1) : 1;

    // runas orbitando
    const numRunes = ph2 ? 8 : 5;
    for (let i = 0; i < numRunes; i++) {
      const ra = this._runeAngle + (Math.PI * 2 / numRunes) * i;
      const rx = sx + w/2 + Math.cos(ra) * (w*.7 + 8);
      const ry = sy + h/2 + Math.sin(ra) * (h*.5 + 8);
      const pulse = 0.6 + 0.4 * Math.sin(this._pulseTime + i);
      ctx.fillStyle = ph2 ? `rgba(204,153,255,${pulse})` : `rgba(153,68,255,${pulse})`;
      ctx.shadowColor = '#cc99ff'; ctx.shadowBlur = 10;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(ra * 2);
      ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(5,0); ctx.lineTo(0,5); ctx.lineTo(-5,0); ctx.closePath();
      ctx.fill(); ctx.restore();
    }
    ctx.shadowBlur = 0;

    // aura exterior
    const auraAlpha = 0.12 + 0.08 * Math.sin(this._pulseTime);
    ctx.globalAlpha = auraAlpha;
    ctx.fillStyle = ph2 ? '#ff88ff' : '#9944ff';
    ctx.beginPath(); ctx.ellipse(sx+w/2, sy+h/2, w*.9, h*.8, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = this.invincible ? (Math.floor(now/60)%2===0 ? 0.2 : 1) : 1;

    // manto / corpo principal
    const bg = ctx.createRadialGradient(sx+w/2, sy+h*.4, 4, sx+w/2, sy+h*.5, w*.6);
    bg.addColorStop(0, ph2 ? '#220033' : '#110022');
    bg.addColorStop(0.6, ph2 ? '#440066' : '#220044');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    // forma alongada e etérea
    ctx.beginPath();
    ctx.moveTo(sx + w*.2, sy + h);
    ctx.bezierCurveTo(sx - 10, sy + h*.7, sx, sy + 10, sx + w*.5, sy + 4);
    ctx.bezierCurveTo(sx + w, sy + 10, sx + w + 10, sy + h*.7, sx + w*.8, sy + h);
    ctx.bezierCurveTo(sx + w*.6, sy + h + 10, sx + w*.4, sy + h + 10, sx + w*.2, sy + h);
    ctx.fill();

    // rosto — máscara antiga
    ctx.fillStyle = ph2 ? '#330044' : '#220033';
    ctx.beginPath(); ctx.ellipse(sx+w/2, sy+h*.3, w*.3, h*.22, 0, 0, Math.PI*2); ctx.fill();

    // olhos — fendas verticais que pulsam
    const eyeC = ph2 ? '#ffffff' : '#cc99ff';
    ctx.shadowColor = eyeC; ctx.shadowBlur = ph2 ? 20 : 12;
    ctx.fillStyle = eyeC;
    const ep = 0.8 + 0.2 * Math.sin(this._pulseTime * 2);
    ctx.beginPath();
    ctx.ellipse(sx+w*.36, sy+h*.27, 3, 6*ep, 0, 0, Math.PI*2);
    ctx.ellipse(sx+w*.64, sy+h*.27, 3, 6*ep, 0, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur = 0;

    // coroa de chifres / espinhos ancestrais
    ctx.strokeStyle = ph2 ? '#cc99ff' : '#9944ff';
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const spikes = ph2 ? 7 : 5;
    for (let i = 0; i < spikes; i++) {
      const sa = -Math.PI + (Math.PI / (spikes-1)) * i;
      const slen = i === Math.floor(spikes/2) ? 28 : 18 - Math.abs(i - Math.floor(spikes/2)) * 3;
      const sx2 = sx + w/2 + Math.cos(sa) * w*.3;
      const sy2 = sy + h*.12;
      ctx.beginPath();
      ctx.moveTo(sx2, sy2);
      ctx.lineTo(sx2 + Math.cos(sa)*slen, sy2 + Math.sin(sa)*slen - 4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // fios de energia caindo do manto
    if (ph2) {
      for (let i = 0; i < 4; i++) {
        const fx = sx + w*.15 + (w*.7 / 3) * i;
        const fy = sy + h * 0.85;
        const flen = 20 + Math.sin(this._pulseTime * 2 + i) * 8;
        ctx.strokeStyle = `rgba(204,153,255,${0.3 + 0.2*Math.sin(this._pulseTime+i)})`;
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + (Math.random()-0.5)*4, fy+flen); ctx.stroke();
      }
    }

    ctx.restore();
  }
}


// ════════════════════════════════════════════════════════════
// BOITATÁ — guardião do pântano
// ════════════════════════════════════════════════════════════
class BossBoitata {
  constructor() {
    Object.assign(this, bossBase({
      id:'boitata', displayName:'BOITATÁ', subtitle:'A Serpente de Fogo',
      nameColor:'#ff9a2f', x:980, y:520, width:112, height:54,
      maxHealth:34, phaseThreshold:0.5, gravity:0,
    }));
    this._baseY=this.y; this._angle=0; this._fire=[]; this._dash=0; this._facing=-1;
  }
  introUpdate(dt){ this._introAnim+=dt; this.y=this._baseY+Math.sin(this._introAnim*3)*35; }
  onPhase2(){ this.attackCooldown=.25; Particles.special(this.x+this.width/2,this.y+this.height/2); }
  _spit(player){
    const dx=(player.x+player.width/2)-(this.x+this.width/2), dy=(player.y+player.height/2)-(this.y+this.height/2);
    const len=Math.max(1,Math.hypot(dx,dy)), sp=this.phase===2?7.5:6;
    this._fire.push({x:this.x+this.width/2,y:this.y+this.height/2,vx:dx/len*sp,vy:dy/len*sp,life:2.2,width:18,height:18});
  }
  update(dt, region, player){
    this.tickTimers(dt); this._angle+=dt*(this.phase===2?5:3);
    this.y=this._baseY+Math.sin(this._angle)*85;
    if(this._dash>0){
      this._dash-=dt; this.x+=this._facing*(this.phase===2?8.5:6.7);
      this.setHit(8,8,this.width-16,this.height-12);
      if(this.x<70){this.x=70;this._facing=1;} if(this.x+this.width>region.bounds.right-70){this.x=region.bounds.right-70-this.width;this._facing=-1;}
      if(this._dash<=0){this.clearHit();this.attackCooldown=this.phase===2?.55:1.0;}
    } else if(this.attackCooldown<=0){
      if(Math.random()<.42){this._facing=player.x<this.x?-1:1;this._dash=this.phase===2?.9:.7;}
      else { this._spit(player); if(this.phase===2) this._spit(player); this.attackCooldown=this.phase===2?.6:1.05; }
    }
    for(let i=this._fire.length-1;i>=0;i--){
      const f=this._fire[i];f.x+=f.vx;f.y+=f.vy;f.life-=dt;
      if(!player.invincible&&boxHits(f,player.hurtBox)){player.takeDamage(1,f.x);this._fire.splice(i,1);continue;}
      if(f.life<=0)this._fire.splice(i,1);
    }
    this.updateHurtBox();
  }
  startDefeat(){this._fire=[];for(let i=0;i<14;i++)Particles.death(this.x+Math.random()*this.width,this.y+Math.random()*this.height,'#ff9a2f');}
  draw(ctx){
    const sx=this.x-Camera.x,sy=this.y,w=this.width,h=this.height;ctx.save();
    if(this.invincible)ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?.25:1;
    const glow=this.phase===2?'#fff06a':'#ff9a2f';ctx.shadowColor=glow;ctx.shadowBlur=this.phase===2?22:14;
    for(let i=0;i<7;i++){const t=i/6,px=sx+t*w,py=sy+h/2+Math.sin(this._angle*1.4-i*.85)*13;ctx.fillStyle=i<2?'#ffcc45':i<5?'#e8651f':'#9a2414';ctx.beginPath();ctx.ellipse(px,py,14-i*.7,12-i*.55,-.15,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ffe66a';ctx.beginPath();ctx.arc(sx+10,sy+h/2-3,4.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    for(const f of this._fire){const fx=f.x-Camera.x;ctx.fillStyle='#ff6b1a';ctx.shadowColor='#ff9a2f';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(fx,f.y,9,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════
// CUCA — chefe final
// ════════════════════════════════════════════════════════════
class BossCuca {
  constructor(){
    Object.assign(this,bossBase({
      id:'cuca',displayName:'CUCA',subtitle:'A Feiticeira do Covil',nameColor:'#ff4f9a',
      x:760,y:690,width:78,height:108,maxHealth:46,phaseThreshold:.48,gravity:.55,
    }));
    this._state='stalk';this._orbs=[];this._facing=-1;this._leapCd=1.5;
  }
  introUpdate(dt){this._introAnim+=dt;this.x=760+Math.sin(this._introAnim*2)*18;}
  onPhase2(){this.attackCooldown=0;this._leapCd=.3;Particles.special(this.x+this.width/2,this.y+30);}
  _cast(player){
    const n=this.phase===2?3:1;
    for(let j=0;j<n;j++){
      const dx=(player.x+15)-(this.x+this.width/2),dy=(player.y+18)-(this.y+28),len=Math.max(1,Math.hypot(dx,dy));
      const a=(j-(n-1)/2)*.18,cs=Math.cos(a),sn=Math.sin(a),ux=dx/len,uy=dy/len,sp=this.phase===2?6.8:5.7;
      this._orbs.push({x:this.x+this.width/2,y:this.y+28,vx:(ux*cs-uy*sn)*sp,vy:(ux*sn+uy*cs)*sp,life:2.7,width:16,height:16});
    }
  }
  update(dt,region,player){
    this.tickTimers(dt);const dx=player.x-this.x;this._facing=dx<0?-1:1;this._leapCd-=dt;
    if(this._leapCd<=0&&Math.abs(dx)>180){this.vx=this._facing*(this.phase===2?5.1:4);this.vy=this.phase===2?-10.5:-8.8;this._leapCd=this.phase===2?1.15:1.7;}
    else if(this.onGround){this.vx*=.82;}
    if(this.attackCooldown<=0){this._cast(player);this.attackCooldown=this.phase===2?.72:1.25;}
    if(Math.abs(dx)<85&&this.attackTimer<=0){this.setHit(this._facing>0?this.width-8:-42,18,48,64);this.attackTimer=.22;}
    this.checkPhysics(region);
    for(let i=this._orbs.length-1;i>=0;i--){const o=this._orbs[i];o.x+=o.vx;o.y+=o.vy;o.life-=dt;o.vy+=.025;
      if(!player.invincible&&boxHits(o,player.hurtBox)){player.takeDamage(1,o.x);this._orbs.splice(i,1);continue;}if(o.life<=0)this._orbs.splice(i,1);}
  }
  startDefeat(){this._orbs=[];for(let i=0;i<18;i++)Particles.death(this.x+Math.random()*this.width,this.y+Math.random()*this.height,'#ff4f9a');}
  draw(ctx){
    const sx=this.x-Camera.x,sy=this.y,w=this.width,h=this.height;ctx.save();if(this.invincible)ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?.22:1;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(sx+w/2,sy+h+4,w*.58,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=this.phase===2?'#46142f':'#2c182b';ctx.beginPath();ctx.moveTo(sx+12,sy+h);ctx.lineTo(sx+w-12,sy+h);ctx.lineTo(sx+w*.72,sy+38);ctx.lineTo(sx+w*.28,sy+38);ctx.closePath();ctx.fill();
    ctx.fillStyle='#486b31';ctx.beginPath();ctx.ellipse(sx+w/2,sy+30,26,29,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d8c071';ctx.beginPath();ctx.moveTo(sx+w/2-6,sy+33);ctx.lineTo(sx+w/2+22,sy+42);ctx.lineTo(sx+w/2-3,sy+47);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ff4f9a';ctx.shadowColor='#ff4f9a';ctx.shadowBlur=this.phase===2?16:8;ctx.beginPath();ctx.arc(sx+w/2+5,sy+25,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#70405f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx+20,sy+55);ctx.lineTo(sx-8,sy+78);ctx.moveTo(sx+w-20,sy+55);ctx.lineTo(sx+w+10,sy+72);ctx.stroke();
    for(const o of this._orbs){const ox=o.x-Camera.x;ctx.fillStyle='#ff75b7';ctx.shadowColor='#ff4f9a';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ox,o.y,8,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
