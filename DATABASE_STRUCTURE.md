# Documentação Completa da Estrutura de Banco de Dados

Este documento descreve a estrutura completa, lógica e relacionamentos do banco de dados do sistema NB Admin (Natureza Brindes). O banco de dados utiliza PostgreSQL e é gerenciado via Supabase.

## 1. Visão Geral

O banco de dados é projetado para suportar um sistema de e-commerce B2B e gestão de orçamentos. Ele integra produtos de múltiplos fornecedores, gerencia clientes, orçamentos, consultores e configurações dinâmicas do sistema.

**Tecnologia**: PostgreSQL (Supabase)
**Autenticação**: Supabase Auth (integrado via `auth.users`)

---

## 2. Tabelas Principais (Core)

Estas tabelas são o núcleo do sistema de orçamentos.

### `clientes_sistema`
Armazena a base de clientes que solicitam orçamentos.
- **id**: UUID (PK) - Identificador único.
- **nome**: VARCHAR(255) - Nome do cliente.
- **email**: VARCHAR(255) (Unique) - Email principal.
- **telefone**: VARCHAR(20) - Telefone de contato.
- **empresa**: VARCHAR(255) - Nome da empresa do cliente.
- **created_at**: TIMESTAMPTZ - Data de criação.
- **updated_at**: TIMESTAMPTZ - Data de atualização (Auto-update via trigger).

### `orcamentos_sistema`
Armazena os cabeçalhos dos orçamentos.
- **id**: UUID (PK) - Identificador único.
- **numero_orcamento**: VARCHAR(50) (Unique) - Gerado automaticamente (ex: `ORC-0001`).
- **cliente_id**: UUID (FK -> `clientes_sistema`) - Referência ao cliente.
- **data_evento**: DATE - Data do evento do cliente (opcional).
- **observacoes_cliente**: TEXT - Observações enviadas pelo cliente.
- **status**: VARCHAR(20) - Enum: `pendente`, `aprovado`, `rejeitado`, `finalizado`.
- **valor_total**: DECIMAL(12,2) - Valor total do orçamento.
- **created_at**: TIMESTAMPTZ.
- **updated_at**: TIMESTAMPTZ.

### `itens_orcamento_sistema`
Armazena os produtos incluídos em cada orçamento.
- **id**: UUID (PK).
- **orcamento_id**: UUID (FK -> `orcamentos_sistema`).
- **produto_ecologico_id**: BIGINT (FK -> `ecologic_products`).
- **quantidade**: INTEGER - Quantidade solicitada (> 0).
- **observacoes**: TEXT - Notas específicas do item.
- **created_at**: TIMESTAMPTZ.

---

## 3. Catálogo de Produtos

### `ecologic_products` (View pública: `eco_products`)
Tabela unificada de produtos, consolidando dados de fornecedores externos (XBZ, Asia, Spot).
- **id**: BIGINT (Identity PK).
- **tipo**: TEXT - Origem do produto (`XBZ`, `ASIA`, `SPOT`).
- **codigo**: TEXT - Código do fornecedor.
- **titulo**: TEXT - Nome do produto.
- **descricao**: TEXT - Descrição detalhada.
- **img_0**, **img_1**, **img_2**: TEXT - URLs das imagens.
- **categoria**: TEXT - Categoria do produto.
- **cor_web_principal**: TEXT - Cor principal.
- **altura**, **largura**, **comprimento**, **peso**: NUMERIC - Dimensões físicas.
- **variacoes**: JSONB - Dados flexíveis de variações (cores, tamanhos).

### `produtos` (Catálogo Interno/Legado)
Tabela para produtos cadastrados manualmente.
- **id**: UUID (PK).
- **nome**: VARCHAR(255).
- **custo_base**: DECIMAL(10,2).
- **fator_multiplicador**: DECIMAL(5,2).
- **preco_venda**: DECIMAL(10,2) (Gerado: `custo_base * fator_multiplicador`).
- **estoque_atual**: INTEGER.
- **status**: VARCHAR(20) (`ativo`, `inativo`).

