// ============================================================
// systems/regionData.js
// Definição das 8 regiões: tiles, portas, spawns, paletas
// Depende de: nada (carregado antes de tudo)
// ============================================================

const T = 40; // tamanho do tile em px

// Paletas visuais por região
const REGION_PALETTES = [
  { name:'Vila Abandonada',      sky0:'#1a0f0a', sky1:'#2d1a10', ground:'#5c3d28', edge:'#3d2518', accent:'#8B6914', fog:'rgba(20,10,5,0.15)'   },
  { name:'Floresta Redemoinho',  sky0:'#050f05', sky1:'#0d1f08', ground:'#1a4d1a', edge:'#0d2e0d', accent:'#4aff4a', fog:'rgba(0,20,0,0.20)'    },
  { name:'Campo das Chamas',     sky0:'#1a0800', sky1:'#2d1000', ground:'#7a2200', edge:'#4d1500', accent:'#ff6600', fog:'rgba(30,8,0,0.22)'    },
  { name:'Raízes Enganadoras',   sky0:'#0a0518', sky1:'#180a30', ground:'#2a0a4d', edge:'#1a0530', accent:'#aa44ff', fog:'rgba(15,0,25,0.25)'   },
  { name:'Mata Viva',            sky0:'#021408', sky1:'#041f0a', ground:'#145214', edge:'#0a300a', accent:'#00ff88', fog:'rgba(0,15,5,0.18)'    },
  { name:'Templo Ancestral',     sky0:'#08001a', sky1:'#120030', ground:'#1a0052', edge:'#0d0030', accent:'#6600ff', fog:'rgba(10,0,30,0.28)'   },
  { name:'Pântano do Boitatá',    sky0:'#04130f', sky1:'#08231a', ground:'#24513d', edge:'#102a20', accent:'#ff9a2f', fog:'rgba(2,30,22,0.30)'    },
  { name:'Covil da Cuca',         sky0:'#130713', sky1:'#280b22', ground:'#4b203e', edge:'#240d20', accent:'#ff4f9a', fog:'rgba(35,5,28,0.32)'     },
];

