// ============================================================
// js/systems/mapSystem.js
// Render do mapa: fundo com parallax, tiles detalhados, portas, névoa
// ============================================================

const MapSystem = {

  _time: 0,

  update(dt) {
    this._time += dt;
  },

  drawBackground(ctx, palette, regionId) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   palette.sky0);
    sky.addColorStop(0.6, palette.sky1);
    sky.addColorStop(1,   palette.sky1);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (typeof RegionStream !== 'undefined') {
      const bg = RegionStream.get(regionId, 'background');
      if (bg) {
        ctx.save(); ctx.globalAlpha = 0.72;
        ctx.drawImage(bg, 0, 0, W, H);
        ctx.restore();
      }
    }
    this._drawSkyFeature(ctx, palette, regionId, W, H);
    this._drawParallaxLayer(ctx, palette, regionId, W, H);
    if (typeof RegionStream !== 'undefined') {
      const mid = RegionStream.get(regionId, 'midground');
      if (mid) {
        ctx.save(); ctx.globalAlpha = 0.62;
        ctx.drawImage(mid, 0, 0, W, H);
        ctx.restore();
      }
    }
    if (regionId >= 3) this._drawStars(ctx, palette, W, H, regionId);
    if (typeof GameSettings === 'undefined' || GameSettings.ambientFx) this._drawAmbientBack(ctx, palette, regionId, W, H);
  },


  _drawSkyFeature(ctx, palette, regionId, W, H) {
    ctx.save();
    if (regionId === 0 || regionId === 1 || regionId === 4) {
      const x = W * (regionId === 1 ? 0.78 : 0.72), y = H * 0.17, r = regionId === 4 ? 62 : 78;
      const halo = ctx.createRadialGradient(x,y,r*.25,x,y,r*2.4);
      halo.addColorStop(0,'rgba(235,225,255,.20)'); halo.addColorStop(.35,'rgba(170,140,205,.08)'); halo.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(x,y,r*2.4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=regionId===4?'#bedbc4':'#c8c2d2'; ctx.globalAlpha=.45; ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.13;ctx.fillStyle='#403849';ctx.beginPath();ctx.arc(x-r*.25,y-r*.16,r*.17,0,Math.PI*2);ctx.arc(x+r*.2,y+r*.22,r*.11,0,Math.PI*2);ctx.fill();
    } else if (regionId === 2) {
      const g=ctx.createRadialGradient(W*.62,H*.58,0,W*.62,H*.58,H*.54);
      g.addColorStop(0,'rgba(255,83,0,.18)');g.addColorStop(.45,'rgba(125,26,0,.08)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    } else if (regionId === 3 || regionId === 5) {
      const x=W*.72,y=H*.21,r=regionId===5?95:68;
      const halo=ctx.createRadialGradient(x,y,0,x,y,r*2.2);halo.addColorStop(0,regionId===5?'rgba(165,100,255,.28)':'rgba(150,70,220,.20)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r*2.2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=palette.accent;ctx.globalAlpha=.23;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*.72,0,Math.PI*2);ctx.stroke();
    } else if (regionId === 6) {
      const x=W*.76,y=H*.18,r=70;const halo=ctx.createRadialGradient(x,y,0,x,y,r*2.5);halo.addColorStop(0,'rgba(255,160,55,.24)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r*2.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2b66b';ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    } else if (regionId === 7) {
      const x=W*.7,y=H*.16,r=82;const halo=ctx.createRadialGradient(x,y,0,x,y,r*2.4);halo.addColorStop(0,'rgba(255,70,145,.26)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r*2.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bf3d79';ctx.globalAlpha=.28;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  },

  _drawAmbientBack(ctx, palette, regionId, W, H) {
    const quality = typeof GameSettings !== 'undefined' ? GameSettings.quality : 'high';
    const count = quality === 'high' ? 26 : quality === 'medium' ? 16 : 8;
    const t=this._time;
    ctx.save();
    for(let i=0;i<count;i++) {
      const baseX=(i*137+regionId*61)%W;
      const baseY=(i*83+regionId*37)%(H*.72);
      const x=(baseX + Math.sin(t*(.18+(i%4)*.05)+i)*24 + W)%W;
      const y=baseY + Math.cos(t*(.22+(i%5)*.04)+i)*16;
      let color=palette.accent, alpha=.14, size=1.5+(i%3);
      if(regionId===0){color='#d6c08a';alpha=.08;}
      if(regionId===1||regionId===4){color=regionId===4?'#76ffb0':'#a6ff7a';alpha=.2;}
      if(regionId===2){color=i%2?'#ff7a22':'#ffcb56';alpha=.22; y=(baseY+t*18*(1+(i%3)*.25))%(H*.78);}
      if(regionId===3||regionId===5){color=i%2?palette.accent:'#d3a7ff';alpha=.18;}
      if(regionId===6){color=i%2?'#ffad45':'#74e7b4';alpha=.20;size=2+(i%3);}
      if(regionId===7){color=i%2?'#ff75b7':'#b565ff';alpha=.20;size=1.5+(i%4);}
      ctx.globalAlpha=alpha*(.65+.35*Math.sin(t*1.2+i));ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=size*3;
      ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  },

  _drawParallaxLayer(ctx, palette, regionId, W, H) {
    const px = (Camera.x * 0.18) % W;
    const t  = this._time;
    ctx.save();
    ctx.globalAlpha = 0.22;

    if (regionId === 0) {
      ctx.fillStyle = '#3d2515';
      for (let i = -1; i <= 1; i++) {
        const ox = i * W - px;
        ctx.beginPath(); ctx.moveTo(ox, H);
        for (let x = 0; x <= W; x += 30) {
          const y = H * 0.72 - Math.sin(x * 0.004 + 0.5) * 90 - Math.sin(x * 0.009) * 40;
          ctx.lineTo(ox + x, y);
        }
        ctx.lineTo(ox + W, H); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 0.15; ctx.fillStyle = '#2a1a0a';
      for (let i = -1; i <= 1; i++) {
        const ox = i * W - (Camera.x * 0.08) % W;
        ctx.beginPath(); ctx.moveTo(ox, H);
        for (let x = 0; x <= W; x += 30) { ctx.lineTo(ox + x, H * 0.82 - Math.sin(x * 0.003 + 1) * 60); }
        ctx.lineTo(ox + W, H); ctx.closePath(); ctx.fill();
      }
    } else if (regionId === 1) {
      ctx.fillStyle = '#0a2210';
      for (let i = 0; i < 12; i++) {
        const tx = ((i * 137 + 60) % W) - (Camera.x * 0.12) % W;
        const th = 120 + (i * 47) % 140, tw = 14 + (i * 13) % 20;
        ctx.fillRect(tx, H - th, tw, th);
        ctx.beginPath(); ctx.arc(tx + tw/2, H - th - 20, 30 + (i*7)%25, 0, Math.PI*2); ctx.fill();
      }
    } else if (regionId === 2) {
      ctx.fillStyle = '#2a0800';
      for (let i = -1; i <= 1; i++) {
        const ox = i * W - px * 0.7;
        ctx.beginPath(); ctx.moveTo(ox, H);
        for (let x = 0; x <= W; x += 60) { ctx.lineTo(ox + x - 60, H); ctx.lineTo(ox + x, H * 0.55 + Math.sin(x * 0.006) * 120); }
        ctx.lineTo(ox + W, H); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 8; i++) {
        const fx = ((i * 200 + 40) % W) - px * 0.5;
        const fh = 60 + Math.sin(t * 2 + i) * 20;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(fx - 15, H * 0.7);
        ctx.quadraticCurveTo(fx + Math.sin(t*3+i)*8, H*0.7 - fh/2, fx, H*0.7 - fh);
        ctx.quadraticCurveTo(fx + 8, H*0.7 - fh/2, fx+15, H*0.7);
        ctx.fill();
      }
    } else if (regionId === 3) {
      ctx.fillStyle = '#1a0535';
      for (let i = 0; i < 7; i++) {
        const rx = ((i * 230 + 80) % W) - px * 0.9;
        const rh = 200 + (i*60)%200, rw = 8 + (i*5)%10;
        ctx.save(); ctx.translate(rx, H * 0.65);
        ctx.beginPath(); ctx.moveTo(-rw/2, 0);
        for (let y = 0; y < rh; y += 20) ctx.lineTo(-rw/2 + Math.sin(y*0.05+i)*12, y);
        for (let y = rh; y >= 0; y -= 20) ctx.lineTo(rw/2 + Math.sin(y*0.05+i+1)*8, y);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    } else if (regionId === 4) {
      ctx.fillStyle = '#062010';
      for (let i = 0; i < 15; i++) {
        const bx = ((i * 108 + 20) % W) - px * 0.85;
        const bh = 180 + (i*55)%180, bw = 6 + (i*3)%8;
        ctx.fillRect(bx, H - bh, bw, bh);
        ctx.fillStyle = '#084020';
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.ellipse(bx + bw/2 + Math.sin(t*0.5+i+j)*10, H - bh + j*(bh/3) + 20, 20, 8, Math.sin(t*0.3+j)*0.3, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = '#062010';
      }
    } else if (regionId === 5) {
      ctx.fillStyle = '#110030';
      for (let i = 0; i < 8; i++) {
        const cx = ((i * 200 + 60) % W) - px * 0.6;
        const ch = 250 + (i*40)%150, cw = 20;
        ctx.fillRect(cx, H - ch, cw, ch);
        ctx.fillRect(cx - 6, H - ch, cw + 12, 12);
        ctx.globalAlpha = 0.06; ctx.fillStyle = '#aa44ff';
        ctx.fillRect(cx + 2, H - ch + 14, cw - 4, ch - 14);
        ctx.fillStyle = '#110030'; ctx.globalAlpha = 0.22;
      }
    } else if (regionId === 6) {
      ctx.fillStyle='#082b21';
      for(let i=0;i<11;i++){
        const x=((i*153+35)%W)-px*.72;
        const h=130+(i*49)%180;
        ctx.fillRect(x,H-h,12,h);
        ctx.beginPath();ctx.arc(x+6,H-h,32+(i%3)*8,0,Math.PI*2);ctx.fill();
      }
    } else if (regionId === 7) {
      ctx.fillStyle='#2c0c27';
      for(let i=0;i<9;i++){
        const x=((i*186+40)%W)-px*.65;
        const h=180+(i*57)%180;
        ctx.fillRect(x,H-h,18,h);
        ctx.fillRect(x-10,H-h,38,10);
      }
      ctx.globalAlpha=.11;ctx.fillStyle='#ff4f9a';
      ctx.beginPath();ctx.moveTo(W*.58,H*.72);ctx.lineTo(W*.73,H*.38);ctx.lineTo(W*.86,H*.72);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  },

  _drawStars(ctx, palette, W, H, regionId) {
    ctx.save();
    const q = (typeof GameSettings !== 'undefined' && GameSettings.quality) || 'high';
    const base = (regionId === 5 || regionId === 7) ? 80 : 40;
    const count = q === 'low' ? Math.ceil(base * .35) : q === 'medium' ? Math.ceil(base * .65) : base;
    for (let i = 0; i < count; i++) {
      const sx = (i * 367 + 13) % W;
      const sy = (i * 251 + 7) % (H * 0.6);
      const size = 1 + (i % 3);
      const alpha = 0.3 + Math.sin(this._time * (0.5 + (i%5)*0.3) + i) * 0.2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = palette.accent;
      ctx.shadowColor = palette.accent; ctx.shadowBlur = size * 3;
      ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  },

  drawTiles(ctx, region) {
    const pal = region.palette;
    const cw  = ctx.canvas.width;
    const rid = region.id !== undefined ? region.id : 0;

    for (const t of region.solidTiles) {
      const sx = t.x - Camera.x;
      if (sx > -T - 4 && sx < cw + T) {
        this._drawSolidTile(ctx, sx, t.y, pal, rid, t.x, t.y);
      }
    }
    for (const t of region.oneWayTiles) {
      const sx = t.x - Camera.x;
      if (sx > -T - 4 && sx < cw + T) {
        this._drawOneWayPlatform(ctx, sx, t.y, pal, rid);
      }
    }
  },

  _drawSolidTile(ctx, sx, sy, pal, rid, wx, wy) {
    ctx.save();
    const seed = (wx * 3 + wy * 7) % 6;

    if (rid === 0) {
      const g = ctx.createLinearGradient(sx, sy, sx, sy+T);
      g.addColorStop(0, '#7a5c3a'); g.addColorStop(0.3, pal.ground); g.addColorStop(1, pal.edge);
      ctx.fillStyle = g; ctx.fillRect(sx, sy, T, T);
      ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 1;
      if (seed===0){ctx.beginPath();ctx.moveTo(sx+8,sy+5);ctx.lineTo(sx+15,sy+18);ctx.lineTo(sx+22,sy+14);ctx.stroke();}
      else if(seed===1){ctx.beginPath();ctx.moveTo(sx+28,sy+3);ctx.lineTo(sx+20,sy+12);ctx.stroke();}
      const tG = ctx.createLinearGradient(sx,sy,sx,sy+5);
      tG.addColorStop(0,'#aa8855'); tG.addColorStop(1,'#7a5c3a');
      ctx.fillStyle=tG; ctx.fillRect(sx,sy,T,4);
      ctx.fillStyle='#3a5c20'; ctx.globalAlpha=0.4;
      for(let m=0;m<3;m++){ctx.beginPath();ctx.arc(sx+4+m*11+(wx*3)%5,sy+2,2+m%2,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;
      ctx.strokeStyle=pal.edge+'88'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 1) {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,'#2a6a2a'); g.addColorStop(0.25,pal.ground); g.addColorStop(1,pal.edge);
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      ctx.fillStyle='#44bb44';
      for(let g2=0;g2<5;g2++){const gx=sx+4+g2*8,gh=4+(wx+g2)%4;ctx.beginPath();ctx.moveTo(gx,sy);ctx.lineTo(gx-2,sy-gh);ctx.lineTo(gx+2,sy-gh);ctx.closePath();ctx.fill();}
      if((wx*5+wy)%3===0){ctx.strokeStyle='#0d2e0d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+5,sy+T);ctx.quadraticCurveTo(sx+10,sy+T-10,sx+20,sy+T-5);ctx.stroke();}
      ctx.strokeStyle=pal.edge+'aa'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 2) {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,'#aa3300'); g.addColorStop(0.4,pal.ground); g.addColorStop(1,'#1a0500');
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      if(seed<3){ctx.strokeStyle='#ff4400';ctx.lineWidth=1;ctx.shadowColor='#ff2200';ctx.shadowBlur=4;ctx.beginPath();ctx.moveTo(sx+5+seed*4,sy+2);ctx.lineTo(sx+10+seed*3,sy+T/2);ctx.lineTo(sx+8+seed*5,sy+T-3);ctx.stroke();ctx.shadowBlur=0;}
      const tG=ctx.createLinearGradient(sx,sy,sx,sy+6); tG.addColorStop(0,'#ff6600aa'); tG.addColorStop(1,'transparent');
      ctx.fillStyle=tG; ctx.fillRect(sx,sy,T,6);
      ctx.strokeStyle='#4d1500aa'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 3) {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,'#4a1a6a'); g.addColorStop(0.4,pal.ground); g.addColorStop(1,'#0d0020');
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      ctx.strokeStyle='#cc44ff'; ctx.lineWidth=1.5; ctx.shadowColor='#9900ff'; ctx.shadowBlur=5;
      if(seed===0){ctx.beginPath();ctx.moveTo(sx+T/2,sy);ctx.lineTo(sx+T/2-6,sy+T/2);ctx.lineTo(sx+T/2+4,sy+T);ctx.stroke();}
      else if(seed===1){ctx.beginPath();ctx.moveTo(sx+4,sy+T/3);ctx.lineTo(sx+T-4,sy+T*2/3);ctx.stroke();}
      ctx.shadowBlur=0;
      const tG=ctx.createLinearGradient(sx,sy,sx,sy+5); tG.addColorStop(0,'#aa44ff88'); tG.addColorStop(1,'transparent');
      ctx.fillStyle=tG; ctx.fillRect(sx,sy,T,5);
      ctx.strokeStyle='#2a0a4d66'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 4) {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,'#1a6a3a'); g.addColorStop(0.3,pal.ground); g.addColorStop(1,'#051a0a');
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      ctx.fillStyle='#22dd66';
      for(let g2=0;g2<6;g2++){const gx=sx+3+g2*7,gh=5+(wx+wy+g2)%5;ctx.beginPath();ctx.moveTo(gx,sy);ctx.lineTo(gx-2,sy-gh);ctx.lineTo(gx+2,sy-gh);ctx.closePath();ctx.fill();}
      const fseed=(wx*13+wy*9)%5;
      if(fseed<2){const fx=sx+12+fseed*16;ctx.fillStyle='#00ff88';ctx.shadowColor='#00ff88';ctx.shadowBlur=5;ctx.beginPath();ctx.arc(fx,sy-4,5,0,Math.PI);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(fx-2,sy-5,1.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;}
      ctx.strokeStyle='#0a300a55'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 5) {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,'#220055'); g.addColorStop(0.4,pal.ground); g.addColorStop(1,'#080015');
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      const rseed=(wx*17+wy*11)%6;
      ctx.strokeStyle='#8844ff'; ctx.lineWidth=1; ctx.shadowColor='#6600ff'; ctx.shadowBlur=6;
      const rcx=sx+T/2, rcy=sy+T/2;
      if(rseed===0){ctx.beginPath();ctx.moveTo(rcx-6,rcy-6);ctx.lineTo(rcx+6,rcy+6);ctx.moveTo(rcx+6,rcy-6);ctx.lineTo(rcx-6,rcy+6);ctx.stroke();}
      else if(rseed===1){ctx.beginPath();ctx.arc(rcx,rcy,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(rcx,rcy,3,0,Math.PI*2);ctx.stroke();}
      else if(rseed===2){ctx.beginPath();ctx.moveTo(rcx,rcy-8);ctx.lineTo(rcx+7,rcy+4);ctx.lineTo(rcx-7,rcy+4);ctx.closePath();ctx.stroke();}
      ctx.shadowBlur=0;
      const tG=ctx.createLinearGradient(sx,sy,sx,sy+5); tG.addColorStop(0,'#6600ffaa'); tG.addColorStop(1,'transparent');
      ctx.fillStyle=tG; ctx.fillRect(sx,sy,T,5);
      ctx.strokeStyle='#1a005266'; ctx.lineWidth=0.5; ctx.strokeRect(sx,sy,T,T);

    } else if (rid === 6) {
      const g=ctx.createLinearGradient(sx,sy,sx,sy+T);g.addColorStop(0,'#39745b');g.addColorStop(.35,pal.ground);g.addColorStop(1,'#0a221b');ctx.fillStyle=g;ctx.fillRect(sx,sy,T,T);
      ctx.fillStyle='#6fbf8f';ctx.globalAlpha=.35;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(sx+8+i*12,sy+4,7,2.5,(i-1)*.3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle='#ff9a2f55';ctx.strokeRect(sx,sy,T,T);
    } else if (rid === 7) {
      const g=ctx.createLinearGradient(sx,sy,sx,sy+T);g.addColorStop(0,'#6d315a');g.addColorStop(.4,pal.ground);g.addColorStop(1,'#1b0818');ctx.fillStyle=g;ctx.fillRect(sx,sy,T,T);
      ctx.strokeStyle='#ff4f9a88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+6,sy+6);ctx.lineTo(sx+T-6,sy+T-6);ctx.moveTo(sx+T-8,sy+7);ctx.lineTo(sx+8,sy+T-7);ctx.stroke();ctx.fillStyle='#ff75b733';ctx.fillRect(sx,sy,T,4);
    } else {
      const g = ctx.createLinearGradient(sx,sy,sx,sy+T);
      g.addColorStop(0,pal.ground); g.addColorStop(1,pal.edge);
      ctx.fillStyle=g; ctx.fillRect(sx,sy,T,T);
      ctx.fillStyle=pal.accent+'55'; ctx.fillRect(sx,sy,T,3);
    }

    ctx.restore();
  },

  _drawOneWayPlatform(ctx, sx, sy, pal, rid) {
    ctx.save();
    const h = 10;

    if (rid === 0) {
      const g=ctx.createLinearGradient(sx,sy,sx,sy+h); g.addColorStop(0,'#aa8855'); g.addColorStop(1,'#5c3d28');
      ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(sx,sy,T,h,3); ctx.fill();
      ctx.fillStyle='#3a6a20';
      ctx.beginPath();ctx.arc(sx+T*0.2,sy+1,4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx+T*0.6,sy+1,3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#2a5010';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(sx+4,sy+5);ctx.quadraticCurveTo(sx+T/2,sy-4,sx+T-4,sy+5);ctx.stroke();

    } else if (rid === 1) {
      ctx.fillStyle='#2a4a15'; ctx.beginPath(); ctx.roundRect(sx,sy+2,T,h-2,4); ctx.fill();
      ctx.fillStyle='#44aa22'; ctx.beginPath(); ctx.roundRect(sx,sy,T,4,2); ctx.fill();
      ctx.fillStyle='#55cc33';
      for(let l=0;l<5;l++){ctx.beginPath();ctx.ellipse(sx+6+l*8,sy-3,5,3,Math.sin(l)*0.4,0,Math.PI*2);ctx.fill();}

    } else if (rid === 2) {
      const g=ctx.createLinearGradient(sx,sy,sx,sy+h); g.addColorStop(0,'#ff5500'); g.addColorStop(0.4,'#aa2200'); g.addColorStop(1,'#550000');
      ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(sx,sy,T,h,2); ctx.fill();
      ctx.shadowColor='#ff3300';ctx.shadowBlur=8;ctx.strokeStyle='#ff6600';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(sx,sy,T,h,2);ctx.stroke();ctx.shadowBlur=0;

    } else if (rid === 3) {
      ctx.fillStyle='#3a1060'; ctx.beginPath(); ctx.roundRect(sx,sy+2,T,h-2,5); ctx.fill();
      ctx.strokeStyle='#cc44ff';ctx.lineWidth=2;ctx.shadowColor='#9900ff';ctx.shadowBlur=8;
      ctx.beginPath();ctx.roundRect(sx,sy,T,h,5);ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle='#ee99ff';ctx.shadowColor='#cc44ff';ctx.shadowBlur=5;
      for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(sx+8+n*12,sy+5,2,0,Math.PI*2);ctx.fill();}
      ctx.shadowBlur=0;

    } else if (rid === 4) {
      ctx.fillStyle='#1a4a25'; ctx.beginPath(); ctx.roundRect(sx,sy+2,T,h-2,5); ctx.fill();
      ctx.fillStyle='#00ff88';ctx.shadowColor='#00ff88';ctx.shadowBlur=6;
      ctx.beginPath();ctx.roundRect(sx,sy,T,4,3);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#88ffcc';ctx.globalAlpha=0.7;
      for(let d=0;d<4;d++){ctx.beginPath();ctx.arc(sx+5+d*10,sy+8,2,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;

    } else if (rid === 5) {
      ctx.fillStyle='#1a0044'; ctx.beginPath(); ctx.roundRect(sx,sy+2,T,h-2,4); ctx.fill();
      ctx.strokeStyle='#7744ff';ctx.lineWidth=2;ctx.shadowColor='#5500cc';ctx.shadowBlur=10;
      ctx.beginPath();ctx.roundRect(sx,sy,T,h,4);ctx.stroke();ctx.shadowBlur=0;
      const tG=ctx.createLinearGradient(sx,sy,sx+T,sy);
      tG.addColorStop(0,'transparent');tG.addColorStop(0.5,'#9966ff44');tG.addColorStop(1,'transparent');
      ctx.fillStyle=tG;ctx.fillRect(sx,sy,T,h);

    } else if (rid === 6) {
      ctx.fillStyle='#173d30';ctx.beginPath();ctx.roundRect(sx,sy+2,T,h-2,5);ctx.fill();ctx.fillStyle='#ff9a2f';ctx.globalAlpha=.75;ctx.fillRect(sx,sy,T,3);ctx.globalAlpha=1;
    } else if (rid === 7) {
      ctx.fillStyle='#3a1532';ctx.beginPath();ctx.roundRect(sx,sy+2,T,h-2,4);ctx.fill();ctx.strokeStyle='#ff4f9a';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(sx,sy,T,h,4);ctx.stroke();
    } else {
      ctx.fillStyle=pal.accent+'cc'; ctx.fillRect(sx,sy,T,6);
    }

    ctx.restore();
  },

  drawDoors(ctx, region) {
    const t = this._time;
    for (const door of region.doors) {
      const tr = door.trigger;
      const sx = tr.x - Camera.x;
      let locked = false;
      if (door.req) {
        locked = door.req.startsWith('boss:')
          ? !GameState.defeatedBosses.has(door.req.slice(5))
          : !Player.abilities[door.req];
      }
      ctx.save();
      const pulse = Math.sin(t * 3) * 0.12 + 0.55;
      const isLeft = tr.x === 0;

      if (locked) {
        ctx.fillStyle = `rgba(120,0,0,${pulse})`;
        ctx.fillRect(sx, tr.y, tr.w, tr.h);
        ctx.strokeStyle='#aa0000'; ctx.lineWidth=3;
        for(let b=0;b<4;b++){const bx=sx+4+b*9;ctx.beginPath();ctx.moveTo(bx,tr.y+10);ctx.lineTo(bx,tr.y+tr.h-10);ctx.stroke();}
        ctx.fillStyle='#cc2222';ctx.shadowColor='#ff0000';ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(sx+tr.w/2,tr.y+tr.h/2,10,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#880000';ctx.beginPath();ctx.arc(sx+tr.w/2,tr.y+tr.h/2,6,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
      } else {
        ctx.fillStyle=`rgba(0,120,160,${pulse*0.7})`;
        ctx.fillRect(sx,tr.y,tr.w,tr.h);
        const arrowX = isLeft ? sx+tr.w*0.3 : sx+tr.w*0.7;
        const arrowDir = isLeft ? -1 : 1;
        ctx.strokeStyle='#aaeeff';ctx.shadowColor='#00aaff';ctx.shadowBlur=8;
        ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';
        const ao=Math.sin(t*4)*3;
        ctx.beginPath();
        ctx.moveTo(arrowX-arrowDir*6+ao*arrowDir,tr.y+tr.h/2);
        ctx.lineTo(arrowX+arrowDir*6+ao*arrowDir,tr.y+tr.h/2);
        ctx.moveTo(arrowX+arrowDir*4+ao*arrowDir,tr.y+tr.h/2-6);
        ctx.lineTo(arrowX+arrowDir*6+ao*arrowDir,tr.y+tr.h/2);
        ctx.lineTo(arrowX+arrowDir*4+ao*arrowDir,tr.y+tr.h/2+6);
        ctx.stroke(); ctx.shadowBlur=0;
      }

      ctx.font='bold 11px monospace';
      ctx.fillStyle=locked?'#ff8888':'#aaeeff';
      ctx.save();
      ctx.translate(sx+tr.w/2,tr.y+tr.h/2+(locked?26:22));
      ctx.rotate(-Math.PI/2); ctx.textAlign='center';
      ctx.shadowColor=locked?'#ff0000':'#00aaff'; ctx.shadowBlur=6;
      ctx.fillText(door.label,0,0); ctx.shadowBlur=0;
      ctx.restore();
      ctx.restore();
    }
  },


  drawForeground(ctx, palette, regionId) {
    const W=ctx.canvas.width,H=ctx.canvas.height,t=this._time;
    const quality=typeof GameSettings!=='undefined'?GameSettings.quality:'high';
    if(quality==='low') return;
    ctx.save();
    if (typeof RegionStream !== 'undefined') {
      const fg = RegionStream.get(regionId, 'foreground');
      if (fg) {
        ctx.save(); ctx.globalAlpha = quality === 'high' ? 0.75 : 0.48;
        ctx.drawImage(fg, 0, 0, W, H);
        ctx.restore();
      }
    }
    if(regionId===1 || regionId===4) {
      ctx.strokeStyle=regionId===4?'rgba(30,120,62,.16)':'rgba(25,80,30,.14)';ctx.lineWidth=4;
      for(let i=0;i<7;i++){
        const x=(i*251-(Camera.x*.34)%W+W)%W;
        ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+Math.sin(t+i)*22,90,x-18,160,x+Math.sin(t*.5+i)*12,245);ctx.stroke();
      }
    } else if(regionId===2) {
      const n=quality==='high'?16:9;
      for(let i=0;i<n;i++){
        const x=(i*113+31)%W,y=H-((i*71+t*95*(1+(i%4)*.15))%(H*.72));
        ctx.globalAlpha=.22;ctx.fillStyle=i%2?'#ff7a22':'#ffcf62';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=6;ctx.fillRect(x,y,2+(i%2),5+(i%3));
      }
    } else if(regionId===3 || regionId===5 || regionId===7) {
      ctx.strokeStyle=palette.accent;ctx.globalAlpha=.08;ctx.lineWidth=1;
      for(let i=0;i<8;i++){
        const y=90+i*96+Math.sin(t*.6+i)*10;ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(W*.5,y+Math.sin(t+i)*22,W,y);ctx.stroke();
      }
    } else if(regionId===6){
      ctx.globalAlpha=.12;ctx.fillStyle='#83d9b0';for(let i=0;i<7;i++){const x=(i*240+Math.sin(t+i)*35)%W;const y=H*.68+(i%3)*38;ctx.beginPath();ctx.ellipse(x,y,110,18,0,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
  },

  drawFog(ctx, palette) {
    const W=ctx.canvas.width, H=ctx.canvas.height;
    const fogGrad=ctx.createLinearGradient(0,H*0.75,0,H);
    fogGrad.addColorStop(0,'transparent'); fogGrad.addColorStop(1,palette.sky1+'bb');
    ctx.fillStyle=fogGrad; ctx.fillRect(0,H*0.75,W,H*0.25);
    ctx.fillStyle=palette.fog; ctx.fillRect(0,0,W,H);
    const vL=ctx.createLinearGradient(0,0,80,0); vL.addColorStop(0,'rgba(0,0,0,0.45)'); vL.addColorStop(1,'transparent');
    ctx.fillStyle=vL; ctx.fillRect(0,0,80,H);
    const vR=ctx.createLinearGradient(W-80,0,W,0); vR.addColorStop(0,'transparent'); vR.addColorStop(1,'rgba(0,0,0,0.45)');
    ctx.fillStyle=vR; ctx.fillRect(W-80,0,80,H);
    const vT=ctx.createLinearGradient(0,0,0,50); vT.addColorStop(0,'rgba(0,0,0,0.3)'); vT.addColorStop(1,'transparent');
    ctx.fillStyle=vT; ctx.fillRect(0,0,W,50);
  },
};
