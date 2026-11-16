// ============================================================
// js/ui/bossHUD.js — barra cinematográfica de chefe
// ============================================================
const BossHUD = {
  _displayPct: 1,
  draw(ctx) {
    if(!BossSystem.active||!BossSystem.boss)return;
    if(BossSystem.introActive&&BossSystem.introTimer>2.0)return;
    const boss=BossSystem.boss,W=ctx.canvas.width,H=ctx.canvas.height;
    const bw=Math.min(620,W*.46),bh=14,bx=(W-bw)/2,by=H-62;
    const target=Math.max(0,boss.health/boss.maxHealth);
    this._displayPct += (target-this._displayPct)*.12;
    const display=Math.max(0,Math.min(1,this._displayPct));
    ctx.save();
    const panelX=bx-24,panelY=by-31,panelW=bw+48,panelH=58;
    const pg=ctx.createLinearGradient(0,panelY,0,panelY+panelH);pg.addColorStop(0,'rgba(12,5,17,.88)');pg.addColorStop(1,'rgba(2,1,4,.94)');ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(panelX,panelY,panelW,panelH,12);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.08)';ctx.stroke();
    ctx.textAlign='left';ctx.font='bold 12px monospace';ctx.fillStyle=boss.nameColor;ctx.shadowColor=boss.nameColor;ctx.shadowBlur=8;ctx.fillText(boss.displayName,bx,by-10);ctx.shadowBlur=0;
    ctx.textAlign='right';ctx.font='9px monospace';ctx.fillStyle=boss.phase===2?'#ff7986':'#7d7282';ctx.fillText(boss.phase===2?'FASE II':'FASE I',bx+bw,by-10);
    ctx.fillStyle='#160e19';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,7);ctx.fill();
    const bar=ctx.createLinearGradient(bx,0,bx+bw,0);bar.addColorStop(0,boss.phase===2?'#a11f3e':boss.nameColor);bar.addColorStop(.75,boss.phase===2?'#ff5f73':'#b967ff');bar.addColorStop(1,'#f4c4ff');ctx.fillStyle=bar;ctx.shadowColor=boss.nameColor;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(bx,by,bw*display,bh,7);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(255,255,255,.11)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,7);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(bx+bw*.5,by+2);ctx.lineTo(bx+bw*.5,by+bh-2);ctx.stroke();
    ctx.textAlign='center';ctx.font='8px monospace';ctx.fillStyle='#736979';ctx.fillText(`${Math.max(0,boss.health)} / ${boss.maxHealth}`,W/2,by+27);
    // Anúncio curto e visível quando a luta evolui para a segunda fase.
    if(BossSystem.phaseNoticeTimer>0 && boss.health>0){
      const remaining=BossSystem.phaseNoticeTimer;
      const alpha=Math.min(1,remaining*2, (2-remaining)*4);
      ctx.globalAlpha=Math.max(0,alpha);
      const y=Math.round(H*.20);
      const pw=Math.min(W*.58,520);
      const g=ctx.createLinearGradient(W/2-pw/2,y,W/2+pw/2,y);
      g.addColorStop(0,'rgba(40,7,20,0)');
      g.addColorStop(.5,'rgba(55,9,33,.88)');
      g.addColorStop(1,'rgba(40,7,20,0)');
      ctx.fillStyle=g;ctx.fillRect(W/2-pw/2,y-22,pw,62);
      ctx.textAlign='center';ctx.font='bold 20px monospace';
      ctx.fillStyle='#ffb2c8';ctx.shadowColor='#ff416c';ctx.shadowBlur=12;
      ctx.fillText('FASE II — FÚRIA DESPERTA',W/2,y+4);
      ctx.shadowBlur=0;ctx.fillStyle='#e1b4d1';ctx.font='11px monospace';
      ctx.fillText(boss.displayName+' mudou de estratégia!',W/2,y+27);
    }
    ctx.restore();
  },
};