### `produto_variacoes`
Variações para a tabela `produtos`.
- **id**: UUID (PK).
- **produto_id**: UUID (FK -> `produtos`).
- **nome**: VARCHAR(255) (ex: "Cor Azul").
- **tipo**: VARCHAR(50) (ex: "cor", "tamanho").
- **valor**: VARCHAR(100).

---

## 4. Administrativo e Configurações

### `consultores`
Gerencia a equipe de vendas e administradores.
- **id**: BIGSERIAL (PK).
- **nome**: VARCHAR(255).
- **email**: VARCHAR(255) (Unique).
- **cpf**: VARCHAR(14) (Unique).
- **auth_user_id**: UUID (FK -> `auth.users`) - Vínculo com usuário do Supabase Auth.
- **ativo**: BOOLEAN.
- **role**: Metadado armazenado em `auth.users` (`admin` ou `consultor`).

### `user_profiles`
Tabela moderna para gestão de perfis de usuário (Super Admins, Admins e Consultores).
- **id**: UUID (PK).
- **user_id**: UUID (FK -> `auth.users`) - Unique.
- **full_name**: VARCHAR(255).
- **role**: VARCHAR(50) (`super_admin`, `admin`, `consultor`).
- **is_active**: BOOLEAN.
- **created_at**, **updated_at**: TIMESTAMPTZ.
*Nota: Esta tabela tende a centralizar as permissões e perfis de acesso.*

### `configuracoes`
Armazena parâmetros globais do sistema (Key-Value).
- **id**: BIGSERIAL (PK).
- **chave**: VARCHAR(255) (Unique) - Ex: `orcamento_validade_padrao`.
- **valor**: TEXT - Valor da configuração.
- **categoria**: VARCHAR(100) - Ex: `sistema`, `orcamento`.
- **tipo**: VARCHAR(50) - Ex: `texto`, `numero`, `booleano`.

---

## 5. Precificação e Personalização

### `personalizacoes`
Cadastro de tipos de serviços de personalização.
- **id**: UUID (PK).
- **nome**: VARCHAR(255) (ex: "Laser", "Silk").
- **status**: VARCHAR(20).
- **percentual**: DECIMAL(10,3) - Custo base percentual.

### `tabelas_personalizacao`
Regras de preço de personalização por faixa de quantidade.
- **id**: UUID (PK).
- **nome_tabela**: VARCHAR(255) (Agrupador, ex: "Tabela P").
- **quantidade_inicial**: INTEGER.
- **quantidade_final**: INTEGER.
- **percentual**: DECIMAL(10,3) - Percentual a aplicar nesta faixa.

### `tabelas_fator`
Regras de markup (fator multiplicador) por quantidade de produtos.
- **id**: UUID (PK).
- **nome_tabela**: VARCHAR(255) (Agrupador, ex: "Tabela A").
- **quantidade_inicial**: INTEGER.
- **quantidade_final**: INTEGER.
- **fator**: DECIMAL(10,3) - Fator a multiplicar pelo custo nesta faixa.

---

## 6. Lógica de Banco de Dados (Backend Logic)

### Triggers (Gatilhos)
1.  **`update_updated_at_column`**: Presente em quase todas as tabelas. Atualiza o campo `updated_at` para `NOW()` sempre que um registro é modificado.
2.  **`set_orcamento_numero`**: Ao inserir um novo orçamento, gera automaticamente o `numero_orcamento` sequencial (ex: `ORC-1023`) se não for fornecido.

