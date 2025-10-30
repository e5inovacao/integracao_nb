import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConsultorData } from '../contexts/AuthContext';
import { toast } from 'sonner';
import Empty from '../components/Empty';
import ConfirmModal from '../components/ConfirmModal';

interface ConsultorFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

const Consultores: React.FC = () => {
  const [consultores, setConsultores] = useState<ConsultorData[]>([]);
  const [filteredConsultores, setFilteredConsultores] = useState<ConsultorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ConsultorFilters>({
    search: '',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    consultor: { id: number; nome: string } | null;
    loading: boolean;
  }>({ isOpen: false, consultor: null, loading: false });

  // Carregar consultores
  const loadConsultores = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('consultores')
        .select('*')
        .eq('role', 'consultor') // Filtrar apenas consultores, não admins
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar consultores:', error);
        toast.error('Erro ao carregar consultores');
        return;
      }

      setConsultores(data || []);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast.error('Erro ao carregar consultores');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...consultores];

    // Filtro de busca
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(consultor => 
        consultor.nome.toLowerCase().includes(searchTerm) ||
        consultor.email.toLowerCase().includes(searchTerm) ||
        (consultor.cpf && consultor.cpf.includes(searchTerm)) ||
        (consultor.telefone && consultor.telefone.includes(searchTerm))
      );
    }

    // Filtro de status
    if (filters.status !== 'all') {
      filtered = filtered.filter(consultor => 
        filters.status === 'active' ? consultor.ativo : !consultor.ativo
      );
    }

    setFilteredConsultores(filtered);
  }, [consultores, filters]);

  // Alternar status do consultor
  const toggleConsultorStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('consultores')
        .update({ 
          ativo: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        toast.error('Erro ao alterar status do consultor');
        return;
      }

      // Atualizar lista local
      setConsultores(prev => 
        prev.map(consultor => 
          consultor.id === id 
            ? { ...consultor, ativo: !currentStatus }
            : consultor
        )
      );

      toast.success(`Consultor ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do consultor');
    }
  };

  // Abrir modal de confirmação de exclusão
  const openDeleteModal = (id: number, nome: string) => {
    setDeleteModal({
      isOpen: true,
      consultor: { id, nome },
      loading: false
    });
  };

  // Fechar modal de confirmação
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      consultor: null,
      loading: false
    });
  };

  // Excluir consultor
  const deleteConsultor = async () => {
    if (!deleteModal.consultor) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      // Usar a função SQL personalizada para deletar consultor e usuário do Auth
      const { data, error } = await supabase
        .rpc('delete_consultor_and_auth_user', {
          consultor_id: deleteModal.consultor.id
        });

      if (error) {
        console.error('Erro ao excluir consultor:', error);
        toast.error('Erro ao excluir consultor: ' + error.message);
        return;
      }

      if (!data) {
        toast.error('Consultor não encontrado ou não foi possível excluir');
        return;
      }

      // Remover da lista local
      setConsultores(prev => prev.filter(consultor => consultor.id !== deleteModal.consultor!.id));
      toast.success('Consultor excluído com sucesso');
      closeDeleteModal();
    } catch (error) {
      console.error('Erro ao excluir consultor:', error);
      toast.error('Erro ao excluir consultor');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadConsultores();
  }, []);

  // Formatação de dados
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Carregando consultores...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultores</h1>
          <p className="text-gray-600">Gerencie os consultores do sistema</p>
        </div>
        <Link
          to="/consultores/novo"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Consultor
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, CPF ou telefone..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botão de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Lista de consultores */}
      {filteredConsultores.length === 0 ? (
        <Empty 
          title="Nenhum consultor encontrado"
          description={filters.search || filters.status !== 'all' 
            ? "Tente ajustar os filtros para encontrar consultores."
            : "Comece adicionando o primeiro consultor ao sistema."
          }
          action={
            <Link
              to="/consultores/novo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Consultor
            </Link>
          }
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultor
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsultores.map((consultor) => (
                  <tr key={consultor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {consultor.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {consultor.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhone(consultor.telefone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCPF(consultor.cpf)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        consultor.ativo 
                          ? 'text-white' 
                          : 'bg-red-100 text-red-800'
                      }`} style={consultor.ativo ? {backgroundColor: '#2CB20B'} : {}}>
                        {consultor.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(consultor.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/consultores/${consultor.id}/editar`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Editar consultor"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleConsultorStatus(consultor.id, consultor.ativo)}
                          className={`p-1 rounded ${
                            consultor.ativo 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'hover:opacity-75'
                          }`}
                          style={!consultor.ativo ? {color: '#2CB20B'} : {}}
                          title={consultor.ativo ? 'Desativar consultor' : 'Ativar consultor'}
                        >
                          {consultor.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteModal(consultor.id, consultor.nome)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Excluir consultor"
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
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteConsultor}
        title="Excluir Consultor"
        message={`Tem certeza que deseja excluir o consultor "${deleteModal.consultor?.nome}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Consultores;