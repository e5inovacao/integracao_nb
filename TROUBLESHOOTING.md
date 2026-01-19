# Solução de Problemas (Troubleshooting)

## Erro: Login Falhando com "Invalid Credentials" ou "Email Provider Disabled"

### Sintoma
Ao tentar fazer login com `admin@naturezabrindes.com.br`, o sistema retorna erro de credenciais inválidas ou erro desconhecido, mesmo após rodar o script de reset de senha.

### Causa
O provedor de autenticação por **Email/Senha** está desabilitado nas configurações do seu projeto Supabase. Por segurança, novos projetos do Supabase às vezes vêm com isso desabilitado ou exigindo confirmação de email (que bloqueia login até clicar no link).

### Solução Definitiva
Você precisa habilitar o provedor manualmente no painel do Supabase.

1.  Acesse o painel do seu projeto no Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  No menu lateral esquerdo, clique no ícone de **Authentication** (parece um grupo de pessoas).
3.  No submenu, clique em **Providers**.
4.  Clique na opção **Email**.
5.  Certifique-se de que a primeira opção **Enable Email provider** esteja **ATIVADA (Verde)**.
6.  (Opcional, mas recomendado para dev) Desative **Confirm email** se quiser que novos usuários possam logar sem clicar no email de confirmação.
7.  Clique em **Save**.

### Após habilitar
Tente fazer login novamente na aplicação local com:
*   **Email**: `admin@naturezabrindes.com.br`
*   **Senha**: `admin123`

Se ainda falhar, rode novamente o script de reset para garantir:
```bash
npx tsx scripts/ensure_admin_user.ts
```
