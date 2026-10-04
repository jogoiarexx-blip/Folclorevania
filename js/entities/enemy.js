// ============================================================
// js/entities/enemy.js
// ============================================================

function createEnemy(x, y, regionId) {
  return {
    x, y, regionId,
    width:34, height:36,
    vx:0, vy:0, gravity:0.55, onGround:false,
    speed:      1.2 + regionId * 0.15,
    health:     2   + regionId,
    maxHealth:  2   + regionId,
    attackTimer:0, invincible:false, invincibleTimer:0, knockbackTimer:0,
    _pt:0, aiState:'patrol', aiCooldown:0, windupTimer:0, _attackDir:1,
    hitBox:null, _hitSpec:null,
    hurtBox:{ x, y, width:34, height:36 },

    setHit(ox,oy,w,h){ this._hitSpec={ox,oy,w,h}; this.syncHitBox(); },
    syncHitBox(){ if(this._hitSpec){const h=this._hitSpec;this.hitBox={x:this.x+h.ox,y:this.y+h.oy,width:h.w,height:h.h};} },
    clearHit(){ this.hitBox=null; this._hitSpec=null; },
    updateHurtBox(){ this.hurtBox.x=this.x; this.hurtBox.y=this.y; },

    takeDamage(n, srcX) {
      if (this.invincible) return;
      this.health -= n;
      this.invincible=true; this.invincibleTimer=0.35;
      const dir = (srcX !== undefined && srcX < this.x) ? 1 : -1;
      this.vx=dir*4.5; this.vy=-2.5; this.knockbackTimer=0.14;
      Particles.impact(this.x+this.width/2, this.y+this.height/2, dir);
      if (typeof triggerScreenShake === 'function') triggerScreenShake(2.2, 0.08);
      if (this.health <= 0)
        Particles.death(this.x+this.width/2, this.y+this.height/2, '#44ff44');
    },

    updateAI(dt, player) {
      if (this.knockbackTimer > 0) return;
      const dist = Math.abs(this.x - player.x);
      switch(this.aiState) {
        case 'patrol':
          this._pt += dt;
          this.vx = Math.sin(this._pt*1.1)*this.speed;
          if (dist < 220) this.aiState='chase';
          break;
        case 'chase':
          this.vx = this.x < player.x ? this.speed : -this.speed;
          if (dist < 52 && this.aiCooldown <= 0) {
            this.aiState='windup'; this.windupTimer=0.16; this.vx=0;
            this._attackDir = this.x < player.x ? 1 : -1;
          }
          if (dist > 350) this.aiState='patrol';
          break;
        case 'windup':
          this.vx = 0;
          this.windupTimer -= dt;
          if (this.windupTimer <= 0) {
            const ox = this._attackDir > 0 ? this.width-4 : -36;
            this.setHit(ox,4,38,28);
            this.attackTimer=0.20; this.aiCooldown=1.45; this.aiState='chase';
          }
          break;
      }
      if (this.aiCooldown>0) this.aiCooldown-=dt;
    },

    update(dt, region, player) {
      if (this.health <= 0) return;
      this.updateAI(dt, player);
      resolvePhysics(this, region);
      this.updateHurtBox();
      this.syncHitBox();
      if (this.attackTimer>0){ this.attackTimer-=dt; if(this.attackTimer<=0) this.clearHit(); }
      if (this.knockbackTimer>0){ this.knockbackTimer-=dt; if(this.knockbackTimer<=0) this.knockbackTimer=0; }
      if (this.invincibleTimer>0){ this.invincibleTimer-=dt; if(this.invincibleTimer<=0) this.invincible=false; }
      if (this.hitBox && !player.invincible && boxHits(this.hitBox, player.hurtBox))
        player.takeDamage(1, this.x+this.width/2);
    },

    draw(ctx) {
      if(this.health<=0)return;
      const sx=this.x-Camera.x,sy=this.y,w=this.width,h=this.height;
      if(sx < -80 || sx > ctx.canvas.width + 80) return;
      const windup=this.aiState==='windup',atk=this.attackTimer>0,chase=this.aiState==='chase'||atk||windup,kb=this.knockbackTimer>0;
      const palettes=[
        ['#765635','#332419','#e2bf69'],['#3b7d34','#12351b','#b5ff69'],['#a9421b','#39110a','#ff8a32'],
        ['#6d3a8c','#27113c','#d882ff'],['#23734a','#0b2d20','#69ffb2'],['#4d328d','#160d35','#c5a0ff'],
        ['#2d6f59','#0b2d25','#ffad45'],['#7d345f','#2b1025','#ff75b7']
      ];
      const [base,dark,glow]=palettes[this.regionId]||palettes[0];
      const bob=Math.sin((typeof MapSystem!=='undefined'?MapSystem._time:0)*5+this.x*.01)*1.3;
      ctx.save();if(this.invincible)ctx.globalAlpha=(Math.floor(Date.now()/60)%2===0)?.35:1;
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(sx+w/2,sy+h+3,w*.48,4,0,0,Math.PI*2);ctx.fill();
      if(chase){ctx.globalAlpha=.11;ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(sx+w/2,sy+h*.55,w*.75,h*.7,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      const g=ctx.createRadialGradient(sx+w*.45,sy+h*.35,2,sx+w*.5,sy+h*.55,w*.75);g.addColorStop(0,kb?'#fff':atk?glow:base);g.addColorStop(1,dark);ctx.fillStyle=g;
      ctx.beginPath();ctx.moveTo(sx+w*.12,sy+h);ctx.bezierCurveTo(sx-4,sy+h*.62+bob,sx+2,sy+5,sx+w*.5,sy+2+bob);ctx.bezierCurveTo(sx+w-2,sy+5,sx+w+4,sy+h*.62-bob,sx+w*.88,sy+h);ctx.closePath();ctx.fill();
      // detalhes por região dão identidade visual aos inimigos
      ctx.strokeStyle=glow;ctx.fillStyle=glow;ctx.shadowColor=glow;ctx.shadowBlur=6;
      if(this.regionId===0){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+8,sy+7);ctx.lineTo(sx+3,sy-3);ctx.moveTo(sx+w-8,sy+7);ctx.lineTo(sx+w-3,sy-3);ctx.stroke();}
      else if(this.regionId===1){for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(sx+6+i*11,sy+5,5,2.5,(i-1)*.4,0,Math.PI*2);ctx.fill();}}
      else if(this.regionId===2){ctx.globalAlpha=.65;for(let i=0;i<3;i++){const fx=sx+8+i*9,fy=sy+4;ctx.beginPath();ctx.moveTo(fx,fy+7);ctx.quadraticCurveTo(fx-5,fy-5-(i%2)*4,fx+2,fy-10);ctx.quadraticCurveTo(fx+7,fy-2,fx,fy+7);ctx.fill();}ctx.globalAlpha=1;}
      else if(this.regionId===3){ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(sx+w/2,sy+h*.56,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+w/2,sy+h*.47);ctx.lineTo(sx+w/2,sy+h*.65);ctx.stroke();}
      else if(this.regionId===4){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+5,sy+14);ctx.quadraticCurveTo(sx-6,sy+5,sx+4,sy-4);ctx.moveTo(sx+w-5,sy+14);ctx.quadraticCurveTo(sx+w+6,sy+5,sx+w-4,sy-4);ctx.stroke();}
      else if(this.regionId===5){ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx+w/2,sy-5);ctx.lineTo(sx+w*.68,sy+5);ctx.lineTo(sx+w*.58,sy+14);ctx.lineTo(sx+w*.42,sy+14);ctx.lineTo(sx+w*.32,sy+5);ctx.closePath();ctx.stroke();}
      else if(this.regionId===6){ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+w/2,sy+6,8,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+7,sy+13);ctx.lineTo(sx+2,sy+3);ctx.moveTo(sx+w-7,sy+13);ctx.lineTo(sx+w-2,sy+3);ctx.stroke();}
      else if(this.regionId===7){ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(sx+5,sy+7);ctx.lineTo(sx+w/2,sy-7);ctx.lineTo(sx+w-5,sy+7);ctx.stroke();ctx.beginPath();ctx.arc(sx+w/2,sy+h*.58,7,0,Math.PI*2);ctx.stroke();}
      ctx.shadowBlur=0;ctx.globalAlpha=1;
      if(windup){ctx.strokeStyle='#fff1be';ctx.globalAlpha=.45+.25*Math.sin((typeof MapSystem!=='undefined'?MapSystem._time:0)*18);ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+w/2,sy+h/2,w*.68,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      // olhos
      const eye=kb?'#fff':(atk||windup)?'#fff1be':glow;ctx.fillStyle=eye;ctx.shadowColor=eye;ctx.shadowBlur=chase?9:5;ctx.beginPath();ctx.arc(sx+w*.31,sy+h*.38+bob,2.7,0,Math.PI*2);ctx.arc(sx+w*.69,sy+h*.38+bob,2.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      // HP só aparece quando ferido
      if(this.health<this.maxHealth){ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.roundRect(sx-2,sy-10,w+4,4,2);ctx.fill();ctx.fillStyle=glow;ctx.beginPath();ctx.roundRect(sx-2,sy-10,(w+4)*(this.health/this.maxHealth),4,2);ctx.fill();}
      ctx.restore();
    },
  };
}

function spawnEnemies(region) {
  region.enemies = region.enemyDefs.map(def => createEnemy(def.x, def.y, region.id));
}
