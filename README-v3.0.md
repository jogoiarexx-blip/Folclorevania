# Folclorevania v3.0 — Herói e Inimigos Redesenhados

Atualização visual que complementa os sete chefes da v2.9 com um herói de silhueta mais detalhada e três criaturas comuns com anatomias próprias. O jogo continua usando **Canvas 2D**, com desenhos vetoriais/procedurais, sem downloads grandes de novos modelos, texturas ou bibliotecas.

## Prévia sem precisar jogar
**[Abrir a galeria do personagem e inimigos](./entity-gallery.html)**

Na galeria é possível experimentar as ações parado, correr, pular, atacar, dash, investida e especial; alternar Espreitador, Brutamontes e Saltador; escolher entre oito biomas e três níveis de qualidade.

## Personagem
- Roupa e armadura em camadas, chapéu com fivela, pescoço e rosto detalhados, lenço animado, botas e braceletes.
- Espada visível no repouso e em ação, com guarda, lâmina, fio e golpe luminoso.
- Ciclos de marcha para pernas, capa e braços, movimento sutil em idle e pose diferenciada em pulo.
- Efeitos limitados de rastro para dash e investida, com cores específicas; aura especial e contorno luminoso quando recebe dano.

## Inimigos
- **Espreitador:** fera baixa, focinho, garras, orelhas pontudas e espinhos no dorso.
- **Brutamontes:** golem de pedra robusto, braços maciços, fissuras, núcleo de energia e armadura.
- **Saltador:** criatura ágil de membros longos, orelhas/antenas e olhos grandes.
- Paletas relacionadas às oito regiões, telegraph de ataques e flash de dano. Ao morrer, há um eco visual de dissolução de curta duração, além das partículas pré-existentes.

## Arquitetura
`js/entities/entityArt.js` é responsável apenas pela apresentação. O `Player` e os inimigos conservam o sistema de física, IA, inimigos mortos, XP, saves e hitboxes. Os métodos `draw` originais permanecem como fallback. Efeitos visuais usam um pool limitado e são limpos em um novo jogo/carregamento.

## Testar
A partir da raiz do repositório com Node 18 ou superior:
```bash
node tests/entityArtSmoke.test.js
```
O arquivo smoke não tem dependências externas e exercita o render de 96 combinações de herói/inimigos. Simulações não substituem conferir a arte no navegador e desempenho no celular.

**Versão atual:** 3.0. Arquivos técnicos: `CHECKPOINT.md` e `TEST-REPORT-v3.0.md`.
