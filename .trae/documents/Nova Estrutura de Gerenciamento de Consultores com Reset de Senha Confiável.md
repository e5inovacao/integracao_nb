## Diagnóstico dos Erros
- Logs indicam falha ao interpretar resposta JSON no frontend e resposta HTTP não OK do backend:
  - Frontend: `resp.json()` falha quando a resposta não é JSON ou está vazia; já trocado por parsing defensivo, mas o backend continua retornando erro.
  - Backend: `PUT /api/consultores/:id` pode falhar em três pontos comuns:
    1) `consultor.auth_user_id` ausente/inválido (não consegue atualizar senha).
    2) Service Role ausente ou inválido nos envs (chamada `supabaseAdmin.auth.admin.updateUserById`).
    3) Dados inconsistentes (ID numérico vs UUID; corpo inválido; Content-Type incorreto).

## Nova Abordagem (Arquitetura)
### 1) Camada Backend dedicada (controller + service)
- Criar rotas específicas e claras, sempre retornando JSON válido:
  - `PATCH /api/consultores/:id/password` (admin): altera a senha diretamente via `supabaseAdmin.auth.admin.updateUserById`.
  - `POST /api/consultores/:id/password-reset` (admin): gera link de recuperação via `supabaseAdmin.auth.admin.generateLink('recovery', email)` e envia e-mail.
  - `POST /api/consultores/:id/password-temp` (admin): define uma senha temporária forte e força alteração no próximo login (flag em tabela).
- Controller valida:
  - ID numérico e existência do consultor.
  - Presença de `auth_user_id` (UUID) e `email`.
  - Privilégios (apenas admin pode trocar senha de consultores).
- Service realiza:
  - Atualização na tabela `consultores` (metadados de senha temporária/force_change_password).
  - Chamadas admin do Supabase Auth.
- Respostas padronizadas:
  - Sempre `{ success: boolean, message?: string, error?: string, data?: any }` com `Content-Type: application/json`.

### 2) Consistência de Dados
- Garantir que a tabela `consultores` tenha `auth_user_id UUID NOT NULL`, `email UNIQUE`.
- Script de reconciliação:
  - Para cada consultor sem `auth_user_id`, buscar usuário de auth por e-mail e preencher.
  - Para e-mails divergentes, normalizar e travar alteração de senha até corrigir.

### 3) Frontend (serviços e UI)
- Serviços:
  - `updateConsultorPassword(id, novaSenha)` chama `PATCH /api/consultores/:id/password`.
  - `sendConsultorRecoveryLink(id)` chama `POST /api/consultores/:id/password-reset`.
  - `setConsultorTempPassword(id)` chama `POST /api/consultores/:id/password-temp` e exibe a senha temporária (apenas uma vez).
- UI (ConsultorForm):
  - Adicionar seção “Alterar Senha” com três ações: Definir nova senha (campo + confirmar), Enviar link de recuperação, Gerar senha temporária.
  - Validar força da senha, confirmação idêntica e exibir mensagens claras de sucesso/erro.

### 4) Segurança e Observabilidade
- Autorização backend: checar papel de quem chama (admin) via sessão/verificação de token.
- Auditoria: registrar alterações de senha (quem alterou, quando, IP).
- Rate limit: limitar tentativas por período para evitar abuso.
- MFA opcional para consultores ao ativar senha nova.

### 5) Robustez contra Falhas
- Backend: try/catch em todas operações e `return res.status(code).json({...})` SEM retornar corpo vazio.
- Frontend: ler `text()` e tentar `JSON.parse` apenas quando `content-type` for JSON; mensagens de erro amigáveis quando for HTML/erro do proxy.
- Health-check:
  - Endpoint `/api/health` retornando `{ ok: true }`.
  - Verificar Service Role carregado na inicialização do servidor.

## Plano de Implementação (Arquivos)
- `api/routes/consultores.ts`:
  - Adicionar rotas: `PATCH /:id/password`, `POST /:id/password-reset`, `POST /:id/password-temp` com respostas JSON padronizadas.
- `src/lib/consultor-service.ts`:
  - Adicionar funções: `updateConsultorPassword`, `sendConsultorRecoveryLink`, `setConsultorTempPassword` com parsing defensivo (já aplicado em `updateConsultor`).
- `src/pages/ConsultorForm.tsx`:
  - Adicionar UI para as três ações acima com validação e toasts.
- Migração/Script:
  - Reconciliação de `auth_user_id` por e-mail (apenas backend script/rota protegida).

## Validação
- Testar:
  - Alteração de senha direta por admin → login do consultor com nova senha.
  - Envio e uso do link de recuperação.
  - Senha temporária gerada e exigência de mudança no primeiro login.
- Confirmar que os logs anteriores não reaparecem e que todas respostas são JSON válidos.

## Entrega
- Implementar backend e frontend conforme descrito; manter documentação das rotas e respostas.
- Depois, rodar testes manuais guiados e fornecer relatório de validação.