// Layouts: '1'=tile sólido, 'p'=plataforma one-way, '0'=vazio
// 40 colunas × 22 linhas = 1600×880 px  (canvas 1600×900)
//
// FÍSICA DO JOGADOR: jumpForce=-12.5, gravity=0.55
//   → Altura máx de salto simples: ~142px = 3.5 tiles
//   → Double jump alcança até ~7 tiles acima do chão
//   → Jogador: 30×46px. Passagem mínima sob plataforma: 3 rows (120px)
//
// REGRAS DE LEVEL DESIGN:
//   - Chão: row 21 (y=840)
//   - Plataformas: mínimo 3 rows (120px) de espaço vertical entre si
//   - Gap horizontal entre plataformas: máx ~5 tiles (200px) para o jogador alcançar
//   - Blocos sólidos (1): sempre têm ao menos 3 rows livres acima deles
//   - Plataformas one-way (p): jogador passa por baixo, mínimo 3 rows de clearance
const REGION_LAYOUTS = [
  // ── 0: VILA ABANDONADA ── tutorial, layout simples e respirável
  // Nível 1 (baixo):  row 17 y=680  — plataformas rasas, fácil de alcançar do chão
  // Nível 2 (médio):  row 13 y=520  — requer 1 salto da plat baixa (3 rows = 120px ✓)
  // Nível 3 (alto):   row  9 y=360  — requer salto da plat média (4 rows = 160px ✓)
  // Blocos sólidos como degraus no centro
  [
    '0000000000000000000000000000000000000000', // row  0  y=0
    '0000000000000000000000000000000000000000', // row  1  y=40
    '0000000000000000000000000000000000000000', // row  2  y=80
    '0000000000000000000000000000000000000000', // row  3  y=120
    '0000000000000000000000000000000000000000', // row  4  y=160
    '0000000000000000000000000000000000000000', // row  5  y=200
    '0000000000000000000000000000000000000000', // row  6  y=240
    '0000000000000000000000000000000000000000', // row  7  y=280
    '0000000000000000000000000000000000000000', // row  8  y=320
    '0000pppppppp00000000000000000pppppppp000', // row  9  y=360  PLAT ALTA
    '0000000000000000000000000000000000000000', // row 10  y=400
    '0000000000000000000000000000000000000000', // row 11  y=440
    '0000000000000000000000000000000000000000', // row 12  y=480
    '000pppppppppp000000000000000pppppppppp00', // row 13  y=520  PLAT MÉDIA
    '0000000000000000000000000000000000000000', // row 14  y=560
    '0000000000000000000000000000000000000000', // row 15  y=600
    '0000000000000111110000000001111100000000', // row 16  y=640  BLOCO DEGRAU CENTRO
    '00pppppppp000000000000000000000pppppppp0', // row 17  y=680  PLAT BAIXA
    '0000000000000000000000000000000000000000', // row 18  y=720
    '0000000000000000000000000000000000000000', // row 19  y=760
    '0000000000000000000000000000000000000000', // row 20  y=800
    '1111111111111111111111111111111111111111', // row 21  y=840  CHÃO
  ],

  // ── 1: FLORESTA REDEMOINHO ── 3 rotas: alta/média/baixa, mais plataformas
  // Chão + blocos laterais como ponto de partida
  // Rota baixa: row 17 → blocos col 0-5 e 34-39
  // Rota média: row 13 / row 14 — plataformas espalhadas
  // Rota alta:  row 9 / row 8 — para exploração com double jump
  [
    '0000000000000000000000000000000000000000', // row  0
    '0000000000000000000000000000000000000000', // row  1
    '0000000000000000000000000000000000000000', // row  2
    '0000000000000000000000000000000000000000', // row  3
    '0000000000000000000000000000000000000000', // row  4
    '000pppppppp0000000000000000000pppppppp00', // row  5  y=200  PLAT TOPO
    '0000000000000000000000000000000000000000', // row  6
    '0000000000000000000000000000000000000000', // row  7
    '0000000000000pppppppp000pppppppp00000000', // row  8  y=320  PLAT ALTA CENTRO
    '0000000000000000000000000000000000000000', // row  9
    '0000000000000000000000000000000000000000', // row 10
    '0000000000000000000000000000000000000000', // row 11
    '0pppppppp0000000000000000000000pppppppp0', // row 12  y=480  PLAT LATERAL MÉDIA
    '0000000000000000000000000000000000000000', // row 13
    '0000000000000pppppppp000pppppppp00000000', // row 14  y=560  PLAT CENTRO MÉDIA
    '0000000000000000000000000000000000000000', // row 15
    '0000000000000000000000000000000000000000', // row 16
    '1111110000000000000000000000111111000000', // row 17  y=680  BLOCOS LATERAIS
    '0000000000000000000000000000000000000000', // row 18
    '0000000000000000000000000000000000000000', // row 19
    '0000000000000000000000000000000000000000', // row 20
    '1111111111111111111111111111111111111111', // row 21  CHÃO
  ],

  // ── 2: CAMPO DAS CHAMAS ── mais espaçado, obstáculos sólidos
  // Blocos centrais servem de trampolim entre rotas
  [
    '0000000000000000000000000000000000000000', // row  0
    '0000000000000000000000000000000000000000', // row  1
    '0000000000000000000000000000000000000000', // row  2
    '0000000000000000000000000000000000000000', // row  3
    '0000000000000000000000000000000000000000', // row  4
    '0000pppppppppp0000000000pppppppppp000000', // row  5  y=200  PLAT ALTA
    '0000000000000000000000000000000000000000', // row  6
    '0000000000000000000000000000000000000000', // row  7
    '0000000000000000000000000000000000000000', // row  8
    '0000000000000111110000000001111100000000', // row  9  y=360  BLOCO SÓLIDO CENTRO
    '0000000000000000000000000000000000000000', // row 10
    '0000000000000000000000000000000000000000', // row 11
    '00pppppppppp000000000000000000pppppppppp', // row 12  y=480  PLAT LATERAL MÉDIA
    '0000000000000000000000000000000000000000', // row 13
    '0000000000000pppppppppp00000000000000000', // row 14  y=560  PLAT CENTRO
    '0000000000000000000000000000000000000000', // row 15
    '0000000000000000000000000000000000000000', // row 16
    '0000011111100000000000000001111110000000', // row 17  y=680  BLOCOS BAIXOS LATERAL
    '0000000000000000000000000000000000000000', // row 18
    '0000000000000000000000000000000000000000', // row 19
    '0000000000000000000000000000000000000000', // row 20
    '1111111111111111111111111111111111111111', // row 21  CHÃO
  ],

  // ── 3: RAÍZES ENGANADORAS ── labiríntico, blocos flutuantes, difícil
  // Muitos blocos sólidos que criam becos sem saída falsos
  [
    '0000000000000000000000000000000000000000', // row  0
    '0000000000000000000000000000000000000000', // row  1
    '0000000000000000000000000000000000000000', // row  2
    '0000000000000000000000000000000000000000', // row  3
    '0011111100000000000000000000011111100000', // row  4  y=160  BLOCO TOPO
    '0000000000000000000000000000000000000000', // row  5
    '0000000000000000000000000000000000000000', // row  6
    '000pppppppppp00000000000000pppppppppp000', // row  7  y=280  PLAT ALTA
    '0000000000000000000000000000000000000000', // row  8
    '0000000000000000000000000000000000000000', // row  9
    '0000000001111111100000001111111100000000', // row 10  y=400  BLOCO CENTRO
    '0000000000000000000000000000000000000000', // row 11
    '0000000000000000000000000000000000000000', // row 12
    '0pppppppppp000000000000000000pppppppppp0', // row 13  y=520  PLAT BAIXA LATERAL
    '0000000000000000000000000000000000000000', // row 14
    '0000000000000pppppppppp00000000000000000', // row 15  y=600  PLAT CENTRO BAIXA
    '0000000000000000000000000000000000000000', // row 16
    '0000000000000000000000000000000000000000', // row 17
    '1111111100000000000000000000001111111100', // row 18  y=720  BLOCOS LATERAIS
    '0000000000000000000000000000000000000000', // row 19
    '0000000000000000000000000000000000000000', // row 20
    '1111111111111111111111111111111111111111', // row 21  CHÃO
  ],

  // ── 4: MATA VIVA ── vertical, cipós, duplo salto necessário
  // Design em zigue-zague: esq → centro → dir → esq
  [
    '0000000000000000000000000000000000000000', // row  0
    '0000000000000000000000000000000000000000', // row  1
    '0000000000000000000000000000000000000000', // row  2
    '0000000000000000000000000000000000000000', // row  3
    '000pppppppppp000000000000000000000000000', // row 4  y=160  PLAT ESQUERDA ALTA
    '0000000000000000000000000000000000000000', // row  5
    '0000000000000000000000000000000000000000', // row  6
    '0000000000000000000pppppppppp00000000000', // row  7  y=280  PLAT CENTRO ALTA
    '0000000000000000000000000000000000000000', // row  8
    '0000000000000000000000000000000000000000', // row  9
    '0000000000000000000000000000pppppppppp00', // row 10  y=400  PLAT DIREITA MÉDIA
    '0000000000000000000000000000000000000000', // row 11
    '0000000000000000000000000000000000000000', // row 12
    '0pppppppppp00000000000000000000000000000', // row 13  y=520  PLAT ESQUERDA BAIXA
    '0000000000000000000000000000000000000000', // row 14
    '0000000000000000000pppppppppp00000000000', // row 15  y=600  PLAT CENTRO BAIXA
    '0000000000000000000000000000000000000000', // row 16
    '0000000000000000000000000000000000000000', // row 17
    '0000000001111110000000000001111110000000', // row 18  y=720  BLOCOS SÓLIDOS
    '0000000000000000000000000000000000000000', // row 19
    '0000000000000000000000000000000000000000', // row 20
    '1111111111111111111111111111111111111111', // row 21  CHÃO
  ],

  // ── 5: TEMPLO ANCESTRAL ── solene, simétrico, paredes fechadas
  // Escadaria central com plataformas simétricas
  [
    '1000000000000000000000000000000000000001', // row  0  PAREDES
    '1000000000000000000000000000000000000001', // row  1
    '1000000000000000000000000000000000000001', // row  2
    '1000000000000000000000000000000000000001', // row  3
    '1000pppppppppp000000000000pppppppppp0001', // row  4  y=160  PLAT ALTA
    '1000000000000000000000000000000000000001', // row  5
    '1000000000000000000000000000000000000001', // row  6
    '1000000000000000000000000000000000000001', // row  7
    '1000000111111000000000000011111100000001', // row  8  y=320  BLOCO SÓLIDO
    '1000000000000000000000000000000000000001', // row  9
    '1000000000000000000000000000000000000001', // row 10
    '1000000000000pppppppppppp000000000000001', // row 11  y=440  PLAT CENTRO MÉDIA
    '1000000000000000000000000000000000000001', // row 12
    '1000pppppppppp000000000000pppppppppp0001', // row 13  y=520  PLAT LATERAL BAIXA
    '1000000000000000000000000000000000000001', // row 14
    '1000000000000000000000000000000000000001', // row 15
    '1000000111111000000000000011111100000001', // row 16  y=640  BLOCO BAIXO
    '1000000000000000000000000000000000000001', // row 17
    '1000000000000000000000000000000000000001', // row 18
    '1000000000000000000000000000000000000001', // row 19
    '1000000000000000000000000000000000000001', // row 20
    '1111111111111111111111111111111111111111', // row 21  CHÃO
  ],


  // ── 6: PÂNTANO DO BOITATÁ ── água rasa, raízes e passagens elevadas
  [
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '000pppppppp00000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000pppppppppp00',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000pppppppppp00000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '00pppppppp00000000000000000000pppppppp00',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '00000000000000000pppppp00000000000000000',
    '0000000000000000000000000000000000000000',
    '0000011111000000000000000000000111110000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '1111111111111111111111111111111111111111',
  ],

  // ── 7: COVIL DA CUCA ── fortaleza final, vertical e fechada
  [
    '1000000000000000000000000000000000000001',
    '1000000000000000000000000000000000000001',
    '1000000000000000000000000000000000000001',
    '1000000000000000000000000000000000000001',
    '1000000000000000pppppppp0000000000000001',
    '1000000000000000000000000000000000000001',
    '1000pppppp00000000000000000000pppppp0001',
    '1000000000000000000000000000000000000001',
    '1000000000001111100000001111100000000001',
    '1000000000000000000000000000000000000001',
    '100000000000000000pppppp0000000000000001',
    '1000000000000000000000000000000000000001',
    '1000pppppp00000000000000000000pppppp0001',
    '1000000000000000000000000000000000000001',
    '1000000000001111100000001111100000000001',
    '1000000000000000000000000000000000000001',
    '1000000000000000pppppppp0000000000000001',
    '1000000000000000000000000000000000000001',
    '1000001111100000000000000000001111100001',
    '1000000000000000000000000000000000000001',
    '1000000000000000000000000000000000000001',
    '1111111111111111111111111111111111111111',
  ],

];

