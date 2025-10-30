import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { sendEmailWithBrevo } from '../utils/brevoApi';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'consultor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface SortConfig {
  key: keyof UserProfile | null;
  direction: 'asc' | 'desc';
}

interface Filters {
  search: string;
  role: string;
  status: string;
}

export default function GestaoColaboradores() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({ search: '', role: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados dos modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Estados dos formulários
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'consultor' as UserProfile['role'],
    password: ''
  });

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar e ordenar usuários
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || 
        (filters.status === 'active' && user.is_active) ||
        (filters.status === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, filters, sortConfig]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);

  // Função para ordenação
  const handleSort = (key: keyof UserProfile) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Função para criar usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações
      if (!formData.full_name.trim()) {
        toast.error('Nome completo é obrigatório');
        return;
      }
      
      if (!formData.email.trim()) {
        toast.error('Email é obrigatório');
        return;
      }
      
      if (!formData.password.trim() || formData.password.length < 6) {
        toast.error('Senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', formData.email.trim())
        .single();

      if (existingUser) {
        toast.error('Este email já está em uso');
        return;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email.trim(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name.trim(),
          role: formData.role
        }
      });

      if (authError) throw authError;

      // O perfil será criado automaticamente pelo trigger
      
      // Enviar email de boas-vindas
      try {
        await sendEmailWithBrevo({
          to: [{ email: formData.email.trim(), name: formData.full_name }],
          subject: 'Bem-vindo ao Sistema Natureza Brindes',
          htmlContent: `
            <h2>Bem-vindo ao Sistema Natureza Brindes!</h2>
            <p>Olá ${formData.full_name},</p>
            <p>Sua conta foi criada com sucesso. Aqui estão suas credenciais de acesso:</p>
            <ul>
              <li><strong>Email:</strong> ${formData.email}</li>
              <li><strong>Senha:</strong> ${formData.password}</li>
              <li><strong>Perfil:</strong> ${formData.role}</li>
            </ul>
            <p>Por favor, faça login no sistema e altere sua senha no primeiro acesso.</p>
            <p>Atenciosamente,<br>Equipe Natureza Brindes</p>
          `
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        toast.warning('Usuário criado, mas houve erro no envio do email');
      }

      toast.success('Usuário criado com sucesso!');
      setShowAddModal(false);
      setFormData({ full_name: '', email: '', role: 'consultor', password: '' });
      loadUsers();
      
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    }
  };

  // Função para editar usuário
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name.trim(),
          role: formData.role
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Atualizar email no auth se mudou
      if (formData.email !== selectedUser.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          selectedUser.user_id,
          { email: formData.email.trim() }
        );

        if (authError) throw authError;

        // Atualizar email no perfil também
        const { error: emailError } = await supabase
          .from('user_profiles')
          .update({ email: formData.email.trim() })
          .eq('id', selectedUser.id);

        if (emailError) throw emailError;
      }

      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    }
  };

  // Função para redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      if (!formData.password.trim() || formData.password.length < 6) {
        toast.error('Senha deve ter pelo menos 6 caracteres');
        return;
      }

      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.user_id,
        { password: formData.password }
      );

      if (error) throw error;

      // Enviar email com nova senha
      try {
        await sendEmailWithBrevo({
          to: [{ email: selectedUser.email, name: selectedUser.full_name }],
          subject: 'Senha Redefinida - Sistema Natureza Brindes',
          htmlContent: `
            <h2>Senha Redefinida</h2>
            <p>Olá ${selectedUser.full_name},</p>
            <p>Sua senha foi redefinida com sucesso.</p>
            <p><strong>Nova senha:</strong> ${formData.password}</p>
            <p>Por favor, faça login e altere sua senha.</p>
            <p>Atenciosamente,<br>Equipe Natureza Brindes</p>
          `
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        toast.warning('Senha redefinida, mas houve erro no envio do email');
      }

      toast.success('Senha redefinida com sucesso!');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setFormData(prev => ({ ...prev, password: '' }));
      
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    }
  };

  // Função para ativar/desativar usuário
  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const newStatus = !user.is_active;
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsers();
      
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  // Função para abrir modal de edição
  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowEditModal(true);
  };

  // Função para abrir modal de senha
  const openPasswordModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, password: '' }));
    setShowPasswordModal(true);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter cor do badge do perfil
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'consultor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter nome do perfil
  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'consultor': return 'Consultor';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Colaboradores</h1>
          <p className="text-gray-600">Gerencie usuários, perfis e permissões do sistema</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por perfil */}
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos os perfis</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Administrador</option>
            <option value="consultor">Consultor</option>
          </select>

          {/* Filtro por status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>

          {/* Limpar filtros */}
          <button
            onClick={() => setFilters({ search: '', role: '', status: '' })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nome</span>
                        {sortConfig.key === 'full_name' ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {sortConfig.key === 'email' ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Perfil</span>
                        {sortConfig.key === 'role' ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('last_login')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Último Acesso</span>
                        {sortConfig.key === 'last_login' ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('is_active')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {sortConfig.key === 'is_active' ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronUpDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.last_login ? (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(user.last_login)}
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca acessou</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.is_active ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm text-green-800">Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-sm text-red-800">Inativo</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Editar usuário"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title="Redefinir senha"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-1 rounded ${
                              user.is_active 
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                          >
                            {user.is_active ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredAndSortedUsers.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredAndSortedUsers.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronDownIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-green-50 border-green-500 text-green-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próximo</span>
                        <ChevronDownIcon className="h-5 w-5 -rotate-90" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Adicionar Usuário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Novo Usuário</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="consultor">Consultor</option>
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha Temporária *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ full_name: '', email: '', role: 'consultor', password: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuário</h3>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="consultor">Consultor</option>
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Redefinir Senha - {selectedUser.full_name}
              </h3>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> A nova senha será enviada por email para o usuário.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedUser(null);
                      setFormData(prev => ({ ...prev, password: '' }));
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md"
                  >
                    Redefinir Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}