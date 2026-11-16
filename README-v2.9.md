# Folclorevania v2.9 — Sete Chefes, Sete Identidades Visuais

A nova versão substitui o tratamento gráfico genérico por uma camada visual individual para cada chefe. O jogo continua com gráficos procedurais Canvas 2D; nenhum asset pesado foi acrescentado.

## Prévia interativa
Abra **[Galeria dos chefes](./boss-gallery.html)** para selecionar qualquer chefe, alternar fases I e II, escolher entre baixa, média e alta qualidade e pausar a animação. Esta galeria é apenas uma vitrine gráfica; os controles e a colisão do combate permanecem no jogo principal.

## Melhorias por chefe
| Chefe | Melhorias gráficas |
| --- | --- |
| Saci | Três turbilhões, chapéu com selo, lenço flutuante e partículas de vento |
| Mula sem Cabeça | Pescoço em chamas, cascos brilhantes, fissuras de lava e reflexos no solo |
| Curupira | Cabelo flamejante, pés invertidos, marcas no corpo e folhas orbitais |
| Caipora | Cocar multicamadas, marcas faciais, pulseiras espirituais e glifos |
| Entidade Ancestral | Máscara rúnica, manto espectral, anéis e símbolos em órbita |
| Boitatá | Focinho e mandíbula, olhos, cristas e escamas incandescentes |
| Cuca | Rosto de jacaré, presas, escamas, coroa e encantamentos mágicos |

## Como funciona
`js/entities/bossVisuals.js` contém as camadas `drawBack()` e `drawFront()`, invocadas em volta do desenho original do boss em `BossSystem.draw()`. O tempo visual avança apenas no `BossSystem.update(dt)`, respeitando pausa e transições. Flash de dano e aura da fase II são atributos temporários do chefe, sem efeitos sobre a física.

Configurações `low`, `medium` e `high` reduzem intensidade de sombra e detalhes quando necessário. Decorações que ficam fora da câmera são descartadas. Não há textura nem modelo 3D adicional.

## Testes e limites
Um teste automatizado de 42 combinações (7 chefes × 3 perfis × 2 fases) foi acrescentado em `tests/bossVisualsSmoke.test.js`; execute `node tests/bossVisualsSmoke.test.js` no repositório para repeti-lo sem dependências. A simulação do código foi realizada em V8, mas **não substitui validar o resultado em um navegador real**.

Salvamento dos três slots, progressão, IA e colisões não tiveram seus dados ou regras modificados. Ver `CHECKPOINT.md` e `TEST-REPORT-v2.9.md`.