// Portas de transição entre regiões
// trigger: rect em coordenadas do mundo que ativa a transição
// spawnX/spawnY: posição de spawn na região destino
const DOOR_DEFS = [
  { id:'v-f',  from:0, to:1, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:null,        label:'Floresta →'  },
  { id:'f-v',  from:1, to:0, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,        label:'← Vila'      },
  { id:'f-c',  from:1, to:2, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:saci', label:'Chamas →🔒'  },
  { id:'c-f',  from:2, to:1, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,        label:'← Floresta'  },
  { id:'c-r',  from:2, to:3, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:mula',     label:'Raízes →🔒'  },
  { id:'r-c',  from:3, to:2, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,            label:'← Chamas'    },
  { id:'r-m',  from:3, to:4, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:curupira', label:'Mata →🔒'    },
  { id:'m-r',  from:4, to:3, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,            label:'← Raízes'    },
  { id:'m-t',  from:4, to:5, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:caipora',  label:'Templo →🔒'  },
  { id:'t-m',  from:5, to:4, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,            label:'← Mata'      },
  { id:'t-b',  from:5, to:6, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:ancestral', label:'Pântano →🔒' },
  { id:'b-t',  from:6, to:5, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,             label:'← Templo'    },
  { id:'b-k',  from:6, to:7, trigger:{x:1560,y:100,w:40,h:700}, spawnX:80,   spawnY:760, req:'boss:boitata',   label:'Covil →🔒'   },
  { id:'k-b',  from:7, to:6, trigger:{x:0,   y:100,w:40,h:700}, spawnX:1480, spawnY:760, req:null,             label:'← Pântano'   },
];

// Spawns de inimigos por região
const ENEMY_SPAWNS = [
  [{x:500,y:760},{x:900,y:760},{x:1300,y:760}],                              // 0 Vila
  [{x:400,y:760},{x:800,y:760},{x:1200,y:760},{x:1450,y:760}],               // 1 Floresta
  [{x:300,y:760},{x:700,y:720},{x:1100,y:760},{x:1400,y:760}],               // 2 Chamas
  [{x:400,y:760},{x:850,y:760},{x:1200,y:760}],                              // 3 Raízes
  [{x:350,y:760},{x:750,y:760},{x:1100,y:760},{x:1400,y:760}],               // 4 Mata
  [{x:300,y:760},{x:600,y:760},{x:900,y:760},{x:1200,y:760},{x:1450,y:760}], // 5 Templo
  [{x:260,y:760},{x:560,y:760},{x:900,y:720},{x:1220,y:760},{x:1440,y:760}],  // 6 Pântano
  [{x:260,y:760},{x:520,y:720},{x:820,y:760},{x:1120,y:720},{x:1400,y:760}],  // 7 Covil
];

// Grafo do minimap [id, coluna, linha]
const MINIMAP_NODES = [
  [0,0,0],[1,1,0],[2,1,1],[3,0,1],[4,0,2],[5,1,2],[6,2,2],[7,2,3]
];
const MINIMAP_EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]];

// ── Função utilitária: monta arrays de tiles a partir do layout ──
function buildTilesFromLayout(layoutId) {
  const layout = REGION_LAYOUTS[layoutId];
  const solid = [], oneway = [];
  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      const ch = layout[row][col];
      const tile = { x: col*T, y: row*T, w: T, h: T };
      if (ch === '1') solid.push(tile);
      if (ch === 'p') oneway.push(tile);
    }
  }
  const width  = layout[0].length * T;
  const height = layout.length    * T;
  return { solid, oneway, width, height };
}

// ── Constrói objeto de região completo ──
function buildRegion(id) {
  const { solid, oneway, width, height } = buildTilesFromLayout(id);
  return {
    id,
    palette:    REGION_PALETTES[id],
    solidTiles: solid,
    oneWayTiles: oneway,
    bounds:     { left:0, right:width, top:0, bottom:height },
    width, height,
    doors:      DOOR_DEFS.filter(d => d.from === id),
    enemyDefs:  ENEMY_SPAWNS[id] || [],
    enemies:    [],   // instâncias criadas pelo enemySystem
  };
}

// Instanciar todas as regiões na global
const Regions = REGION_LAYOUTS.map((_, id) => buildRegion(id));

// ── Salas de chefe: tiles da arena ──────────────────────────
// Cada sala é uma região interna com paredes + chão plano
// Usada pelo BossSystem como 'roomTiles'
const BOSS_ROOMS = {
  // Saci — arena aberta com plataformas flutuantes
  saci: (function() {
    const t = [];
    // chão
    for (let c=0;c<40;c++) t.push({x:c*T,y:840,w:T,h:T});
    // paredes
    for (let r=0;r<21;r++) t.push({x:0,y:r*T,w:T,h:T},{x:39*T,y:r*T,w:T,h:T});
    // plataformas flutuantes
    [[8,11],[15,9],[22,11],[29,9]].forEach(([c,r])=>{
      for(let i=0;i<4;i++) t.push({x:(c+i)*T,y:r*T,w:T,h:T});
    });
    return t;
  })(),

  // Mula — arena larga com piso plano (espaço para galope)
  mula: (function() {
    const t = [];
    for (let c=0;c<40;c++) t.push({x:c*T,y:840,w:T,h:T});
    for (let r=0;r<21;r++) t.push({x:0,y:r*T,w:T,h:T},{x:39*T,y:r*T,w:T,h:T});
    // plataforma central elevada
    for (let c=16;c<24;c++) t.push({x:c*T,y:13*T,w:T,h:T});
    return t;
  })(),

  // Curupira — arena com pilares e buracos
  curupira: (function() {
    const t = [];
    for (let c=0;c<40;c++) {
      if (c<5||c>8 && c<13||c>16 && c<21||c>24 && c<29||c>32)
        t.push({x:c*T,y:840,w:T,h:T});
    }
    // chão completo
    for (let c=0;c<40;c++) t.push({x:c*T,y:840,w:T,h:T});
    for (let r=0;r<21;r++) t.push({x:0,y:r*T,w:T,h:T},{x:39*T,y:r*T,w:T,h:T});
    // pilares
    [[10,8],[10,10],[10,12],[20,6],[20,8],[20,10],[30,8],[30,10],[30,12]].forEach(([c,r])=>{
      t.push({x:c*T,y:r*T,w:T,h:T});
    });
    return t;
  })(),

  // Caipora — arena com árvores/pilares e plataformas assimétricas (Mata Viva)
  caipora: (function() {
    const t = [];
    // chão
    for (let c = 0; c < 40; c++) t.push({x:c*T, y:840, w:T, h:T});
    // paredes
    for (let r = 0; r < 21; r++) t.push({x:0, y:r*T, w:T, h:T}, {x:39*T, y:r*T, w:T, h:T});
    // troncos / pilares de árvore (pares assimétricos)
    [[5,9],[5,11],[5,13],[5,15], [14,7],[14,9],[14,11],[14,13],
     [24,9],[24,11],[24,13],[24,15], [33,7],[33,9],[33,11],[33,13]].forEach(([c,r]) =>
      t.push({x:c*T, y:r*T, w:T, h:T})
    );
    // galhos / plataformas em alturas diferentes
    [[6,9],[7,9],[8,9],         // galho esquerdo alto
     [15,7],[16,7],[17,7],      // galho centro-esq
     [21,11],[22,11],[23,11],   // galho centro-dir
     [28,6],[29,6],[30,6],      // galho dir alto
     [11,13],[12,13],[13,13],   // plataforma baixa
     [26,15],[27,15],[28,15],   // plataforma baixa dir
    ].forEach(([c,r]) => t.push({x:c*T, y:r*T, w:T, h:T}));
    return t;
  })(),

  // Ancestral — templo com geometria sagrada, plataformas elevadas e abismos (Templo Ancestral)
  ancestral: (function() {
    const t = [];
    // chão parcial — com buracos simbólicos
    for (let c = 0; c < 40; c++) {
      if (c < 3 || (c > 5 && c < 11) || (c > 13 && c < 19) ||
          (c > 21 && c < 27) || (c > 29 && c < 35) || c > 37)
        t.push({x:c*T, y:840, w:T, h:T});
    }
    // paredes
    for (let r = 0; r < 21; r++) t.push({x:0, y:r*T, w:T, h:T}, {x:39*T, y:r*T, w:T, h:T});
    // altar central
    for (let c = 17; c < 23; c++) t.push({x:c*T, y:13*T, w:T, h:T});
    // colunas do templo (pilares finos)
    [[8,8],[8,10],[8,12],[8,14],
     [31,8],[31,10],[31,12],[31,14]].forEach(([c,r]) => t.push({x:c*T, y:r*T, w:T, h:T}));
    // plataformas escalonadas — sobe até o teto
    [[4,17],[5,17],[6,17],
     [9,14],[10,14],[11,14],
     [14,11],[15,11],
     [25,11],[26,11],
     [29,14],[30,14],[31,14],
     [33,17],[34,17],[35,17],
     [18,6],[19,6],[20,6],[21,6],  // plataforma do topo
    ].forEach(([c,r]) => t.push({x:c*T, y:r*T, w:T, h:T}));
    return t;
  })(),

  // Boitatá — pântano com ilhas e plataformas para a serpente de fogo
  boitata: (function() {
    const t = [];
    for (let c=0;c<40;c++) t.push({x:c*T,y:840,w:T,h:T});
    for (let r=0;r<21;r++) t.push({x:0,y:r*T,w:T,h:T},{x:39*T,y:r*T,w:T,h:T});
    [[5,15],[6,15],[7,15],[12,11],[13,11],[14,11],[20,14],[21,14],[22,14],[27,9],[28,9],[29,9],[33,15],[34,15],[35,15]]
      .forEach(([c,r])=>t.push({x:c*T,y:r*T,w:T,h:T}));
    return t;
  })(),

  // Cuca — arena final em formato de salão ritual
  cuca: (function() {
    const t = [];
    for (let c=0;c<40;c++) t.push({x:c*T,y:840,w:T,h:T});
    for (let r=0;r<21;r++) t.push({x:0,y:r*T,w:T,h:T},{x:39*T,y:r*T,w:T,h:T});
    [[7,15],[8,15],[9,15],[14,11],[15,11],[16,11],[23,11],[24,11],[25,11],[30,15],[31,15],[32,15],
     [18,7],[19,7],[20,7],[21,7]].forEach(([c,r])=>t.push({x:c*T,y:r*T,w:T,h:T}));
    return t;
  })(),
};

// Triggers de entrada na sala do chefe (rect no mundo de cada região)
const BOSS_TRIGGERS = {
  1: { x:1300, y:280, w:260, h:560, bossId:'saci'      }, // Floresta
  2: { x:1300, y:280, w:260, h:560, bossId:'mula'      }, // Chamas
  3: { x:1300, y:280, w:260, h:560, bossId:'curupira'  }, // Raízes
  4: { x:1300, y:280, w:260, h:560, bossId:'caipora'   }, // Mata Viva
  5: { x:1300, y:280, w:260, h:560, bossId:'ancestral' }, // Templo Ancestral
  6: { x:1300, y:280, w:260, h:560, bossId:'boitata'   }, // Pântano do Boitatá
  7: { x:1300, y:280, w:260, h:560, bossId:'cuca'      }, // Covil da Cuca
};
