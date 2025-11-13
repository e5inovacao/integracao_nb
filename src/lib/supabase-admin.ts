import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I'

// Cliente Supabase com privilégios administrativos
// ATENÇÃO: Este cliente deve ser usado APENAS no backend ou em operações administrativas seguras
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Cria um usuário de autenticação usando privilégios administrativos
 */
export async function createAuthUser(email: string, password: string, userData?: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: userData || {}
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar usuário de autenticação:', error)
    return { data: null, error }
  }
}

/**
 * Atualiza um usuário de autenticação
 */
export async function updateAuthUser(userId: string, updates: any) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar usuário de autenticação:', error)
    return { data: null, error }
  }
}

/**
 * Deleta um usuário de autenticação
 */
export async function deleteAuthUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao deletar usuário de autenticação:', error)
    return { data: null, error }
  }
}