### Functions (Funções Armazenadas)
1.  **`generate_quote_number()`**: Lógica para buscar o último número de orçamento e incrementar.
2.  **`ensure_client_exists(email, ...)`**: Verifica se um cliente existe pelo email. Se não, cria um novo e retorna o ID. Usado para criar orçamentos para novos leads automaticamente.
3.  **`calcular_fator(tabela, quantidade)`**: Retorna o fator multiplicador correto baseado na tabela informada e na quantidade desejada.
4.  **`get_tabelas_fator_by_nome`**: Retorna todas as faixas de uma tabela específica.

### Row Level Security (RLS) - Segurança
O sistema utiliza RLS extensivamente para proteção de dados:
*   **Público (`anon`)**: Pode ler produtos (`ecologic_products`) e inserir orçamentos/clientes (para solicitações via site).
*   **Autenticado (`authenticated`)**:
    *   **Admins**: Acesso total a todas as tabelas.
    *   **Consultores**: Podem ver seus próprios dados e orçamentos vinculados a eles. Podem ler produtos e configurações.

---

## 7. Como Replicar

Para replicar este banco de dados:

1.  **Instale o PostgreSQL** e habilite a extensão `pgcrypto` ou `uuid-ossp` (o Supabase já traz habilitado).
2.  **Execute os Scripts de Migração** na ordem numérica/cronológica. Os scripts principais são:
    *   `001_create_initial_tables.sql`
    *   `007_clean_database_architecture.sql` (Estrutura limpa principal)
    *   `fix_ecologic_products_schema.sql` (Estrutura de produtos)
    *   `create_configuracoes_table.sql`
    *   `004_create_consultores_table.sql`
    *   `create_tabelas_fator.sql`
3.  **Popule os Dados Iniciais**:
    *   Inserir configurações padrão na tabela `configuracoes`.
    *   Inserir tabelas de fator e personalização padrão.
    *   Importar produtos para `ecologic_products`.

---

## 8. Integração e Unificação (Novo Esquema 2026)

Esta seção descreve a unificação com o sistema "Gestão de Pedidos", consolidando parceiros, pedidos e financeiro.

### 8.1. Novas Entidades Principais

#### `partners`
Unifica Clientes e Fornecedores.
- **id**: UUID (PK)
- **type**: ENUM ('CLIENTE', 'FORNECEDOR', 'AMBOS')
- **name**: Identificação (Nome do contato).
- **company_name**: Razão Social / Nome da Empresa.
- **doc**: CPF/CNPJ.
- **financial_email**: Email para cobrança.
- **active**: Boolean.

#### `orders`
Tabela de execução do pedido (Pós-venda).
- **id**: UUID (PK)
- **quote_id**: UUID (FK -> `orcamentos_sistema`) - Vínculo com a origem.
- **partner_id**: UUID (FK -> `partners`).
- **status**: Status do processo (Produção, Financeiro, Entrega).
- **total_amount**: Valor total.
- **entry_amount**, **remaining_amount**: Controle de pagamentos.

#### `order_items`
Itens do pedido com detalhamento de custos.
- **unit_price**: Preço de venda (congelado do orçamento).
- **total_item_value**: Valor total do item.
- **real_cost_product**, **real_cost_customization**: Custos reais para cálculo de margem.

#### `commissions`
Controle de comissões de vendedores.
- **amount**, **type** ('ENTRADA', 'RESTANTE'), **status**.

#### `company_expenses`
Contas a pagar da empresa.

### 8.2. Alterações em Tabelas Existentes

- **`ecologic_products`**:
  - Adicionado `supplier_id` (FK -> `partners`).
  - Adicionado `cost_price` (Custo base).

- **`itens_orcamento_sistema`**:
  - Adicionado `unit_price` e `total_price` para garantir integridade ao converter para pedido.

### 8.3. Fluxo de Conversão (Quote -> Order)
Uma função de banco de dados `convert_quote_to_order(quote_id)` foi criada para:
1. Validar o orçamento aprovado.
2. Criar/Vincular o parceiro (`partners`) baseado no usuário.
3. Gerar o registro de `orders`.
4. Copiar itens para `order_items` com preços congelados.
