## Objetivo
Atender aos 6 itens: remover o valor exibido no cabeçalho, exibir o nome do fator no bloco de detalhes, adicionar a coluna PREÇO UNIT no formulário com cálculo automático e manter o subtotal dinâmico, além de garantir a exibição do preço unitário ajustado na página de detalhes.

## Implementações

### 1) Remover `div` do cabeçalho com total
- Arquivo: `src/pages/OrcamentoDetalhes.tsx`
- Remover o `<div class="mt-1 text-sm font-normal text-gray-700">…</div>` dentro do `<th>Valor Total`.
- Verificar que não há dependência (o cálculo total geral continua disponível para uso futuro se necessário, mas não exibido no cabeçalho).

### 2) Exibir nome do fator imediatamente abaixo de “Gravação: …”
- Arquivo: `src/pages/OrcamentoDetalhes.tsx` (bloco de detalhes do item antes da tabela)
- Inserir um `<div class="text-sm text-gray-600 mb-2">Fator: {fatorAtual}</div>` logo abaixo do `<p>Gravação: …`.
- `fatorAtual` definido como o primeiro nome de tabela preenchido entre `tabelaFator1`, `tabelaFator2`, `tabelaFator3`.

### 3) Adicionar coluna “PREÇO UNIT” no formulário
- Arquivo: `src/pages/OrcamentoForm.tsx`
- Entre `PREÇO UNIT. FORN.` e `FATOR`, inserir `PREÇO UNIT` no `<thead>`.
- No `<tbody>`, adicionar `<td>` com três linhas (uma por quantidade) exibindo o preço unitário ajustado: `(preço fornecido × fator × personalização)` reutilizando `precoVendaReal1/2/3` já calculados.
- Garantir atualização em tempo real quando preço, fator ou personalização mudarem.

### 4) Subtotal = PREÇO UNIT × quantidade
- Já está implementado usando `precoVendaRealN × quantidadeN`; manter e garantir a atualização conforme alterações.

### 5) Página de detalhes: exibição de “Valor Unitário” como preço ajustado
- Arquivo: `src/pages/OrcamentoDetalhes.tsx`
- Mantida a alteração que calcula e exibe `(valor_qtdN × fatorBase × personalização)` por linha na coluna "Valor Unitário".

### 6) Remoção permanente do outro `div` solicitado
- Confirmar que qualquer outra exibição redundante do valor total em `div` foi removida e que não há referências.

## Validação
- Navegar à edição de orçamento: verificar coluna “PREÇO UNIT” com valores atualizados; conferir subtotal e cabeçalho.
- Navegar à página de detalhes: verificar o nome do fator abaixo de “Gravação: …” e confirmar que o preço unitário ajustado aparece na coluna “Valor Unitário”.
- Confirmar ausência do `div` com total no cabeçalho.

## Arquivos Alvo
- `src/pages/OrcamentoDetalhes.tsx` (remoção do div, exibição do nome do fator)
- `src/pages/OrcamentoForm.tsx` (nova coluna no formulário e cálculos reativos)