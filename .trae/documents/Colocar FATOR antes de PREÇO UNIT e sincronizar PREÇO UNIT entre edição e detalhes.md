## Mudanças
- Reordenar colunas na tabela do formulário: "FATOR" antes de "PREÇO UNIT" tanto no `<thead>` quanto nas `<td>`.
- Persistir no banco o PREÇO UNIT ajustado (Preço Forn × Fator × Personalização) nos campos `valor_qtd01/02/03` durante o salvamento, de modo que os detalhes usem exatamente esses valores.
- Na página de detalhes, exibir o PREÇO UNIT salvo sem recomputar fatores; e calcular o "Valor Total" como `Quantidade × PREÇO UNIT` para alinhar com o formulário.

## Arquivos
- `src/pages/OrcamentoForm.tsx`: reordenar cabeçalhos/colunas; no `salvarInformacoesProdutos`, gravar `valor_qtdXX` com preço unitário ajustado; opcionalmente salvar `tabelafator1/2/3`.
- `src/pages/OrcamentoDetalhes.tsx`: coluna "Valor Unitário" mostra `valor_qtdXX` diretamente; "Valor Total" usa `Quantidade × valor_qtdXX` sem multiplicar fatores novamente.

## Validação
- Editar orçamento: verificar PREÇO UNIT e SUB-TOTAL atualizando em tempo real.
- Detalhes: confirmar que "Valor Unitário" coincide com a edição e que "Valor Total" é `Qtd × PREÇO UNIT`.
