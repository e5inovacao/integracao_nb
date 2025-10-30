import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Send, FileText, MapPin, Calendar, DollarSign, User, Building, Mail, Phone, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EmailModal from '../components/EmailModal';
import { sendEmailWithBrevo } from '../utils/brevoApi';
import { generateOrcamentoEmailHTML } from '../utils/emailTemplate';
import '../styles/print.css';

// Classe de erro personalizada para orçamentos não encontrados
class OrcamentoNaoEncontradoError extends Error {
  constructor(orcamentoId: string, shouldRedirect: boolean = true) {
    super(`Orçamento ${orcamentoId} não foi encontrado no sistema`);
    this.name = 'OrcamentoNaoEncontradoError';
    this.shouldRedirect = shouldRedirect;
  }
  shouldRedirect: boolean;
}

// Interface consolidada para dados do orçamento
interface OrcamentoData {
  solicitacao_id: string;
  numero_solicitacao?: string;
  numero_orcamento?: string;
  numero_sequencial?: number;
  ano_orcamento?: number;
  titulo?: string;
  descricao?: string;

  status?: string;
  valor_total?: number;
  valor_total_estimado?: number;
  solicitacao_observacao?: string;
  observacoes?: string;
  observacoes_ricas?: string;
  descricao_rica?: string;
  informacoes_adicionais_ricas?: string;
  validade_proposta?: string;
  prazo_entrega?: string;
  forma_pagamento?: string;
  opcao_frete?: string;
  local_entrega?: string;
  local_cobranca?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  cliente_id?: string;
  consultor_id?: string;
}

interface ClienteData {
  id: string;
  empresa: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface ProdutoOrcamento {
  id: string;
  produto_id: string;
  descricao: string;
  titulo: string;
  quantidade: number;
  products_quantidade_01?: number;
  products_quantidade_02?: number;
  products_quantidade_03?: number;
  valor_unitario: number;
  valor_total: number;
  categoria?: string;
  codigo?: string;
  color?: string;
  customizations?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
}

// Configurações para retry com backoff exponencial
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000,
  retryableErrors: [
    'Failed to fetch',
    'ERR_ABORTED',
    'NetworkError',
    'fetch',
    'ECONNRESET',
    'ETIMEDOUT'
  ]
};

// Função utilitária para delay
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar se um erro é recuperável
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  return RETRY_CONFIG.retryableErrors.some(retryableError => 
    errorMessage.toLowerCase().includes(retryableError.toLowerCase())
  );
};

// Função genérica para executar operações com retry
const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  context = 'operação'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), RETRY_CONFIG.timeout);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error: any) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries) {
        throw error;
      }
      
      const delayMs = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`Tentativa ${attempt} falhou para ${context}. Tentando novamente em ${delayMs}ms...`, error);
      await delay(delayMs);
    }
  }
  
  throw lastError;
};

