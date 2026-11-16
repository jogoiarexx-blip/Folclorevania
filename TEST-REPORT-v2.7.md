# Testes de regressão — Folclorevania 2.7

**Data:** 2026-11-16  
**Execução:** V8 com código fonte do branch de desenvolvimento; mocks das APIs do DOM, colisões, progressão, localStorage e regiões.

## Revisão de arquitetura
Problemas confirmados na v2.6.1:
1. A IA de inimigos variava basicamente a velocidade e a vida por região; havia um único padrão de ataque.
2. A reentrada dependia de `enemies.length === 0`; listas com cadáveres permaneciam não vazias, impedindo o reabastecimento de encontros.
3. Ausência de `KeyE` nos botões touch, impossibilitando descansar em fogueiras sem teclado externo.
4. Carregamento preservava temporizadores antigos e podia carregar `_confused`.
5. Dash e investida encerravam a imunidade sem considerar o timer de dano.
6. A árvore podia ser aberta com outras telas ativas.

## Testes realizados (PASS)
- Sintaxe de **19 módulos JavaScript** carregados da branch: **19/19**.
- 22 asserções: classes de inimigos, valores de vida e velocidade, spawn determinístico, falta de duplicação, recompensa de XP uma vez por morte, saltos com cooldown, telegrafia de brutamontes, inversão de patrulha, botão de fogueira contextual, tecla virtual E, save/load e restauração de estado transitório, renovação das regiões e bloqueio da árvore enquanto a tela de save está aberta.
- 10 verificações: descanso manual/fogueira grava slot, restaura HP e stamina, protege por 1s, recria inimigos, mantém progresso de chefes, rollback integral quando a gravação falha e compatibilidade com imunidade do dash.
- Documentação atualizada no checkpoint.

**Importante:** esses testes não executam o renderizador ou a navegação real em navegador; algumas verificações são checagens de código. Não houve teste de frame rate, Android/iOS, gráficos in-game, gameplay de ponta a ponta ou combate contra os 7 chefes.

## Plano de validação visual
1. Visitar cada região, verificar as três classes, seus movimentos e recompensas de XP.
2. Matar parte dos inimigos, sair e voltar; conferir reposição limpa.
3. Testar desktop com E e celular com botão contextual na fogueira.
4. Salvar com pouco HP, descansar, sofrer dano após a proteção expirar e reiniciar a página para confirmar persistência.
5. Durante e após a luta com Curupira, garantir que nenhum controle fica invertido após derrotá-lo ou carregar save.
6. Abrir a árvore, salvar/carregar e retornar aos menus sem sobreposição.
