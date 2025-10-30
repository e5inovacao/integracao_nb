import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'consultor';

export interface AuthUser extends User {
  role?: UserRole;
}

export interface ConsultorData {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  observacoes?: string;
  ativo: boolean;
  auth_user_id: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  consultorData: ConsultorData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isConsultor: () => boolean;
  hasRole: (role: UserRole) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [consultorData, setConsultorData] = useState<ConsultorData | null>(null);
  const [loading, setLoading] = useState(true);

  // Função de retry com backoff exponencial
  const retryWithBackoff = async (fn: () => Promise<any>, maxAttempts: number = 3): Promise<any> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Lista de erros que não devem ser retentados
        const nonRetryableErrors = [
          'invalid_grant',
          'unauthorized',
          'forbidden',
          'Invalid login credentials',
          'Email not confirmed'
        ];
        
        const errorMessage = error?.message || error?.toString() || '';
        const isNonRetryable = nonRetryableErrors.some(nonRetryErr => 
          errorMessage.toLowerCase().includes(nonRetryErr.toLowerCase())
        ) || error?.nonRetryable;
        
        // Se for erro não retentável ou última tentativa, lançar erro
        if (isNonRetryable || attempt === maxAttempts) {
          throw error;
        }
        
        // Calcular delay com backoff exponencial (1s, 2s, 4s...)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        
        console.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, errorMessage);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  // Função para lidar com erros de autenticação de forma mais robusta
  const handleAuthError = async (error: any) => {
    // Lista de erros que devem ser tratados silenciosamente
    const silentErrors = [
      'refresh_token_not_found',
      'invalid_refresh_token',
      'Failed to fetch',
      'ERR_ABORTED',
      'NetworkError',
      'fetch'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    const isSilentError = silentErrors.some(silentErr => 
      errorMessage.toLowerCase().includes(silentErr.toLowerCase())
    );
    
    // Log apenas para debug, sem spam no console
    if (!isSilentError) {
      console.error('Erro de autenticação:', error);
    }
    
    // Se for erro de sessão expirada, inválida ou de rede, fazer logout silencioso
    if (isSilentError || error?.status === 401 || error?.status === 403) {
      // Limpar estado local sem logs desnecessários
      setUser(null);
      setSession(null);
      setConsultorData(null);
      
      // Limpar localStorage silenciosamente
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignorar erros de localStorage silenciosamente
      }
      
      return; // Não mostrar toast para erros silenciosos
    }
    
    // Para outros erros críticos, mostrar mensagem genérica
    toast.error('Erro de conexão. Tente novamente.');
  };

  // Função para buscar dados do consultor
  const fetchConsultorData = async (authUserId: string): Promise<ConsultorData | null> => {
    try {
      const { data, error } = await supabase
        .from('consultores')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do consultor:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar dados do consultor:', error);
      return null;
    }
  };

  // Função para atualizar dados do usuário
  const updateUserData = async (currentUser: User, currentSession: Session) => {
    try {
      // Obter role dos metadados do usuário
      const role = currentUser.user_metadata?.role || currentSession.user?.user_metadata?.role;
      
      const authUser: AuthUser = {
        ...currentUser,
        role: role as UserRole
      };

      setUser(authUser);
      setSession(currentSession);

      // Se for consultor, buscar dados adicionais
      if (role === 'consultor') {
        const consultorInfo = await fetchConsultorData(currentUser.id);
        setConsultorData(consultorInfo);
      } else {
        setConsultorData(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  // Função para fazer login com retry
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const loginResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Erros de credenciais não devem ser retentados
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Email not confirmed') ||
              error.message.includes('invalid_grant')) {
            throw { ...error, nonRetryable: true };
          }
          throw error;
        }

        if (!data.user || !data.session) {
          throw new Error('Dados de autenticação inválidos');
        }

        return { user: data.user, session: data.session };
      }, 2); // Máximo 2 tentativas para login

      await updateUserData(loginResult.user, loginResult.session);
      toast.success('Login realizado com sucesso!');
      return { success: true };
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Retornar mensagem de erro apropriada
      if (error?.message?.includes('Invalid login credentials')) {
        return { success: false, error: 'Email ou senha incorretos' };
      }
      if (error?.message?.includes('Email not confirmed')) {
        return { success: false, error: 'Email não confirmado' };
      }
      if (error?.message?.includes('Too many requests')) {
        return { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' };
      }
      
      return { success: false, error: error?.message || 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Tentar logout no Supabase com timeout
      const logoutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      try {
        const { error } = await Promise.race([logoutPromise, timeoutPromise]) as any;
        
        if (error) {
          console.warn('Erro no logout remoto:', error);
          // Continuar com logout local mesmo com erro remoto
        }
      } catch (networkError) {
        console.warn('Erro de rede no logout, fazendo logout local:', networkError);
        // Continuar com logout local
      }
      
      // Sempre fazer logout local independente do resultado remoto
      setUser(null);
      setSession(null);
      setConsultorData(null);
      
      // Limpar localStorage manualmente
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.warn('Erro ao limpar localStorage:', storageError);
      }
      
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro crítico no logout:', error);
      
      // Forçar logout local mesmo com erro crítico
      setUser(null);
      setSession(null);
      setConsultorData(null);
      
      toast.success('Logout realizado com sucesso!');
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se é admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Função para verificar se é consultor
  const isConsultor = (): boolean => {
    return user?.role === 'consultor';
  };

  // Função para verificar role específica
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  // Função para atualizar dados do usuário
  const refreshUserData = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await updateUserData(session.user, session);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  // Effect para monitorar mudanças na autenticação
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    // Função para lidar com mudanças na autenticação
    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('Auth event:', event, session);

      try {
        if (session?.user) {
          await updateUserData(session.user, session);
          retryCount = 0; // Reset retry count on successful auth
        } else {
          setUser(null);
          setSession(null);
          setConsultorData(null);
        }
      } catch (error) {
          console.error('Erro no handleAuthChange:', error);
          await handleAuthError(error);
        }
      
      setLoading(false);
    };



    // Obter sessão inicial com retry melhorado
    const getInitialSession = async () => {
      try {
        const sessionResult = await retryWithBackoff(async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          return session;
        }, maxRetries);
        
        if (mounted) {
          if (sessionResult?.user) {
            await updateUserData(sessionResult.user, sessionResult);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial após todas as tentativas:', error);
        await handleAuthError(error);
        
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Obter sessão inicial
    getInitialSession();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    consultorData,
    loading,
    signIn,
    signOut,
    isAdmin,
    isConsultor,
    hasRole,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};