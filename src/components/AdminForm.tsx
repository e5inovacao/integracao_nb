import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AdminFormProps {
  admin?: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
    cpf?: string;
    endereco?: string;
    observacoes?: string;
    ativo: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminForm({ admin, isOpen, onClose, onSuccess }: AdminFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    observacoes: '',
    ativo: true,
    senha: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        nome: admin.nome || '',
        email: admin.email || '',
        telefone: admin.telefone || '',
        cpf: admin.cpf || '',
        endereco: admin.endereco || '',
        observacoes: admin.observacoes || '',
        ativo: admin.ativo,
        senha: ''
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        endereco: '',
        observacoes: '',
        ativo: true,
        senha: ''
      });
    }
  }, [admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (admin) {
        // Atualizar admin existente
        const { error } = await supabase
          .from('consultores')
          .update({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cpf: formData.cpf,
            endereco: formData.endereco,
            observacoes: formData.observacoes,
            ativo: formData.ativo
          })
          .eq('id', admin.id);

        if (error) throw error;
        toast.success('Administrador atualizado com sucesso!');
      } else {
        // Criar novo admin
        // Primeiro criar o usuário no auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
          options: {
            data: {
              role: 'admin'
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Depois criar o registro na tabela consultores
          const { error: insertError } = await supabase
            .from('consultores')
            .insert({
              nome: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              cpf: formData.cpf,
              endereco: formData.endereco,
              observacoes: formData.observacoes,
              ativo: formData.ativo,
              role: 'admin',
              auth_user_id: authData.user.id
            });

          if (insertError) throw insertError;
          toast.success('Administrador criado com sucesso!');
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar administrador:', error);
      toast.error(error.message || 'Erro ao salvar administrador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {admin ? 'Editar Administrador' : 'Novo Administrador'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!admin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <input
                type="password"
                required
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Ativo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : admin ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminForm;