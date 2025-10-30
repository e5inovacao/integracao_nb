import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon as EyeIcon, DocumentDuplicateIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SolicitacaoOrcamento {
  solicitacao_id: number;
  created_at: string;
  user_id: string | null;
  status: string | null;
  solicitacao_observacao: string | null;
  numero_solicitacao?: string;
  numero_sequencial?: number;
  ano_orcamento?: number;
  // Campos de cliente (vindos do join com usuarios_clientes)
  cliente_nome?: string;
  cliente_email?: string;
  cliente_empresa?: string;
  // Campos de consultor (vindos do join com consultores)
  consultor_nome?: string;
  consultor_email?: string;
  
  // Relacionamentos
  usuarios_clientes?: {
    id: number;
    nome: string;
    email: string;
    empresa?: string;
  };
  consultores?: {
    id: number;
    nome: string;
    email: string;
  };
}

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  aprovado: 'text-white',
  rejeitado: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado'
};

export default function Orcamentos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoOrcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [solicitacaoToDelete, setSolicitacaoToDelete] = useState<SolicitacaoOrcamento | null>(null);
  const [consultorId, setConsultorId] = useState<number | null>(null);
  
  const itemsPerPage = 10;
  const filteredSolicitacoes = solicitacoes.filter(solicitacao =>
    solicitacao.solicitacao_id.toString().includes(searchTerm) ||
    solicitacao.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitacao.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solicitacao.consultor_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredSolicitacoes.length / itemsPerPage);
  const paginatedSolicitacoes = filteredSolicitacoes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Função para buscar solicitações da tabela com dados reais de cliente e consultor
  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Se for consultor, buscar o ID do consultor primeiro
      let consultorIdAtual = null;
      if (user?.role === 'consultor' && user) {
        const { data: consultorData } = await supabase
          .from('consultores')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        consultorIdAtual = consultorData?.id;
        setConsultorId(consultorIdAtual);
      }
      
      // Implementar retry com backoff exponencial
      const maxRetries = 3;
      let retryCount = 0;
      let data: any = null;
      
      while (retryCount < maxRetries) {
        try {
          // Construir query baseada no role
          let query = supabase
            .from('solicitacao_orcamentos')
            .select(`
              *,
              usuarios_clientes!inner(
                id,
                nome,
                email,
                empresa
              ),
              consultores(
                id,
                nome,
                email
              )
            `);
          
          // Se for consultor, filtrar apenas orçamentos vinculados a ele
          if (user?.role === 'consultor' && consultorIdAtual) {
            query = query.eq('consultor_id', consultorIdAtual);
          }
          
          const { data: queryData, error } = await query.order('created_at', { ascending: false });

          if (error) {
            // Verificar se é erro de rede que pode ser retentado
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('ERR_ABORTED') ||
                error.message.includes('NetworkError') ||
                error.message.includes('fetch')) {
              
              if (retryCount < maxRetries - 1) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000;
                console.warn(`Erro ao buscar solicitações - tentativa ${retryCount}, tentando novamente em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            throw error;
          }

          data = queryData;
          break;
        } catch (networkError) {
          if (retryCount < maxRetries - 1 && 
              (networkError instanceof TypeError || 
               networkError.message?.includes('fetch') ||
               networkError.message?.includes('ERR_ABORTED'))) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            console.warn(`Erro de rede ao buscar solicitações - tentativa ${retryCount}, tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw networkError;
        }
      }
      
      if (retryCount >= maxRetries) {
        throw new Error('Falha na conexão ao buscar solicitações após múltiplas tentativas');
      }

      // Mapear dados reais de cliente e consultor
      const solicitacoesComDados = data?.map(solicitacao => ({
        ...solicitacao,
        cliente_nome: solicitacao.usuarios_clientes?.nome || 'Cliente não encontrado',
        cliente_email: solicitacao.usuarios_clientes?.email || 'Email não informado',
        cliente_empresa: solicitacao.usuarios_clientes?.empresa || '',
        consultor_nome: solicitacao.consultores?.nome || 'Consultor não atribuído',
        consultor_email: solicitacao.consultores?.email || ''
      })) || [];

      setSolicitacoes(solicitacoesComDados);
      console.log(`Carregadas ${solicitacoesComDados.length} solicitações com dados reais`);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      setError('Erro ao carregar solicitações. Tente novamente.');
      
      // Fallback: tentar buscar apenas as solicitações sem joins
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('solicitacao_orcamentos')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!fallbackError && fallbackData) {
          const solicitacoesSemJoin = fallbackData.map(solicitacao => ({
            ...solicitacao,
            cliente_nome: 'Dados do cliente indisponíveis',
            cliente_email: 'Email indisponível',
            consultor_nome: 'Consultor indisponível'
          }));
          setSolicitacoes(solicitacoesSemJoin);
          setError('Alguns dados podem estar indisponíveis devido a problemas de conexão.');
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // useEffect para carregar dados automaticamente
  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const handleDelete = (solicitacao: SolicitacaoOrcamento) => {
    setSolicitacaoToDelete(solicitacao);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!solicitacaoToDelete) return;

    try {
      const { error } = await supabase
        .from('solicitacao_orcamentos')
        .delete()
        .eq('solicitacao_id', solicitacaoToDelete.solicitacao_id);

      if (error) {
        throw error;
      }

      // Atualizar lista após exclusão
      await fetchSolicitacoes();
      setDeleteModalOpen(false);
      setSolicitacaoToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      setError('Erro ao excluir solicitação. Tente novamente.');
    }
  };

  const handleEdit = (solicitacao: SolicitacaoOrcamento) => {
    // Navegar para a página de edição do orçamento com o ID da solicitação
    navigate(`/orcamentos/${solicitacao.solicitacao_id}/editar`);
  };

  const handleDuplicate = async (solicitacao: SolicitacaoOrcamento) => {
    try {
      // Buscar todos os dados da solicitação original
      const { data: originalData, error: fetchError } = await supabase
        .from('solicitacao_orcamentos')
        .select('*')
        .eq('solicitacao_id', solicitacao.solicitacao_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Criar uma cópia da solicitação sem o ID, mas preservando campos importantes
      const duplicatedData = {
        ...originalData,
        solicitacao_id: undefined, // Será gerado automaticamente
        created_at: new Date().toISOString(),
        solicitacao_observacao: `Cópia do orçamento #${originalData.solicitacao_id} - ${originalData.solicitacao_observacao || ''}`,
        // Preservar campos de numeração para evitar erro "ID do orçamento não encontrado"
        numero_sequencial: originalData.numero_sequencial,
        ano_orcamento: originalData.ano_orcamento,
        numero_solicitacao: originalData.numero_solicitacao
      };

      // Inserir a nova solicitação
      const { data: newSolicitacao, error: insertError } = await supabase
        .from('solicitacao_orcamentos')
        .insert(duplicatedData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Nota: A tabela 'solicitacao_produtos' não existe no banco de dados
      // Removendo duplicação de tabela inexistente

      // Buscar e duplicar os produtos detalhados da tabela products_solicitacao se existirem
      const { data: produtosDetalhados, error: produtosDetalhadosError } = await supabase
        .from('products_solicitacao')
        .select('*')
        .eq('solicitacao_id', solicitacao.solicitacao_id);

      if (!produtosDetalhadosError && produtosDetalhados && produtosDetalhados.length > 0) {
        const produtosDetalhadosDuplicados = produtosDetalhados.map(produto => {
          // Remover campos que devem ser gerados automaticamente
          const { id, created_at, ...produtoSemId } = produto;
          
          return {
            ...produtoSemId,
            solicitacao_id: newSolicitacao.solicitacao_id,
            // Garantir que todos os campos importantes sejam preservados
            products_id: produto.products_id,
            products_quantidade_01: produto.products_quantidade_01,
            products_quantidade_02: produto.products_quantidade_02,
            products_quantidade_03: produto.products_quantidade_03,
            color: produto.color,
            customizations: produto.customizations,
            gravacao: produto.gravacao,
            personalizacao: produto.personalizacao,
            info: produto.info,
            custo: produto.custo,
            preco_unitario: produto.preco_unitario,
            valor_unitario: produto.valor_unitario,
            observacoes: produto.observacoes,
            fator: produto.fator,
            preco1: produto.preco1,
            preco2: produto.preco2,
            preco3: produto.preco3,
            variacao_selecionada: produto.variacao_selecionada,
            cor_selecionada: produto.cor_selecionada,
            descricao_rica: produto.descricao_rica,
            observacoes_ricas: produto.observacoes_ricas,
            imagem_variacao: produto.imagem_variacao
          };
        });

        const { error: insertError } = await supabase
          .from('products_solicitacao')
          .insert(produtosDetalhadosDuplicados);

        if (insertError) {
          console.error('Erro ao duplicar produtos detalhados:', insertError);
          throw insertError;
        }
      }

      // Atualizar a lista de solicitações
      await fetchSolicitacoes();
      
      // Navegar para editar a nova solicitação
      navigate(`/orcamentos/${newSolicitacao.solicitacao_id}/editar`);
      
    } catch (error) {
      console.error('Erro ao duplicar orçamento:', error);
      setError('Erro ao duplicar orçamento. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Gerencie todos os orçamentos do sistema'
              : 'Seus orçamentos vinculados'
            }
          </p>
        </div>
        <Link
          to="/orcamentos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Incluir Novo
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Buscar por título, número ou cliente..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                  Número Solicitação
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '240px', minWidth: '240px' }}>
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                  Data Solicitação
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '160px', minWidth: '160px' }}>
                  Consultor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '160px', minWidth: '160px' }}>
                  <div className="flex items-center justify-center space-x-2">
                    <span>AÇÕES</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Carregando solicitações...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-500">
                    {error}
                    <button
                      onClick={fetchSolicitacoes}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : paginatedSolicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                paginatedSolicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.solicitacao_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ width: '140px', minWidth: '140px' }}>
                      <div className="flex items-center">
                        <span className="text-blue-600 font-semibold">#{solicitacao.solicitacao_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '200px', minWidth: '200px' }}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {solicitacao.cliente_nome?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate" title={solicitacao.cliente_nome}>
                            {solicitacao.cliente_nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600" style={{ width: '240px', minWidth: '240px' }}>
                      <div className="truncate" title={solicitacao.cliente_email}>
                        {solicitacao.cliente_email}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" style={{ width: '140px', minWidth: '140px' }}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(solicitacao.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '160px', minWidth: '160px' }}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">
                            {solicitacao.consultor_nome?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-2 truncate min-w-0 flex-1" title={solicitacao.consultor_nome}>
                          {solicitacao.consultor_nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '120px', minWidth: '120px' }}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[solicitacao.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}
                      style={solicitacao.status === 'aprovado' ? {backgroundColor: '#2CB20B', color: 'white'} : {}}>
                        {statusLabels[solicitacao.status as keyof typeof statusLabels] || solicitacao.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ width: '160px', minWidth: '160px' }}>
                      <div className="flex items-center justify-center space-x-1">
                        {/* Botão Principal de Impressão - Destacado */}
                        {(solicitacao.status === 'orçamento' || solicitacao.status === 'Orçamento Gerado') && (
                          <button
                            onClick={() => navigate(`/orcamentos/${solicitacao.solicitacao_id}/detalhes`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 p-2 rounded-md shadow-sm"
                            title="Imprimir Orçamento (Ctrl+P)"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {solicitacao.status === 'orçamento' && (
                          <button
                            onClick={() => navigate(`/orcamentos/${solicitacao.solicitacao_id}/detalhes`)}
                            className="text-green-600 hover:text-green-800 transition-colors duration-150 p-1 rounded-md hover:bg-green-50"
                            title="Visualizar detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}

                        
                        {/* Botão Editar - oculto quando botão Imprimir estiver visível */}
                        {!(solicitacao.status === 'orçamento' || solicitacao.status === 'Orçamento Gerado') && (
                          <button
                            onClick={() => handleEdit(solicitacao)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150 p-1 rounded-md hover:bg-indigo-50"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Botão Duplicar - sempre visível */}
                        <button
                          onClick={() => handleDuplicate(solicitacao)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 rounded-md hover:bg-blue-50"
                          title="Duplicar orçamento"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(solicitacao)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1 rounded-md hover:bg-red-50"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 border rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir a solicitação #{solicitacaoToDelete?.solicitacao_id}?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}