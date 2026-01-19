## Visão Geral
- Consolidar as tabelas de fator criadas na página "Fatores" para uso direto na página de detalhes de orçamento.
- Garantir que o usuário selecione uma tabela (ex.: A, B, C) e que o sistema calcule o fator correto com base na quantidade do item.
- Aplicar o fator na formação do preço unitário para embutir a margem.

## Estado Atual
- CRUD de fatores usa `tabelas_fator` no Supabase, com faixas de quantidade e coluna `fator` (supabase/migrations/create_tabelas_fator.sql:1-115).
- Editor de fatores usa `tabelas_fator` para listar/inserir/atualizar (src/pages/TabelaFator.tsx:82-90, 140-152, 199-217).
- Orçamento possui selects de tabela de fator e calcula `fator1`/`precoVendaReal1` (src/pages/OrcamentoForm.tsx:3191-3225 e 725-736; preço: 2726-2731).

## Problemas Identificados
- Status filtrado como `"ativa"` em vez de `"ativo"` impede carregar tabelas (src/pages/OrcamentoForm.tsx:693-697).
- Busca das faixas consulta uma tabela inexistente `fatores`; deveria ler de `tabelas_fator` (src/pages/OrcamentoForm.tsx:708-716).
- Lista de opções não deduplica nomes, pois `tabelas_fator` tem várias linhas por tabela.

## Solução Técnica
1. Carregar nomes de tabelas únicos ativos:
   - Consultar `tabelas_fator` filtrando `status = 'ativo'`.
   - Deduplicar por `nome_tabela` para popular o `select`.
2. Carregar faixas por tabela:
   - Para cada `nome_tabela`, consultar `tabelas_fator` retornando `quantidade_inicial, quantidade_final, fator` ordenado.
   - Preencher `fatoresCarregados[nome_tabela]` com as faixas.
3. Cálculo do fator por quantidade:
   - Reutilizar `obterFatorPorQuantidade(nomeTabela, quantidade)` que percorre faixas e retorna o fator.
   - Aplicar o fator no preço unitário: `precoVendaReal = precoBase * fator`.
4. Consistência de dados:
   - Armazenar a escolha da tabela por item (`tabelaFator1/2/3`) e o fator calculado (`fator1/2/3`) já existe no estado; manter atualização ao mudar quantidade.
   - Opcional: usar RPC `calcular_fator(nome_tabela, quantidade)` para garantir fonte única no backend.

## Mudanças Pontuais (Frontend)
- Ajustar filtro de status:
  - De `eq('status', 'ativa')` para `eq('status', 'ativo')` (src/pages/OrcamentoForm.tsx:693-697).
- Trocar fonte das faixas:
  - De `supabase.from('fatores')` para `supabase.from('tabelas_fator')` com `eq('nome_tabela', ...)` e `eq('status','ativo')` (src/pages/OrcamentoForm.tsx:708-716).
- Deduplicar `tabelasFator`:
  - Mapear `data` para um Set por `nome_tabela` e criar array único para options (src/pages/OrcamentoForm.tsx:703-719).
- Manter `obterFatorPorQuantidade` como está (src/pages/OrcamentoForm.tsx:725-736).

## Validação
- Criar duas faixas na tabela A: 1-100 → 1.8, 101-300 → 1.79 (já presente na migration: supabase/migrations/create_tabelas_fator.sql:111-115).
- No orçamento, selecionar "Fator A":
  - Item com quantidade 50 → fator 1.8 e `precoVendaReal = preco * 1.8`.
  - Alterar quantidade para 120 → fator 1.79 recalcula automaticamente.
- Verificar `precoVendaReal1` atualiza conforme seleção e mudança de quantidade (src/pages/OrcamentoForm.tsx:2726-2731, 2978-2993).

## Opcional (Back-end)
- Usar `supabase.rpc('calcular_fator', { p_nome_tabela, p_quantidade })` como fallback quando não houver faixas pré-carregadas, garantindo regra única no BD.

## Entregáveis
- `select` de tabelas populado com os nomes criados na página de Fatores.
- Cálculo do fator por quantidade funcionando e preço unitário multiplicado pelo fator.
- Sem mudanças de schema; apenas correções de consulta e deduplicação no frontend.

## Confirmação
- Ao aprovar, aplico as mudanças nos pontos indicados e valido em tempo real no formulário de orçamento.