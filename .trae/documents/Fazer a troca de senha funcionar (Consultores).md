## Objetivo
- Eliminar o erro 22P02 e o “Unexpected end of JSON input”, garantindo a troca de senha de consultores com segurança (Admin API) e respostas JSON válidas em desenvolvimento e produção.

## Passos de Correção
### 1) Banco (corrigir 22P02 se RPC for usada)
- Atualizar a função para aceitar BIGINT e recarregar o schema:
```sql
CREATE OR REPLACE FUNCTION public.update_consultor_with_password(
  p_consultor_id BIGINT,
  p_nome TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_id UUID;
BEGIN
  SELECT auth_user_id INTO v_auth_id
  FROM consultores
  WHERE id = p_consultor_id;

  UPDATE consultores
  SET nome = p_nome,
      email = p_email,
      telefone = p_telefone
  WHERE id = p_consultor_id;

  IF p_password IS NOT NULL AND v_auth_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf'))
    WHERE id = v_auth_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_consultor_with_password(
  BIGINT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

NOTIFY pgrst, 'reload schema';
```
- Observação: se migração para Admin API estiver ativa, remover o trecho de `encrypted_password` e manter a troca via Admin API.

### 2) Backend (rota segura para troca de senha)
- Criar rota Express `PUT /api/consultores/:id` usando Admin API e sempre respondendo JSON:
```ts
// api/routes/consultores.ts
router.put('/:id', async (req, res) => {
  try {
    const consultorId = Number(req.params.id);
    if (!Number.isFinite(consultorId)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const { nome, email, telefone, ativo, senha } = req.body || {};

    const { data: consultor, error: getError } = await supabaseAdmin
      .from('consultores')
      .select('id, auth_user_id')
      .eq('id', consultorId)
      .single();
    if (getError || !consultor) return res.status(404).json({ success: false, error: 'Consultor não encontrado' });

    const { error: updError } = await supabaseAdmin
      .from('consultores')
      .update({ nome, email, telefone: telefone ?? '', ativo: ativo ?? true, updated_at: new Date().toISOString() })
      .eq('id', consultorId);
    if (updError) return res.status(500).json({ success: false, error: 'Erro ao atualizar dados do consultor' });

    if (senha && String(senha).trim()) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(consultor.auth_user_id, { password: String(senha) });
      if (passError) return res.status(500).json({ success: false, error: 'Erro ao atualizar senha do consultor' });
    }

    return res.status(200).json({ success: true, message: 'Consultor atualizado com sucesso' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro inesperado ao atualizar consultor' });
  }
});
```
- Registrar a rota em `api/app.ts`:
```ts
import consultoresRoutes from './routes/consultores.ts';
app.use('/api/consultores', consultoresRoutes);
```
- (Opcional) Middleware de autorização para garantir role “admin” antes da troca de senha.

### 3) Dev Server (corrigir Unexpected JSON)
- Configurar proxy para `/api` no Vite:
```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001', // porta do backend
      changeOrigin: true
    }
  }
}
```
- Garantir que o backend Express esteja rodando (scripts de dev) e que todas as rotas retornem `res.status(...).json(...)` — sem respostas vazias.

### 4) Frontend (consultor-service)
- Usar a rota `/api/consultores/:id` com tratamento de erro robusto e remover duplicidade de `try`:
```ts
export async function updateConsultor(id: string, data: Partial<CreateConsultorData>) {
  const resp = await fetch(`/api/consultores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: data.nome, email: data.email, telefone: data.telefone || '', ativo: data.ativo ?? true, senha: data.senha || undefined })
  });
  const text = await resp.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* resposta inválida */ }
  if (!resp.ok || !json.success) throw new Error(json.error || `HTTP ${resp.status}`);
  return { success: true, message: json.message || 'Consultor atualizado com sucesso' };
}
```
- Garantir que não exista `});  try {` ou blocos `try` duplicados que causem sintaxe inválida.

## Checklist Final
- Aplicar a função SQL BIGINT e rodar `NOTIFY pgrst, 'reload schema'` (se usar RPC).
- Subir o backend Express e confirmar que `/api/consultores/:id` responde JSON.
- Configurar o proxy `/api` no Vite para apontar ao backend.
- Testar edição do consultor:
  - Sem senha: atualiza nome/email/telefone/ativo.
  - Com senha: atualiza também a senha via Admin API.
- Confirmar que:
  - Não aparece 22P02.
  - Não aparece “Unexpected end of JSON input”.
  - A tela “Personalizações” deixa de ficar em branco após aplicar a migration e o reload de schema.

Observação: Nunca exponha a service_role key no frontend; `supabaseAdmin` deve rodar apenas no backend. 