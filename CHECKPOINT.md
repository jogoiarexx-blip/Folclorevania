# Folclorevania — checkpoint de desenvolvimento

## v3.0 — Redesenho do herói e dos inimigos (2026-11-16)

### Entregas de código
- **Novo módulo `js/entities/entityArt.js`:** substitui o desenho visual original com fallback automático caso o módulo não esteja carregado. Não altera hitboxes nem mecânica de combate.
- **Herói:** proporções e anatomia de aventureiro, rosto e chapéu reconhecíveis, roupa com camadas, ombreiras, botas segmentadas, braceletes, cachecol e espada com guarda/fio definidos. Ciclos procedurais de caminhada, capa ao vento, poses aéreas, investida, especial, arco luminoso na espada e flash ao receber dano.
- **Inimigos:** três designs radicalmente diferentes; Espreitador com corpo de predador, focinho, orelhas e garras; Brutamontes com armadura de pedra, rachaduras, núcleo brilhante e braços maciços; Saltador com pernas longas, antenas e olhos grandes. Oito esquemas cromáticos mantêm o contexto dos biomas.
- **Efeitos de combate:** fantasmas de dash/investida em uma fila limitada a 6; ecos de derrota limitados a 16 instâncias e desaparecendo em 0,58s; flash de dano e marcação de ataques com proporção do tempo de preparação.
- `EntityArt.updatePlayer(dt)` e `EntityArt.update(dt)` usam o timestep fixo do jogo, respeitando pausa; draw não modifica estado de HP, posição nem progressão. Todos os efeitos temporários são resetados no novo jogo e ao carregar save.
- **Galeria `entity-gallery.html`:** selecione ações do herói, tipo de inimigo, oito biomas e qualidades gráficas. Mostra os novos desenhos sem entrar em uma luta.
- Mantidos todos os 7 chefes e sua camada gráfica 2.9; mantidos todos os 3 slots, dados salvos, 8 mapas, 12 talentos e IA da v2.8.


**Verificação final complementar:** sintaxe dos 23 arquivos JavaScript do repositório (incluindo os testes) passou; 6 integrações de runtime Player/Enemy/EntityArt foram aprovadas; os 21 scripts do index e o script externo da galeria existem na branch; os 2 trechos JS inline da galeria têm sintaxe válida.

### Arquivos de código
`js/entities/entityArt.js` (novo); `js/entities/player.js`; `js/entities/enemy.js`; `js/main.js`; `js/systems/saveSystem.js`; `index.html`; `entity-gallery.html` (novo); `tests/entityArtSmoke.test.js`; `CHECKPOINT.md`, `README-v3.0.md`, `TEST-REPORT-v3.0.md`.

### Testes e limites
- 96 cenários de arte executados com renderer Canvas simulado: 8 estados do herói × 3 qualidades = 24, e 3 inimigos × 8 biomas × 3 qualidades = 72. Os desenhos não modificaram dados de física.
- 35 verificações (incluindo sintaxe, limitação de efeitos, zero coordenadas inválidas e save/restore de contexto equilibrados). Execução do teste de smoke armazenado em `tests/entityArtSmoke.test.js` com mocks das primitivas de Node: PASS, 17.694 chamadas de Canvas.
- Não há evidência de FPS em GPU real, testes visuais em navegador, teste de toque em iOS/Android ou screenshot de arte produzida. São pendências para QA real.
- **Atenção:** esta versão entrega sprites vetoriais/procedurais Canvas, não imagens 3D, atlas externo ou assets pixel art pré-renderizados.

### Próximas verificações
1. Inspecionar a galeria e o jogo para validar proporções das silhuetas, posicionamento nas plataformas e visibilidade em telas menores.
2. Comparar FPS no Android nas configurações baixa, média e alta.
3. Testar a sequência completa de uma região (andar, salto, combate, fogueira, save/load, chefão).
4. Só depois de capturas reais, balancear contraste e proporções de cada sprite.

---
## v2.9 — Reconstrução gráfica procedural dos 7 chefes (2026-11-16)

