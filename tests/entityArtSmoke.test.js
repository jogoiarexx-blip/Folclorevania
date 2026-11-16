// Folclorevania v3.0 - Smoke test da arte procedural.
// Execute: node tests/entityArtSmoke.test.js (Node 18+, sem npm).
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../js/entities/entityArt.js'),'utf8');
const env={Camera:{x:0},GameSettings:{quality:'high'},console,Math,Date,Number};
vm.createContext(env);
vm.runInContext(src,env,{filename:'entityArt.js'});
const Art=vm.runInContext('EntityArt',env);
const gradient=()=>({addColorStop(){}});
let calls=0,saves=0,restores=0,invalid=0;
const ctx=new Proxy({canvas:{width:1600,height:900}},{
  get(obj,key){
    if(key in obj)return obj[key];
    if(key==='createRadialGradient'||key==='createLinearGradient')return gradient;
    if(key==='measureText')return t=>({width:String(t).length*8});
    if(typeof key==='symbol')return undefined;
    return (...args)=>{
      calls++;
      if(key==='save')saves++;
      if(key==='restore')restores++;
      if(args.some(a=>typeof a==='number'&&!Number.isFinite(a)))invalid++;
    };
  },
  set(obj,k,v){obj[k]=v;return true;}
});
const player={x:240,y:720,width:30,height:46,facing:1,onGround:true,
  state:'idle',attackTimer:0,specialTimer:0,health:6,maxHealth:6,
  invincible:false,vx:0,vy:0,stamina:100};
const heroStates=['idle','run','jump','dash','attack','charge','special','hurt'];
let scenarios=0;
for(const quality of ['low','medium','high']){
  env.GameSettings.quality=quality;
  for(const state of heroStates){
    player.state=state;
    player.onGround=state!=='jump';
    player.vx=state==='dash'?7.5:state==='run'?3.2:0;
    player.attackTimer=state==='attack'?.15:0;
    Art.updatePlayer(1/60,player);
    Art.update(1/60);
    const old=JSON.stringify({x:player.x,y:player.y,health:player.health,state:player.state});
    Art.drawPlayer(ctx,player);
    assert.equal(JSON.stringify({x:player.x,y:player.y,health:player.health,state:player.state}),old,
      'drawPlayer nao modifica fisica');
    scenarios++;
  }
}
for(const quality of ['low','medium','high']){
  env.GameSettings.quality=quality;
  for(let regionId=0;regionId<8;regionId++){
    for(const kind of ['espreitador','brutamontes','saltador']){
      const enemy={x:900,y:740,width:34,height:36,regionId,kind,
        health:3,maxHealth:5,speed:1.3,vx:1.3,_animTime:regionId*.2,
        aiState:regionId%2?'windup':'chase',windupTimer:.18,windupDuration:.33,
        _attackDir:1,onGround:regionId%2===0,attackTimer:regionId%3===0?.2:0,
        _artHitFlash:.07};
      const old=JSON.stringify(enemy);
      Art.drawEnemy(ctx,enemy);
      assert.equal(JSON.stringify(enemy),old,'drawEnemy nao modifica inimigo');
      scenarios++;
    }
  }
}
Art.reset();
env.GameSettings.quality='high';player.state='dash';
for(let i=0;i<30;i++){Art.updatePlayer(1/60,player);Art.update(1/60)}
assert.ok(Art.heroTrail.length<=6,'limite do rastro');
for(let i=0;i<35;i++)Art.enemyDeath({x:500,y:750,kind:'brutamontes',regionId:2});
assert.equal(Art.deathEchoes.length,16,'limite de ecos de morte');
Art.drawEchoes(ctx,2);
for(let i=0;i<40;i++)Art.update(1/60);
assert.equal(Art.deathEchoes.length,0,'ecos expiram');
Art.reset();
assert.equal(Art.heroTrail.length,0,'reset limpa efeitos');
assert.equal(saves,restores,'canvas save/restore equilibrado');
assert.equal(invalid,0,'coordenadas finitas');
assert.ok(calls>1200,'render realmente desenhou');
assert.equal(scenarios,96,'cobertura 24 herois + 72 inimigos');
console.log('PASS 96 combinacoes de render; '+calls+' chamadas Canvas; efeitos limitados e sem alteracao da fisica.');
