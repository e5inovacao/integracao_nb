import React, { useState, useEffect } from 'react';
import { Mail, Eye, Code, FileText, Settings, Copy, CheckCircle, Search, Package, AlertCircle, Loader2 } from 'lucide-react';
import { generateOrcamentoEmailHTML } from '../utils/emailTemplate';
import { supabase } from '../lib/supabase';

// Interfaces para o produto e dados do email
interface ProductData {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  codigo: string;
  tipo?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
  htmlContent: string;
  lastModified: string;
}

// Hook customizado para busca de produtos
const useProductSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProduct = async (code: string): Promise<ProductData | null> => {
    if (!code || code.trim().length === 0) {
      setError('Por favor, insira um código de produto');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('ecologic_products_site')
        .select(`
          id,
          titulo,
          descricao,
          categoria,
          codigo,
          tipo,
          img_0,
          img_1,
          img_2
        `)
        .eq('codigo', code.trim())
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setError('Produto não encontrado com este código');
        } else {
          setError('Erro ao buscar produto: ' + supabaseError.message);
        }
        return null;
      }

      return data;
    } catch (err) {
      setError('Erro inesperado ao buscar produto');
      console.error('Erro na busca:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { searchProduct, loading, error, clearError };
};

// Função para gerar email com produto específico
const generateProductEmailPreview = async (productData: ProductData): Promise<string> => {
  const mockData = {
    orcamento: {
      id: 999,
      opcao_frete: 'Frete CIF - Incluso para Grande Vitória',
      validade_proposta: '15',
      prazo_entrega: '10',
      forma_pagamento: 'À vista ou parcelado',
      observacoes: 'Produto sujeito à disponibilidade de estoque'
    },
    cliente: {
      nome: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      telefone: '(27) 99999-9999',
      empresa: 'Empresa Exemplo Ltda'
    },
    consultor: {
      nome: 'Consultor Natureza Brindes',
      email: 'consultor@naturezabrindes.com',
      telefone: '(27) 3238-9726'
    },
    produtos: [
      {
        titulo: productData.titulo,
        descricao: productData.descricao,
        categoria: productData.categoria,
        codigo: productData.codigo,
        color: '',
        customizations: 'Personalização conforme especificação do cliente',
        quantidade: 100,
        valor_unitario: 25.00, // Valor exemplo fixo
        valor_total: 2500.00, // 100 * 25.00
        image: productData.img_0
      }
    ],
    customMessage: `Confira nossa proposta para o produto ${productData.titulo}. Estamos à disposição para esclarecer dúvidas.`
  };

  const result = await generateOrcamentoEmailHTML(mockData);
  return result.htmlContent;
};

const ModelosEmail: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  
  // Estados para busca de produto
  const [productCode, setProductCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [productEmailHtml, setProductEmailHtml] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<ProductData[]>([]);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  
  const { searchProduct, loading: searchLoading, error: searchError, clearError } = useProductSearch();

  // Carregar template HTML na inicialização
  useEffect(() => {
    const loadTemplateHtml = async () => {
      try {
        const result = await generateOrcamentoEmailHTML(mockOrcamentoData);
        setTemplateHtml(result.htmlContent);
      } catch (error) {
        console.error('Erro ao carregar template HTML:', error);
        setTemplateHtml('Erro ao carregar template');
      }
    };
    
    loadTemplateHtml();
  }, []);

  // Template de exemplo baseado no sistema atual
  const mockOrcamentoData = {
    orcamento: {
      id: 1,
      opcao_frete: 'Frete CIF - Incluso para Grande Vitória',
      validade_proposta: '10',
      prazo_entrega: '20',
      forma_pagamento: '100% 15 dias após emissão da NF',
      observacoes: 'Produto sujeito à disponibilidade de estoque'
    },
    cliente: {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '(27) 99999-9999',
      empresa: 'Empresa Exemplo Ltda'
    },
    consultor: {
      nome: 'Maria Santos',
      email: 'maria@naturezabrindes.com',
      telefone: '(27) 3238-9726'
    },
    produtos: [
      {
        titulo: 'Caneca Personalizada',
        descricao: 'Caneca de porcelana branca 325ml',
        categoria: 'Brindes',
        codigo: 'CAN001',
        color: 'Branco',
        customizations: 'Logo da empresa em uma cor',
        quantidade: 100,
        valor_unitario: 12.50,
        valor_total: 1250.00
      },
      {
        titulo: 'Camiseta Polo',
        descricao: 'Camiseta polo 100% algodão',
        categoria: 'Vestuário',
        codigo: 'CAM002',
        color: 'Azul Marinho',
        customizations: 'Bordado no peito',
        quantidade: 50,
        valor_unitario: 35.00,
        valor_total: 1750.00
      }
    ],
    customMessage: 'Obrigado pelo interesse em nossos produtos! Estamos à disposição para esclarecer qualquer dúvida.'
  };

  const emailTemplates: EmailTemplate[] = [
    {
      id: 'orcamento-template',
      name: 'Template de Orçamento',
      description: 'Template utilizado para envio de orçamentos aos clientes, contendo detalhes dos produtos, preços e informações da empresa.',
      category: 'Comercial',
      variables: [
        'orcamento.id',
        'cliente.nome',
        'cliente.email',
        'cliente.telefone',
        'cliente.empresa',
        'consultor.nome',
        'consultor.email',
        'consultor.telefone',
        'produtos[]',
        'customMessage',
        'orcamento.opcao_frete',
        'orcamento.validade_proposta',
        'orcamento.prazo_entrega',
        'orcamento.forma_pagamento',
        'orcamento.observacoes'
      ],
      htmlContent: templateHtml,
      lastModified: '2024-01-15'
    }
  ];

  // Função para buscar produto
  const handleProductSearch = async () => {
    if (!productCode.trim()) {
      return;
    }

    const product = await searchProduct(productCode);
    if (product) {
      setSelectedProduct(product);
      const emailHtml = await generateProductEmailPreview(product);
      setProductEmailHtml(emailHtml);
      
      // Adicionar aos recentes (evitar duplicatas)
      setRecentSearches(prev => {
        const filtered = prev.filter(p => p.codigo !== product.codigo);
        return [product, ...filtered].slice(0, 5); // Manter apenas os 5 mais recentes
      });
      
      // Limpar template selecionado quando produto for encontrado
      setSelectedTemplate(null);
    }
  };

  // Função para selecionar produto dos recentes
  const handleRecentProductSelect = async (product: ProductData) => {
    setSelectedProduct(product);
    setProductCode(product.codigo);
    const emailHtml = await generateProductEmailPreview(product);
    setProductEmailHtml(emailHtml);
    setSelectedTemplate(null);
  };

  const handleCopyCode = async () => {
    const contentToCopy = selectedProduct ? productEmailHtml : selectedTemplate?.htmlContent;
    if (contentToCopy) {
      try {
        await navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar código:', err);
      }
    }
  };

  // Limpar busca de produto
  const clearProductSearch = () => {
    setSelectedProduct(null);
    setProductCode('');
    setProductEmailHtml('');
    clearError();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Mail className="h-8 w-8 mr-3 text-blue-600" />
          Modelos de Email
        </h1>
        <p className="text-gray-600">
          Visualize templates de email e teste com produtos reais do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Lateral - Busca e Templates */}
        <div className="lg:col-span-1 space-y-6">
          {/* Busca por Código de Produto */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Buscar por Código
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Digite o código do produto para gerar prévia
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => {
                    setProductCode(e.target.value);
                    clearError();
                  }}
                  placeholder="Digite o código do produto"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
                />
                <button
                  onClick={handleProductSearch}
                  disabled={searchLoading || !productCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {searchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>

              {searchError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{searchError}</span>
                </div>
              )}

              {selectedProduct && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    {selectedProduct.img_0 && (
                      <img
                        src={selectedProduct.img_0}
                        alt={selectedProduct.titulo}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {selectedProduct.titulo}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Código: {selectedProduct.codigo}
                      </p>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                        {selectedProduct.categoria}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={clearProductSearch}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Produtos Recentes */}
          {recentSearches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-600" />
                  Buscas Recentes
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {recentSearches.map((product) => (
                  <button
                    key={product.codigo}
                    onClick={() => handleRecentProductSelect(product)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 border border-gray-100"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.titulo}
                    </div>
                    <div className="text-xs text-gray-500">
                      Código: {product.codigo}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Templates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Templates Padrão
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    clearProductSearch();
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {template.category}
                        </span>
                        <span>Modificado: {template.lastModified}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Área Principal - Visualização */}
        <div className="lg:col-span-2">
          {selectedTemplate || selectedProduct ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedProduct 
                      ? `Prévia com Produto: ${selectedProduct.titulo}` 
                      : selectedTemplate?.name
                    }
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('code')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'code'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Code className="h-4 w-4 inline mr-1" />
                      Código
                    </button>
                    <button
                      onClick={() => setFullscreenMode(true)}
                      className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Tela Cheia
                    </button>
                    {viewMode === 'code' && (
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 inline mr-1" />
                        )}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {viewMode === 'preview' ? (
                  <div className="space-y-4">
                    {/* Informações do Template/Produto */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        {selectedProduct ? 'Informações do Produto' : 'Informações do Template'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {selectedProduct ? (
                          <>
                            <div>
                              <span className="font-medium text-gray-700">Código:</span>
                              <span className="ml-2 text-gray-600">{selectedProduct.codigo}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Categoria:</span>
                              <span className="ml-2 text-gray-600">{selectedProduct.categoria}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Tipo:</span>
                              <span className="ml-2 text-gray-600">{selectedProduct.tipo || 'Não especificado'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Descrição:</span>
                              <span className="ml-2 text-gray-600">{selectedProduct.descricao}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="font-medium text-gray-700">Categoria:</span>
                              <span className="ml-2 text-gray-600">{selectedTemplate?.category}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Última modificação:</span>
                              <span className="ml-2 text-gray-600">{selectedTemplate?.lastModified}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Variáveis Utilizadas (apenas para templates) */}
                    {selectedTemplate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Variáveis Utilizadas</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.variables.map((variable, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview do Email */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Preview do Email</h3>
                      </div>
                      <div className="p-4 bg-white max-h-96 overflow-y-auto">
                        <iframe
                          srcDoc={selectedProduct ? productEmailHtml : selectedTemplate?.htmlContent}
                          className="w-full h-80 border-0"
                          title="Email Preview"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                        <code>{selectedProduct ? productEmailHtml : selectedTemplate?.htmlContent}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Busque um Produto ou Selecione um Template
              </h3>
              <p className="text-gray-600">
                Digite um código de produto para gerar uma prévia personalizada ou escolha um template padrão da lista ao lado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Tela Cheia */}
      {fullscreenMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedProduct 
                  ? `Prévia com Produto: ${selectedProduct.titulo}` 
                  : selectedTemplate?.name
                } - Tela Cheia
              </h2>
              <button
                onClick={() => setFullscreenMode(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 h-full overflow-auto">
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ 
                  __html: selectedProduct 
                    ? productEmailHtml 
                    : selectedTemplate?.htmlContent || '' 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelosEmail;