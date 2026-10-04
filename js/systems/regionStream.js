// ============================================================
// js/systems/regionStream.js
// Streaming real de assets por região.
// Mantém somente: região atual + anterior + próxima.
// ============================================================

const REGION_ASSET_MANIFEST = [
  ['vila','Vila Abandonada'],
  ['floresta','Floresta Redemoinho'],
  ['chamas','Campo das Chamas'],
  ['raizes','Raízes Enganadoras'],
  ['mata','Mata Viva'],
  ['templo','Templo Ancestral'],
  ['pantano','Pântano do Boitatá'],
  ['cuca','Covil da Cuca'],
].map(([slug,name], id) => ({
  id, name,
  assets: {
    background: `assets/regions/region-${id}-${slug}.webp`,
    midground:  `assets/regions/region-${id}-${slug}-mid.webp`,
    foreground: `assets/regions/region-${id}-${slug}-fg.webp`,
  },
}));

const RegionStream = {
  cache: new Map(),          // regionId -> { background, midground, foreground }
  inflight: new Map(),       // regionId -> Promise
  currentId: 0,
  loading: false,
  progress: 1,
  label: '',
  targetId: null,
  _token: 0,

  _valid(id) {
    return Number.isInteger(id) && id >= 0 && id < REGION_ASSET_MANIFEST.length;
  },

  _windowFor(id) {
    const set = new Set([id]);
    if (this._valid(id - 1)) set.add(id - 1);
    if (this._valid(id + 1)) set.add(id + 1);
    return set;
  },

  isLoaded(id) {
    return this.cache.has(id);
  },

  get(id, key) {
    const pack = this.cache.get(id);
    return pack ? pack[key] || null : null;
  },

  loadedIds() {
    return [...this.cache.keys()].sort((a,b)=>a-b);
  },

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        // decode() finaliza a decodificação quando o navegador suporta.
        if (typeof img.decode === 'function') img.decode().catch(()=>{}).finally(() => resolve(img));
        else resolve(img);
      };
      img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      img.src = src;
    });
  },

  async ensure(id, {foreground=true} = {}) {
    if (!this._valid(id)) return null;
    if (this.cache.has(id)) return this.cache.get(id);
    if (this.inflight.has(id)) return this.inflight.get(id);

    const manifest = REGION_ASSET_MANIFEST[id];
    const entries = foreground
      ? Object.entries(manifest.assets)
      : [['background', manifest.assets.background], ['midground', manifest.assets.midground]];

    const promise = (async () => {
      const pack = {};
      let done = 0;
      const total = entries.length;
      this.loading = true;
      this.targetId = id;
      this.label = `Carregando ${manifest.name}`;
      this.progress = 0;

      for (const [key, src] of entries) {
        pack[key] = await this._loadImage(src);
        done++;
        if (this.targetId === id) this.progress = done / total;
      }

      // Se foreground foi omitido numa carga antecipada, ele pode ser completado depois.
      if (!foreground) pack.foreground = null;
      this.cache.set(id, pack);
      this.inflight.delete(id);
      if (this.targetId === id) {
        this.progress = 1;
        this.loading = false;
      }
      return pack;
    })().catch(err => {
      this.inflight.delete(id);
      if (this.targetId === id) this.loading = false;
      console.warn('[RegionStream]', err);
      // Falha do asset não bloqueia gameplay: renderer procedural continua como fallback.
      const fallback = this.cache.get(id) || {background:null,midground:null,foreground:null};
      this.cache.set(id, fallback);
      return fallback;
    });

    this.inflight.set(id, promise);
    return promise;
  },

  async ensureComplete(id) {
    if (!this._valid(id)) return null;
    const cached = this.cache.get(id);
    if (cached && cached.background && cached.midground && cached.foreground) return cached;

    if (cached && cached.background && cached.midground && !cached.foreground) {
      const manifest = REGION_ASSET_MANIFEST[id];
      this.loading = true; this.targetId = id; this.progress = 2/3;
      this.label = `Finalizando ${manifest.name}`;
      try { cached.foreground = await this._loadImage(manifest.assets.foreground); }
      catch (e) { console.warn('[RegionStream]', e); }
      this.progress = 1; this.loading = false;
      return cached;
    }
    return this.ensure(id, {foreground:true});
  },

  release(id) {
    if (!this.cache.has(id)) return;
    const pack = this.cache.get(id);
    // Solta referências JS. O navegador decide se mantém bytes no cache HTTP/disco,
    // mas texturas/objetos deixam de permanecer presos pelo jogo.
    for (const key of ['background','midground','foreground']) {
      if (pack && pack[key]) {
        pack[key].onload = null;
        pack[key].onerror = null;
        pack[key] = null;
      }
    }
    this.cache.delete(id);
  },

  trimToWindow(id) {
    const keep = this._windowFor(id);
    for (const loadedId of [...this.cache.keys()]) {
      if (!keep.has(loadedId)) this.release(loadedId);
    }
  },

  async prepareInitial(id) {
    this.currentId = this._valid(id) ? id : 0;
    this.trimToWindow(this.currentId);
    // Para começar a jogar, espera apenas a região atual.
    await this.ensureComplete(this.currentId);
    // A próxima/anterior começam a carregar sem bloquear a entrada no gameplay.
    this.prefetchNeighbors(this.currentId);
  },

  async prepareTransition(id) {
    // Só bloqueia no fade se o destino ainda não estiver pronto.
    return this.ensureComplete(id);
  },

  focus(id) {
    if (!this._valid(id)) return;
    this.currentId = id;
    this.trimToWindow(id);
    this.prefetchNeighbors(id);
  },

  prefetchNeighbors(id) {
    const wanted = this._windowFor(id);
    for (const rid of wanted) {
      if (rid === id || this.cache.has(rid) || this.inflight.has(rid)) continue;
      // Pré-carga completa, mas nunca pausa o gameplay.
      this.ensure(rid, {foreground:true}).then(() => {
        // Se o jogador avançou enquanto o download ocorria, libera o que ficou longe.
        this.trimToWindow(this.currentId);
      });
    }
  },

  reset() {
    this._token++;
    for (const id of [...this.cache.keys()]) this.release(id);
    this.inflight.clear();
    this.currentId = 0;
    this.loading = false;
    this.progress = 1;
    this.label = '';
    this.targetId = null;
  },
};
