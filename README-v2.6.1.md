# Folclorevania v2.6.1 — Descansar e Salvar
Correção do sistema de recuperação e reaparecimento de inimigos da versão 2.6.

## Como descansar
Aproxime-se da fogueira de uma região e pressione **E**. Alternativamente, abra **Pausa → Descansar e salvar** ou use **F5**, escolhendo um slot.

Ao descansar:
- Vida é restaurada até a quantidade atual de corações máximos.
- Energia volta a 100.
- Todos os inimigos normais **da região atual** reaparecem nas posições originais com vida máxima, substituindo os antigos (sem duplicação).
- A posição, experiência, talentos e chefes derrotados seguem intactos.
- Os valores restaurados são persistidos no slot escolhido.

Salvar a compra de um talento ou o progresso pós-chefe **não** provoca descanso automático. Não há novos tipos de inimigos nesta correção, apenas reaparecimento dos inimigos já existentes.

Caso o navegador não consiga gravar, o descanso é cancelado e surge mensagem de erro.

## Verificação
Consultar `TEST-REPORT-v2.6.1.md` e `CHECKPOINT.md`. Os testes feitos são de lógica e integração simulada; ainda é preciso validar em navegador e dispositivos móveis reais.
