## Análise Profunda
### Fluxo de atualização de senha
- UI: `src/pages/ConsultorForm.tsx` envia `updateConsultor(id, {...})` quando em modo edição.
- Service: `src/lib/consultor-service.ts` chama `supabase.rpc('update_consultor_with_password', { p_consultor_id: id, ... })`.
- Banco: função `update_consultor_with_password` (fix_consultor_functions.sql) atualiza dados do consultor e, se fornecida, a senha em `auth.users.encrypted_password` via `crypt()`.

### Logs & Causa raiz
- Erro 22P02: "invalid input syntax for type uuid: '4'".
- Motivo: a função SQL define `p_consultor_id UUID` enquanto `consultores.id` é `BIGSERIAL` (inteiro). Ao passar `"4"`, o Postgres tenta converter para UUID.

### Validações e regras
- Formulário exige nome/email; senha só se fornecida quando editando.
- Função SQL é `SECURITY DEFINER` e não restringe a admins; segurança pode ser reforçada.

### Conexão & permissões
- RPC executada por usuário autenticado; RLS não se aplica à função, mas políticas existem para tabelas.
- Necessário garantir GRANT correto e reload de schema.

### Criptografia
- Função usa `pgcrypto/crypt('bf')`; em Supabase, ideal é usar o Admin API (GoTrue) para senha. Podemos manter criptografia atual e planejar migração posterior.

### Tela de Personalizações em branco
- Página consulta `tabelas_personalizacao`; quando a tabela não existe/sem schema cache (PGRST205), retorna vazio. É necessário aplicar a migration e/ou reload de schema.

## Correções Propostas
### 1) Atualização de senha (corrigir 22P02)
- Banco:
  - Criar migration que troca assinatura da função para `p_consultor_id BIGINT` e atualiza GRANT.
  - Opcional: adicionar verificação de admin dentro da função (usando `raw_user_meta_data->>'role' = 'admin'`).
  - Executar reload de schema do PostgREST após aplicar migration.
- Frontend:
  - Garantir que o service envie `Number(id)` para `p_consultor_id`.
- Validação & mensagens:
  - Mapear erros específicos (email duplicado, permissão) e mostrar toasts claros.
- Segurança:
  - Manter `SECURITY DEFINER` com checagem de admin para evitar abuso.
  - Planejar migração futura para `supabaseAdmin.auth.admin.updateUserById` (rota server-side restrita).

### 2) Personalizações (página em branco)
- Aplicar migration `tabelas_personalizacao` (estrutura idêntica à de Fatores: faixas por quantidade + percentual, RLS/índices/triggers).
- Executar reload de schema do PostgREST.
- Validar que policies de SELECT para `authenticated` estão ativas.
- Confirmar se o fallback de aviso aparece quando a tabela está ausente; com tabela criada, cards/lista devem carregar.

### 3) Status dos produtos
- Lista: usar `status_active` para exibir “Ativo/Inativo”.
- Formulário: ao selecionar “Inativo”, atualizar `status_active` em `ecologic_products_site` e refletir no load/salvar.

## Etapas de Execução
1. Aplicar migration da função (`update_consultor_with_password` → BIGINT) e fazer schema reload.
2. Confirmar no service que `p_consultor_id: Number(id)` está ativo.
3. Testar edição de consultor com ID numérico (ex.: 4) e atualização de senha.
4. Aplicar migration da `tabelas_personalizacao` e fazer schema reload; abrir `/personalizacoes` e verificar.
5. Validar exibição e alteração de status nos produtos conforme `status_active`.

## Validação
- Atualizar senha: usar consultor com id inteiro; senha altera sem 22P02; mensagens de sucesso/erro claras.
- Personalizações: página carrega cards, criação/edição/salvar funcionam.
- Produtos: colunas e form refletem status com persistência em BD.

## Segurança & Ambientes
- Checagem de admin dentro da função de senha; GRANT restrito.
- Testar em desenvolvimento e homologação com schema reload para evitar cache.
- Planejar migração futura para fluxo via Admin API.

Posso executar as migrações e atualizar as funções conforme acima para resolver os erros e habilitar as telas. Deseja que eu aplique agora?