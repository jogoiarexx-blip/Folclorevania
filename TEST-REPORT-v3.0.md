# Folclorevania v3.0 — Relatório de testes

**Data:** 2026-11-16  
**Base do desenvolvimento:** commit `456d869623f7abd3874bb7922c1d3db2a1c8f928` (v2.9)  
**Tipo:** smoke test de renderização procedural com código real e Canvas 2D simulado.

## Cobertura executada
- Sintaxe dos arquivos JS de arte, Player, Enemy, Main e SaveSystem: PASS.
- **24 cenas do herói:** 8 estados (`idle`, `run`, `jump`, `dash`, `attack`, `charge`, `special`, `hurt`) × 3 qualidades (`low`, `medium`, `high`).
- **72 cenas de inimigos:** 3 classes × 8 biomas × 3 qualidades.
- **Total: 96 combinações**, sem erros nos comandos Canvas executados por mocks.
- **35 verificações de integração/segurança visual**, cobrindo também pureza de desenho quanto a x/y/health/state, fila do rastro limitada a 6, fila de ecos limitada a 16, expiração dos ecos, balanço de `ctx.save`/`ctx.restore`, número de comandos efetivamente desenhados, inclusão do módulo no HTML e conexão ao fluxo principal.
- Total de **17.694 chamadas simuladas ao Canvas** no teste inicial; não é métrica de FPS real.
- `tests/entityArtSmoke.test.js` foi acrescentado e executado em harness V8 que simula `fs`, `vm`, `path` e `assert`, com o mesmo módulo JS usado pelo jogo. Resultado: PASS em 96 cenários e regras de limite. O uso em Node real deve ser repetido no ambiente local ou CI.

## Verificações estáticas e compatibilidade
- `EntityArt.drawPlayer(ctx,Player)` e `EntityArt.drawEnemy(ctx,enemy)` substituem somente o desenho. Os estados físicos continuam sob `Player.update` e `Enemy.update`.
- `EntityArt.enemyDeath(enemy)` cria somente um efeito decorativo sem colisão, e o código existente remove a instância morta do array de inimigos.
- Nenhum campo novo é serializado no save e nenhum limite de HP, XP, velocidade, hitbox ou mapa foi alterado.
- O módulo visual tem um fallback: se faltar `EntityArt`, os desenhos da v2.9 ainda estão disponíveis.

## Limitações reais
Não houve browser E2E, screenshot de resultado visual do jogo, avaliação de legibilidade no celular, teste gráfico em GPU, medição de FPS ou QA completo das oito regiões. Os resultados descritos são simulações de execução, não homologação visual. Próxima etapa é testar jogo e galeria em navegador real e fazer ajustes de proporção/cores conforme as imagens.

## Verificações complementares antes da publicação
- Sintaxe de **23/23 arquivos JavaScript** da branch (incluindo dois testes) aprovada.
- **6 testes adicionais de integração** usando os módulos reais Player, Enemy e EntityArt com física/entrada/partículas simuladas: execução de 90 frames de atualizações, dano do herói e flash temporário, XP único no abate, eco visual único e reset visual sem alterar HP.
- Dependências da página: os 21 scripts no `index.html` e o script externo da galeria correspondem a arquivos existentes da branch; 2 trechos JavaScript inline da galeria tiveram sintaxe aprovada.
- **Ainda não foram executados testes reais de navegador ou métricas de FPS.**
