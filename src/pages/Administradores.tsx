import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdminForm } from "../components/AdminForm";

interface Administrador {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  observacoes?: string;
  ativo: boolean;
  auth_user_id?: string;
  created_at: string;
  updated_at: string;
  role: string;
}

export function Administradores() {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);

  useEffect(() => {
    loadAdministradores();
  }, []);

  const loadAdministradores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultores')
        .select('*')
        .eq('role', 'admin') // Filtrar apenas administradores
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdministradores(data || []);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
      toast.error('Erro ao carregar administradores');
    } finally {
      setLoading(false);
    }
  };

  const filteredAdministradores = administradores.filter(admin => {
    const matchesSearch = admin.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (admin.cpf && admin.cpf.includes(searchTerm)) ||
                         (admin.telefone && admin.telefone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && admin.ativo) ||
                         (statusFilter === 'inactive' && !admin.ativo);
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('consultores')
        .update({ ativo: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setAdministradores(prev => 
        prev.map(admin => 
          admin.id === id ? { ...admin, ativo: !currentStatus } : admin
        )
      );

      toast.success(`Administrador ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do administrador');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este administrador?')) return;

    try {
      // Usar a função personalizada para deletar admin e usuário do auth
      const { error } = await supabase.rpc('delete_consultor_and_auth_user', {
        consultor_id: id
      });

      if (error) throw error;

      setAdministradores(prev => prev.filter(admin => admin.id !== id));
      toast.success('Administrador excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir administrador:', error);
      toast.error('Erro ao excluir administrador');
    }
  };

  const handleEdit = (admin: Administrador) => {
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAdmin(null);
    loadAdministradores();
  };

  const activeCount = administradores.filter(admin => admin.ativo).length;
  const inactiveCount = administradores.filter(admin => !admin.ativo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administradores</h1>
          <p className="text-gray-600">Gerencie os administradores do sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Administrador
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>



      {/* Lista de Administradores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdministradores.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{admin.nome}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.telefone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.cpf || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                       admin.ativo 
                         ? 'text-white'
                         : 'bg-red-100 text-red-800'
                     }`}
                     style={admin.ativo ? {backgroundColor: '#2CB20B'} : {}}>
                      {admin.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin.id, admin.ativo)}
                        className={`${admin.ativo ? 'text-red-600 hover:text-red-900' : 'hover:opacity-75'}`}
                style={admin.ativo ? {} : {color: '#2CB20B'}}
                        title={admin.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {admin.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdministradores.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum administrador encontrado com os filtros aplicados.' 
                : 'Nenhum administrador cadastrado ainda.'}
            </div>
          </div>
        )}
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AdminForm
              admin={editingAdmin}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Administradores;