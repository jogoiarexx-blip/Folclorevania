// Folclorevania v2.6 — progressão ancestral independente das relíquias e dos poderes de chefes.
const SKILL_BRANCHES = [
  {id:'guerreiro', name:'Guerreiro', icon:'⚔️', subtitle:'Domine o combate', color:'#ff9f79', skills:[
    {id:'ferocidade',name:'Fúria da Onça',icon:'🐆',max:3,desc:'+0,4 de dano por nível.',requires:null},
    {id:'precisao',name:'Olhar do Caçador',icon:'🎯',max:2,desc:'+8% de chance crítica por nível.',requires:'ferocidade'},
    {id:'alcance',name:'Lâmina das Matas',icon:'🗡️',max:2,desc:'+7 pixels de alcance no ataque por nível.',requires:'precisao'},
    {id:'executor',name:'Golpe Derradeiro',icon:'🔥',max:1,desc:'+40% de dano em inimigos abaixo de 35% da vida.',requires:'alcance'}
  ]},
  {id:'guardiao',name:'Guardião',icon:'🌿',subtitle:'Sobreviva às maldições',color:'#83e5ac',skills:[
    {id:'vigor',name:'Coração da Mata',icon:'❤️',max:3,desc:'+1 coração máximo por nível; cura 1 ao aprender.',requires:null},
    {id:'folego',name:'Seiva Vital',icon:'🍃',max:3,desc:'+0,14 de regeneração de energia por nível.',requires:'vigor'},
    {id:'resiliencia',name:'Casca Ancestral',icon:'🛡️',max:2,desc:'+0,12 s de invulnerabilidade após receber dano.',requires:'folego'},
    {id:'renascer',name:'Benção da Floresta',icon:'🌱',max:1,desc:'Recupere 1 coração a cada 5 inimigos derrotados.',requires:'resiliencia'}
  ]},
  {id:'mistico',name:'Místico',icon:'✨',subtitle:'Desperte os espíritos',color:'#c7a0ff',skills:[
    {id:'agilidade',name:'Passos do Saci',icon:'💨',max:3,desc:'Reduz o custo do dash em 3 de energia por nível.',requires:null},
    {id:'foco',name:'Meditação Lunar',icon:'🌙',max:3,desc:'Reduz a recarga do especial em 0,75 s por nível.',requires:'agilidade'},
    {id:'arcano',name:'Chama Encantada',icon:'🔮',max:2,desc:'+0,6 de dano no golpe especial por nível.',requires:'foco'},
    {id:'ventania',name:'Vento Eterno',icon:'🌪️',max:1,desc:'Aumenta a duração do dash em 0,05 s.',requires:'arcano'}
  ]}
];

const SkillTree = {
  level:1, xp:0, points:0, kills:0, ranks:{}, opened:false, returnToPause:false,
  allSkills(){ return SKILL_BRANCHES.flatMap(b => b.skills); },
  find(id){ return this.allSkills().find(s => s.id===id) || null; },
  rank(id){ return this.ranks[id] || 0; },
  xpRequired(level=this.level){ return 60 + (level-1)*45; },
  bonus(key){
    const r=id=>this.rank(id);
    const bonuses={
      damage: r('ferocidade')*.4,
      critChance: r('precisao')*.08,
      reach: r('alcance')*7,
      finisher: r('executor')*.4,
      health: r('vigor'),
      regen: r('folego')*.14,
      hurtInvulnerability: r('resiliencia')*.12,
      recovery: r('renascer'),
      dashCost: r('agilidade')*3,
      specialCooldown: r('foco')*.75,
      specialDamage: r('arcano')*.6,
      dashDuration: r('ventania')*.05,
    };
    return bonuses[key] || 0;
  },
  reset(){
    this.level=1; this.xp=0; this.points=0; this.kills=0;
    this.ranks={}; this.forceClose(); this.refreshQuick();
  },
  serialize(){
    return {version:1,level:this.level,xp:this.xp,points:this.points,kills:this.kills,ranks:{...this.ranks}};
  },
  load(data){
    this.reset();
    if(!data || typeof data !== 'object') return;
    // Somente habilidades conhecidas e níveis válidos. Saves antigos seguem funcionando.
    const incoming = data.ranks && typeof data.ranks==='object' ? data.ranks : {};
    for(const skill of this.allSkills()){
      const rank = Math.max(0,Math.min(skill.max,Math.floor(Number(incoming[skill.id])||0)));
      if(!skill.requires || (this.ranks[skill.requires]||0)>0) this.ranks[skill.id]=rank;
    }
    this.level=Math.max(1,Math.min(50,Math.floor(Number(data.level)||1)));
    this.xp=Math.max(0,Math.min(this.xpRequired()-1,Math.floor(Number(data.xp)||0)));
    this.points=Math.max(0,Math.min(100,Math.floor(Number(data.points)||0)));
    this.kills=Math.max(0,Math.min(1000000,Math.floor(Number(data.kills)||0)));
    this.refreshQuick();
  },
  refreshQuick(){
    const btn=document.getElementById('skillQuickButton');
    if(btn) btn.textContent=this.points?'✦ Árvore • '+this.points:'✦ Árvore';
  },
  gainXP(amount){
    if(!Number.isFinite(amount)||amount<=0) return;
    this.xp+=amount;
    let levels=0;
    while(this.level<50 && this.xp>=this.xpRequired()){
      this.xp-=this.xpRequired(); this.level++; this.points++; levels++;
    }
    if(this.level>=50) this.xp=0;
    this.refreshQuick();
    if(levels && typeof showSaveFeedback==='function')
      showSaveFeedback('✨ Nível '+this.level+'! +'+levels+' ponto(s) ancestral(is). Abra com K');
  },
  onEnemyDefeated(regionId,kind='espreitador'){
    this.kills++;
    const base=14+Math.max(0,Math.min(7,Number(regionId)||0))*7;
    const multiplier=kind==='brutamontes'?1.5:kind==='saltador'?1.2:1;
    this.gainXP(Math.round(base*multiplier));
    if(this.bonus('recovery') && this.kills%5===0 && typeof Player!=='undefined')
      Player.health=Math.min(Player.maxHealth,Player.health+1);
  },
  onBossDefeated(bossId){
    this.points+=2;
    this.gainXP(80);
    this.refreshQuick();
    if(typeof showSaveFeedback==='function') showSaveFeedback('✦ '+bossId.toUpperCase()+' derrotado: +2 pontos ancestrais');
  },
  canPurchase(id){
    const s=this.find(id);
    return !!s && this.points>0 && this.rank(id)<s.max && (!s.requires || this.rank(s.requires)>0);
  },
  purchase(id){
    if(!this.opened || !this.canPurchase(id)) return false;
    this.ranks[id]=this.rank(id)+1;
    this.points--;
    if(id==='vigor' && typeof Player!=='undefined'){
      Player.maxHealth+=1;
      Player.health=Math.min(Player.maxHealth,Player.health+1);
    }
    // Salvamento imediato da escolha no slot ativo. Não sobrescreve outros slots.
    if(typeof GameState!=='undefined' && Number.isInteger(GameState._activeSlot) &&
       typeof SaveSystem!=='undefined') SaveSystem.save(GameState._activeSlot);
    this.render();
    this.refreshQuick();
    return true;
  },
  toggle(){ this.opened?this.close():this.open(); },
  open(){
    if(typeof GameState==='undefined'||!GameState.started||GameState.playerDead||
       GameState.bossMode || (typeof Transition!=='undefined'&&Transition.active)) return;
    if(this.opened) return;
    this.returnToPause=!!GameState.paused;
    GameState.paused=true;
    document.body.classList.add('game-paused');
    document.getElementById('pauseMenu')?.classList.add('hidden');
    document.getElementById('skillScreen')?.classList.remove('hidden');
    this.opened=true;
    if(typeof Input!=='undefined') Input.clear();
    this.render();
    document.getElementById('skillClose')?.focus();
  },
  close(){
    if(!this.opened) return;
    this.opened=false;
    document.getElementById('skillScreen')?.classList.add('hidden');
    if(typeof GameState!=='undefined'&&GameState.started){
      GameState.paused=this.returnToPause;
      document.body.classList.toggle('game-paused',GameState.paused);
      document.getElementById('pauseMenu')?.classList.toggle('hidden',!this.returnToPause);
    }
    if(typeof Input!=='undefined') Input.clear();
  },
  forceClose(){
    this.opened=false; this.returnToPause=false;
    document.getElementById('skillScreen')?.classList.add('hidden');
  },
  render(){
    const container=document.getElementById('skillBranches');
    if(!container) return;
    const levelEl=document.getElementById('skillLevel');
    const pointsEl=document.getElementById('skillPoints');
    const xpEl=document.getElementById('skillXp');
    const xpBar=document.getElementById('skillXpBar');
    if(levelEl) levelEl.textContent=String(this.level);
    if(pointsEl) pointsEl.textContent=String(this.points);
    if(xpEl) xpEl.textContent=this.xp+' / '+this.xpRequired()+' experiência';
    if(xpBar) xpBar.style.width=(this.xp/this.xpRequired()*100)+'%';
    container.innerHTML=SKILL_BRANCHES.map(branch=>
      '<section class="skill-branch" style="--branch-color:'+branch.color+'">'+
        '<div class="skill-branch-head"><span class="skill-branch-icon">'+branch.icon+'</span><div><h3>'+branch.name+'</h3><p>'+branch.subtitle+'</p></div></div>'+
        '<div class="skill-nodes">'+branch.skills.map(skill=>{
          const rank=this.rank(skill.id),maxed=rank>=skill.max,locked=!!skill.requires&&!this.rank(skill.requires);
          const disabled=!this.canPurchase(skill.id);
          const label=maxed?'Concluída':locked?'Requer habilidade anterior':this.points?'Aprender • 1 ponto':'Sem pontos';
          return '<article class="skill-node '+(maxed?'maxed':locked?'locked':'')+'">'+
            '<div class="skill-node-icon">'+skill.icon+'</div>'+
            '<div class="skill-node-body"><div class="skill-node-title">'+skill.name+'</div>'+
            '<p>'+skill.desc+'</p><div class="skill-ranks">'+Array.from({length:skill.max},(_,i)=>'<i class="'+(i<rank?'filled':'')+'"></i>').join('')+'</div></div>'+
            '<button type="button" data-skill="'+skill.id+'" '+(disabled?'disabled':'')+' aria-label="'+skill.name+': '+label+'">'+label+'</button>'+
          '</article>';
        }).join('')+'</div></section>'
    ).join('');
    container.querySelectorAll('[data-skill]').forEach(btn=>{
      btn.addEventListener('click',()=>this.purchase(btn.dataset.skill));
    });
    const quick=document.getElementById('skillQuickButton');
    if(quick) quick.textContent=this.points?'✦ Árvore • '+this.points:'✦ Árvore';
  }
};
