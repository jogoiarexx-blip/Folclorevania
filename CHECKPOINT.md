# Folclorevania — checkpoint de desenvolvimento

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
