## Objetivo

* Remover erros ao salvar produtos (22P02) substituindo strings de tabela de fator por valores numéricos nas colunas numéricas.

* Reduzir/neutralizar o log AuthApiError refresh\_disabled em desenvolvimento.

## Implementações

1. OrcamentoForm

* No objeto de inserção/atualização, trocar `tabelafator1/2/3` para receber `product.fator1/2/3` (números) em vez de nomes de tabela.

* Manter os nomes das tabelas em campos textuais locais (`product.tabelaFatorN`) somente para cálculo UI, não enviar esses nomes para colunas numéricas.

1. Supabase Client

* Desabilitar persistência de sessão para evitar tentativas de refresh.

* Suprimir logs de erro `refresh_disabled` capturando e ignorando o caso específico.

## Validação

* Tentar salvar produtos com fator “A/B” selecionado → não deve ocorrer 22P02.

* Navegar com sessão expirada → suprimir log de `refresh_disabled` sem quebrar navegação.

