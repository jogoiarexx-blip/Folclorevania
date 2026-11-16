# Relatório técnico — Folclorevania v2.8

**Data:** 2026-11-16  
**Escopo:** `bossSystem.js`, `enemy.js`, `bossHUD.js`, tela de título e documentação.  
**Ambiente de testes:** execução JavaScript V8 com mocks de física, colisões, partículas, jogador e canvas. O código real das classes de chefes foi executado.

## Defeitos identificados
1. Saci: o estado `idle` priorizava sempre uma nova investida assim que a recarga chegava a zero, tornando o ataque de vento da primeira fase praticamente inalcançável.
2. Mula: durante 0,3 segundo do estado de pisada, `vy=-7` era reaplicado a cada quadro, distorcendo a física da subida.
3. Mula: 2 a 4 chamas criadas em cada quadro, sem limitar a geração por tempo decorrido.
4. Interface de chefes: aviso de mudança de fase ausente e percentual interpolado de HP podia persistir de uma luta anterior.
5. Inimigos: faltavam ciclos de passos independentes e sinal visual de carregamento dos ataques.

## Código e testes
**Sintaxe:** os 3 módulos JavaScript alterados (chefes, inimigos, HUD) analisados sem erro.  
**17 testes lógicos aprovados:**
- Criação e estado inicial válido dos sete chefes.
- Saci usa os estados de preparação de investida e vento; ataque à distância realmente dispara.
- Hitbox do Saci não aparece antes de completar a preparação.
- Dano letal não força fase dois; dano acima de limiar não letal ativa fase dois apenas uma vez.
- Mula completa ciclos de pisada, anuncia a investida antes de começar, e quantidade de chamas no pool permaneceu abaixo de 90 em 12s de simulação.
- Medição em uma simulação da Mula: 4 inícios de pisada, carga avisada/realizada e máximo de 18 chamas simultâneas.

**7 simulações adicionais aprovadas:** todos os sete chefes em atualização real de JS, por 8s cada (4s na fase I e 4s na fase II), com coordenadas e vida finitas.

## Limitações
Não foram executados testes visuais em navegador real, testes de desempenho com métricas de FPS, colisões físicas completas de plataformas ou gameplay integral no Android. Os mocks de física e `boxHits` não substituem testes de hitbox reais. Salvar/carregar não sofreu alteração nesta versão; o checkpoint preserva os testes anteriores.

## Validação manual recomendada
1. Saci: esperar dois ataques na fase I, confirmar uma carga e uma rajada, ambos precedidos de aviso.
2. Mula: observar a altura de um salto, aviso laranja de carga e reação com dash; testar segunda fase.
3. Inimigos comuns: identificar movimentação das patas do saltador, espreitador e brutamontes e aviso de ataque.
4. Derrotar dois chefes em sequência e conferir que a barra de HP abre cheia em cada luta.
5. Repetir no celular e registrar FPS/latência de toque para refinamento.
