# Folclorevania v2.6.1 — Testes de descanso, salvamento e inimigos
**Data:** 2026-11-16  
**Método:** execução do JavaScript do repositório em V8 com mock das APIs de navegador, estado do jogo, armazenamento local, sistema de fogueiras, regiões e inimigos. Testes funcionais reais de navegador/Android continuam pendentes.

## Diagnóstico
Em v2.6, o método SaveSystem.save() apenas serializava o HP e a energia atuais; CampfireSystem.update() acendia a fogueira e enviava "save" sem executar repouso; main.js apenas chamava SaveSystem.save() sem restaurar Player nem spawnar inimigos. Só o carregamento de save fazia spawnEnemies().

## Mudanças
- Criado `SaveSystem.saveRested(slotIndex, {campfireRegionId})` para restaurar `health = maxHealth` e `stamina = 100`, substituir o conjunto de inimigos vivos e persistir o resultado.
- O método salva normalmente para sistema de talentos e eventos de chefes: não há cura automática nesses eventos.
- Caso a gravação falhe, restaura HP, energia, lista de inimigos e flag da fogueira anteriores.
- O evento da fogueira não marca como acesa antes da gravação bem-sucedida.
- F5 e menu de pausa executam descanso completo ao salvar manualmente.
- Descansar durante boss, morte, transição ou em slot inválido é bloqueado.
- Interface informa claramente o efeito de descansar.

## Testes de integração — resultados PASS
1. Sintaxe dos quatro arquivos analisados: `saveSystem.js`, `campfireSystem.js`, `enemy.js`, `main.js`.
2. Interação na fogueira gera evento sem marcá-la como acesa prematuramente.
3. Descanso na fogueira grava o slot.
4. HP máximo e energia 100 são restaurados.
5. Todos os inimigos da região reaparecem com vida máxima, sem duplicação.
6. Fogueira acende apenas após save bem-sucedido.
7. Save armazena HP e energia recuperados.
8. Chefes derrotados e progressão de talentos permanecem.
9. Salvamento manual também descansa e grava.
10. Salvamento manual restaura HP/energia e inimigos.
11. Falha simulada de localStorage é reportada corretamente.
12. Falha de gravação reverte cura, energia e repopulação.
13. Descanso e salvamento em outra região usam slot distinto.
14. Regiões fora da região atual não são repopuladas.
15. Nenhum progresso é sobrescrito em outro slot.
16. Descanso bloqueado em boss fight.
17. Descanso bloqueado durante morte.
18. Descanso bloqueado em transição.

## Teste manual recomendado
No jogo: entre em uma região, deixe o HP ficar baixo, elimine um inimigo, vá à fogueira e pressione E. Confira HP cheio, energia 100 e inimigo reaparecido. Reinicie a página e carregue o mesmo slot para conferir a persistência. Repita com F5 e menu de pausa e em outra região.

**Limite:** teste em V8 simula dependências, mas não comprova interação visual/renderização no navegador nem a atualização do cache do GitHub Pages.
