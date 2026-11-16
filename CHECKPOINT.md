# Folclorevania — checkpoint de desenvolvimento

**Build de trabalho:** v2.6 — Árvore Ancestral  
**Base:** v2.5 (8 regiões e 7 chefes)  
**Data:** 2026-11-16

## Estado implementado
- Árvore de habilidades independente dos poderes concedidos pelos chefes.
- 3 especializações: Guerreiro, Guardião e Místico.
- 12 talentos com 27 níveis de investimento no total, pré-requisitos e pontos limitados.
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
