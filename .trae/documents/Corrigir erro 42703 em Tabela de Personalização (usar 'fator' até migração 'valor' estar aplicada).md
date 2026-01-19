## Diagnóstico
- O erro 42703 ocorre porque a consulta está pedindo a coluna `valor` em `tabelas_personalizacao`, mas a coluna ainda não existe no banco (ou o cache do PostgREST não foi recarregado).

## Correção
- Ajustar `TabelaPersonalizacao.tsx` para:
  - Selecionar apenas `fator` (coluna existente) na função `carregarLinhas`.
  - Renderizar/preencher o campo "Preço" usando `linha.valor ?? linha.fator ?? 0` (compatível com ambos; se `valor` não existir, usa `fator`).
  - Inserir novas linhas gravando em `fator` (a partir do valor do input de preço) enquanto a coluna `valor` não estiver disponível.
  - Manter o update de linha: tenta `valor`, e se der `PGRST204`, faz fallback para `fator` (já implementado).
  - Adicionar `aria-label` nos inputs para acessibilidade.

## Validação
- Abrir qualquer tabela de personalização: não deve mais ocorrer 42703.
- Inserir e editar preços devem funcionar, exibindo valores como R$ e persistindo em `fator` até que a coluna `valor` seja aplicada.

## Observação
- Quando a migração que adiciona `valor` estiver aplicada e o schema recarregado, podemos mudar o select para incluir `valor` oficialmente e parar de depender do fallback.
