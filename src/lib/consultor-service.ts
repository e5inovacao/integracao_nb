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
    const { data: result, error } = await supabase
      .rpc('update_consultor_with_password', {
        p_consultor_id: id,
        p_nome: data.nome,
        p_email: data.email,
        p_telefone: data.telefone || '',
        p_ativo: data.ativo ?? true,
        p_nova_senha: data.senha || null
      })

    if (error) {
      throw error
    }

    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao atualizar consultor')
    }

    return {
      success: true,
      message: result.message || 'Consultor atualizado com sucesso'
    }

  } catch (error) {
    console.error('Erro ao atualizar consultor:', error)
    throw error
  }
}