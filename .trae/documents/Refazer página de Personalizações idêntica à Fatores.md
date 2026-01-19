## Objetivo
- Refazer a página de Personalizações copiando exatamente a página de Fatores, mudando apenas nomenclaturas e a coluna de valor (percentual no lugar de fator), mantendo o mesmo fluxo, UI e CRUD por faixas.

## O que ficará igual à Fatores
- Estrutura de duas vistas: cards (lista de tabelas) e edição (tabela específica).
- Controles: criar nova tabela, incluir/remover linhas, editar campos, salvar, sair.
- Faixas por quantidade: `quantidade_inicial` e `quantidade_final` com valor por faixa.
- Filtro por `status` (ativo/inativo), ordenação por `quantidade_inicial`.
- Layout, componentes e ações visuais idênticos.

## Tarefas Técnicas
1. Duplicar `src/pages/TabelaFator.tsx` para `src/pages/TabelaPersonalizacao.tsx`.
2. Substituir referências ao backend:
   - Trocar `tabelas_fator` → `tabelas_personalizacao`.
   - Campo `fator` → `percentual` (rótulo: “Percentual (%)”).
3. Manter o mesmo formulário inline para “Nova Tabela” (sem `prompt`).
4. Adicionar rota protegida `/personalizacoes` em `src/App.tsx` e item de menu em `src/components/Layout.tsx`.
5. Garantir mensagens de erro/aviso idênticas às de Fatores; tratar ausência de tabela com aviso (até aplicar migrações).

## Migração de Banco
- Usar a tabela `tabelas_personalizacao` (já planejada/implementada) com campos:
  - `nome_tabela`, `status`, `quantidade_inicial`, `quantidade_final`, `percentual`.
- Aplicar migrações no Supabase para o PostgREST reconhecer a tabela (evitar PGRST205).

## Integração no Orçamento
1. Carregar nomes únicos ativos de `tabelas_personalizacao` para o `select`.
2. Carregar faixas por tabela (`quantidade_inicial`, `quantidade_final`, `percentual`).
3. Calcular preço unitário com o mesmo padrão do Fator:
   - `preco_final = preco_unit × fator × (1 + percentual/100)`.
4. Recalcular ao alterar quantidade, tal como já acontece com Fatores.

## Validação
- Criar duas faixas na Personalização P: 1–100 → 10.000%, 101–300 → 12.500%.
- No orçamento, com quantidade 50 e fator 1.80: preço 10 → `10 × 1.80 × 1.10 = 19.80`.
- Alterar quantidade para 120: usa 12.5%.

## Entregáveis
- Página Personalizações idêntica à Fatores (UI e fluxo), com backend `tabelas_personalizacao`.
- Rota/menu atualizados e seleção dinâmica no Orçamento com cálculo por faixa de quantidade.

Confirma executar as alterações conforme acima?