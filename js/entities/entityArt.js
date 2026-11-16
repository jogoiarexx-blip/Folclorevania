// Folclorevania v3.0 — arte procedural de personagem e inimigos.
// O renderer nao altera hitboxes, velocidade, HP nem objetos serializados.
// Atualizado somente no fixed timestep; nenhum asset ou lib externa.
const EntityArt = {
  clock:0, heroTime:0, heroTrail:[], deathEchoes:[],
  quality(){return typeof GameSettings!=='undefined'?GameSettings.quality:'high';},
  reset(){this.clock=0;this.heroTime=0;this.heroTrail=[];this.deathEchoes=[];},
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.05);this.clock+=dt;
    for(const e of this.deathEchoes)e.age+=dt;
    this.deathEchoes=this.deathEchoes.filter(e=>e.age<.58);
  },
  updatePlayer(dt,p){
    if(!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.05);this.heroTime+=dt;
    for(const echo of this.heroTrail)echo.age+=dt;
    this.heroTrail=this.heroTrail.filter(e=>e.age<.23);
    p._artHitFlash=Math.max(0,(p._artHitFlash||0)-dt);
    if((p.state==='dash'||p.state==='charge') && this.quality()!=='low'){
      // Acumula somente 1 fantasma a cada 2 quadros; limite rigido.
      if((Math.floor(this.heroTime*60)&1)===0){
        this.heroTrail.push({x:p.x,y:p.y,dir:p.facing,state:p.state,age:0});
        if(this.heroTrail.length>6)this.heroTrail.shift();
      }
    }
  },
  enemyHit(e){e._artHitFlash=.17;},
  enemyDeath(e){
    this.deathEchoes.push({x:e.x,y:e.y,kind:e.kind,regionId:e.regionId,age:0});
    if(this.deathEchoes.length>16)this.deathEchoes.shift();
  },
  line(ctx,pts,color,w=2){
    if(pts.length<2)return;
    ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.stroke();
  },
  shape(ctx,pts,fill,stroke='#15121b',w=1.3){
    if(!pts.length)return;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
  },
  oval(ctx,x,y,rx,ry,fill,stroke=null,w=1.2){
    ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);
    ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
  },
  circle(ctx,x,y,r,fill,stroke=null){this.oval(ctx,x,y,r,r,fill,stroke);},
  glow(ctx,color,blur){
    const q=this.quality();
    ctx.shadowBlur=q==='low'?0:q==='medium'?blur*.4:blur*.75;
    ctx.shadowColor=color;
  },
  drawTrail(ctx,p){
    if(this.quality()==='low')return;
    const color=p.state==='charge'?'#fc8038':'#49e4ec';
    ctx.save();
    for(const e of this.heroTrail){
      const alpha=.20*(1-e.age/.23);if(alpha<=0)continue;
      const sx=e.x+p.width/2-Camera.x,sy=e.y+p.height;
      ctx.globalAlpha=alpha;ctx.fillStyle=color;
      ctx.beginPath();ctx.ellipse(sx,sy-25,12,26,0,0,Math.PI*2);ctx.fill();
      this.line(ctx,[[sx-e.dir*3,sy-31],[sx-e.dir*21,sy-22],[sx-e.dir*38,sy-26]],color,2);
    }
    ctx.restore();
  },
  drawPlayer(ctx,p){
    const sx=p.x+p.width/2-Camera.x,sy=p.y+p.height;
    if(sx<-100||sx>ctx.canvas.width+100)return;
    const st=p.state,dir=p.facing||1,t=this.heroTime;
    const moving=st==='run',air=st==='jump'||(!p.onGround&&st!=='hurt');
    const stride=moving?Math.sin(t*15)*6:0;
    const bob=moving?Math.abs(Math.sin(t*15))*1.4:Math.sin(t*2.7)*.55;
    const lean=st==='dash'?.16:st==='charge'?.21:st==='hurt'?.14:0;
    const energy=st==='dash'?'#5fe9f5':st==='charge'?'#ff994f':st==='special'?'#d69cff':'#ecc985';
    ctx.save();
    // A sombra fica na escala do mundo e nao aumenta a hitbox.
    if(p.onGround)this.oval(ctx,sx,sy+3,21,4,'rgba(0,0,0,.43)');
    if(st==='dash'||st==='charge')this.drawTrail(ctx,p);
    ctx.translate(sx,sy+bob);ctx.scale(1.29,1.29);
    if(lean)ctx.rotate(-dir*lean);
    if(p.invincible && st!=='dash'&&st!=='charge'&&(Math.floor(t*13)%2===0))
      ctx.globalAlpha=.63;
    // Manto em camadas, com peso proprio, afastado da arma.
    const flap=Math.sin(t*6.8)*2.5+(moving?stride*.6:0);
    this.shape(ctx,[[-9,-38],[-17-dir*3,-24],[-22-dir*9+flap,-3],
      [-10-dir*5,0],[10,0],[9,-38]],'#321925','#190d15',1.7);
    this.shape(ctx,[[-8,-38],[-16-dir*4,-20],[-16-dir*8+flap,-6],
      [-7,-9],[7,-36]],'#712a37','#3a1a29',1.3);
    this.line(ctx,[[-8,-36],[-15-dir*3,-20],[-16-dir*8+flap,-7]],'#a85759',1.3);
    // Pernas segmentadas e botas com tornozelos distintos.
    const leftLeg=air?6:stride,rightLeg=air?-8:-stride;
    this.line(ctx,[[-5,-15],[-7+leftLeg*.45,-9],[-8+leftLeg, -1]],'#191722',7);
    this.line(ctx,[[5,-15],[7+rightLeg*.45,-9],[8+rightLeg,-1]],'#191722',7);
    this.line(ctx,[[-5,-15],[-7+leftLeg*.45,-9],[-8+leftLeg,-1]],'#574335',4.8);
    this.line(ctx,[[5,-15],[7+rightLeg*.45,-9],[8+rightLeg,-1]],'#574335',4.8);
    this.shape(ctx,[[-13+leftLeg,-5],[-3+leftLeg,-5],[-1+leftLeg,-1],[-14+leftLeg,0]],'#241e24','#0a0a0f',1.5);
    this.shape(ctx,[[3+rightLeg,-5],[13+rightLeg,-5],[15+rightLeg,0],[2+rightLeg,0]],'#241e24','#0a0a0f',1.5);
    this.line(ctx,[[-10+leftLeg,-2],[-3+leftLeg,-2]],'#aa8158',1);
    this.line(ctx,[[5+rightLeg,-2],[12+rightLeg,-2]],'#aa8158',1);
    // Torso: jaqueta reforcada, ombreiras, faixas e ferragens.
    this.shape(ctx,[[-9,-40],[-13,-31],[-10,-17],[10,-17],[13,-31],[9,-40]],
      st==='hurt'?'#aa5052':'#72523c','#231b21',2);
    this.shape(ctx,[[-8,-38],[-3,-39],[0,-18],[-10,-19]],'#a27445',null);
    this.shape(ctx,[[3,-39],[9,-38],[10,-21],[0,-18]],'#463345',null);
    this.line(ctx,[[-8,-37],[7,-23]],'#d9ab6a',2.6);
    this.line(ctx,[[-8,-24],[9,-24]],'#342027',4.7);
    this.shape(ctx,[[-2,-27],[3,-27],[4,-22],[-3,-22]],'#eac88a','#5e3d28',1.3);
    this.shape(ctx,[[-14,-38],[-8,-43],[-2,-36],[-7,-30],[-15,-32]],'#8f7376','#291d25',1.5);
    this.shape(ctx,[[7,-42],[14,-39],[15,-32],[9,-30],[3,-36]],'#8f7376','#291d25',1.5);
    // Braço secundario em passo ou defesa.
    this.line(ctx,[[-11,-35],[-14+stride*.25,-24],[-10+stride*.45,-17]],'#3e2930',7);
    this.line(ctx,[[-11,-35],[-14+stride*.25,-24],[-10+stride*.45,-17]],'#ac795a',3.7);
    this.shape(ctx,[[-13+stride*.45,-20],[-8+stride*.45,-19],[-7+stride*.45,-13],[-14+stride*.45,-14]],'#4a3843','#1c1721',1);
    // Cabeca com contorno/rosto/lencos e chapeu de aba estilizado.
    this.shape(ctx,[[-5,-41],[6,-41],[5,-36],[-4,-36]],'#9f684c',null);
    this.oval(ctx,0,-50,9.5,11,'#251c21','#100f13',1.4);
    this.oval(ctx,1,-48,8,9.2,'#d7a779','#533c39',.9);
    this.oval(ctx,-5,-48,2,3,'#e4b78b');
    this.shape(ctx,[[-8,-56],[-5,-63],[4,-65],[10,-55]],'#362322','#1b161a',1.1);
    this.shape(ctx,[[-9,-59],[-8,-66],[-3,-70],[7,-70],[10,-61],[11,-58]],
      '#412c28','#1c171c',1.6);
    this.oval(ctx,1,-59,18,3.7,'#32252a','#1b151b',1.5);
    this.line(ctx,[[-9,-61],[11,-61]],'#aa7949',2.3);
    this.shape(ctx,[[-1,-66],[4,-66],[2,-62],[-3,-62]],'#deb874','#704b34',.8);
    const eyeX=dir*4+1;
    this.line(ctx,[[eyeX-1,-49],[eyeX+2,-49]],'#36251e',1.7);
    this.circle(ctx,eyeX+1,-48.8,1.2,st==='special'?'#e6bbff':'#1f1720');
    this.line(ctx,[[dir*7,-46],[dir*9,-43],[dir*4,-42]],'#835a45',1.2);
    // Lenco no pescoco, com ponta animada.
    this.shape(ctx,[[-7,-39],[7,-39],[4,-35],[-4,-35]],'#923d42','#37232d',.9);
    this.shape(ctx,[[dir*3,-37],[dir*7,-34],[dir*9+flap*.5,-20],[dir*5,-27]],
      '#b14e4e','#44212e',1);
    // Braco da arma; a lamina acompanha o estado do ataque.
    const swing=st==='attack'?Math.min(1,Math.max(0,1-(p.attackTimer||0)/.25)):0;
    const armY=st==='attack'?-40+17*swing:st==='charge'?-29:-25;
    const gripX=dir*(st==='attack'?22:st==='charge'?24:16);
    const gripY=armY+(st==='attack'?10*swing:2);
    this.line(ctx,[[dir*10,-35],[dir*16,-30],[gripX,gripY]],'#39272a',8);
    this.line(ctx,[[dir*10,-35],[dir*16,-30],[gripX,gripY]],'#ae7e5e',4.2);
    this.shape(ctx,[[gripX-dir*3,gripY-4],[gripX+dir*4,gripY-4],
      [gripX+dir*5,gripY+3],[gripX-dir*3,gripY+4]],'#3b3034','#1c1720',1.4);
    // Espada de metal com fio e guarda separados; inclinacao dinâmica.
    ctx.save();ctx.translate(gripX,gripY);ctx.rotate(dir*(st==='attack'?-0.85+swing*1.9:-.13));
    this.line(ctx,[[0,5],[0,-10]],'#64432e',4.3);
    this.line(ctx,[[-9,-10],[9,-10]],'#c89956',3.8);
    this.shape(ctx,[[-5,-11],[-4,-32],[0,-44],[4,-32],[5,-11]],'#bfc9d2','#343b4a',1.2);
    this.shape(ctx,[[0,-42],[3,-30],[0,-14]],'#f5f5e4',null);
    this.line(ctx,[[0,-29],[0,-13]],'#7a95a8',.8);
    this.circle(ctx,0,-9,2.5,energy,'#4d3541');
    ctx.restore();
    if(st==='attack'){
      const frac=Math.max(0,Math.min(1,1-(p.attackTimer||0)/.25));
      ctx.save();ctx.globalAlpha=.75*(1-frac*.65);
      this.glow(ctx,'#f9dd8e',9);
      ctx.strokeStyle='#fae1a7';ctx.lineWidth=4.5;ctx.beginPath();
      const a=-1.4+frac*1.8;
      ctx.arc(dir*9,-32,33,a,a+Math.PI*.55);ctx.stroke();
      ctx.strokeStyle='#fff9d9';ctx.lineWidth=1.6;ctx.beginPath();
      ctx.arc(dir*9,-32,39,a,a+Math.PI*.46);ctx.stroke();
      ctx.restore();
    }
    if(st==='special'){
      ctx.save();this.glow(ctx,'#c38aff',14);
      for(let i=0;i<3;i++){
        const angle=t*3+i*2.094;
        this.circle(ctx,Math.cos(angle)*27,-30+Math.sin(angle)*22,2.7,'#ddb3ff');
      }
      ctx.strokeStyle='rgba(205,130,255,.62)';ctx.lineWidth=2;ctx.beginPath();
      ctx.ellipse(0,-28,31+Math.sin(t*10)*3,33,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if((p._artHitFlash||0)>0){
      ctx.save();ctx.globalAlpha=Math.min(.8,p._artHitFlash*3.5);
      this.glow(ctx,'#fff9f1',12);ctx.strokeStyle='#fff9e1';ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(0,-35,19,36,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    ctx.restore();
  },
  // Os tres arquétipos tem anatomias e animações diferentes.
  enemyColors(regionId){
    const base=[
      ['#88664a','#3a2928','#f5c36f'],
      ['#59895c','#273e36','#d6f385'],
      ['#a75d37','#442326','#ffb157'],
      ['#754c91','#342444','#dfa7ff'],
      ['#39896a','#1f4849','#89eac5'],
      ['#5b4d95','#282848','#e2bbff'],
      ['#ad7039','#493026','#ffe183'],
      ['#9d5b78','#40253a','#ff9bc5'],
    ];
    return base[Math.max(0,Math.min(base.length-1,regionId|0))];
  },
  drawEchoes(ctx,regionId){
    if(this.quality()==='low')return;
    ctx.save();
    for(const e of this.deathEchoes){
      if(e.regionId!==regionId)continue;
      const a=1-e.age/.58;
      ctx.globalAlpha=Math.max(0,a*.36);
      const sx=e.x+17-Camera.x,sy=e.y+36-e.age*18;
      this.oval(ctx,sx,sy-12,12+a*7,8+a*4,e.kind==='brutamontes'?'#e0a96d':e.kind==='saltador'?'#b3eddb':'#baa4db');
      this.line(ctx,[[sx-9,sy],[sx-16-a*8,sy-8-a*12]],'#e1caba',2*a);
      this.line(ctx,[[sx+9,sy],[sx+16+a*8,sy-8-a*12]],'#e1caba',2*a);
    }
    ctx.restore();
  },
  drawEnemy(ctx,e){
    if(e.health<=0)return;
    const sx=e.x+e.width/2-Camera.x,sy=e.y+e.height;
    if(sx<-90||sx>ctx.canvas.width+90)return;
    const [base,dark,glow]=this.enemyColors(e.regionId),t=e._animTime||0;
    const chasing=e.aiState==='chase',windup=e.aiState==='windup';
    const stride=Math.sin(t*(e.kind==='saltador'?17:e.kind==='brutamontes'?8:12))*
      Math.min(1,Math.abs(e.vx)/Math.max(.3,e.speed));
    const jump=!e.onGround,flinch=(e._artHitFlash||0)>0;
    const bob=jump?-4:Math.sin(t*4)*1.2;
    ctx.save();
    if(e.onGround)this.oval(ctx,sx,sy+2,22,4,'rgba(0,0,0,.4)');
    ctx.translate(sx,sy+bob);ctx.scale(e.kind==='brutamontes'?1.37:e.kind==='saltador'?1.24:1.2,
      e.kind==='brutamontes'?1.34:1.22);
    const face=(windup || e.attackTimer>0) ? (e._attackDir||1) : ((e.vx||0)>=0?1:-1);
    if(flinch)ctx.globalAlpha=.78;
    if(e.kind==='espreitador'){
      // Predador da mata: quatro patas, mandibula comprida e espinhos.
      this.shape(ctx,[[-20,-24],[-13,-34],[7,-32],[17,-24],[16,-11],[-15,-9]],
        dark,'#130f1c',2);
      this.shape(ctx,[[-14,-31],[-5,-38],[8,-35],[17,-27],[6,-21],[-17,-23]],base,'#231c23',1.6);
      // Dorso peludo e escamas de regiao.
      for(let i=0;i<4;i++){
        const xx=-13+i*7;
        this.shape(ctx,[[xx,-29],[xx+3,-38-(i%2)*4],[xx+8,-28]],
          i%2?base:dark,'#241e25',.7);
      }
      for(const side of [-1,1]){
        this.line(ctx,[[side*11,-14],[side*(12+stride*3),-5],[side*(17+stride*4),1]],
          dark,6);
        this.line(ctx,[[side*11,-14],[side*(12+stride*3),-5],[side*(17+stride*4),1]],
          base,3.4);
        this.line(ctx,[[side*(17+stride*4),1],[side*(23+stride*4),-1]],'#d9ba8f',2.3);
      }
      this.shape(ctx,[[-11,-30],[-12,-43],[-3,-35],[7,-35],[13,-43],[14,-28]],
        base,'#281d25',1.6);
      this.shape(ctx,[[4,-30],[21,-27],[22,-22],[8,-21]],'#5a483e','#1e1821',1.4);
      this.line(ctx,[[12,-21],[22,-19]],'#e1c6a0',1.6);
      this.circle(ctx,9,-30,3.6,glow,'#1c1b19');
      this.circle(ctx,-3,-30,3.1,glow,'#1c1b19');
      this.circle(ctx,10,-30,1.1,'#ffffff');
    }else if(e.kind==='brutamontes'){
      // Golem de pedra: membros em blocos, rachaduras e núcleo.
      for(const side of [-1,1]){
        const sx=side*(13+stride*2);
        this.shape(ctx,[[sx-6,-14],[sx+5,-15],[sx+8,0],[sx-7,0]],
          dark,'#1b1820',2);
        this.shape(ctx,[[sx-8,-1],[sx+8,-1],[sx+11,3],[sx-10,3]],
          base,'#1c1820',1.4);
      }
      this.shape(ctx,[[-18,-35],[-12,-45],[11,-45],[18,-35],[18,-13],
        [10,-9],[-13,-9],[-18,-16]],base,'#241d24',2.6);
      this.shape(ctx,[[-20,-40],[-7,-49],[-1,-40],[-6,-26],[-22,-27]],dark,
        '#1d1820',2);
      this.shape(ctx,[[20,-40],[7,-49],[1,-40],[7,-26],[23,-27]],dark,
        '#1d1820',2);
      this.shape(ctx,[[-9,-41],[10,-41],[13,-28],[0,-26],[-12,-30]],'#6a6359',
        '#231b23',1.3);
      this.shape(ctx,[[-7,-42],[0,-52],[10,-46],[11,-35],[-9,-35]],dark,'#201923',1.5);
      for(const side of [-1,1]){
        this.shape(ctx,[[side*13,-34],[side*23,-35],[side*27,-18],[side*21,-12],
          [side*13,-19]],base,'#201a21',2);
        this.shape(ctx,[[side*19,-13],[side*27,-13],[side*27,-5],[side*19,-4]],
          dark,'#241b22',1.2);
      }
      this.glow(ctx,glow,9);
      this.shape(ctx,[[0,-33],[7,-28],[4,-20],[-4,-20],[-8,-27]],glow,'#20151d',1.6);
      ctx.shadowBlur=0;
      this.line(ctx,[[-11,-24],[-15,-18],[-6,-13]],'#b0a08c',1.6);
      this.line(ctx,[[8,-41],[13,-35],[8,-30]],'#af998b',1.3);
      this.circle(ctx,-5,-40,2.3,glow);
      this.circle(ctx,6,-40,2.3,glow);
    }else{
      // Saltador: silhueta anfibia, pernas longas e antenas de criatura noturna.
      const spring=jump?8:stride*7;
      for(const side of [-1,1]){
        this.line(ctx,[[side*7,-15],[side*(17+spring*.55),-7],
          [side*(19+spring),2]],dark,7);
        this.line(ctx,[[side*7,-15],[side*(17+spring*.55),-7],
          [side*(19+spring),2]],base,4);
        this.line(ctx,[[side*(19+spring),2],[side*(25+spring),0]],'#efe4b9',2);
      }
      this.shape(ctx,[[-12,-24],[-17,-36],[-5,-40],[9,-38],[14,-28],
        [12,-13],[1,-9],[-11,-15]],dark,'#201722',2);
      this.shape(ctx,[[-14,-31],[-10,-38],[8,-38],[14,-28],[6,-18],
        [-8,-18]],base,'#271d27',1.5);
      this.shape(ctx,[[-11,-34],[-20,-57],[-13,-61],[-2,-38]],base,'#211a23',1.5);
      this.shape(ctx,[[4,-37],[13,-61],[20,-58],[14,-32]],base,'#211a23',1.5);
      this.line(ctx,[[-13,-52],[-10,-43]],glow,2);
      this.line(ctx,[[13,-53],[10,-43]],glow,2);
      this.oval(ctx,0,-30,13,9,dark,'#211921',1.2);
      for(const side of [-1,1]){
        this.oval(ctx,side*6,-34,6,6,'#d4d4b7','#1c1c1e',1.4);
        this.circle(ctx,side*7.4+face*1,-34,2.5,glow,'#221925');
        this.circle(ctx,side*8.2+face*1,-35,1,'#ffffff');
      }
      this.line(ctx,[[-4,-22],[0,-20],[5,-22]],'#f0d7b7',1.6);
      for(const side of [-1,1])this.line(ctx,[[side*11,-21],
        [side*18,-18],[side*22,-13]],base,3);
    }
    // Identidade de bioma: cicatrizes/símbolos nas partes visiveis.
    this.line(ctx,[[-5,-18],[-2,-14],[3,-17]],glow,1);
    if(windup){
      const ready=1-Math.max(0,Math.min(1,e.windupTimer/e.windupDuration));
      ctx.save();
      ctx.globalAlpha=.55+ready*.38;ctx.strokeStyle='#ffe2a1';
      ctx.lineWidth=1.8+ready*2;ctx.beginPath();
      ctx.ellipse(0,-27,24+ready*6,20+ready*5,0,0,Math.PI*2);ctx.stroke();
      this.line(ctx,[[face*13,-20],[face*(30+ready*20),-20]],'#fff2ae',2.5);
      ctx.restore();
    }
    if(e.attackTimer>0){
      ctx.save();this.glow(ctx,glow,11);
      this.line(ctx,[[face*16,-21],[face*37,-16]],glow,4);
      ctx.restore();
    }
    if(flinch){
      ctx.save();ctx.globalAlpha=Math.min(.75,e._artHitFlash*4);
      ctx.strokeStyle='#fffaf0';ctx.lineWidth=2.6;ctx.beginPath();
      ctx.ellipse(0,-27,e.kind==='brutamontes'?25:19,26,0,0,Math.PI*2);
      ctx.stroke();ctx.restore();
    }
    ctx.restore();
    if(e.health<e.maxHealth){
      const pct=Math.max(0,Math.min(1,e.health/e.maxHealth));
      ctx.save();ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillRect(sx-23,sy-63,46,6);
      ctx.fillStyle=glow;ctx.fillRect(sx-21,sy-61,42*pct,2);
      ctx.restore();
    }
  }
};