const OrcamentoView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orcamento, setOrcamento] = useState<OrcamentoData | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Função para buscar dados do orçamento
  const fetchOrcamentoData = async () => {
    if (!id) {
      throw new Error('ID do orçamento não fornecido');
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do orçamento
      const { data: orcamentoData, error: orcamentoError } = await executeWithRetry(
        () => supabase
          .from('solicitacao_orcamentos')
          .select('*')
          .eq('solicitacao_id', id)
          .single(),
        'buscar orçamento'
      );

      if (orcamentoError) {
        if (orcamentoError.code === 'PGRST116') {
          throw new OrcamentoNaoEncontradoError(id);
        }
        throw orcamentoError;
      }

      if (!orcamentoData) {
        throw new OrcamentoNaoEncontradoError(id);
      }

      setOrcamento(orcamentoData);

      // Buscar dados do cliente
      if (orcamentoData.user_id) {
        const { data: clienteData, error: clienteError } = await executeWithRetry(
          () => supabase
            .from('usuarios_clientes')
            .select('*')
            .eq('user_id', orcamentoData.user_id)
            .single(),
          'buscar cliente'
        );

        if (clienteError) {
          console.warn('Erro ao buscar dados do cliente:', clienteError);
        } else {
          setCliente(clienteData);
        }
      }

      // Buscar produtos do orçamento
      const { data: produtosData, error: produtosError } = await executeWithRetry(
        () => supabase
          .from('products_solicitacao')
          .select(`
            *,
            produtos:produto_id (
              titulo,
              categoria,
              codigo,
              img_0,
              img_1,
              img_2
            )
          `)
          .eq('solicitacao_id', id),
        'buscar produtos'
      );

      if (produtosError) {
        console.warn('Erro ao buscar produtos:', produtosError);
        setProdutos([]);
      } else {
        setProdutos(produtosData || []);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados do orçamento:', error);
      
      if (error instanceof OrcamentoNaoEncontradoError) {
        setError(`Orçamento #${id} não encontrado`);
        if (error.shouldRedirect) {
          toast.error('Orçamento não encontrado');
          setTimeout(() => navigate('/orcamentos'), 2000);
        }
      } else {
        setError('Erro ao carregar dados do orçamento. Tente novamente.');
        toast.error('Erro ao carregar orçamento');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentoData();
  }, [id]);

  // Função para formatação de moeda
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatação de data
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Função para impressão nativa
  const handleNativePrint = () => {
    window.print();
  };

  // Função para gerar PDF
  const handleGeneratePDF = async () => {
    try {
      toast.info('Gerando PDF...');
      
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão');
        return;
      }

      // Obter o conteúdo atual da página
      const content = document.querySelector('.orcamento-content')?.innerHTML || '';
      
      // HTML completo para o PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orçamento ${orcamento ? generateOrcamentoNumber(orcamento) : id}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 30px; }
            .print-section { margin-bottom: 20px; }
            .print-table { width: 100%; border-collapse: collapse; }
            .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .print-table th { background-color: #f5f5f5; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Aguardar o carregamento e imprimir
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Função para enviar email
  const handleSendEmail = async (emailData: { to: string; subject: string; message: string }) => {
    try {
      setSendingEmail(true);
      
      const emailResult = await generateOrcamentoEmailHTML({
        orcamento: orcamento!,
        cliente: cliente!,
        produtos,
        customMessage: emailData.message
      });

      await sendEmailWithBrevo({
        to: emailData.to,
        subject: emailData.subject,
        htmlContent: emailResult.htmlContent,
        inlineImages: emailResult.inlineImages
      });

      toast.success('Email enviado com sucesso!');
      setEmailModalOpen(false);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Calcular valor total dos produtos
  const valorTotalProdutos = produtos.reduce((total, produto) => {
    return total + (produto.valor_total || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Orçamento não encontrado'}
          </div>
          <button
            onClick={() => navigate('/orcamentos')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar para Orçamentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação e ações */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Navegação */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orcamentos')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </button>
              <div className="text-sm text-gray-500">
                <span>Orçamentos</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">
                   #{generateOrcamentoNumber(orcamento)}
                 </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleNativePrint}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </button>
              <button
                onClick={() => setEmailModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="orcamento-content bg-white rounded-lg shadow-sm">
          {/* Cabeçalho do orçamento */}
          <div className="border-b border-gray-200 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                   Orçamento #{generateOrcamentoNumber(orcamento)}
                 </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Criado em {formatDate(orcamento.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                       orcamento.status === 'Orçamento Gerado'
                         ? 'bg-green-100 text-green-800' 
                         : 'bg-yellow-100 text-yellow-800'
                     }`}>
                       {orcamento.status || 'Pendente'}
                     </span>
                  </div>
                </div>
              </div>
              
              {/* Logo da empresa */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 mb-1">NB ADMIN</div>
                <div className="text-sm text-gray-600">Sistema de Gestão</div>
              </div>
            </div>
          </div>

          {/* Informações do cliente */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações do Cliente
            </h2>
            
            {cliente ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Empresa:</span>
                      <p className="font-medium">{cliente.empresa}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Responsável:</span>
                      <p className="font-medium">{cliente.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">CNPJ:</span>
                      <p className="font-medium">{cliente.cnpj}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium">{cliente.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <p className="font-medium">{cliente.telefone}</p>
                    </div>
                  </div>
                  {cliente.endereco && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-600">Endereço:</span>
                        <p className="font-medium">{cliente.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Informações do cliente não disponíveis</div>
            )}
          </div>

          {/* Produtos/Itens */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Itens do Orçamento
            </h2>
            
            {produtos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qtd
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Unit.
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtos.map((produto, index) => (
                       <tr key={produto.id || index} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                             {(produto.img_0 || produto.produtos?.img_0) && (
                               <img
                                 src={produto.img_0 || produto.produtos?.img_0}
                                 alt={produto.titulo || produto.produtos?.titulo}
                                 className="h-12 w-12 rounded-lg object-cover mr-3"
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none';
                                 }}
                               />
                             )}
                             <div>
                               <div className="text-sm font-medium text-gray-900">
                                 {produto.titulo || produto.produtos?.titulo || 'Produto sem título'}
                               </div>
                               {(produto.codigo || produto.produtos?.codigo) && (
                                 <div className="text-sm text-gray-500">
                                   Cód: {produto.codigo || produto.produtos?.codigo}
                                 </div>
                               )}
                               {produto.produtos?.categoria && (
                                 <div className="text-sm text-gray-500">
                                   Categoria: {produto.produtos.categoria}
                                 </div>
                               )}
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="text-sm text-gray-900 mb-2">
                             {produto.descricao || 'Sem descrição'}
                           </div>
                           {produto.color && (
                             <div className="text-sm text-gray-500 mb-1">
                               <span className="font-medium">Cor:</span> {produto.color}
                             </div>
                           )}
                           {produto.personalizacao && (
                             <div className="text-sm text-gray-500 mb-1">
                               <span className="font-medium">Gravação:</span> {produto.personalizacao}
                             </div>
                           )}
                           {produto.customizations && (
                             <div className="text-sm text-gray-500 mb-1">
                               <span className="font-medium">Personalizações:</span>
                               <div 
                                 className="mt-1 text-xs"
                                 dangerouslySetInnerHTML={{ __html: produto.customizations }}
                               />
                             </div>
                           )}
                           {/* Mostrar quantidades adicionais se existirem */}
                           {(produto.products_quantidade_01 || produto.products_quantidade_02 || produto.products_quantidade_03) && (
                             <div className="text-xs text-gray-500 mt-2">
                               <span className="font-medium">Qtds. Adicionais:</span>
                               {produto.products_quantidade_01 && <span className="ml-1">Q1: {produto.products_quantidade_01}</span>}
                               {produto.products_quantidade_02 && <span className="ml-2">Q2: {produto.products_quantidade_02}</span>}
                               {produto.products_quantidade_03 && <span className="ml-2">Q3: {produto.products_quantidade_03}</span>}
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                           <div className="font-medium">{produto.quantidade}</div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                           {formatCurrency(produto.valor_unitario)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                           {formatCurrency(produto.valor_total)}
                         </td>
                       </tr>
                     ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Total Geral:
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                        {formatCurrency(valorTotalProdutos)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum produto encontrado neste orçamento
              </div>
            )}
          </div>

          {/* Condições comerciais */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Condições Comerciais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {orcamento.validade_proposta && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Validade da Proposta:</span>
                    <p className="text-gray-900">{orcamento.validade_proposta}</p>
                  </div>
                )}
                {orcamento.prazo_entrega && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Prazo de Entrega:</span>
                    <p className="text-gray-900">{orcamento.prazo_entrega}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {orcamento.forma_pagamento && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Forma de Pagamento:</span>
                    <p className="text-gray-900">{orcamento.forma_pagamento}</p>
                  </div>
                )}
                {orcamento.opcao_frete && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Frete:</span>
                    <p className="text-gray-900">{orcamento.opcao_frete}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Locais de entrega e cobrança */}
          {(orcamento.local_entrega || orcamento.local_cobranca) && (
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Locais de Entrega e Cobrança
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orcamento.local_entrega && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Local de Entrega:</span>
                    <div 
                      className="text-gray-900 mt-1"
                      dangerouslySetInnerHTML={{ __html: orcamento.local_entrega }}
                    />
                  </div>
                )}
                
                {orcamento.local_cobranca && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Local de Cobrança:</span>
                    <div 
                      className="text-gray-900 mt-1"
                      dangerouslySetInnerHTML={{ __html: orcamento.local_cobranca }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condições Comerciais */}
           {(orcamento.forma_pagamento || orcamento.prazo_entrega || orcamento.opcao_frete || orcamento.validade_proposta) && (
             <div className="px-8 py-6 border-b border-gray-200">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 Condições Comerciais
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {orcamento.forma_pagamento && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Forma de Pagamento</h3>
                     <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{orcamento.forma_pagamento}</p>
                   </div>
                 )}
                 {orcamento.prazo_entrega && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Prazo de Entrega</h3>
                     <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{orcamento.prazo_entrega}</p>
                   </div>
                 )}
                 {orcamento.opcao_frete && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Opção de Frete</h3>
                     <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{orcamento.opcao_frete}</p>
                   </div>
                 )}
                 {orcamento.validade_proposta && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Validade da Proposta</h3>
                     <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                       {new Date(orcamento.validade_proposta).toLocaleDateString('pt-BR')}
                     </p>
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Locais de Entrega e Cobrança */}
           {(orcamento.local_entrega || orcamento.local_cobranca) && (
             <div className="px-8 py-6 border-b border-gray-200">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 Locais de Entrega e Cobrança
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {orcamento.local_entrega && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Local de Entrega</h3>
                     <div className="text-gray-700 bg-blue-50 p-4 rounded-lg whitespace-pre-line">
                       {orcamento.local_entrega}
                     </div>
                   </div>
                 )}
                 {orcamento.local_cobranca && (
                   <div>
                     <h3 className="text-lg font-medium text-gray-800 mb-2">Local de Cobrança</h3>
                     <div className="text-gray-700 bg-green-50 p-4 rounded-lg whitespace-pre-line">
                       {orcamento.local_cobranca}
                     </div>
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Totais */}
           {orcamento.valor_total_estimado && (
             <div className="px-8 py-6 border-b border-gray-200">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 Totais
               </h2>
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                 <div className="flex justify-between items-center">
                   <span className="text-lg font-medium text-gray-800">Valor Total Estimado:</span>
                   <span className="text-2xl font-bold text-indigo-600">
                     R$ {parseFloat(orcamento.valor_total_estimado.toString()).toLocaleString('pt-BR', {
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2
                     })}
                   </span>
                 </div>
               </div>
             </div>
           )}

           {/* Observações e Informações Adicionais */}
           {(orcamento.observacoes_ricas || orcamento.observacoes || orcamento.solicitacao_observacao || orcamento.descricao_rica || orcamento.informacoes_adicionais_ricas) && (
             <div className="px-8 py-6 border-b border-gray-200">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 Observações e Informações Adicionais
               </h2>
               
               {/* Observações Ricas */}
               {orcamento.observacoes_ricas && (
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-2">Observações</h3>
                   <div 
                     className="text-gray-700 prose max-w-none bg-gray-50 p-4 rounded-lg"
                     dangerouslySetInnerHTML={{ __html: orcamento.observacoes_ricas }}
                   />
                 </div>
               )}
               
               {/* Observações Simples (fallback) */}
               {!orcamento.observacoes_ricas && (orcamento.observacoes || orcamento.solicitacao_observacao) && (
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-2">Observações</h3>
                   <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                     {orcamento.observacoes || orcamento.solicitacao_observacao}
                   </div>
                 </div>
               )}
               
               {/* Descrição Rica */}
               {orcamento.descricao_rica && (
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-2">Descrição do Orçamento</h3>
                   <div 
                     className="text-gray-700 prose max-w-none bg-blue-50 p-4 rounded-lg"
                     dangerouslySetInnerHTML={{ __html: orcamento.descricao_rica }}
                   />
                 </div>
               )}
               
               {/* Informações Adicionais Ricas */}
               {orcamento.informacoes_adicionais_ricas && (
                 <div className="mb-6">
                   <h3 className="text-lg font-medium text-gray-800 mb-2">Informações Adicionais</h3>
                   <div 
                     className="text-gray-700 prose max-w-none bg-green-50 p-4 rounded-lg"
                     dangerouslySetInnerHTML={{ __html: orcamento.informacoes_adicionais_ricas }}
                   />
                 </div>
               )}
             </div>
           )}

          {/* Rodapé */}
          <div className="px-8 py-6 bg-gray-50 rounded-b-lg">
            <div className="text-center text-sm text-gray-600">
              <p>Este orçamento foi gerado automaticamente pelo sistema NB Admin</p>
              <p className="mt-1">Data de geração: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de email */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        defaultTo={cliente?.email || ''}
        defaultSubject={`Orçamento #${generateOrcamentoNumber(orcamento)} - ${cliente?.empresa || 'Cliente'}`}
        loading={sendingEmail}
      />
    </div>
  );
};

export default OrcamentoView;


// Função para gerar número do orçamento formatado
const generateOrcamentoNumber = (orcamento: OrcamentoData): string => {
  // Se já existe numero_orcamento, usar ele
  if (orcamento.numero_orcamento) {
    return orcamento.numero_orcamento;
  }
  
  // Se existe numero_sequencial e ano_orcamento, formatar como YYYY-NNNN
  if (orcamento.numero_sequencial && orcamento.ano_orcamento) {
    return `${orcamento.ano_orcamento}-${String(orcamento.numero_sequencial).padStart(4, '0')}`;
  }
  
  // Fallback para numero_solicitacao se existir
  if (orcamento.numero_solicitacao) {
    return orcamento.numero_solicitacao;
  }
  
  // Último fallback: usar o ID da solicitação
  return `ORC-${String(orcamento.solicitacao_id).padStart(4, '0')}`;
};