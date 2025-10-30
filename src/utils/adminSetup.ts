import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

/**
 * Função para criar o usuário administrador no sistema
 * @param email Email do administrador
 * @param password Senha do administrador
 * @returns Promise com resultado da operação
 */
export const createAdminUser = async (email: string, password: string) => {
  try {
    console.log('Iniciando criação do usuário administrador...');
    
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      throw new Error(`Erro na autenticação: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado corretamente');
    }

    console.log('Usuário criado no Auth:', authData.user.id);

    // 2. Criar registro na tabela consultores
    const { data: consultorData, error: consultorError } = await supabase
      .from('consultores')
      .insert({
        nome: 'Administrador',
        email: email,
        telefone: null,
        cpf: null,
        endereco: null,
        observacoes: 'Usuário administrador do sistema',
        ativo: true,
        auth_user_id: authData.user.id
      })
      .select()
      .single();

    if (consultorError) {
      console.error('Erro ao criar consultor:', consultorError);
      // Se falhou ao criar o consultor, tentar deletar o usuário do Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar registro do consultor: ${consultorError.message}`);
    }

    console.log('Consultor criado:', consultorData);

    // 3. Atualizar metadados do usuário no Auth
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role: 'admin',
        consultor_id: consultorData.id
      }
    });

    if (updateError) {
      console.warn('Aviso: Não foi possível atualizar metadados do usuário:', updateError);
    }

    return {
      success: true,
      message: 'Usuário administrador criado com sucesso!',
      user: authData.user,
      consultor: consultorData
    };

  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao criar usuário'
    };
  }
};

/**
 * Função para verificar se o usuário administrador já existe
 * @param email Email do administrador
 * @returns Promise com resultado da verificação
 */
export const checkAdminExists = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('consultores')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar administrador:', error);
      return { exists: false, error: error.message };
    }

    return { exists: !!data, data };
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    return { exists: false, error: 'Erro ao verificar usuário' };
  }
};

/**
 * Função para testar login do administrador
 * @param email Email do administrador
 * @param password Senha do administrador
 * @returns Promise com resultado do teste
 */
export const testAdminLogin = async (email: string, password: string) => {
  try {
    console.log('Testando login do administrador...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no teste de login:', error);
      return {
        success: false,
        message: `Erro no login: ${error.message}`
      };
    }

    if (data.user && data.session) {
      console.log('Login testado com sucesso:', data.user.id);
      
      // Fazer logout após o teste
      await supabase.auth.signOut();
      
      return {
        success: true,
        message: 'Login do administrador funcionando corretamente!',
        user: data.user
      };
    }

    return {
      success: false,
      message: 'Dados de login inválidos'
    };

  } catch (error) {
    console.error('Erro ao testar login:', error);
    return {
      success: false,
      message: 'Erro interno ao testar login'
    };
  }
};