# Folclorevania 2.8 — O Despertar dos Chefes

Esta atualização foca em leitura de golpes, variedade real de padrões e economia de partículas. Preserva os 8 mapas, 7 chefes, 12 talentos e 3 slots locais.

## Combate
**Saci:** A primeira fase não fica mais presa à investida. O chefe alterna entre avançar e lançar uma rajada de vento. A preparação mostra a direção aproximada do perigo: 0,44s antes da carga e 0,48s antes da rajada. Na mudança para a segunda fase, abandona a investida atual.

**Mula sem Cabeça:** Os saltos recebem apenas um impulso por salto; a investida agora possui aviso antes do movimento (0,56s na primeira fase e 0,38s na segunda). As chamas passam a ser emitidas por intervalos de tempo, com menor custo em quadros por segundo elevados.

**Todos os chefes:** Exibição temporária de mudança de fase; barra de HP reiniciada corretamente ao começar outro chefe; golpes fatais não disparam uma transformação de fase extra.

**Inimigos normais:** Passos procedurais independentes, pose de salto e aviso de ataque progressivo. Nenhuma imagem ou biblioteca externa foi adicionada.

## Compatibilidade e limites
O salvamento local e as habilidades conquistadas não foram alterados. Um eventual cache do GitHub Pages pode exigir atualização forçada da aba (Ctrl+F5 no desktop).

Os testes de código e simulação estão em `TEST-REPORT-v2.8.md`. A experiência completa, especialmente a leitura do golpe no celular, ainda precisa de teste humano em navegador.
