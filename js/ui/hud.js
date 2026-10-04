// ============================================================
// js/ui/hud.js — HUD v2.1
// Vida, stamina, objetivo, habilidades, relíquias e minimapa
// ============================================================

const HUD = {
  _panel(ctx,x,y,w,h,r=10,alpha=.76) {
    ctx.save();
    const g=ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,`rgba(14,8,22,${alpha})`);g.addColorStop(1,`rgba(4,2,8,${Math.min(.96,alpha+.12)})`);
    ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
    ctx.strokeStyle='rgba(210,175,235,.13)';ctx.lineWidth=1;ctx.stroke();
    ctx.restore();
  },

  _heart(ctx,x,y,size,filled) {
    ctx.save();ctx.translate(x,y);ctx.scale(size/18,size/18);
    ctx.beginPath();ctx.moveTo(9,16);ctx.bezierCurveTo(7,13,1,9,1,5);ctx.bezierCurveTo(1,1,6,-1,9,3);ctx.bezierCurveTo(12,-1,17,1,17,5);ctx.bezierCurveTo(17,9,11,13,9,16);ctx.closePath();
    if(filled){const g=ctx.createLinearGradient(0,0,0,16);g.addColorStop(0,'#ff7180');g.addColorStop(1,'#a91636');ctx.fillStyle=g;ctx.shadowColor='#ff365d';ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;}else{ctx.fillStyle='#24151d';ctx.fill();ctx.strokeStyle='#4b2733';ctx.lineWidth=1.2;ctx.stroke();}
    ctx.restore();
  },

  _objective() {
    if (GameState.bossMode && BossSystem.boss) return `Derrote ${BossSystem.boss.displayName}`;
    const rid=GameState.currentRegionId;
    const trig=BOSS_TRIGGERS[rid];
    if(trig && !GameState.defeatedBosses.has(trig.bossId)) return 'Encontre o portal da entidade';
    if(rid < Regions.length - 1) return 'Explore e encontre a próxima passagem';
    if(!GameState.defeatedBosses.has('cuca')) return 'Encontre a Cuca no coração do covil';
    return 'A jornada principal foi concluída';
  },

  draw(ctx, regionName, visitedRegions, showMinimap) {
    const W=ctx.canvas.width,H=ctx.canvas.height;
    ctx.save();

    // bloco de status principal
    this._panel(ctx,18,16,300,76,12,.78);
    ctx.font='bold 9px monospace';ctx.fillStyle='#74677d';ctx.letterSpacing='1px';ctx.fillText('VITALIDADE',32,32);
    const heartSize=18;
    for(let i=0;i<Player.maxHealth;i++) this._heart(ctx,32+i*24,41,heartSize,i<Player.health);

    // stamina
    const sx=32,sy=70,sw=260,sh=7;
    ctx.fillStyle='#15121a';ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,4);ctx.fill();
    const pct=Math.max(0,Math.min(1,Player.stamina/100));
    const sg=ctx.createLinearGradient(sx,sy,sx+sw,sy);sg.addColorStop(0,'#167f9d');sg.addColorStop(1,'#4ce1ff');ctx.fillStyle=sg;ctx.beginPath();ctx.roundRect(sx,sy,sw*pct,sh,4);ctx.fill();
    ctx.fillStyle='#6f8d96';ctx.font='8px monospace';ctx.fillText('ENERGIA',sx,sy+17);

    // região + objetivo no topo central
    const titleW=Math.min(520,Math.max(330,ctx.measureText(regionName).width+190));
    this._panel(ctx,W/2-titleW/2,16,titleW,63,11,.68);
    ctx.textAlign='center';ctx.font='bold 15px monospace';ctx.fillStyle='#dfcef0';ctx.fillText(regionName.toUpperCase(),W/2,38);
    ctx.font='9px monospace';ctx.fillStyle='#7f708a';ctx.fillText(this._objective(),W/2,57);

    // progresso no topo direito
    this._panel(ctx,W-246,16,228,76,12,.76);
    const explored=Math.round((visitedRegions.size/Regions.length)*100);
    ctx.textAlign='left';ctx.font='bold 9px monospace';ctx.fillStyle='#74677d';ctx.fillText('PROGRESSO',W-230,32);
    ctx.font='bold 17px monospace';ctx.fillStyle='#d9c0ed';ctx.fillText(`${explored}%`,W-230,55);
    ctx.font='9px monospace';ctx.fillStyle='#7e7188';ctx.fillText(`${visitedRegions.size}/${Regions.length} regiões`,W-178,54);
    ctx.fillStyle='#17121d';ctx.beginPath();ctx.roundRect(W-230,67,196,6,4);ctx.fill();
    const pg=ctx.createLinearGradient(W-230,0,W-34,0);pg.addColorStop(0,'#61308b');pg.addColorStop(1,'#c879ff');ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(W-230,67,196*(explored/100),6,4);ctx.fill();
    ctx.font='8px monospace';ctx.fillStyle='#5c5063';ctx.fillText(`Chefes ${GameState.defeatedBosses.size}/${Object.keys(BOSS_TRIGGERS).length}`,W-230,85);

    this.drawRelics(ctx);
    this.drawAbilities(ctx);

    if(GameState.regionTitleTimer>0) this.drawRegionTitle(ctx,regionName);
    ctx.restore();

    if(showMinimap) this.drawMinimap(ctx,visitedRegions);
  },

  drawRelics(ctx) {
    const H=ctx.canvas.height;
    this._panel(ctx,18,H-96,300,76,12,.72);
    ctx.font='bold 9px monospace';ctx.fillStyle='#7b687f';ctx.fillText('RELÍQUIAS EQUIPADAS',32,H-77);
    if(!Player.equippedRelics.length){ctx.font='10px monospace';ctx.fillStyle='#4c4251';ctx.fillText('Nenhuma relíquia equipada',32,H-50);return;}
    Player.equippedRelics.slice(0,3).forEach((r,i)=>{
      const x=32+i*88;
      ctx.fillStyle='rgba(193,137,70,.11)';ctx.strokeStyle='rgba(217,165,87,.25)';ctx.beginPath();ctx.roundRect(x,H-65,78,34,7);ctx.fill();ctx.stroke();
      ctx.font='15px monospace';ctx.fillStyle='#e3ba6d';ctx.fillText(r.icon,x+8,H-43);
      ctx.font='7px monospace';ctx.fillStyle='#927950';ctx.fillText((r.name||'').slice(0,8).toUpperCase(),x+28,H-45);
    });
  },

  drawAbilities(ctx) {
    const ab=Player.abilities,W=ctx.canvas.width,H=ctx.canvas.height;
    const slots=[
      {key:'dash',icon:'➤',label:'DASH',keyName:'SHIFT',color:'#41d8ff'},
      {key:'doubleJump',icon:'↟',label:'PULO II',keyName:'SPACE',color:'#77eaff'},
      {key:'charge',icon:'◆',label:'INVEST.',keyName:'X',color:'#ff9c3f'},
      {key:'special',icon:'✦',label:'ESPECIAL',keyName:'C',color:'#d16dff'},
    ];
    const pw=350;this._panel(ctx,W-pw-18,H-96,pw,76,12,.72);
    ctx.font='bold 9px monospace';ctx.fillStyle='#7b687f';ctx.fillText('HABILIDADES',W-pw,H-77);
    slots.forEach((s,i)=>{
      const x=W-pw+i*82,y=H-66,on=!!ab[s.key];
      ctx.fillStyle=on?'rgba(255,255,255,.045)':'rgba(0,0,0,.18)';ctx.strokeStyle=on?s.color+'55':'#2d2730';ctx.beginPath();ctx.roundRect(x,y,72,36,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=on?s.color:'#3b3540';ctx.font='bold 14px monospace';ctx.fillText(s.icon,x+8,y+23);
      ctx.font='7px monospace';ctx.fillStyle=on?'#a89bac':'#443d47';ctx.fillText(s.label,x+27,y+14);ctx.fillStyle=on?s.color+'aa':'#403843';ctx.fillText(s.keyName,x+27,y+25);
    });
    if(ab.special && Player.specialCooldown>0){const cd=Math.min(1,Player.specialCooldown/5);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W-100,H-66,72,36*cd);}
  },

  drawRegionTitle(ctx,name) {
    const W=ctx.canvas.width,t=GameState.regionTitleTimer;
    const alpha=Math.min(1,(2.8-t)*2, t*1.2);
    ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.textAlign='center';
    const g=ctx.createLinearGradient(W/2-260,0,W/2+260,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,'rgba(4,1,9,.74)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(W/2-280,122,560,66);
    ctx.font='9px monospace';ctx.fillStyle='#8e749f';ctx.fillText('REGIÃO DESCOBERTA',W/2,143);
    ctx.font='bold 22px monospace';ctx.fillStyle='#ecdfff';ctx.shadowColor='#9e4adb';ctx.shadowBlur=12;ctx.fillText(name.toUpperCase(),W/2,172);ctx.restore();
  },

  drawMinimap(ctx,visitedRegions) {
    const W=ctx.canvas.width,mx=W-192,my=104,mw=174,mh=144;
    ctx.save();this._panel(ctx,mx,my,mw,mh,11,.78);
    ctx.font='bold 8px monospace';ctx.fillStyle='#76657d';ctx.fillText('MAPA  [M]',mx+12,my+17);
    const ox=mx+16,oy=my+31,cellW=70,cellH=34,nW=44,nH=22;
    ctx.strokeStyle='#35293e';ctx.lineWidth=1;
    for(const [a,b] of MINIMAP_EDGES){const na=MINIMAP_NODES.find(n=>n[0]===a),nb=MINIMAP_NODES.find(n=>n[0]===b);const ax=ox+na[1]*cellW+nW/2,ay=oy+na[2]*cellH+nH/2,bx=ox+nb[1]*cellW+nW/2,by=oy+nb[2]*cellH+nH/2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}
    for(const [id,gx,gy] of MINIMAP_NODES){const x=ox+gx*cellW,y=oy+gy*cellH,seen=visitedRegions.has(id),current=id===GameState.currentRegionId;ctx.fillStyle=current?'#48225f':seen?'#27202e':'#100d13';ctx.strokeStyle=current?'#c36dff':seen?'#55465f':'#241d29';ctx.lineWidth=current?2:1;ctx.beginPath();ctx.roundRect(x,y,nW,nH,5);ctx.fill();ctx.stroke();if(seen||current){ctx.font='7px monospace';ctx.fillStyle=current?'#f2dfff':'#84778c';ctx.textAlign='center';ctx.fillText(String(id+1).padStart(2,'0'),x+nW/2,y+14);}}
    ctx.restore();
  },
};
