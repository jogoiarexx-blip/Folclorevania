// ============================================================
// js/systems/transitionSystem.js
// Fade entre regiões + espera real de streaming quando necessário.
// ============================================================

const Transition = {
  active: false,
  alpha:  0,
  dir:    1,
  _cb:    null,
  _waiting: false,
  _commitStarted: false,
  _loadingText: 'Carregando região',
  _error: null,

  start(cb, options={}) {
    if (this.active) return;
    this.active = true;
    this.alpha  = 0;
    this.dir    = 1;
    this._cb    = cb;
    this._waiting = false;
    this._commitStarted = false;
    this._loadingText = options.loadingText || 'Carregando região';
    this._error = null;
  },

  _finishCommit() {
    this._waiting = false;
    this.dir = -1;
  },

  update(dt) {
    if (!this.active) return;

    // Quando há carregamento assíncrono, a tela permanece totalmente escura
    // até que os assets exigidos estejam prontos.
    if (this._waiting) {
      this.alpha = 1;
      return;
    }

    this.alpha += this.dir * dt * 3.5;
    if (this.dir === 1 && this.alpha >= 1) {
      this.alpha = 1;
      if (this._commitStarted) return;
      this._commitStarted = true;

      if (!this._cb) {
        this.dir = -1;
        return;
      }

      const cb = this._cb;
      this._cb = null;
      try {
        const result = cb();
        if (result && typeof result.then === 'function') {
          this._waiting = true;
          result.then(() => this._finishCommit()).catch(err => {
            console.error('Erro durante transição:', err);
            this._error = 'Falha ao carregar. Continuando com fallback.';
            this._finishCommit();
          });
        } else {
          this.dir = -1;
        }
      } catch (err) {
        console.error('Erro durante transição:', err);
        this._error = 'Falha na transição.';
        this.dir = -1;
      }
    }

    if (this.dir === -1 && this.alpha <= 0) {
      this.alpha  = 0;
      this.active = false;
      this._waiting = false;
      this._commitStarted = false;
      this._error = null;
    }
  },

  draw(ctx) {
    if (!this.active && this.alpha === 0) return;
    const W=ctx.canvas.width, H=ctx.canvas.height;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.alpha);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    if (this.alpha > .92 && this._waiting) {
      const progress = (typeof RegionStream !== 'undefined')
        ? Math.max(0, Math.min(1, RegionStream.progress || 0)) : 0;
      const pct = Math.round(progress * 100);
      const title = (typeof RegionStream !== 'undefined' && RegionStream.label)
        ? RegionStream.label : this._loadingText;

      ctx.save();
      ctx.textAlign='center';
      ctx.fillStyle='#e7d5f7';
      ctx.font='bold 20px monospace';
      ctx.fillText(title, W/2, H/2 - 34);

      const bw=360,bh=9,bx=(W-bw)/2,by=H/2;
      ctx.fillStyle='#130a18'; ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle='rgba(190,120,255,.38)'; ctx.strokeRect(bx-.5,by-.5,bw+1,bh+1);
      ctx.fillStyle='#a857e8'; ctx.fillRect(bx,by,bw*progress,bh);
      ctx.shadowColor='#b968ff'; ctx.shadowBlur=12; ctx.fillRect(bx,by,bw*progress,bh); ctx.shadowBlur=0;

      ctx.font='11px monospace'; ctx.fillStyle='#897794';
      ctx.fillText(`${pct}% • carregando assets necessários`, W/2, by+34);
      if (typeof RegionStream !== 'undefined') {
        const ids=RegionStream.loadedIds();
        const names=ids.map(id=>REGION_ASSET_MANIFEST[id]?.name || `Região ${id}`);
        ctx.font='9px monospace'; ctx.fillStyle='#5f5267';
        ctx.fillText(names.length ? `Na memória: ${names.join(' • ')}` : 'Preparando pacote visual...', W/2, by+56);
      }
      if (this._error) { ctx.fillStyle='#ff8290'; ctx.fillText(this._error,W/2,by+78); }
      ctx.restore();
    }
  },
};
