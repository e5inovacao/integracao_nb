import { supabase } from './supabase'
import { createAuthUser, supabaseAdmin } from './supabase-admin'

export interface CreateConsultorData {
  nome: string
  email: string
  telefone?: string
  senha: string
  ativo?: boolean
  role?: string
}

/**
 * Cria um consultor completo (registro + usuário de autenticação)
 */
export async function createConsultor(data: CreateConsultorData) {
  try {
    const { data: result, error } = await supabase
      .rpc('create_consultor_complete', {
        p_nome: data.nome,
        p_email: data.email,
        p_telefone: data.telefone || '',
        p_senha: data.senha,
        p_ativo: data.ativo ?? true,
        p_role: data.role || 'consultor'
      })

    if (error) {
      throw error
    }

    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao criar consultor')
    }

    return {
      success: true,
      consultor_id: result.consultor_id,
      auth_user_id: result.auth_user_id,
      message: result.message || 'Consultor criado com sucesso'
    }

  } catch (error) {
    console.error('Erro ao criar consultor:', error)
    throw error
  }
}

/**
 * Atualiza um consultor existente
 */
export async function updateConsultor(id: string, data: Partial<CreateConsultorData>) {
  try {
    // Preflight de saúde da API
    const healthOk = await (async () => {
      try {
        const h = await fetch('/api/health', { method: 'GET' });
        const raw = await h.text();
        let json: any = null;
        try { json = JSON.parse(raw); } catch {}
        return h.ok && json && json.success === true;
      } catch {
        return false;
      }
    })();
    if (!healthOk) {
      throw new Error('API offline');
    }

    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any = null;
    while (attempts < maxAttempts) {
      attempts++;
      const resp = await fetch(`/api/consultores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || '',
          ativo: data.ativo ?? true,
          senha: data.senha || undefined,
        })
      });
      const contentType = resp.headers.get('content-type') || '';
      const raw = await resp.text();
      let json: any = null;
      if (raw && contentType.includes('application/json')) {
        try { json = JSON.parse(raw); } catch { /* ignore */ }
      }
      if (!resp.ok) {
        const msg = (json && (json.error || json.message)) || raw || 'Erro ao atualizar consultor';
        // Retry leve em caso de API not found (servidor reiniciando)
        if (attempts < maxAttempts && /API not found/i.test(String(msg))) {
          await new Promise(r => setTimeout(r, 1500));
          lastError = new Error(msg);
          continue;
        }
        throw new Error(msg);
      }
      if (!json || json.success !== true) {
        const msg = (json && (json.error || json.message)) || 'Resposta inválida do servidor';
        throw new Error(msg);
      }
      return { success: true, message: json.message || 'Consultor atualizado com sucesso' };
    }
    if (lastError) throw lastError;
  } catch (error) {
    console.error('Erro ao atualizar consultor:', error);
    throw error;
  }
}

export async function updateConsultorPassword(id: string, novaSenha: string) {
  try {
    const resp = await fetch(`/api/consultores/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: novaSenha })
    });
    const contentType = resp.headers.get('content-type') || '';
    const raw = await resp.text();
    let json: any = null;
    if (raw && contentType.includes('application/json')) {
      try { json = JSON.parse(raw); } catch { /* ignore */ }
    }
    if (!resp.ok) {
      const msg = (json && (json.error || json.message)) || raw || 'Erro ao atualizar senha do consultor';
      throw new Error(msg);
    }
    if (!json || json.success !== true) {
      const msg = (json && (json.error || json.message)) || 'Resposta inválida do servidor';
      throw new Error(msg);
    }
    return { success: true, message: json.message || 'Senha atualizada com sucesso' };
  } catch (error) {
    console.error('Erro ao atualizar senha do consultor:', error);
    throw error;
  }
}

export async function sendConsultorRecoveryLink(id: string) {
  try {
    const resp = await fetch(`/api/consultores/${id}/password-reset`, {
      method: 'POST'
    });
    const raw = await resp.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch { /* ignore */ }
    if (!resp.ok || !json?.success) {
      throw new Error((json && (json.error || json.message)) || 'Erro ao solicitar recuperação de senha');
    }
    return { success: true, recoveryLink: json.data?.recoveryLink || null };
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    throw error;
  }
}

export async function setConsultorTempPassword(id: string) {
  try {
    const resp = await fetch(`/api/consultores/${id}/password-temp`, { method: 'POST' });
    const raw = await resp.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch { /* ignore */ }
    if (!resp.ok || !json?.success) {
      throw new Error((json && (json.error || json.message)) || 'Erro ao definir senha temporária');
    }
    return { success: true, tempPassword: json.data?.tempPassword };
  } catch (error) {
    console.error('Erro ao definir senha temporária:', error);
    throw error;
  }
}