**Objetivo:** evoluir de fato os gráficos de todos os bosses, preservando IA, colisões, poderes desbloqueados, salvamentos e desempenho em dispositivos móveis.

### Implementado em código
- Novo subsistema `js/entities/bossVisuals.js`, com desenho Canvas em camadas de fundo e primeiro plano; integra-se no `BossSystem.draw`. Sem imagens externas ou dependências.
- **Saci:** redemoinhos com várias elipses animadas, faixa rúnica no chapéu, lenço flutuante e partículas orbitais.
- **Mula sem Cabeça:** juba/pescoço em chamas, rachaduras de magma, cascos incandescentes e aura de calor.
- **Curupira:** mechas de cabelo flamejante animadas, pés voltados para trás mais reconhecíveis, talismãs e folhas ao redor.
- **Caipora:** cocar com novas camadas, pinturas faciais, pulseiras espirituais e símbolos verdes orbitais.
- **Entidade Ancestral:** manto energético, anéis etéreos, máscara com inscrições e runas flutuantes.
- **Boitatá:** cabeça/mandíbula detalhadas, olhos, escamas e cristas ardentes ao longo do corpo.
- **Cuca:** focinho de jacaré, presas, escamas, coroa de espinhos e símbolos mágicos rosados.
- Brilho temporário para impacto de golpes e onda radial de transição para fase II, usando `visualHitTimer` e `visualPhasePulse` definidos na base comum dos chefes.
- Animação baseada em `dt` do jogo: os efeitos congelam na pausa/loading. Modos de qualidade `low`, `medium`, `high` controlam principalmente sombras e quantidade de glifos. Decoração fora da área visível é descartada.
- Adicionada `boss-gallery.html`, galeria opcional para testar os sete bosses, ambas as fases e níveis de qualidade com zoom independente.
- Scripts gráficos receberam versionamento de URL `?v=2.9` para reduzir chances de cache antigo em atualizações do GitHub Pages.

### Arquivos
`js/entities/bossVisuals.js` (novo), `js/entities/bossSystem.js`, `index.html`, `boss-gallery.html` (novo), `tests/bossVisualsSmoke.test.js` (novo), `README-v2.9.md`, `TEST-REPORT-v2.9.md`, `CHECKPOINT.md`.

### Verificações
- Teste smoke usando o código da nova branch em V8: **42 cenários** (7 chefes × 3 qualidades × 2 fases), incluindo ambas as camadas e o desenhista original; passou.
- Harness automatizado reutilizável adicionado: `node tests/bossVisualsSmoke.test.js` (somente Node nativo, sem dependências).
- JavaScript da galeria passou por verificação sintática.
- Limitação: o teste realizado é de lógica/desenho com mock de Canvas, **não comprova fidelidade visual em navegador real, FPS em smartphone ou ausência de todos os bugs**.

### Próximas prioridades
1. Validar visualmente cada chefe e ajustar cores/proporções/posicionamentos com screenshots reais.
2. Aferir FPS no Android/iOS, principalmente em fase II.
3. Aplicar efeitos de acerto e derrota exclusivos por chefe dentro de um orçamento fixo de partículas.
4. Refinar animações procedurais dos ataques reais (não apenas poses do modelo).

---
## v2.8 — Evolução dos chefes e animações (2026-11-16)

**Foco da versão:** padrões de ataque dos chefes, informação visual antes do dano e custo de efeitos desenhados.

### Código implementado
- Saci: corrigida IA da fase 1, na qual a investida impedia a rajada de vento. Agora alterna investida e rajada, com estados próprios de preparação (0,44s e 0,48s) e indicadores direcionais antes da colisão.
- Saci: ao avançar para fase 2, não carrega hitbox ou estado de investida pendente.
- Mula sem Cabeça: salto recebe apenas um impulso vertical, em vez de reaplicá-lo em vários quadros.
- Mula: investida entra em estado de preparação visual (0,56s fase 1 / 0,38s fase 2), permitindo reação do jogador. A hitbox ativa somente quando a carga começa.
- Mula: partículas de chama emitidas por intervalo de tempo (0,09s / 0,05s) e não por frame, reduzindo efeitos e diminuindo dependência do FPS; partículas antigas ainda expiram normalmente.
- Base dos 7 chefes: dano inválido não é aplicado e HP é limitado a zero; golpe letal não ativa a fase 2. Ao mudar de fase, exibe aviso curto de **FASE II — FÚRIA DESPERTA**; a barra de vida é reiniciada no início de cada luta.
- Inimigos comuns: ciclos de caminhada independentes por instância, postura aérea do saltador e indicador de intenção de ataque com progresso baseado no tempo restante. Tudo desenhado no canvas, sem assets adicionais.

