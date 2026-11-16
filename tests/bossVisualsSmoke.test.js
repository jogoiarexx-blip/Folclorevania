// Smoke test dos sete visuais — execute: node tests/bossVisualsSmoke.test.js
// Sem bibliotecas externas, DOM ou GPU; não substitui teste visual no navegador.
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const player={
  x:420,y:740,width:30,height:46,vx:0,vy:0,
  hurtBox:{x:420,y:740,width:30,height:46},
  abilities:{_confused:false},invincible:true,health:7,takeDamage(){},
};
const particles=new Proxy({}, {get:()=>()=>{}});
const env={
  console,Math,Date,Number,Array,Object,
  Camera:{x:0},
  GameSettings:{quality:'high'},
  Player:player,Particles:particles,
  triggerScreenShake(){},boxHits(){return false},_overlap(){return false},
  BossHUD:{_displayPct:1},
  resolvePhysics(b){
    b.onGround=true;b.updateHurtBox();b.syncHitBox();
  },
};
vm.createContext(env);
for(const file of ['js/entities/bossSystem.js','js/entities/bossVisuals.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),env,{filename:file});
}
const system=vm.runInContext('BossSystem',env);
const visuals=vm.runInContext('BossVisuals',env);
const makeGradient=()=>({addColorStop(){}});
let drawCalls=0;
const ctx=new Proxy({canvas:{width:1280,height:900}}, {
  get(obj,key){
    if(key in obj)return obj[key];
    if(key==='createRadialGradient'||key==='createLinearGradient')return makeGradient;
    if(key==='measureText')return s=>({width:String(s).length*9});
    if(typeof key==='symbol')return undefined;
    return (...args)=>{
      if(args.some(a=>typeof a==='number' && !Number.isFinite(a)))
        throw new Error('Coordenada inválida em '+String(key));
      drawCalls++;
    };
  },
  set(obj,key,value){obj[key]=value;return true;}
});
const ids=['saci','mula','curupira','caipora','ancestral','boitata','cuca'];
let total=0;
for(const id of ids){
  system.start(id,[],()=>{});
  system.introActive=false;
  const boss=system.boss;
  assert.equal(boss.id,id);
  for(const quality of ['low','medium','high']){
    env.GameSettings.quality=quality;
    for(const phase of [1,2]){
      boss.phase=phase;
      boss.visualPhasePulse=.8;
      boss.visualHitTimer=.12;
      for(let i=0;i<4;i++){
        system.update(1/60);
        const snap=[boss.health,boss.phase,boss.x,boss.y];
        const t=visuals.time;
        system.draw(ctx);
        assert.deepEqual([boss.health,boss.phase,boss.x,boss.y],snap,
          'desenho não deve alterar mecânica: '+id);
        assert.equal(visuals.time,t,'desenho não deve avançar tempo de jogo');
      }
      total++;
    }
  }
}
assert.ok(drawCalls>500,'caminhos de desenho realmente executados');
assert.equal(total,42);
console.log('PASS 42 cenários (7 chefes x 3 qualidades x 2 fases); comandos canvas:',drawCalls);
