import React, { useState } from 'react';
import { CheckCircle, XCircle, User, Shield, Loader2 } from 'lucide-react';
import { createAdminUser, checkAdminExists, testAdminLogin } from '../utils/adminSetup';
import { toast } from 'sonner';

const AdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const adminEmail = 'admin@naturezabrindes.com.br';
  const adminPassword = '@Sucesso10!';

  const handleCreateAdmin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('=== Iniciando criação do admin ===');
      console.log('Email:', adminEmail);
      
      // Primeiro verificar se já existe
      console.log('Verificando se admin já existe...');
      const existsResult = await checkAdminExists(adminEmail);
      console.log('Resultado da verificação:', existsResult);
      
      if (existsResult.exists) {
        setResult({
          type: 'info',
          message: 'Usuário administrador já existe no sistema!'
        });
        toast.info('Administrador já cadastrado');
        return;
      }
      
      // Criar o usuário admin
      console.log('Criando usuário admin...');
      const createResult = await createAdminUser(adminEmail, adminPassword);
      console.log('Resultado da criação:', createResult);
      
      if (createResult.success) {
        setResult({
          type: 'success',
          message: createResult.message
        });
        toast.success('Administrador criado com sucesso!');
      } else {
        setResult({
          type: 'error',
          message: createResult.message
        });
        toast.error('Erro ao criar administrador: ' + createResult.message);
      }
      
    } catch (error) {
      console.error('Erro capturado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({
        type: 'error',
        message: errorMessage
      });
      toast.error('Erro interno: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('=== Testando login do admin ===');
      console.log('Email:', adminEmail);
      
      const loginResult = await testAdminLogin(adminEmail, adminPassword);
      console.log('Resultado do teste de login:', loginResult);
      
      if (loginResult.success) {
        setResult({
          type: 'success',
          message: loginResult.message
        });
        toast.success('Login testado com sucesso!');
      } else {
        setResult({
          type: 'error',
          message: loginResult.message
        });
        toast.error('Falha no teste de login: ' + loginResult.message);
      }
      
    } catch (error) {
      console.error('Erro no teste de login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({
        type: 'error',
        message: errorMessage
      });
      toast.error('Erro no teste: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200">
        <div className="text-center p-6 pb-4">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup do Administrador</h1>
          <p className="text-gray-600 mt-2">
            Configure o usuário administrador do sistema
          </p>
        </div>
        
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700 mb-2">Credenciais do Administrador:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-mono">{adminEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="font-mono">@Sucesso10!</span>
              </div>
            </div>
          </div>

          {result && (
              <div className={`p-4 rounded-lg border ${
                result.type === 'success' ? '' :
                result.type === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}
              style={result.type === 'success' ? {backgroundColor: '#2CB20B20', borderColor: '#2CB20B', border: '1px solid'} : {}}>
              <div className="flex items-center gap-2">
                {result.type === 'success' && <CheckCircle className="w-4 h-4" style={{color: '#2CB20B'}} />}
                {result.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                {result.type === 'info' && <User className="w-4 h-4 text-blue-600" />}
                <p className={`text-sm ${
                   result.type === 'success' ? '' :
                   result.type === 'error' ? 'text-red-800' :
                   'text-blue-800'
                 }`}
                  style={result.type === 'success' ? {color: '#2CB20B'} : {}}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={handleCreateAdmin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Criar/Verificar Administrador
                </>
              )}
            </button>

            <button 
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Testar Login
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center mt-4">
            Esta página é temporária para configuração inicial do sistema.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;