### Arquivos alterados
`js/entities/bossSystem.js`, `js/entities/enemy.js`, `js/ui/bossHUD.js`, `index.html`, `CHECKPOINT.md`, `TEST-REPORT-v2.8.md`, `README-v2.8.md`.

### Testes efetivos
- Sintaxe dos módulos alterados de chefe, inimigo e HUD: PASS.
- 17 asserções executadas sobre criação dos 7 chefes, Saci (ambas as armas, sem hitbox durante aviso), Mula (sequência de saltos, aviso de carga, limites de chamas), troca de fase e dano letal.
- 7 simulações de 8 segundos, uma por chefe, atravessando primeira e segunda fase: PASS com substitutos para DOM, física e partículas. Os testes são simulações do JS real, **não** partidas completas em navegador.
- Testes manuais em desktop e smartphone, balanceamento real de dificuldade e FPS permanecem pendentes.

### Próximas prioridades
1. Jogar os 7 chefes no navegador, observar tempo de reação e ajustar padrões/tempo de aviso.
2. Medir FPS em Android e otimizar transparências, sombras e partículas.
3. Adicionar mais variedade de ataques aos chefes 3–7, mantendo os poderes e o enredo.
4. Melhorar esquiva e resposta visual de acertos/críticos.

---
## v2.7 — Variedade de inimigos, combate e usabilidade (2026-11-16)

**Escopo concluído em código**
- Reestruturado `createEnemy` com três arquétipos determinísticos por posição de spawn: **espreitador** (patrulha e perseguição), **brutamontes** (mais vida, menor velocidade, ataque lento e anunciado, até 2 de dano em regiões avançadas) e **saltador** (movimentação mais rápida e salto de perseguição com cooldown).
- As classes possuem silhuetas reconhecíveis desenhadas em canvas, sem adicionar texturas, sprites ou downloads.
- XP escalonado por tipo: padrão x1, saltador x1,2 e brutamontes x1,5; recompensa concedida uma vez por morte.
- Inimigos mortos saem da lista de atualização. Ao trocar de região, o conjunto é recriado de forma limpa e previsível; descansar continua recriando na região atual.
- Na versão mobile, um botão de **descansar** aparece apenas perto da fogueira, ligado ao mesmo comando `KeyE` já processado pelo sistema de input. Alterações CSS controladas para evitar piscar a cada frame.
- O carregamento descarta efeitos transitórios (confusão do Curupira), limpa hitboxes e temporizadores, mas mantém habilidades conquistadas.
- Ao derrotar um chefe, a confusão é removida.
- Corrigido conflito entre imunidade de dash/investida e a imunidade temporária de dano.
- Árvore não abre por cima de menu de save, opções, créditos finais ou loading.
- Descansar protege por ~1s contra os inimigos que acabaram de reaparecer; estado é revertido se falhar a gravação.

**Arquivos:** `js/entities/enemy.js`, `js/entities/player.js`, `js/main.js`, `js/systems/skillTree.js`, `js/systems/saveSystem.js`, `js/systems/campfireSystem.js`, `index.html`, `css/style.css`, `CHECKPOINT.md`, `README-v2.7.md`, `TEST-REPORT-v2.7.md`.

**Testes:** sintaxe dos 19 módulos JS aprovada e 22 asserções de simulação de inimigos, XP, reentrada, touch, save e interface; mais 10 verificações de descanso, invulnerabilidade e rollback de gravação. Parte desses testes valida chamadas e padrões em código; detalhes em `TEST-REPORT-v2.7.md`. Não foi realizado teste visual ou partida completa no browser.

