// Folclorevania v2.9 - Camadas visuais leves dos sete chefes.
// Somente Canvas 2D: não altera colisões, pontos de vida, IA ou saves.
// Todos os movimentos usam tempo do jogo (congelam durante pausa/loading).
const BossVisuals = {
  time:0,
  update(dt){
    if(Number.isFinite(dt) && dt>0) this.time+=Math.min(dt,.05);
  },
  quality(){
    return typeof GameSettings !== 'undefined' ? GameSettings.quality : 'high';
  },
  glow(ctx,color,blur){
    ctx.shadowBlur=this.quality()==='low'?0:this.quality()==='medium'?blur*.55:blur;
    ctx.shadowColor=color;
  },
  circle(ctx,x,y,r,color){
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.2,r),0,Math.PI*2);ctx.fill();
  },
  ellipse(ctx,x,y,rx,ry,color,rotation=0){
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),rotation,0,Math.PI*2);ctx.fill();
  },
  stroke(ctx,points,color,width=2){
    if(points.length<2)return;
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.stroke();
  },
  ring(ctx,x,y,rx,ry,color,width=2,rotation=0){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
    ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rotation,0,Math.PI*2);ctx.stroke();
  },
  glyph(ctx,x,y,r,color,phase=0){
    // Pequena runa com símbolo próprio; evita depender de fontes ou imagens.
    const a=phase*Math.PI/3;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    this.stroke(ctx,[[0,-r],[r*.6,0],[0,r],[-r*.6,0],[0,-r]],color,1.3);
    this.stroke(ctx,[[-r*.38,0],[r*.38,0]],color,1);
    ctx.restore();
  },
  drawBack(ctx,b){
    if(!b || b.health<=0)return;
    const x=b.x-Camera.x,y=b.y,w=b.width,h=b.height;
    if(x+w < -110 || x > ctx.canvas.width+110)return; // cull offscreen
    const t=this.time,phase=b.phase===2;
    const cx=x+w/2,cy=y+h/2;
    ctx.save();
    // Sombra comum: ancora o personagem no cenário.
    this.ellipse(ctx,cx,y+h+5,w*.58,6+Math.sin(t*3)*.8,'rgba(0,0,0,.38)');
    // Auras específicas: diferenciadas também por ritmo e geometria.
    if(b.id==='saci'){
      ctx.strokeStyle=phase?'rgba(137,255,138,.55)':'rgba(100,205,115,.37)';
      ctx.lineWidth=phase?2.4:1.6;
      for(let i=0;i<3;i++){
        const radius=18+i*10,turn=t*(phase?6:4)+i*2.1;
        ctx.beginPath();ctx.ellipse(cx,y+h-5-i*8,radius,5+i*2,turn*.12,turn,turn+Math.PI*1.15);ctx.stroke();
      }
      this.ellipse(ctx,cx,y+h+1,w*.52,4,'rgba(109,250,96,.16)');
    } else if(b.id==='mula'){
      const flick=.6+.4*Math.sin(t*9);
      this.ellipse(ctx,cx,y+h+4,w*.82,9,'rgba(241,98,17,.23)');
      this.glow(ctx,'#ff801e',13);
      for(let i=0;i<5;i++){
        const fx=x+w*(.12+i*.19),fy=y+h-16;
        this.stroke(ctx,[[fx,fy+17],[fx+Math.sin(t*8+i)*5,fy-7-7*flick],
          [fx+Math.sin(t*5+i)*3,fy-18-6*flick]],i%2?'rgba(255,104,25,.40)':'rgba(255,194,68,.45)',2+i%2);
      }
    } else if(b.id==='curupira'){
      this.ellipse(ctx,cx,y+h+2,w*.8,6,'rgba(96,208,84,.14)');
      const count=this.quality()==='low'?3:6;
      for(let i=0;i<count;i++){
        const a=t*.7+i*Math.PI*2/count;
        const lx=cx+Math.cos(a)*(w*.78),ly=cy+Math.sin(a*1.4)*30;
        ctx.save();ctx.translate(lx,ly);ctx.rotate(a);
        this.ellipse(ctx,0,0,7,3,phase?'rgba(155,255,97,.55)':'rgba(123,188,53,.40)',.6);
        ctx.restore();
      }
    } else if(b.id==='caipora'){
      this.ellipse(ctx,cx,y+h+5,w*.73,6,'rgba(45,233,128,.12)');
      for(let i=0;i<4;i++){
        const a=t*(phase?1.9:1.2)+i*Math.PI/2;
        const ox=cx+Math.cos(a)*(w*.7+10),oy=cy+Math.sin(a)*36;
        this.glyph(ctx,ox,oy,6,phase?'rgba(103,255,203,.6)':'rgba(47,197,124,.40)',i);
      }
    } else if(b.id==='ancestral'){
      this.glow(ctx,'#ac69ff',18);
      for(let i=0;i<3;i++){
        const rad=42+i*20;
        this.ring(ctx,cx,cy,rad,rad*.73,phase?'rgba(224,163,255,.38)':'rgba(139,89,191,.25)',1.3+i*.3,t*.14*(i%2?-1:1));
      }
      // Manto energético, com curvas largas e translucidez discreta.
      for(let i=0;i<5;i++){
        const xx=x+10+i*w/5;
        this.stroke(ctx,[[xx,y+h*.48],[xx+Math.sin(t*2+i)*11,y+h+13],
          [xx+Math.sin(t*3+i)*13,y+h+29]],phase?'rgba(189,120,253,.38)':'rgba(108,69,192,.28)',3);
      }
    } else if(b.id==='boitata'){
      this.ellipse(ctx,cx,y+h+10,w*.8,7,'rgba(252,97,13,.17)');
      this.glow(ctx,'#ff6c19',18);
      for(let i=0;i<4;i++){
        const xx=x+w*(.14+i*.22),yy=cy+Math.sin(t*3-i)*14;
        this.ring(ctx,xx,yy,14+i%2*3,11,phase?'rgba(255,221,97,.45)':'rgba(249,116,35,.3)',2,t*.17);
      }
    } else if(b.id==='cuca'){
      this.ellipse(ctx,cx,y+h+3,w*.85,7,'rgba(216,76,152,.18)');
      for(let i=0;i<5;i++){
        const a=t*.55+i*Math.PI*2/5;
        const xx=cx+Math.cos(a)*(w*.75+8),yy=cy+Math.sin(a)*(h*.43);
        this.glyph(ctx,xx,yy,6+i%2*2,phase?'rgba(255,154,235,.55)':'rgba(205,80,156,.35)',i);
      }
    }
    // O aviso da transição de fase reforça a identidade de cada chefe.
    if(b.visualPhasePulse>0){
      const p=b.visualPhasePulse;
      this.ring(ctx,cx,cy,w*.5+(1-p)*90,h*.45+(1-p)*70,
        phase?'rgba(255,235,180,'+(p*.55)+')':'rgba(220,160,255,'+(p*.4)+')',2+p*4);
    }
    ctx.restore();
  },
  drawFront(ctx,b){
    if(!b || b.health<=0)return;
    const x=b.x-Camera.x,y=b.y,w=b.width,h=b.height;
    if(x+w < -110 || x > ctx.canvas.width+110)return;
    const cx=x+w/2,cy=y+h/2,t=this.time,phase=b.phase===2;
    ctx.save();
    switch(b.id){
      case 'saci':{
        // Faixa do chapéu com selo e cachecol agitado pelo redemoinho.
        this.stroke(ctx,[[cx-13,y-7],[cx+13,y-7]],phase?'#ffeb74':'#f6d7a5',4);
        this.glyph(ctx,cx,y-11,5,phase?'#fff1a9':'#e7c99a');
        this.stroke(ctx,[[cx-7,y+35],[cx-20,y+42+Math.sin(t*8)*4],
          [cx-38-Math.sin(t*5)*6,y+37]],phase?'#a9ffca':'#79d5a3',4);
        const sparkle=phase?4:2;
        for(let i=0;i<sparkle;i++){
          const a=t*4+i*Math.PI*2/sparkle;
          const px=cx+Math.cos(a)*(w*.65),py=cy+Math.sin(a)*h*.48;
          this.circle(ctx,px,py,phase?2.8:1.8,phase?'#eeffae':'#a1ed81');
        }
        break;
      }
      case 'mula':{
        // Pescoço incendiado e cascos com brilho; mantém a silhueta sem cabeça.
        this.glow(ctx,'#ff8a22',phase?16:10);
        for(let i=0;i<5;i++){
          const xx=cx-16+i*8,top=y-13-Math.sin(t*9+i*1.8)*8;
          this.stroke(ctx,[[xx,y+23],[xx-3,top+13],[xx+Math.sin(t*8+i)*3,top]],
            i%2?'#ffad32':'#ff6b15',3);
        }
        for(const fx of [.18,.37,.63,.82]){
          const tx=x+w*fx,yy=y+h+Math.sin(t*13+fx*8)*3;
          this.glow(ctx,'#ffcb53',12);
          this.ellipse(ctx,tx,yy,6,3,phase?'#fff3a1':'#ffb640');
        }
        // Fissuras de magma iluminadas nos flancos.
        this.stroke(ctx,[[x+15,y+36],[x+29,y+49],[x+24,y+59]],phase?'#ffe28c':'#ff6d29',2);
        this.stroke(ctx,[[x+w-13,y+35],[x+w-29,y+50],[x+w-21,y+58]],phase?'#ffe28c':'#ff6d29',2);
        break;
      }
      case 'curupira':{
        // Mechas vermelhas flamejantes e pés voltados para trás.
        this.glow(ctx,'#ff5b23',12);
        for(let i=0;i<7;i++){
          const fx=x+6+i*(w-12)/6;
          const sway=Math.sin(t*6+i*.95)*5;
          this.stroke(ctx,[[fx,y+9],[fx+sway,y-11-i%2*7],
            [fx+sway*1.2,y-17-i%3*5]],phase?'#ffbd59':i%2?'#f34a2e':'#d52b17',2.5);
        }
        this.glow(ctx,'#8cff86',phase?10:4);
        this.stroke(ctx,[[x+12,y+h-1],[x-5,y+h+7],[x-13,y+h+3]],'#8bde65',4);
        this.stroke(ctx,[[x+w-12,y+h-1],[x+w+5,y+h+7],[x+w+13,y+h+3]],'#8bde65',4);
        for(let i=0;i<3;i++)this.stroke(ctx,[[cx-15+i*15,y+37],[cx-13+i*15,y+44]],'#b46d45',1.8);
        break;
      }
      case 'caipora':{
        // Cocar de três camadas e pinturas faciais de luz orgânica.
        for(let i=0;i<5;i++){
          const a=(i-2)*.43;
          const bx=cx+Math.sin(a)*24,by=y+12;
          this.stroke(ctx,[[bx,by],[bx+Math.sin(a)*13,y-25-Math.abs(i-2)*3+Math.sin(t*4+i)*3]],
            phase?['#7fffd9','#96f4ff','#adff82'][i%3]:['#68d6a4','#42c69e','#c5e986'][i%3],4);
        }
        this.glyph(ctx,cx,y+29,7,phase?'#a4fff4':'#3fe3a5');
        this.stroke(ctx,[[cx-23,y+38],[cx-31,y+44],[cx-23,y+48]],'#d8f6ae',2);
        this.stroke(ctx,[[cx+23,y+38],[cx+31,y+44],[cx+23,y+48]],'#d8f6ae',2);
        // Pulseiras espirituais nos braços.
        this.ring(ctx,x+5,y+h*.67,8,4,phase?'#88fbe6':'#62c994',2);
        this.ring(ctx,x+w-5,y+h*.67,8,4,phase?'#88fbe6':'#62c994',2);
        break;
      }
      case 'ancestral':{
        // Máscara esculpida, costuras rúnicas e coroa espectral.
        this.glow(ctx,'#ceabff',phase?20:11);
        this.stroke(ctx,[[cx-15,y+22],[cx,y+17],[cx+15,y+22]],phase?'#f8e5ff':'#d2acfa',2.2);
        for(let i=0;i<3;i++){
          const yy=y+h*.42+i*15;
          this.stroke(ctx,[[cx-20,yy],[cx,yy+4],[cx+20,yy]],phase?'#d3b1ff':'#8e65c7',1.2);
          this.glyph(ctx,cx,yy,5,phase?'#ffffff':'#c79fff',i);
        }
        const cnt=this.quality()==='low'?4:8;
        for(let i=0;i<cnt;i++){
          const a=t*(phase?1.35:.8)+i*Math.PI*2/cnt;
          this.glyph(ctx,cx+Math.cos(a)*(w*.58+18),cy+Math.sin(a)*(h*.64+20),
            phase?7:5,phase?'#e6bfff':'#a17af4',i);
        }
        break;
      }
      case 'boitata':{
        // Escamas dorsais em chamas, focinho definido e mandíbulas.
        this.glow(ctx,'#ffa72a',phase?18:10);
        for(let i=1;i<=8;i++){
          const q=i/9,xx=x+w*q,yy=cy+Math.sin((b._angle||t)*1.4-i*.85)*13;
          this.stroke(ctx,[[xx-5,yy-5],[xx,yy-17-Math.sin(t*8+i)*3],
            [xx+7,yy-5]],i%2?'#ffdc67':'#f27328',2.4);
          this.ellipse(ctx,xx,yy,3.7,2.5,phase?'#fffaab':'#ff9c50');
        }
        const headX=x+12,headY=cy-3+Math.sin((b._angle||t)*1.4)*4;
        this.ellipse(ctx,headX-10,headY+6,19,11,phase?'#ffc33e':'#bd421e',-.13);
        this.ellipse(ctx,headX-17,headY+5,8,4,'#502318');
        this.glow(ctx,'#fff1a1',phase?18:11);
        this.circle(ctx,headX-4,headY-1,4,phase?'#ffffff':'#ffde58');
        this.stroke(ctx,[[headX-20,headY+13],[headX-11,headY+17],[headX+1,headY+13]],'#ffdb7d',2);
        this.stroke(ctx,[[headX-11,headY+16],[headX-8,headY+22]],'#fff1bd',2.1);
        break;
      }
      case 'cuca':{
        // Rosto de jacaré/bruxa em três profundidades: focinho, presas e escamas.
        this.glow(ctx,'#b8cf65',phase?13:6);
        this.ellipse(ctx,cx+18,y+39,28,11,phase?'#728b41':'#5d7837',-.16);
        this.ellipse(ctx,cx+29,y+38,11,6,'#b5ae65',-.15);
        this.circle(ctx,cx+34,y+35,2,'#354a31');
        for(let i=0;i<4;i++){
          const px=cx+8+i*10;
          this.stroke(ctx,[[px,y+44],[px+3,y+52],[px+7,y+44]],'#fbebc7',2);
        }
        this.stroke(ctx,[[cx-12,y+17],[cx-20,y-3],[cx-9,y+3],[cx,y-13],
          [cx+9,y+7],[cx+17,y-3],[cx+20,y+13]],phase?'#ff9fdf':'#a67f9a',3.2);
        for(let i=0;i<5;i++){
          const px=x+12+(i%3)*25,py=y+54+Math.floor(i/3)*21;
          this.ellipse(ctx,px,py,5,2.5,phase?'#97ae66':'#3e6936',-.2);
        }
        this.stroke(ctx,[[x-4,y+77],[x-14,y+84],[x-18,y+78]],'#eac49f',2.2);
        this.stroke(ctx,[[x+w+5,y+73],[x+w+14,y+84],[x+w+19,y+78]],'#eac49f',2.2);
        break;
      }
    }
    // Clarão de dano; valor decai pelo timer de combate já existente.
    if(b.visualHitTimer>0){
      const alpha=Math.min(.62,b.visualHitTimer*3.5);
      ctx.globalAlpha=alpha;
      this.glow(ctx,'#ffffff',14);
      this.ring(ctx,cx,cy,w*.58,h*.57,'#ffffff',2.3);
    }
    ctx.restore();
  }
};
