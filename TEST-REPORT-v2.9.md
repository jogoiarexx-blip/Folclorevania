# Relatório de testes — Folclorevania v2.9

**Data:** 2026-11-16  
**Commit de origem:** v2.8 (main anterior: `5b601d89623ed0916bffc8dc1a5a9d3ad131c883`)  
**Objetivo:** garantir que a nova camada de desenhos dos 7 chefes não gere exceções, não modifique estados de jogo no draw, e degrade em 3 qualidades.

## Simulação de renderização
Executados os arquivos reais `bossSystem.js` e `bossVisuals.js` com mocks de Canvas 2D, física, partículas e jogador.

- **42 combinações:** Saci, Mula sem Cabeça, Curupira, Caipora, Entidade Ancestral, Boitatá e Cuca × fases I/II × perfis low/medium/high.
- **Resultado:** 42 combinações processadas sem exceção.
- **25 verificações de agrupamento** no teste inicial (módulos válidos, carregamento e cada boss/perfil) também passaram.
- **32.533 comandos de desenho** passaram pelo Canvas substituto no smoke test, incluindo repetição de quadros; esse número não mede custo de GPU nem FPS real.
- O teste garante que `BossSystem.draw` não altera saúde, fase, x ou y, e que a renderização não avança o relógio de animação.
- Verificação sintática dos scripts inline da galeria: PASS.

## Automação mantida no repositório
`tests/bossVisualsSmoke.test.js`: execute com `node tests/bossVisualsSmoke.test.js` na raiz do projeto. O teste usa só `fs`, `vm` e `assert`, sem npm. Foi executado por simulação do ambiente de Node em V8; execução via Node real permanece a reproduzir por CI/ambiente local.

## Integridade do jogo
- Nenhuma mudança no formato de `localStorage`, nos três slots ou em `SaveSystem`.
- Nenhuma mudança nos limites das hitboxes, velocidade, HP ou IA dos chefes.
- As camadas de arte ficam em torno do desenho original; a nova galeria não é carregada pelo jogo.
- Na carga da página normal, um script novo `bossVisuals.js` é incluído após `bossSystem.js`.
- Os perfis de qualidade controlam sombra e número de detalhes; há rejeição de decoração fora da câmera.

## Riscos e verificações pendentes
Não houve captura real de tela do jogo nem teste interativo em um navegador nessa execução. As verificações não demonstram fidelidade estética, métricas de CPU/GPU/FPS, compatibilidade iOS/Android, ordem perfeita das camadas em todas as poses, colisões reais de combate ou uso de memória. Avaliar visualmente na galeria e depois em jogo é obrigatório antes de considerar o trabalho de QA gráfico encerrado.
