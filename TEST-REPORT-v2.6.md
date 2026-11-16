# Relatório de testes — Folclorevania v2.6

**Data:** 2026-11-16  
**Método:** execução de JavaScript em V8 com mocks de DOM, estado do jogo e armazenamento local, a partir dos arquivos da branch. Não foi realizado smoke test em Chromium/Firefox nem teste de interação touch real.

## Resultados PASS
- Sintaxe dos módulos JavaScript alterados.
- 12 talentos distribuídos em 3 caminhos.
- Experiência de 60 pontos evolui o personagem ao nível 2 e concede ponto.
- Pré-requisitos impedem a compra adiantada; falta de pontos impede compra.
- O painel pausa o jogo e restaura corretamente o estado anterior ao fechar.
- Compras modificam atributos e acionam salvamento no slot ativo.
- Chefes concedem pontos e experiência.
- Serialização, reset e restauração dos níveis dos talentos.
- Valores malformados de save têm limites e pré-requisitos validados.
- Saves v2 sem árvore iniciam progressão v2.6 vazia.
- Dados da árvore são isolados entre os slots 0 e 1.
- Compra de vigor aumenta vida máxima e preserva a restauração no save.
- Inimigos concedem XP uma vez após morte, mesmo com novo dano.
- Integração real de `Player`: dano adicional, execução, custo e duração do dash, alcance, redução do cooldown especial e extensão de invulnerabilidade.
- Ordem de carregamento de scripts e presença dos elementos de UI verificados.
- Fogueiras presentes nas regiões 0–7.

## Pendências de validação
- Abrir jogo via GitHub Pages em navegador e verificar console/requisições HTTP.
- Conferir cliques, foco, rolagem e layout do painel em resoluções móveis.
- Jogar o fluxo completo em 8 regiões e lutar contra os 7 chefes.
- Teste real de refresh da página após compra, morte, troca de slots e salvamento em fogueira.
- Verificar balanceamento de XP/talentos com sessões humanas.

**Importante:** os itens pendentes não devem ser reportados como testados.
