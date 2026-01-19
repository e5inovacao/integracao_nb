## Objetivo
- Converter a coluna FRETE para ter três inputs por produto (um por faixa de quantidade).
- Usar frete por faixa para o cálculo do PREÇO UNIT em tempo real.
- Garantir que a largura de FRETE seja igual à de PREÇO UNIT (70px).
- Persistir frete por faixa ao salvar (impacta valor_qtd01/02/03).

## Implementação
- `src/pages/OrcamentoForm.tsx`:
  - Substituir o único input de FRETE por três inputs (`frete1`, `frete2`, `frete3`).
  - Atualizar cálculo do PREÇO UNIT para usar frete unitário calculado por faixa: `max(freteN / quantidadeN, 0.01)`.
  - Atualizar `salvarInformacoesProdutos` para usar `frete1/2/3` em vez de frete único.

## Validação
- Editar valores de frete por faixa: PREÇO UNIT se atualiza imediatamente.
- Salvar o orçamento e verificar que a página de detalhes exibe os PREÇOS UNIT iguais aos calculados.
