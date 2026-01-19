## Diagnóstico

* PGRST204 indica que o PostgREST não enxerga a coluna `valor` em `tabelas_personalizacao` (cache de esquema desatualizado ou migração não aplicada).

* O `ReferenceError: obterFatorPersonalizacao is not defined` ocorre porque ainda há chamadas à função antiga na edição de orçamento, após migração da lógica para "Preço" em vez de "Fator".

## Soluções

### 1) Banco e Cache

* Aplicar migração que adiciona a coluna `valor`:

  * `ALTER TABLE public.tabelas_personalizacao ADD COLUMN IF NOT EXISTS valor numeric;`

  * `UPDATE public.tabelas_personalizacao SET valor = COALESCE(valor, 0);`

* Forçar reload do schema do PostgREST:

  * `NOTIFY pgrst, 'reload schema';`

* Reiniciar o backend e validar health em `GET /api/health`.

### 2) Página de Personalização (Preço)

* Substituir todos usos de `fator` → `valor`:

  * Interfaces `TabelaPersonalizacao` e `NovaLinha`

  * Select: `quantidade_inicial, quantidade_final, valor`

  * Inserção: `{ valor: parseFloat(linha.valor) }`

  * Edição: `atualizarLinha(id, 'valor', novoValor)`

* Inputs com acessibilidade:

  * `aria-label="Preço da personalização"` e `step="0.01"`

  * Exibir com máscara monetária (R$) na visualização; entrada como número simples para confiabilidade.

* Tratamento de erro PGRST204:

  * Se erro `PGRST204` em update/insert, exibir toast: “Estrutura da tabela desatualizada. Atualize o schema do PostgREST.” e interromper ação.

### 3) Edição de Orçamento (Soma em vez de multiplicação)

* Remover chamadas a `obterFatorPersonalizacao` e usar `obterValorPersonalizacao(nomeTabela, quantidade)`.

* PREÇO UNIT por faixa:

  * `preco_base_n = preco_forn_n × fator_n`

  * `frete_unit_n = (q_n > 0 && F_n > 0) ? max(F_n / q_n, 0.01) : 0`

  * `preco_unit_n = preco_base_n + valor_personalizacao_n + frete_unit_n`

* Persistir `valor_qtd01/02/03` com a soma acima.

* Exibir PREÇO UNIT em tempo real somando preço base + valor de personalização + frete unitário.

### 4) Testes

* Integração (Personalização):

  * Inserir linha com `valor=2.50`, ler de volta, atualizar para `3.10`, validar persistência.

* Unidade (Cálculo PREÇO UNIT):

  * Dados: `preco_forn=10`, `fator=1.1`, `valor_person=2.50`, `frete_total=20`, `q=20` → `frete_unit=1.00` → `preco_unit=10×1.1 + 2.5 + 1.0 = 14.5`.

  * Checar arredondamento, piso de `frete_unit=0.01` quando aplicável.

### 5) Verificação Fim-a-Fim

* Editar “Preço” de personalização sem erro PGRST204.

* Abrir edição de orçamento sem ReferenceError e com “PREÇO UNIT” atualizando pela nova soma.

* Salvar e confirmar que detalhes mostram os mesmos valores de `valor_qtdXX`.

## Observação

* Caso o ambiente do PostgREST continue sem reconhecer `valor` após o `NOTIFY`, reinicie o serviço de API do Supabase para reindexar o schema.