**Pendências:** validar de ponta a ponta 8 regiões, 7 chefes, touch em Android/iOS, equilíbrio dos três arquétipos, pontos de spawn em plataformas e save/restore entre dispositivos. Não foi introduzido backend nem salvamento em nuvem.

---

# Folclorevania — checkpoint de desenvolvimento

## v2.6.1 — Correção de descanso e reaparecimento de inimigos (2026-11-16)
- Corrigido o save em fogueiras: **ao interagir com E**, o jogador restaura todos os corações e toda a energia antes de salvar.
- Corrigido o salvamento manual (F5 / pausa): agora também descansa, recupera vida/energia e recria os inimigos da região.
- O spawn da região corrente é substituído de uma vez, evitando cópias e preservando o progresso dos chefes e talentos.
- Fogueiras só são marcadas como acesas após conclusão positiva da gravação; em falha o estado de HP/energia/inimigos volta ao anterior.
- Proteção contra descansar durante morte, boss fight e transição.
- Testes de sintaxe e de integração em V8 executados para os fluxos acima; **navegador/jogabilidade mobile ainda requerem teste real**.
- Arquivos: `js/systems/saveSystem.js`, `js/main.js`, `js/systems/campfireSystem.js`, `index.html`, `CHECKPOINT.md` e `TEST-REPORT-v2.6.1.md`.

---

**Build de trabalho:** v2.6 — Árvore Ancestral  
**Base:** v2.5 (8 regiões e 7 chefes)  
**Data:** 2026-11-16

## Estado implementado
- Árvore de habilidades independente dos poderes concedidos pelos chefes.
- 3 especializações: Guerreiro, Guardião e Místico.
- 12 talentos com 26 níveis de investimento no total, pré-requisitos e pontos limitados.
- Experiência concedida por inimigos comuns (com escalonamento por região) e chefes.
- Cada nível concede 1 ponto; cada chefe derrotado pela primeira vez concede 2 pontos.
- Talentos aplicados a dano, críticos, alcance, execução, vida, energia, invulnerabilidade, cura, dash e especial.
- Painel responsivo com níveis, barra de XP, nós bloqueados e indicador de pontos.
- Acesso via tecla K, botão no HUD/viewport e menu de pausa; painel pausa o jogo e restaura a pausa anterior.
- Save v3 com árvore por slot e carregamento retrocompatível de saves v2.
- Compra grava imediatamente no slot ativo. Progresso de combate segue a política original: salvar em fogueira, F5 ou após chefes.
- Fogueiras acrescentadas ao Pântano do Boitatá e Covil da Cuca.
- Golpes especiais não recuperam vida contra inimigos/chefes invulneráveis.

## Arquivos afetados
- `js/systems/skillTree.js` (novo)
- `js/entities/player.js`, `js/entities/enemy.js`, `js/main.js`
- `js/systems/saveSystem.js`, `js/systems/campfireSystem.js`
- `js/ui/hud.js`, `index.html`, `css/style.css`
- `TEST-REPORT-v2.6.md`

## Testes e verificação
Ver `TEST-REPORT-v2.6.md`. Foram feitos testes de sintaxe JavaScript, lógica de progressão e simulações de integração de Player, Enemy e SaveSystem. **Não houve teste end-to-end em navegador real nesta execução.**

## Próximas prioridades
1. Testar manualmente as oito regiões e chefes no desktop e no celular, verificando bloqueios de entrada e progressão.
2. Balancear XP e dano com dados de gameplay real (tempo médio até primeiro nível, dificuldade dos chefes).
3. Adicionar sprites/efeitos específicos para talentos ativados, sem aumentar demasiadamente o peso.
4. Criar uma tela de estatísticas completa e telemetria local não identificável para ajustar progressão.
5. Adicionar testes automatizados de navegador para saves, menus e navegação touch.

## Regras para futuras alterações
- Não substituir as habilidades de progressão obtidas por chefes (pulo duplo, investida, especial).
- Preservar saves existentes e todos os 3 slots.
- Evitar alterar áreas ou streaming sem testes de regressão.
- Atualizar este checkpoint e o relatório de testes com resultados reais a cada versão.
