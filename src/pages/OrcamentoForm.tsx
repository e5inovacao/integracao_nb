import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PlusIcon, TrashIcon, DocumentTextIcon, ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import RichTextEditor from '../components/RichTextEditor';
import { useVariationColorImage } from '@/hooks/useVariationColorImage';
import { parseVariacoes } from '@/utils/variationImages';
import { getValidImageUrl, createImageErrorHandler } from '@/utils/imageUtils';
import { getConfiguracoesOrcamento, buscarConfiguracoes } from '../lib/configuracoes-service';

// Helpers utilitários para normalização e parse seguro
// Normaliza strings: lowercase, remove acentos, colapsa espaços, trim
const norm = (s?: string) =>
  s?.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim() ?? '';

// JSON.parse seguro (aceita objeto já parseado)
const safeParse = <T,>(v: any): T | null => {
  try {
    return typeof v === 'string' ? JSON.parse(v) : (v ?? null);
  } catch {
    return null;
  }
};

// Funções auxiliares para formatação monetária - REFATORADAS
const formatCurrencyInput = (value: number): string => {
  if (!value || value === 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para formatar subtotais em moeda brasileira
const formatSubtotalCurrency = (value: number): string => {
  if (!value || value === 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const parseCurrencyInput = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove tudo exceto números, vírgulas e pontos
  let cleanValue = value.replace(/[^\d,.]/g, '');
  
  // Se tem vírgula, assumir formato brasileiro (1.234,56)
  if (cleanValue.includes(',')) {
    // Remover pontos (separadores de milhares) e trocar vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  }
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

// Função para formatar valor monetário para exibição
const formatCurrencyDisplay = (value: number): string => {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para formatar valor para edição (preenchimento da direita para esquerda)
const formatCurrencyForEditing = (value: number): string => {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para formatação com preenchimento da direita para esquerda
const formatCurrencyRightToLeft = (inputValue: string): string => {
  // Remove tudo exceto números
  const numbers = inputValue.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos e formata
  const cents = parseInt(numbers);
  const reais = cents / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais);
};

// Função para converter valor formatado da direita para esquerda para número
const parseCurrencyRightToLeft = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove tudo exceto números
  const numbers = formattedValue.replace(/\D/g, '');
  
  if (!numbers) return 0;
  
  // Converte centavos para reais
  const cents = parseInt(numbers);
  return cents / 100;
};

// Função para formatação em tempo real enquanto digita
const formatCurrencyRealTime = (value: string): string => {
  // Remove tudo exceto números, vírgulas e pontos
  let cleanValue = value.replace(/[^\d,.]/g, '');
  
  if (!cleanValue) return '';
  
  // Permitir digitação livre - só formatar quando tiver vírgula ou mais de 2 dígitos
  if (cleanValue.length <= 2 && !cleanValue.includes(',')) {
    return cleanValue;
  }
  
  // Se contém vírgula, assumir formato brasileiro
  if (cleanValue.includes(',')) {
    // Permitir apenas uma vírgula
    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      cleanValue = parts[0] + ',' + parts[1].substring(0, 2);
    } else if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    // Retornar o valor com vírgula sem formatação completa ainda
    return 'R$ ' + cleanValue;
  }
  
  // Para números maiores que 2 dígitos, aplicar formatação básica
  const numericValue = parseInt(cleanValue);
  if (isNaN(numericValue)) return cleanValue;
  
  // Formatação simples para valores grandes
  if (numericValue >= 100) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  }
  
  return cleanValue;
};

// Função para converter valor digitado para número
const parseCurrencyValue = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo exceto números, vírgulas e pontos
  let cleanValue = value.replace(/[^\d,.]/g, '');
  
  // Se tem vírgula, assumir formato brasileiro (1.234,56)
  if (cleanValue.includes(',')) {
    // Remover pontos (separadores de milhares) e trocar vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  }
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

// Função para extrair valor numérico de string formatada
const extractNumericValue = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove R$, espaços e converte vírgula para ponto
  const cleanValue = formattedValue
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

// Mantendo as funções antigas para compatibilidade com código existente
const formatInputWhileTyping = formatCurrencyDisplay;
const parseFormattedCurrency = parseCurrencyValue;

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cnpj?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

interface Representante {
  id: number;
  user_name: string;
  user_email: string;
  role: string;
}

interface Produto {
  id: number;
  produto_name: string;
  preco_venda: number;
}

interface OrcamentoItem {
  id?: number;
  produto_id: number;
  produto?: Produto;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto_percentual: number;
  valor_total: number;
  observacoes?: string;
  ordem: number;
  tipo_custo?: string;
  fator?: number;
}

interface Orcamento {
  id?: number;
  numero_orcamento: string;
  titulo: string;
  cliente_id: string;
  descricao?: string;
  data_validade: string;
  status: 'Orçamento Solicitado' | 'Orçamento Enviado' | 'Orçamento Aprovado';
  observacoes?: string;
  valor_total: number;
  validade_proposta?: string;
  prazo_entrega?: string;
  forma_pagamento?: string;
  opcao_frete?: string;
  local_entrega?: string;
  local_cobranca?: string;
  itens: OrcamentoItem[]; // Simplificado - itens diretamente no orçamento
  created_at?: string;
}

// Componente para imagem do produto - versão melhorada do NovoEditor2
const ProductImage: React.FC<{ product: any }> = ({ product }) => {
  // Validação robusta de dados do produto
  if (!product) {
    console.warn('ProductImage: produto não fornecido');
    return (
      <div className="flex-shrink-0 h-16 w-16">
        <img
          src="/placeholder-product.svg"
          alt="Produto não disponível"
          className="h-16 w-16 object-contain rounded-md border border-gray-200 p-1 bg-white transition-all duration-300"
        />
      </div>
    );
  }

  // Extrair dados do produto com fallbacks
  const productData = product?.originalData?.ecologic_products_site || product?.originalData || product;
  const variacoes = parseVariacoes(product.variacoes || productData?.variacoes);
  
  // Debug logs para diagnóstico
  console.log('ProductImage Debug (NovoEditor2 style):', {
    productId: product.id,
    productName: product.name || product.titulo,
    selectedColor: product.color,
    selectedVariationImage: product.selectedVariationImage,
    variacoesCount: variacoes?.length || 0,
    imageKey: product.imageKey
  });

  // Usar hook com parâmetros corretos - incluindo imageKey para forçar re-render
  const { src, onError } = useVariationColorImage({
    variacoes,
    initialColor: product.color,
    initialIndex: 0,
    // Usar imageKey para forçar re-render quando cor muda
    key: product.imageKey || product.color
  });

  // Implementar cascata de fallbacks com proxy e validação
  const fallbacksArr = [
    src, // Imagem da variação selecionada
    product.selectedVariationImage, // Imagem da variação selecionada manualmente
    productData?.img_0, // Imagem principal
    productData?.img_1, // Imagem secundária
    productData?.img_2, // Imagem terciária
    product.img_0,
    product.img_1,
    product.img_2,
  ].filter(Boolean);

  const finalImageSrc = getValidImageUrl(fallbacksArr[0] || '/placeholder-product.svg', fallbacksArr.slice(1));
  const imageErrorHandler = createImageErrorHandler(fallbacksArr.slice(1));

  return (
    <div className="flex-shrink-0 h-16 w-16">
      <img
        src={finalImageSrc}
        alt={product.name || product.titulo || 'Produto'}
        className="h-16 w-16 object-contain rounded-md border border-gray-200 p-1 bg-white transition-all duration-300"
        onError={(e) => {
          imageErrorHandler(e);
          if (onError) onError(e);
        }}
        onLoad={() => {
          console.log('Imagem carregada com sucesso:', {
            src: finalImageSrc,
            productId: product.id
          });
        }}
      />
    </div>
  );
};

// Componente para seletor de variações de cor
const ColorVariationSelector: React.FC<{
  product: any;
  variacoes: any[];
  onSelect: (product: any, variacao: any) => void;
  isViewOnly: boolean;
}> = ({ product, variacoes, onSelect, isViewOnly }) => {
  return (
    <>
      {variacoes.map((variacao: any, index: number) => (
        <div
          key={`${variacao.cor}-${index}`}
          className={`flex items-center space-x-2 p-2 rounded border transition-colors ${
            product.color === variacao.cor
              ? 'border-blue-300 bg-blue-50 shadow-sm'
              : 'border-gray-100 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name={`variacao-${product.id}`}
            id={`variacao-${product.id}-${index}`}
            checked={product.color === variacao.cor}
            onChange={(e) => {
              if (!isViewOnly && e.target.checked) {
                onSelect(product, variacao);
              }
            }}
            disabled={isViewOnly}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          
          {/* Miniatura da Variação */}
          <div className="flex-shrink-0 h-8 w-8">
            {variacao.imagem ? (
              <img
                src={getValidImageUrl(variacao.imagem)}
                alt={variacao.cor}
                className="h-8 w-8 object-cover rounded border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class=\"h-8 w-8 bg-gray-200 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500\">${variacao.cor.charAt(0)}</div>`;
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-gray-200 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                {variacao.cor.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Label da Variação */}
          <label
            htmlFor={`variacao-${product.id}-${index}`}
            className="flex-1 text-xs text-gray-700 cursor-pointer"
          >
            {variacao.cor}
            {variacao.tamanho && (
              <span className="text-gray-500 ml-1">
                - {variacao.tamanho}
              </span>
            )}
            {variacao.preco && (
              <span className="text-green-600 ml-1 font-medium">
                R$ {parseFloat(variacao.preco).toFixed(2)}
              </span>
            )}
          </label>
          
          {/* Indicador de Seleção */}
          {product.color === variacao.cor && (
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// Removido: componente de busca de configurações e seus inputs auxiliares

export default function OrcamentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, consultorData } = useAuth();
  const isEditing = !!id;
  const isConsultor = user?.role === 'consultor';
  const isAdmin = user?.role === 'admin';

  const [orcamento, setOrcamento] = useState<Orcamento>({
    numero_orcamento: '',
    titulo: '',
    cliente_id: '',
    data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Orçamento Solicitado',
    valor_total: 0,
    validade_proposta: '15 dias',
    prazo_entrega: '15 / 20 dias úteis',
    forma_pagamento: '',
    opcao_frete: 'cliente-retira',
    local_entrega: '',
    local_cobranca: '',
    itens: [] // Simplificado - itens diretamente no orçamento
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showTitles, setShowTitles] = useState<Record<string, boolean>>({});
  const [tabelasPersonalizacao, setTabelasPersonalizacao] = useState<{ nome_tabela: string; status: string }[]>([]);
  const [personalizacaoValores, setPersonalizacaoValores] = useState<{ [key: string]: { quantidade_inicial: number; quantidade_final: number; valor: number }[] }>({});
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [consultores, setConsultores] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [representante, setRepresentante] = useState<Representante | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  // Removido activeVersionIndex - não mais necessário com estrutura simplificada
  
  // Estados para busca de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados para busca de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [clientSearchMessage, setClientSearchMessage] = useState('');
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false); // Controla se está em modo apenas visualização
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: string }>({});
  
  // Estados para configurações
  const [configuracoes, setConfiguracoes] = useState<Record<string, string>>({});
  const [configuracoesCarregadas, setConfiguracoesCarregadas] = useState(false);
  
  // Estados para tabelas de fator
  const [tabelasFator, setTabelasFator] = useState<{ nome_tabela: string; status: string }[]>([]);
  const [fatoresCarregados, setFatoresCarregados] = useState<{ [key: string]: { quantidade_inicial: number; quantidade_final: number; fator: number }[] }>({});
  // Personalizações removidas

  // Handler para seleção de cor - versão melhorada do NovoEditor2
  const handleColorVariationSelect = (product: any, variacao: any) => {
    const newColor = variacao?.cor ?? '';
    const newImage = variacao?.link_image ?? variacao?.imagem ?? '';

    console.log('🎯 Color variation selected (NovoEditor2 style):', {
      productId: product.id,
      productName: product.name || product.titulo,
      oldColor: product.color,
      newColor,
      newImage,
      variacao,
      timestamp: new Date().toISOString()
    });

    // CORREÇÃO CRÍTICA: Validar se a imagem da variação existe
    if (!newImage || newImage.trim() === '') {
      console.warn('⚠️ AVISO: Variação selecionada não possui imagem válida!', {
        cor: newColor,
        imagem: newImage,
        variacao
      });
      toast.warning(`Cor "${newColor}" selecionada, mas sem imagem específica`);
    } else {
      console.log('✅ Imagem da variação válida:', newImage);
    }

    // Atualizar o produto selecionado com a nova cor
    setSelectedProducts((prev) => {
      const updatedProducts = prev.map((p) => {
        if (p.id === product.id) {
          const updatedProduct = {
            ...p,
            color: newColor,
            selectedVariations: [newColor],
            selectedVariationImage: newImage, // GARANTIR que a imagem da variação seja salva
            // Forçar re-render do componente de imagem
            imageKey: Date.now()
          };

          console.log('🔄 Produto sendo atualizado:', {
            id: p.id,
            oldColor: p.color,
            newColor: updatedProduct.color,
            oldImage: p.selectedVariationImage,
            newImage: updatedProduct.selectedVariationImage,
            imageKey: updatedProduct.imageKey
          });

          return updatedProduct;
        }
        return p;
      });

      const updatedProduct = updatedProducts.find(p => p.id === product.id);
      console.log('✅ Updated products with new color:', {
        productId: updatedProduct?.id,
        color: updatedProduct?.color,
        selectedVariationImage: updatedProduct?.selectedVariationImage,
        imageKey: updatedProduct?.imageKey
      });
      
      return updatedProducts;
    });

    // Mostrar feedback visual
    toast.success(`Cor alterada para: ${newColor}${newImage ? ' (com imagem específica)' : ' (sem imagem específica)'}`);
  };

  useEffect(() => {
    fetchClientes();
    fetchProdutos();
    fetchConsultores();
    fetchRepresentante();
    fetchConfiguracoes();
    carregarTabelasFator();
    // Personalizações removidas
    if (isEditing) {
      fetchOrcamento();
    } else {
      generateNumeroOrcamento();
    }
  }, [id]);

  // Carregar configurações de orçamento
  const fetchConfiguracoes = async () => {
    try {
      const configs = await getConfiguracoesOrcamento();
      setConfiguracoes(configs);
      setConfiguracoesCarregadas(true);
      
      // Aplicar configurações padrão se não estiver editando
      if (!isEditing) {
        setOrcamento(prev => ({
          ...prev,
          validade_proposta: configs.validade_proposta || prev.validade_proposta,
          prazo_entrega: configs.prazo_entrega || prev.prazo_entrega,
          forma_pagamento: configs.forma_pagamento || prev.forma_pagamento,
          opcao_frete: configs.opcao_frete || prev.opcao_frete
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setConfiguracoesCarregadas(true); // Marcar como carregado mesmo com erro
    }
  };

  // Personalizações removidas

  // Função para carregar tabelas de fator
  const carregarTabelasFator = async () => {
    try {
      const { data, error } = await supabase
        .from('tabelas_fator')
        .select('nome_tabela, status')
        .eq('status', 'ativo')
        .order('nome_tabela');

      if (error) {
        console.error('Erro ao carregar tabelas de fator:', error);
        return;
      }

      const nomesUnicos = Array.from(new Set((data || []).map((t) => t.nome_tabela)));
      const tabelasUnicas = nomesUnicos.map((nome) => ({ nome_tabela: nome, status: 'ativo' }));
      setTabelasFator(tabelasUnicas);

      // Carregar fatores para cada tabela
      const fatoresMap: { [key: string]: any[] } = {};
      for (const nomeTabela of nomesUnicos) {
        const { data: fatores, error: fatoresError } = await supabase
          .from('tabelas_fator')
          .select('quantidade_inicial, quantidade_final, fator')
          .eq('status', 'ativo')
          .eq('nome_tabela', nomeTabela)
          .order('quantidade_inicial');

        if (!fatoresError && fatores) {
          fatoresMap[nomeTabela] = fatores;
        }
      }
      setFatoresCarregados(fatoresMap);
    } catch (error) {
      console.error('Erro ao carregar tabelas de fator:', error);
    }
  };

  // Função para obter o fator baseado na quantidade e tabela selecionada
  const obterFatorPorQuantidade = (nomeTabela: string, quantidade: number): number => {
    if (!nomeTabela || !fatoresCarregados[nomeTabela]) {
      return 1; // Valor padrão
    }

    const fatores = fatoresCarregados[nomeTabela];
    const fatorEncontrado = fatores.find(f => 
      quantidade >= f.quantidade_inicial && quantidade <= f.quantidade_final
    );

    return fatorEncontrado ? fatorEncontrado.fator : 1;
  };

  // Função para obter o valor da personalização baseado na quantidade e tabela selecionada
  const obterValorPersonalizacao = (nomeTabela: string | null | undefined, quantidade: number): number => {
    if (!nomeTabela || !quantidade || !personalizacaoValores[nomeTabela]) {
      return 0; // Valor padrão é 0 (sem custo extra)
    }

    const faixas = personalizacaoValores[nomeTabela];
    const faixaEncontrada = faixas.find(f => 
      quantidade >= f.quantidade_inicial && quantidade <= f.quantidade_final
    );

    return faixaEncontrada ? faixaEncontrada.valor : 0;
  };

  // Carregar nomes de tabelas de personalização ativas
  // Personalização removida

  // Personalizações removidas

  const fetchClientes = async () => {
    try {
      let query = supabase
        .from('clientes_sistema')
        .select('id, nome, email, telefone, empresa, cnpj, endereco');

      // Se for consultor, filtrar apenas clientes atribuídos a ele
      if (isConsultor && consultorData) {
        query = query.eq('consultor_id', consultorData.id);
      }

      const { data, error } = await query.order('nome');

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
      } else {
        const clientesMapeados = data?.map(cliente => ({
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          cnpj: cliente.cnpj,
          endereco: cliente.endereco
        })) || [];
        setClientes(clientesMapeados);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    }
  };

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('ecologic_products')
        .select('id, titulo, descricao, categoria')
        .order('titulo');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        setProdutos([]);
      } else {
        // Mapear os campos da tabela ecologic_products_site para a interface Produto
        const produtosMapeados = data?.map(item => ({
          id: item.id,
          produto_name: item.titulo || item.descricao || `Produto ${item.id}`,
          preco_venda: 0 // Preço será definido no orçamento
        })) || [];
        setProdutos(produtosMapeados);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    }
  };

  const generateNumeroOrcamento = async () => {
    try {
      const { data, error } = await supabase.rpc('gerar_numero_orcamento');
      if (error) {
        console.warn('RPC gerar_numero_orcamento não disponível, usando fallback:', error.message);
        throw error;
      }
      
      setOrcamento(prev => ({
        ...prev,
        numero_orcamento: data
      }));
    } catch (error) {
      console.info('Gerando número do orçamento usando método alternativo');
      // Fallback: gerar número baseado na data
      const now = new Date();
      const numero = `ORC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      setOrcamento(prev => ({
        ...prev,
        numero_orcamento: numero
      }));
    }
  };

  const generateNumeroOrcamentoFromId = async (solicitacaoId: string) => {
    try {
      // Tentar usar RPC se disponível
      const { data, error } = await supabase.rpc('gerar_numero_orcamento');
      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.info('RPC não disponível, gerando número baseado no ID da solicitação');
    }
    
    // Fallback: gerar número baseado no ID da solicitação
    const paddedId = String(solicitacaoId).padStart(4, '0');
    return `ORC-${paddedId}`;
  };

  const fetchOrcamento = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Implementar retry com backoff exponencial
      const maxRetries = 3;
      let retryCount = 0;
      let orcamentoData = null;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error: orcamentoError } = await supabase
            .from('orcamentos_sistema')
            .select('*')
            .eq('id', id)
            .single();

          if (orcamentoError) {
            // Verificar se é erro de rede que pode ser retentado
            if (orcamentoError.message.includes('Failed to fetch') || 
                orcamentoError.message.includes('ERR_ABORTED') ||
                orcamentoError.message.includes('NetworkError') ||
                orcamentoError.message.includes('fetch')) {
              
              if (retryCount < maxRetries - 1) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000;
                console.warn(`Erro ao buscar orçamento - tentativa ${retryCount}, tentando novamente em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            throw orcamentoError;
          }
          
          orcamentoData = data;
          break;
        } catch (networkError) {
          if (retryCount < maxRetries - 1 && 
              (networkError instanceof TypeError || 
               networkError.message?.includes('fetch') ||
               networkError.message?.includes('ERR_ABORTED'))) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            // Erro de rede ao buscar orçamento - tentativa silenciada
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw networkError;
        }
      }
      
      if (retryCount >= maxRetries) {
        throw new Error('Falha na conexão ao buscar orçamento após múltiplas tentativas');
      }

      if (!orcamentoData) throw new Error('Orçamento não encontrado');

      // Validar se os dados essenciais estão presentes
      if (!orcamentoData.user_id) {
        throw new Error('Dados do cliente não encontrados na solicitação');
      }

      // Mapear os campos da tabela solicitacao_orcamentos para a interface Orcamento
      const orcamentoMapeado = {
        id: orcamentoData.solicitacao_id,
        numero_orcamento: await generateNumeroOrcamentoFromId(orcamentoData.solicitacao_id),
        titulo: 'Orçamento',
        cliente_id: orcamentoData.user_id,
        descricao: orcamentoData.solicitacao_observacao,
        data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: orcamentoData.status || 'Orçamento Solicitado',
        observacoes: orcamentoData.solicitacao_observacao,
        valor_total: orcamentoData.valor_total_estimado || 0,
        // Campos de persistência que estavam faltando
        validade_proposta: orcamentoData.validade_proposta || '15 dias',
        forma_pagamento: orcamentoData.forma_pagamento || '',
        prazo_entrega: orcamentoData.prazo_entrega || '15 / 20 dias úteis',
        opcao_frete: orcamentoData.opcao_frete || 'frete-cif-incluso',
        local_entrega: orcamentoData.local_entrega || '',
        local_cobranca: orcamentoData.local_cobranca || '',
        itens: [] // Simplificado - itens diretamente no orçamento
      };

      // Verificar se o orçamento está em modo apenas visualização
      // Cópias duplicadas devem sempre ser editáveis, independente do status
      const isCopia = orcamentoData.solicitacao_observacao && 
                     orcamentoData.solicitacao_observacao.includes('Cópia do orçamento');
      
      if (orcamentoData.status === 'Orçamento Gerado' && !isCopia) {
        setIsViewOnly(true);
      } else {
        setIsViewOnly(false);
      }

      setOrcamento(orcamentoMapeado);
      // Removido setActiveVersionIndex - não mais necessário
      
      // Carregar produtos da solicitação
      await fetchProductsSolicitacao(id);
      
      // Carregar dados do cliente
      if (orcamentoMapeado.cliente_id) {
        await fetchClienteData(orcamentoMapeado.cliente_id);
      }
      
      // Carregar representante baseado no consultor_id do orçamento
      if (orcamentoData.consultor_id) {
        await fetchRepresentanteById(orcamentoData.consultor_id);
      }
    } catch (error) {
      // Em caso de erro, manter estrutura padrão
      setOrcamento({
        numero_orcamento: '',
        titulo: 'Orçamento',
        cliente_id: '',
        data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Orçamento Solicitado',
        valor_total: 0,
        itens: [] // Simplificado - itens diretamente no orçamento
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClienteData = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_clientes')
        .select('id, nome, email, telefone, empresa, cnpj, endereco')
        .eq('id', clienteId)
        .single();

      if (error) {
        setClienteSelecionado(null);
      } else {
        setClienteSelecionado({
          id: data.id,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          empresa: data.empresa,
          cnpj: data.cnpj,
          endereco: data.endereco
        });
      }
    } catch (error) {
      setClienteSelecionado(null);
    }
  };

  const fetchConsultores = async () => {
    try {
      // Buscar apenas consultores ativos (não administradores)
      const { data, error } = await supabase
        .from('consultores')
        .select('id, nome, email, ativo, role')
        .eq('ativo', true)
        .neq('role', 'admin') // Excluir administradores
        .order('nome');

      if (error) {
        console.error('Erro ao carregar consultores:', error);
        setConsultores([]);
      } else {
        // Filtrar apenas consultores (não administradores)
        const consultoresFiltrados = (data || []).filter(consultor => 
          !consultor.role || consultor.role.toLowerCase() !== 'admin'
        );
        setConsultores(consultoresFiltrados);
      }
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      setConsultores([]);
    }
  };

  const fetchRepresentante = async () => {
    try {
      let representanteData;
      
      if (isConsultor && consultorData) {
        // Se for consultor, usar seus próprios dados
        representanteData = {
          id: consultorData.id,
          user_name: consultorData.nome,
          user_email: consultorData.email,
          role: 'Consultor'
        };
      } else {
        // Buscar o primeiro consultor do sistema como representante padrão
        const { data, error } = await supabase
          .from('consultores')
          .select('id, nome, email, role')
          .limit(1);

        if (error) {
          console.error('Erro ao carregar representante:', error);
          setRepresentante(null);
          return;
        }
        
        if (data && data.length > 0) {
          representanteData = {
            id: data[0].id,
            user_name: data[0].nome || 'Não informado',
            user_email: data[0].email || 'Não informado',
            role: data[0].role || 'Representante'
          };
        } else {
          // Nenhum representante encontrado, definir dados padrão
          representanteData = {
            id: 0,
            user_name: 'Representante Padrão',
            user_email: 'representante@empresa.com',
            role: 'Representante'
          };
        }
      }
      
      setRepresentante(representanteData);
    } catch (error) {
      console.error('Erro ao carregar representante:', error);
      setRepresentante(null);
    }
  };

  const fetchRepresentanteById = async (consultorId: number) => {
    try {
      const { data, error } = await supabase
        .from('consultores')
        .select('id, nome, email, role')
        .eq('id', consultorId)
        .single();

      if (error) {
        console.error('Erro ao carregar representante por ID:', error);
        // Fallback para o representante padrão
        await fetchRepresentante();
        return;
      }
      
      if (data) {
        const representanteData = {
          id: data.id,
          user_name: data.nome || 'Não informado',
          user_email: data.email || 'Não informado',
          role: data.role || 'Representante'
        };
        setRepresentante(representanteData);
      } else {
        // Se não encontrou o consultor, usar representante padrão
        await fetchRepresentante();
      }
    } catch (error) {
      console.error('Erro ao carregar representante por ID:', error);
      // Fallback para o representante padrão
      await fetchRepresentante();
    }
  };

  const fetchProductsSolicitacao = async (solicitacaoId: string) => {
    try {
      // Implementar retry com backoff exponencial
      const maxRetries = 3;
      let retryCount = 0;
      let productsData = null;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error: productsError } = await supabase
            .from('products_solicitacao')
            .select(`
              *,
              ecologic_products_site!products_solicitacao_products_id_fkey (
                id,
                titulo,
                descricao,
                categoria,
                codigo,
                tipo,
                img_0,
                variacoes
              )
            `)
            .eq('solicitacao_id', solicitacaoId);

          if (productsError) {
            // Verificar se é erro de rede que pode ser retentado
            if (productsError.message.includes('Failed to fetch') || 
                productsError.message.includes('ERR_ABORTED') ||
                productsError.message.includes('NetworkError') ||
                productsError.message.includes('fetch')) {
              
              if (retryCount < maxRetries - 1) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000;
                console.warn(`Erro ao buscar produtos da solicitação - tentativa ${retryCount}, tentando novamente em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            throw productsError;
          }
          
          productsData = data;
          break;
        } catch (networkError) {
          if (retryCount < maxRetries - 1 && 
              (networkError instanceof TypeError || 
               networkError.message?.includes('fetch') ||
               networkError.message?.includes('ERR_ABORTED'))) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            // Erro de rede ao buscar produtos da solicitação - tentativa silenciada
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw networkError;
        }
      }
      
      if (retryCount >= maxRetries) {
        throw new Error('Falha na conexão ao buscar produtos da solicitação após múltiplas tentativas');
      }

      if (productsData && productsData.length > 0) {
        // Mapear produtos para selectedProducts (para exibição na tabela)
        const selectedProductsData = productsData.map((product) => {
          const produtoInfo = product.ecologic_products_site;
          
          return {
            id: product.products_id || product.id,
            name: produtoInfo?.titulo || product.descricao || `Produto ${product.products_id}`,
            description: produtoInfo?.descricao || product.descricao || '',
            reference: produtoInfo?.codigo || product.marca || product.products_id,
            category: produtoInfo?.categoria || product.categoria || '',
            color: product.color || '',
            observations: product.customizations || product.observacoes || '',
            quantity: product.products_quantidade_01 || 0,
            quantity1: product.products_quantidade_01 || 0,
            quantity2: product.products_quantidade_02 || 0,
            quantity3: product.products_quantidade_03 || 0,
            image: produtoInfo?.img_0 || product.imagem || null,
            source: 'products_solicitacao',
            originalData: {
              ...product,
              variacoes: produtoInfo?.variacoes || product.variacoes || null
            },
            // Campos adicionais para a tabela
            custo: product.valor_unitario || 0,
            personalizacao: product.customizations || '',
            gravacao: product.gravacao || '',
            info: product.observacoes || '',
            fator: product.fator || 1.0,
            preco1: product.preco1 || 0,
            preco2: product.preco2 || 0,
            preco3: product.preco3 || 0,
            // Incluir variações diretamente no produto
            variacoes: produtoInfo?.variacoes || product.variacoes || null
          };
        });

        // Atualizar selectedProducts para exibir na tabela
        setSelectedProducts(selectedProductsData);
        
        // Mapear produtos para itens do orçamento com dados completos
        const itens = productsData.map((product, index) => {
          const produtoInfo = product.ecologic_products_site;
          
          // Determinar a quantidade correta baseada nos campos disponíveis
          const quantidade = product.products_quantidade_01 || 
                           product.products_quantidade_02 || 
                           product.products_quantidade_03 || 
                           product.quantidade || 1;
          
          // Garantir que todos os campos essenciais estejam preenchidos
          const valorUnitario = product.valor_unitario || 0;
          const descricao = produtoInfo?.descricao || 
                           produtoInfo?.titulo || 
                           product.descricao || 
                           `Produto ID: ${product.products_id}`;
          
          const item = {
            produto_id: product.products_id || product.id,
            descricao: descricao,
            quantidade: quantidade,
            valor_unitario: valorUnitario,
            desconto_percentual: product.desconto_percentual || 0,
            valor_total: quantidade * valorUnitario * (1 - (product.desconto_percentual || 0) / 100),
            ordem: index + 1,
            // Campos adicionais do produto
            categoria: produtoInfo?.categoria || product.categoria || '',
            marca: produtoInfo?.codigo || product.marca || '',
            modelo: produtoInfo?.tipo || product.modelo || '',
            observacoes: product.observacoes || ''
          };
          
          return item;
        });

        // Calcular valor total do orçamento
        const valorTotal = itens.reduce((total, item) => total + item.valor_total, 0);

        // Atualizar orçamento com os produtos e valor total
        setOrcamento(prev => ({
          ...prev,
          valor_total: valorTotal,
          itens: itens
        }));
        
        // Produtos carregados com sucesso
      } else {
        // Nenhum produto encontrado para a solicitação
        setSelectedProducts([]);
      }
    } catch (error) {
      // Erro ao carregar produtos da solicitação
      setSelectedProducts([]);
      // Em caso de erro, manter estrutura vazia mas válida
      setOrcamento(prev => ({
        ...prev,
        itens: []
      }));
    }
  };

  const addItem = () => {
    const newItem: OrcamentoItem = {
      produto_id: 0,
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto_percentual: 0,
      valor_total: 0,
      ordem: orcamento.itens.length + 1
    };

    setOrcamento({
      ...orcamento,
      itens: [...orcamento.itens, newItem]
    });
  };

  const removeItem = (itemIndex: number) => {
    const updatedItens = [...orcamento.itens];
    updatedItens.splice(itemIndex, 1);
    
    // Reordenar itens
    updatedItens.forEach((item, index) => {
      item.ordem = index + 1;
    });
    
    setOrcamento({
      ...orcamento,
      itens: updatedItens
    });
  };

  const updateItem = (itemIndex: number, field: keyof OrcamentoItem, value: string | number) => {
    const updatedItens = [...orcamento.itens];
    const item = updatedItens[itemIndex];
    
    (item as any)[field] = value;
    
    // Se mudou o produto, atualizar preço e descrição
    if (field === 'produto_id') {
      const produto = produtos.find(p => p.id === value);
      if (produto) {
        item.valor_unitario = produto.preco_venda;
        item.descricao = produto.produto_name;
        item.produto = produto;
      }
    }
    
    // Recalcular valor total do item
    item.valor_total = item.quantidade * item.valor_unitario * (1 - item.desconto_percentual / 100);
    
    setOrcamento({
      ...orcamento,
      itens: updatedItens
    });
  };

  // Removidas funções addVersion e setActiveVersion - não mais necessárias com estrutura simplificada

  const calculateTotal = () => {
    return orcamento.itens.reduce((total, item) => total + item.valor_total, 0);
  };

  // Função helper para validar e limitar valores DECIMAL(10,2)
  const validateDecimalValue = (value: any, fieldName: string = 'campo'): number | null => {
    // Se o valor é null, undefined ou string vazia, retornar null
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Converter para número se for string
    let numValue: number;
    if (typeof value === 'string') {
      // Remover caracteres não numéricos exceto ponto e vírgula
      const cleanValue = value.replace(/[^\d.,-]/g, '').replace(',', '.');
      numValue = parseFloat(cleanValue);
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
      console.warn(`Valor inválido para ${fieldName}:`, value);
      return null;
    }
    
    // Verificar se é um número válido
    if (isNaN(numValue) || !isFinite(numValue)) {
      console.warn(`Valor não numérico para ${fieldName}:`, value);
      return null;
    }
    
    // Limite máximo para DECIMAL(10,2): 99.999.999,99
    const MAX_DECIMAL_VALUE = 99999999.99;
    
    // Se o valor excede o limite, logar e limitar
    if (Math.abs(numValue) > MAX_DECIMAL_VALUE) {
      console.warn(`Valor ${numValue} para ${fieldName} excede o limite DECIMAL(10,2). Limitando para ${MAX_DECIMAL_VALUE}`);
      return numValue > 0 ? MAX_DECIMAL_VALUE : -MAX_DECIMAL_VALUE;
    }
    
    // Arredondar para 2 casas decimais
    return Math.round(numValue * 100) / 100;
  };

  // FUNÇÃO ESPECÍFICA PARA CAPTURA DE IMAGEM DE VARIAÇÃO
  const captureVariationImage = (product: any, context: string = ''): string | null => {
    console.log(`🎯 CAPTURA DE IMAGEM DE VARIAÇÃO${context ? ` - ${context}` : ''}:`, {
      productId: product.id,
      productName: product.name || product.titulo,
      selectedVariationImage: product.selectedVariationImage,
      color: product.color
    });

    // PRIORIDADE 1: Imagem selecionada pelo usuário (selectedVariationImage)
    if (product.selectedVariationImage) {
      console.log(`✅ CAPTURADA - selectedVariationImage: ${product.selectedVariationImage}`);
      return product.selectedVariationImage;
    }

    // PRIORIDADE 2: Buscar na cor selecionada no JSON variacoes
    if (product.color && product.variacoes) {
      try {
        const variacoes = Array.isArray(product.variacoes) 
          ? product.variacoes 
          : JSON.parse(product.variacoes || '[]');
        
        const wanted = String(product.color).trim().toLowerCase();
        const corEncontrada = variacoes.find((v: any) => 
          String(v?.cor || '').trim().toLowerCase() === wanted
        );
        
        if (corEncontrada) {
          const imageUrl = corEncontrada.link_image || corEncontrada.imagem || null;
          if (imageUrl) {
            console.log(`✅ CAPTURADA - imagem da cor selecionada: ${imageUrl}`);
            return imageUrl;
          }
        }
      } catch (error) {
        console.warn('Erro ao processar variações para captura de imagem:', error);
      }
    }

    // PRIORIDADE 3: Fallback para imagem principal
    const fallbackImage = product?.img_0 || product?.img_1 || product?.img_2 || null;
    
    if (fallbackImage) {
      console.log(`⚠️ FALLBACK - usando imagem principal: ${fallbackImage}`);
      return fallbackImage;
    }

    console.log(`❌ NENHUMA IMAGEM CAPTURADA para produto ${product.id}`);
    return null;
  };

  // Função para salvar informações detalhadas dos produtos
  const salvarInformacoesProdutos = async (solicitacaoId: number, produtos: any[]) => {
    try {
      console.log('🔄 INICIANDO SALVAMENTO ROBUSTO DE PRODUTOS...');
      console.log('Produtos para processar:', produtos.length);
      
      // PRIMEIRO: Remover produtos existentes para evitar duplicação
      console.log('Removendo produtos existentes para evitar duplicação...');
      const { error: deleteError } = await supabase
        .from('products_solicitacao')
        .delete()
        .eq('solicitacao_id', solicitacaoId);

      if (deleteError) {
        console.error('Erro ao remover produtos existentes:', deleteError);
        // Não falhar aqui, apenas logar o erro
      }

      const produtosParaInserir: any[] = [];

      produtos.forEach((product, index) => {
        console.log(`\n🔍 PROCESSANDO PRODUTO ${index + 1}/${produtos.length}:`);
        console.log('Dados do produto:', {
          id: product.id,
          name: product.name || product.titulo,
          color: product.color,
          selectedVariationImage: product.selectedVariationImage,
          hasVariacoes: !!product.variacoes,
          hasOriginalData: !!product.originalData
        });

        // CAPTURA ROBUSTA DE IMAGEM DE VARIAÇÃO
        const imagemVariacaoCapturada = captureVariationImage(product, `Produto ${index + 1}`);
        console.log(`Processando produto ${index + 1}:`, {
          codigo: product.codigo,
          id: product.id,
          color: product.color,
          quantity1: product.quantity1,
          quantity2: product.quantity2,
          quantity3: product.quantity3,
          preco1: product.preco1,
          preco2: product.preco2,
          preco3: product.preco3
        });

        // Usar 'codigo' como chave estrangeira (chave primária da tabela ecologic_products_site)
        let productsId = null;
        if (product.codigo && product.codigo.toString().trim() !== '') {
          productsId = product.codigo.toString();
        } else if (product.reference && product.reference.toString().trim() !== '') {
          productsId = product.reference.toString();
        } else if (product.id && product.id.toString().trim() !== '') {
          productsId = product.id.toString();
        }

        // Obter informações da cor/variação selecionada
        let corSelecionada = null;
        let imagemCorSelecionada = null;
        
        // PRIORIZAR selectedVariationImage do estado atual do produto
        if (product.selectedVariationImage) {
          imagemCorSelecionada = product.selectedVariationImage;
          console.log('🎯 Usando selectedVariationImage do estado:', imagemCorSelecionada);
        }
        
        if (product.color && product.variacoes) {
          const variacoes = safeParse(product.variacoes);
          if (variacoes && Array.isArray(variacoes)) {
            const variacaoEncontrada = variacoes.find(v => 
              norm(v.cor) === norm(product.color) || 
              norm(v.nome) === norm(product.color)
            );
            
            if (variacaoEncontrada) {
              corSelecionada = {
                cor: variacaoEncontrada.cor || variacaoEncontrada.nome,
                nome: variacaoEncontrada.nome || variacaoEncontrada.cor,
                codigo: variacaoEncontrada.codigo,
                imagem: variacaoEncontrada.imagem
              };
              
              // Se não temos selectedVariationImage, usar a imagem da variação encontrada
              if (!imagemCorSelecionada) {
                imagemCorSelecionada = variacaoEncontrada.imagem;
              }
            }
          }
        }

        // SINCRONIZAÇÃO: Usar a MESMA lógica da função getImageForColor de OrcamentoDetalhes.tsx
        const getImageForColorSync = (product: any) => {
          console.log('🎯 getImageForColorSync - Produto:', product.name || product.titulo, {
            cor_selecionada: corSelecionada,
            imagem_variacao: imagemCorSelecionada,
            color: product.color,
            selectedVariationImage: product.selectedVariationImage,
            variacoes: product.variacoes
          });

          // PRIORIDADE 0: Usar captureVariationImage primeiro
          const capturedImage = captureVariationImage(product, 'getImageForColorSync');
          if (capturedImage) {
            console.log('✅ Usando imagem capturada:', capturedImage);
            return capturedImage;
          }

          // PRIORIDADE 1: imagem_variacao (salva diretamente no banco)
          if (imagemCorSelecionada) {
            console.log('✅ Usando imagem_variacao:', imagemCorSelecionada);
            return imagemCorSelecionada;
          }

          // PRIORIDADE 2: cor_selecionada.imagem (formato JSON estruturado)
          if (corSelecionada && corSelecionada.imagem) {
            console.log('✅ Usando cor_selecionada.imagem:', corSelecionada.imagem);
            return corSelecionada.imagem;
          }

          // Normalizar cor para busca - PRIORIZAR a cor do estado atual
          const corParaUsar = product.color;

          // PRIORIDADE 3: busca nas variações do produto usando a cor atual
          if (product.variacoes && corParaUsar) {
            const variacoes = safeParse(product.variacoes);
            
            // Procurar pela variação correspondente à cor selecionada
            if (Array.isArray(variacoes)) {
              const variacaoCorrespondente = variacoes.find((v: any) => 
                v.cor && v.cor.toLowerCase().trim() === corParaUsar.toLowerCase().trim()
              );
              
              if (variacaoCorrespondente && variacaoCorrespondente.imagem) {
                console.log('✅ Usando imagem das variações para cor atual:', variacaoCorrespondente.imagem);
                return variacaoCorrespondente.imagem;
              }
            }
          }

          // PRIORIDADE 4: mapeamento estático expandido
          const productData = product?.originalData?.ecologic_products_site || product?.originalData || product;
          const colorImageMap: { [key: string]: string } = {
            'verde escuro': productData?.img_0 || product.img_0 || '',
            'marrom': productData?.img_1 || product.img_1 || '',
            'preto': productData?.img_2 || product.img_2 || '',
            'azul': productData?.img_0 || product.img_0 || '',
            'vermelho': productData?.img_1 || product.img_1 || '',
            'branco': productData?.img_2 || product.img_2 || '',
            'inox': productData?.img_0 || product.img_0 || '',
            'rosa': productData?.img_1 || product.img_1 || '',
            'amarelo': productData?.img_0 || product.img_0 || '',
            'cinza': productData?.img_1 || product.img_1 || '',
            'transparente': productData?.img_0 || product.img_0 || '',
            // Adicionar variações comuns
            'red': productData?.img_1 || product.img_1 || '',
            'blue': productData?.img_0 || product.img_0 || '',
            'black': productData?.img_2 || product.img_2 || '',
            'white': productData?.img_2 || product.img_2 || '',
            'green': productData?.img_0 || product.img_0 || '',
            'yellow': productData?.img_0 || product.img_0 || '',
            'gray': productData?.img_1 || product.img_1 || '',
            'grey': productData?.img_1 || product.img_1 || ''
          };

          // Tentar encontrar a imagem específica da cor no mapeamento estático
          if (corParaUsar) {
            const corNormalizadaParaBusca = corParaUsar.toLowerCase().trim();
            const imagemCor = colorImageMap[corNormalizadaParaBusca];
            
            if (imagemCor) {
              console.log('✅ Usando mapeamento estático para cor atual:', imagemCor);
              return imagemCor;
            }
          }

          // PRIORIDADE 5: fallback inteligente
          const fallbackImage = productData?.img_0 || productData?.img_1 || productData?.img_2 || 
                               product.img_0 || product.img_1 || product.img_2;
          console.log('⚠️ Usando fallback:', fallbackImage);
          return fallbackImage;
        };

        const finalImageSrc = getValidImageUrl(getImageForColorSync(product) || '/placeholder-product.svg');
        
        console.log(`🔍 ANÁLISE DETALHADA - Produto ${index + 1}:`, {
          productId: product.id,
          productName: product.name || product.titulo,
          color: product.color,
          selectedVariationImage: product.selectedVariationImage,
          imagemCorSelecionada,
          finalImageSrc,
          variacoes: product.variacoes ? 'Tem variações' : 'Sem variações',
          originalData: product.originalData ? 'Tem originalData' : 'Sem originalData',
          // ANÁLISE CRÍTICA: Verificar se a imagem selecionada está sendo capturada
          imagemCapturadaCorreta: product.selectedVariationImage === imagemCorSelecionada,
          prioridadeImagem: product.selectedVariationImage ? 'selectedVariationImage' : 
                           imagemCorSelecionada ? 'imagemCorSelecionada' : 
                           'fallback'
        });
        
        // Validar e limitar todos os campos numéricos DECIMAL(10,2)
        const custoValidado = validateDecimalValue(product.custo, `custo do produto ${index + 1}`);
        const precoUnitarioValidado = validateDecimalValue(product.preco_unitario, `preco_unitario do produto ${index + 1}`);
        const valorUnitarioValidado = validateDecimalValue(product.valor_unitario, `valor_unitario do produto ${index + 1}`);
        
        // CORREÇÃO: Mapear preco1, preco2, preco3 para valor_qtd01, valor_qtd02, valor_qtd03
        // Calcular PREÇO UNIT ajustado (fornecedor × fator × personalização) para cada faixa
        const q1 = product.quantity1 || 0;
        const q2 = product.quantity2 || 0;
        const q3 = product.quantity3 || 0;
        const base1 = typeof product.fator1 === 'number' ? product.fator1 : (product.tabelaFator1 ? obterFatorPorQuantidade(product.tabelaFator1, q1) : 1);
        const base2 = typeof product.fator2 === 'number' ? product.fator2 : (product.tabelaFator2 ? obterFatorPorQuantidade(product.tabelaFator2, q2) : 1);
        const base3 = typeof product.fator3 === 'number' ? product.fator3 : (product.tabelaFator3 ? obterFatorPorQuantidade(product.tabelaFator3, q3) : 1);
        const valPers1 = obterValorPersonalizacao(product.personalizacao, q1) || 0;
        const valPers2 = obterValorPersonalizacao(product.personalizacao, q2) || 0;
        const valPers3 = obterValorPersonalizacao(product.personalizacao, q3) || 0;
        const freteUnit1 = q1 > 0 && (product.frete1 || 0) > 0 ? Math.max((product.frete1 || 0) / q1, 0.01) : 0;
        const freteUnit2 = q2 > 0 && (product.frete2 || 0) > 0 ? Math.max((product.frete2 || 0) / q2, 0.01) : 0;
        const freteUnit3 = q3 > 0 && (product.frete3 || 0) > 0 ? Math.max((product.frete3 || 0) / q3, 0.01) : 0;
        const valorQtd01 = validateDecimalValue(((product.preco1 || 0) * (base1 || 1)) + valPers1 + freteUnit1, `valor_qtd01 do produto ${index + 1}`);
        const valorQtd02 = validateDecimalValue(((product.preco2 || 0) * (base2 || 1)) + valPers2 + freteUnit2, `valor_qtd02 do produto ${index + 1}`);
        const valorQtd03 = validateDecimalValue(((product.preco3 || 0) * (base3 || 1)) + valPers3 + freteUnit3, `valor_qtd03 do produto ${index + 1}`);
        
        // Criar uma linha separada para cada produto (mesmo produto com cores diferentes = linhas distintas)
        // Cada produto será salvo com suas quantidades e preços nas respectivas colunas
        const produtoProcessado = {
          solicitacao_id: solicitacaoId,
          products_id: productsId,
          products_quantidade_01: product.quantity1 || 0,
          products_quantidade_02: product.quantity2 || 0,
          products_quantidade_03: product.quantity3 || 0,
          color: product.color || null,
          customizations: product.observations || null,
          gravacao: product.gravacao || null,
          personalizacao: product.personalizacao || null,
          info: product.info || null,
          custo: custoValidado,
          preco_unitario: precoUnitarioValidado,
          valor_unitario: valorUnitarioValidado,
          observacoes: product.observacoes || null,
          fator: product.fator || 1.0,
          // CORREÇÃO: Salvar nos campos corretos
          valor_qtd01: valorQtd01,
          valor_qtd02: valorQtd02,
          valor_qtd03: valorQtd03,
          // Persistir nomes das tabelas de fator para referência futura
          tabelafator1: typeof product.fator1 === 'number' ? product.fator1 : (parseFloat(String(product.fator1)) || null),
          tabelafator2: typeof product.fator2 === 'number' ? product.fator2 : (parseFloat(String(product.fator2)) || null),
          tabelafator3: typeof product.fator3 === 'number' ? product.fator3 : (parseFloat(String(product.fator3)) || null),
          // Salvar cor_selecionada como JSON estruturado para manter todas as informações
          cor_selecionada: corSelecionada ? JSON.stringify(corSelecionada) : (product.color || null),
          imagem_variacao: imagemCorSelecionada || null,
          // CORREÇÃO: Salvar a URL da imagem CORRETA que está sendo exibida
          img_ref_url: finalImageSrc !== '/placeholder-product.svg' ? finalImageSrc : null,
          // CORREÇÃO CRÍTICA: Usar a função robusta de captura de imagem
          imagem_variacao_capturada: imagemVariacaoCapturada
        };

        console.log(`🔍 Produto ${index + 1} processado para inserção:`, {
          products_id: produtoProcessado.products_id,
          color: produtoProcessado.color,
          products_quantidade_01: produtoProcessado.products_quantidade_01,
          products_quantidade_02: produtoProcessado.products_quantidade_02,
          products_quantidade_03: produtoProcessado.products_quantidade_03,
          valor_qtd01: produtoProcessado.valor_qtd01,
          valor_qtd02: produtoProcessado.valor_qtd02,
          valor_qtd03: produtoProcessado.valor_qtd03,
          img_ref_url: produtoProcessado.img_ref_url,
          // CAMPOS CRÍTICOS PARA IMAGEM
          imagem_variacao: produtoProcessado.imagem_variacao,
          imagem_variacao_capturada: produtoProcessado.imagem_variacao_capturada,
          cor_selecionada: produtoProcessado.cor_selecionada,
          // VERIFICAÇÃO: A imagem capturada é a mesma que o usuário selecionou?
          imagemCorretaCapturada: imagemVariacaoCapturada === product.selectedVariationImage,
          // VALIDAÇÃO ADICIONAL: Verificar se a captura foi bem-sucedida
          capturaValida: !!imagemVariacaoCapturada
        });

        produtosParaInserir.push(produtoProcessado);
      });

      console.log('Inserindo produtos validados:', produtosParaInserir.length);

      const { error: insertProductsError } = await supabase
        .from('products_solicitacao')
        .insert(produtosParaInserir);

      if (insertProductsError) {
        console.error('Erro ao salvar produtos:', insertProductsError);
        toast.error('Orçamento criado, mas houve erro ao salvar os produtos');
        throw insertProductsError;
      }

      console.log('Produtos salvos com informações detalhadas:', produtosParaInserir.length);
    } catch (error) {
      console.error('Erro na função salvarInformacoesProdutos:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o orçamento já foi gerado
    if (orcamento.status === 'Orçamento Enviado' || isViewOnly) {
      toast.error('Este orçamento já foi gerado e não pode ser editado.');
      return;
    }
    
    setLoading(true);

    try {
      // Verificar permissões
      if (isConsultor && !consultorData) {
        toast.error('Dados do consultor não encontrados');
        return;
      }

      // Validar campos obrigatórios
      if (!orcamento.cliente_id || orcamento.cliente_id.trim() === '') {
        toast.error('Por favor, selecione um cliente');
        return;
      }

      if (!representante || !representante.id) {
        toast.error('Por favor, selecione um representante');
        return;
      }

      const orcamentoData = {
        ...orcamento,
        valor_total: calculateTotal()
      };

      // Preparar dados para inserção
      const insertData: any = {
        user_id: orcamentoData.cliente_id,
        status: 'Orçamento Gerado', // Status atualizado para 'Orçamento Gerado'
        status_old: 'Orçamento', // Status anterior no fluxo
        solicitacao_observacao: orcamentoData.observacoes,
        valor_total_estimado: orcamentoData.valor_total,
        validade_proposta: orcamentoData.validade_proposta,
        prazo_entrega: orcamentoData.prazo_entrega,
        forma_pagamento: orcamentoData.forma_pagamento,
        opcao_frete: orcamentoData.opcao_frete,
        local_entrega: orcamentoData.local_entrega,
        local_cobranca: orcamentoData.local_cobranca
      };

      // Atribuir consultor baseado no representante selecionado
      if (representante && representante.id) {
        insertData.consultor_id = representante.id;
      } else if (isConsultor && consultorData) {
        // Fallback: se for consultor, usar seus próprios dados
        insertData.consultor_id = consultorData.id;
      }

      // Validar e limpar campos UUID para evitar erro de sintaxe
      if (insertData.user_id && insertData.user_id.trim() === '') {
        insertData.user_id = null;
      }
      if (insertData.consultor_id && insertData.consultor_id.toString().trim() === '') {
        insertData.consultor_id = null;
      }

      // Criar novo orçamento na tabela solicitacao_orcamentos
      const { data: newOrcamento, error: orcamentoError } = await supabase
        .from('solicitacao_orcamentos')
        .insert(insertData)
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      console.log('Novo orçamento criado com sucesso:', newOrcamento);
      
      // Salvar produtos selecionados na tabela products_solicitacao
      if (selectedProducts && selectedProducts.length > 0) {
        await salvarInformacoesProdutos(newOrcamento.solicitacao_id, selectedProducts);
      }
      
      toast.success('Orçamento criado com sucesso!');
      
      // Tornar o formulário apenas visualizável
      setIsViewOnly(true);
      
      // Retornar o orçamento criado para que o botão "Gerar orçamento" possa acessar o ID
      return { id: newOrcamento.solicitacao_id, ...newOrcamento };
      
    } catch (error) {
      toast.error('Erro ao salvar orçamento');
      throw error; // Re-throw para que o botão "Gerar orçamento" possa capturar o erro
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar dados sem alterar status (para o botão Salvar)
  const handleSave = async () => {
    if (orcamento.status === 'Orçamento Enviado' || isViewOnly) {
      toast.error('Este orçamento já foi gerado e não pode ser editado.');
      return;
    }

    setUpdating(true);

    try {
      if (isConsultor && !consultorData) {
        toast.error('Dados do consultor não encontrados');
        return;
      }

      // Validar campos obrigatórios
      if (!orcamento.cliente_id || orcamento.cliente_id.trim() === '') {
        toast.error('Por favor, selecione um cliente');
        setUpdating(false);
        return;
      }

      if (!representante || !representante.id) {
        toast.error('Por favor, selecione um representante');
        setUpdating(false);
        return;
      }

      const orcamentoData = {
        ...orcamento,
        valor_total: calculateTotal()
      };

      // Preparar dados para atualização sem alterar status
      const updateData: any = {
        user_id: orcamentoData.cliente_id,
        solicitacao_observacao: orcamentoData.observacoes,
        valor_total_estimado: orcamentoData.valor_total,
        validade_proposta: orcamentoData.validade_proposta,
        prazo_entrega: orcamentoData.prazo_entrega,
        forma_pagamento: orcamentoData.forma_pagamento,
        opcao_frete: orcamentoData.opcao_frete,
        local_entrega: orcamentoData.local_entrega,
        local_cobranca: orcamentoData.local_cobranca
      };

      // Salvar consultor_id baseado no representante selecionado ou consultor logado
      if (representante && representante.id) {
        updateData.consultor_id = representante.id;
      } else if (isConsultor && consultorData) {
        updateData.consultor_id = consultorData.id;
      }

      if (isEditing) {
        // Atualizar orçamento existente
        const { error: orcamentoError } = await supabase
          .from('solicitacao_orcamentos')
          .update(updateData)
          .eq('solicitacao_id', id);

        if (orcamentoError) {
          throw orcamentoError;
        }

        // Salvar produtos atualizados se existirem
        if (selectedProducts && selectedProducts.length > 0) {
          await salvarInformacoesProdutos(parseInt(id), selectedProducts);
        }
      } else {
        // Criar novo orçamento como rascunho
        const insertData = {
          ...updateData,
          status: 'Orçamento Solicitado'
        };

        const { data: newOrcamento, error: orcamentoError } = await supabase
          .from('solicitacao_orcamentos')
          .insert(insertData)
          .select()
          .single();

        if (orcamentoError) throw orcamentoError;

        // Atualizar o estado com o novo ID
        setOrcamento(prev => ({ ...prev, id: newOrcamento.solicitacao_id }));
        
        // Salvar produtos se existirem
        if (selectedProducts && selectedProducts.length > 0) {
          await salvarInformacoesProdutos(newOrcamento.solicitacao_id, selectedProducts);
        }
      }

      toast.success('Dados salvos com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar dados');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o orçamento já foi gerado
    if (orcamento.status === 'Orçamento Enviado' || isViewOnly) {
      toast.error('Este orçamento já foi gerado e não pode ser editado.');
      return;
    }
    
    // Verificar se já foi editado uma vez
    if (hasBeenEdited) {
      toast.error('Este orçamento já foi editado. Não é possível editar novamente.');
      return;
    }
    
    setUpdating(true);

    try {
      // Verificar permissões
      if (isConsultor && !consultorData) {
        toast.error('Dados do consultor não encontrados');
        return;
      }


      
      const orcamentoData = {
        ...orcamento,
        valor_total: calculateTotal()
      };

      // Preparar dados para atualização
      const updateData: any = {
        user_id: orcamentoData.cliente_id,
        status: 'Orçamento', // Status atual no fluxo
        status_old: 'Solicitação de orçamento', // Status anterior no fluxo
        solicitacao_observacao: orcamentoData.observacoes,
        valor_total_estimado: orcamentoData.valor_total,
        validade_proposta: orcamentoData.validade_proposta,
        prazo_entrega: orcamentoData.prazo_entrega,
        forma_pagamento: orcamentoData.forma_pagamento,
        opcao_frete: orcamentoData.opcao_frete,
        local_entrega: orcamentoData.local_entrega,
        local_cobranca: orcamentoData.local_cobranca
      };

      // Salvar consultor_id baseado no representante selecionado ou consultor logado
      if (representante && representante.id) {
        updateData.consultor_id = representante.id;
      } else if (isConsultor && consultorData) {
        updateData.consultor_id = consultorData.id;
      }

      // Atualizar orçamento existente na tabela solicitacao_orcamentos
      const { error: orcamentoError } = await supabase
        .from('solicitacao_orcamentos')
        .update(updateData)
        .eq('solicitacao_id', id);

      if (orcamentoError) {
        alert('Erro ao atualizar orçamento: ' + orcamentoError.message);
        throw orcamentoError;
      }

      // Verificar se existe um orçamento na tabela solicitacao_orcamentos
      let orcamentoId = null;
      const { data: existingOrcamento, error: checkError } = await supabase
        .from('solicitacao_orcamentos')
        .select('solicitacao_id')
        .eq('solicitacao_id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingOrcamento) {
        orcamentoId = existingOrcamento.solicitacao_id;
      } else {
        // Usar o ID da solicitação atual como orcamentoId
        orcamentoId = id;
      }

      // Remover produtos existentes da solicitação
      const { error: deleteProductsError } = await supabase
        .from('products_solicitacao')
        .delete()
        .eq('solicitacao_id', orcamentoId);

      if (deleteProductsError) {
        console.error('Erro ao remover produtos existentes:', deleteProductsError);
        throw deleteProductsError;
      }

      // Salvar produtos selecionados na tabela products_solicitacao
      if (selectedProducts && selectedProducts.length > 0) {
        const produtosParaInserir = selectedProducts.map((product) => {
          // Usar 'codigo' como chave estrangeira (chave primária da tabela ecologic_products_site)
          let productsId = null;
          if (product.codigo && product.codigo.toString().trim() !== '') {
            productsId = product.codigo.toString();
          } else if (product.reference && product.reference.toString().trim() !== '') {
            productsId = product.reference.toString();
          } else if (product.id && product.id.toString().trim() !== '') {
            productsId = product.id.toString();
          }
          
          return {
            solicitacao_id: orcamentoId,
            products_id: productsId,
            products_quantidade_01: product.quantity1 || 0,
            products_quantidade_02: product.quantity2 || 0,
            products_quantidade_03: product.quantity3 || 0,
            color: product.color || null,
            customizations: product.observations || null,
            gravacao: product.gravacao || null,
            personalizacao: product.personalizacao || null,
            info: product.info || null,
            custo: product.custo || null,
            preco_unitario: product.preco_unitario || null,
            valor_unitario: product.valor_unitario || null,
            observacoes: product.observacoes || null,
            fator: product.fator || 1.0,
            valor_qtd01: product.preco1 || null,
            valor_qtd02: product.preco2 || null,
            valor_qtd03: product.preco3 || null
          };
        });

        const { error: insertProductsError } = await supabase
          .from('products_solicitacao')
          .insert(produtosParaInserir);

        if (insertProductsError) {
          console.error('Erro ao inserir produtos da solicitação:', insertProductsError);
          throw insertProductsError;
        }

        console.log(`${produtosParaInserir.length} produtos inseridos com sucesso`);
      }

      // Marcar como editado para impedir futuras edições
      setHasBeenEdited(true);
      
      console.log('Orçamento atualizado com sucesso');
      toast.success('Orçamento atualizado com sucesso!');
      navigate('/orcamentos');
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      toast.error('Erro ao atualizar orçamento: ' + (error.message || error));
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para buscar produtos (sistema do NovoEditor2)
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const normalizedTerm = norm(term);
      
      // Buscar APENAS por título ou código/referência/ID
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('*')
        .or(`titulo.ilike.%${term}%,codigo.ilike.%${term}%,id.eq.${parseInt(term) || 0}`)
        .limit(20);

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao buscar produtos');
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      // Filtrar e normalizar resultados - APENAS título ou código/ID
      const filteredResults = data?.filter(product => {
        const normalizedTitle = norm(product.titulo);
        const normalizedCode = norm(product.codigo);
        return normalizedTitle.includes(normalizedTerm) || 
               normalizedCode.includes(normalizedTerm) ||
               product.id.toString() === term;
      }) || [];

      // Mapear para o formato esperado
      const results = filteredResults.map(product => ({
        id: product.id,
        name: product.titulo || product.descricao || `Produto ${product.id}`,
        description: product.descricao || '',
        reference: product.codigo || product.id.toString(),
        category: product.categoria || '',
        image: product.img_0 || null,
        source: 'ecologic_products_site',
        originalData: product,
        // Incluir dados necessários para variações
        variacoes: product.variacoes
      }));

      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar produtos');
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para a busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Sincronização automática entre selectedProducts e versão ativa do orçamento
  useEffect(() => {
    if (selectedProducts.length === 0) return;

    const syncOrcamentoWithProducts = () => {
      const itens = selectedProducts.map((product, index) => {
        const quantidade1 = product.quantity || 0;
        const quantidade2 = product.quantity2 || 0;
        const quantidadeTotal = quantidade1 + quantidade2;

        // Calcular preço total e valor total
        const preco1 = product.price || 0;
        const preco2 = product.preco2 || 0;
        const valorTotalProduto = (quantidade1 * preco1) + (quantidade2 * preco2);

        
        return {
          ...product,
          item_orcamento_id: product.item_orcamento_id || `new-${index}`,
          produto_id: product.id,
          quantidade: quantidadeTotal,
          valor_unitario: preco1, // Usar preco1 como valor unitário principal
          valor_total: valorTotalProduto,
          // Manter os campos adicionais para consistência
          quantity1: quantidade1,
          quantity2: quantidade2,
          preco1: preco1,
          preco2: preco2,
          observacoes: product.observations || product.observacoes || ''
        };
      });

      setOrcamento(prevOrcamento => ({
        ...prevOrcamento,
        itens: itens,
        valor_total: itens.reduce((total, item) => total + item.valor_total, 0)
      }));
    };

    syncOrcamentoWithProducts();

  }, [selectedProducts]);

  // Função para selecionar um produto (sistema do NovoEditor2)
  const selectProduct = (product: any) => {
    // Obter variações do produto para determinar a cor padrão
    const getProductVariations = (product: any) => {
      const variacoesData = product.variacoes || product.originalData?.variacoes;
      
      if (!variacoesData) return [];

      let variacoes = variacoesData;
      if (typeof variacoes === 'string') {
        try {
          variacoes = JSON.parse(variacoes);
        } catch (error) {
          console.error('Error parsing variations:', error);
          return [];
        }
      }

      return Array.isArray(variacoes) ? variacoes : [];
    };

    const variations = getProductVariations(product);
    const defaultColor = variations.length > 0 ? variations[0].cor : '';

    // Verificar se o produto com a mesma cor já foi adicionado
    const existsWithSameColor = selectedProducts.some(p => {
      const isSameProduct = p.id === product.id;
      const isSameColor = (p.color || '').toLowerCase() === (defaultColor || '').toLowerCase();
      return isSameProduct && isSameColor;
    });

    if (existsWithSameColor) {
      toast.warning(`Produto "${product.name}" com a cor "${defaultColor}" já foi adicionado ao orçamento`);
      return;
    }

    // Verificar se o produto já existe com outra cor
    const existsWithDifferentColor = selectedProducts.some(p => {
      const isSameProduct = p.id === product.id;
      const isDifferentColor = (p.color || '').toLowerCase() !== (defaultColor || '').toLowerCase();
      return isSameProduct && isDifferentColor;
    });

    if (existsWithDifferentColor) {
      // Permitir adicionar o mesmo produto com cor diferente
      console.log(`✅ Permitindo adicionar produto ${product.name} com cor diferente: ${defaultColor}`);
    }

    // Usar as variações já obtidas anteriormente

    const newProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      reference: product.reference,
      category: product.category,
      color: defaultColor,
      observations: '',
      quantity1: 1,
      quantity2: 0,
      quantity3: 0,
      image: product.image || null,
      source: product.source,
      originalData: product.originalData,
      // Incluir variações para seleção de cores
      variacoes: product.variacoes || product.originalData?.variacoes,
      // Novos campos
      custo: 0,
      personalizacao: '',
      gravacao: '',
      info: '',
      fator: 1.0,
      preco: 0
    };

    setSelectedProducts(prev => [...prev, newProduct]);
    setSearchTerm('');
    setShowDropdown(false);
    setSearchResults([]);
    toast.success('Produto adicionado ao orçamento');
  };

  // Função para remover produto selecionado
  const removeSelectedProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Função para buscar clientes
  const searchClients = async (term: string) => {
    if (!term || term.length < 2) {
      setClientSearchResults([]);
      setShowClientDropdown(false);
      return;
    }

    setIsSearchingClients(true);
    try {
      const { data, error } = await supabase
        .from('usuarios_clientes')
        .select('id, nome, email, telefone, empresa, cnpj, endereco, consultor_id')
        .ilike('email', `%${term}%`)
        .order('nome')
        .limit(10);

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        setClientSearchResults([]);
      } else {
        setClientSearchResults(data || []);
        setShowClientDropdown(true);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientSearchResults([]);
    } finally {
      setIsSearchingClients(false);
    }
  };

  // Debounce para a busca de clientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(clientSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);

  // Função para selecionar um cliente
  const selectClient = async (client: any) => {
    try {
      // Verificar se o cliente pertence ao representante selecionado
      if (!representante) {
        setClientSearchMessage('Por favor, selecione um representante primeiro.');
        setTimeout(() => setClientSearchMessage(''), 3000);
        return;
      }

      // Verificar relacionamento cliente-consultor
      if (client.consultor_id && String(client.consultor_id) !== String(representante.id)) {
        // Buscar o nome do consultor responsável pelo cliente
        const { data: consultorData, error: consultorError } = await supabase
          .from('consultores')
          .select('nome')
          .eq('id', client.consultor_id)
          .single();

        const nomeConsultor = consultorData?.nome || 'Consultor desconhecido';
        setClientSearchMessage(`Este cliente está cadastrado com outro consultor: ${nomeConsultor}. Não é possível selecioná-lo.`);
        setTimeout(() => setClientSearchMessage(''), 5000);
        return;
      }

      // Se o cliente não tem consultor_id, associar ao representante atual
      if (!client.consultor_id) {
        const { error } = await supabase
          .from('usuarios_clientes')
          .update({ consultor_id: representante.id })
          .eq('id', client.id);

        if (error) {
          console.error('Erro ao associar cliente ao consultor:', error);
          setClientSearchMessage('Erro ao associar cliente ao representante.');
          setTimeout(() => setClientSearchMessage(''), 3000);
          return;
        }
      }

      // Preencher dados do cliente
      setClienteSelecionado({
        id: client.id,
        nome: client.nome,
        email: client.email,
        telefone: client.telefone,
        empresa: client.empresa,
        cnpj: client.cnpj,
        endereco: client.endereco
      });

      // Atualizar o orçamento com o cliente selecionado
      setOrcamento(prev => ({
        ...prev,
        cliente_id: client.id
      }));

      // Limpar busca e mostrar mensagem de sucesso
      setClientSearchTerm('');
      setShowClientDropdown(false);
      setClientSearchResults([]);
      setClientSearchMessage('Cliente selecionado com sucesso!');
      setTimeout(() => setClientSearchMessage(''), 3000);

    } catch (error) {
      console.error('Erro ao selecionar cliente:', error);
      setClientSearchMessage('Erro ao selecionar cliente.');
      setTimeout(() => setClientSearchMessage(''), 3000);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Removido activeVersion - não mais necessário com estrutura simplificada

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 print-container">
      {/* Cabeçalho para impressão */}
      <div className="print-header hidden print:block">
        <h1>ORÇAMENTO</h1>
        <div className="company-info">
          <p><strong>NB Admin</strong></p>
          <p>Sistema de Gestão de Orçamentos</p>
          <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
          {orcamento?.id && <p>Orçamento #{orcamento.id}</p>}
        </div>
      </div>
      
      {/* Cabeçalho do Orçamento */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          {/* Botão Voltar */}
          <div className="flex items-center justify-between mb-6 no-print">
            <button
              onClick={() => navigate('/orcamentos')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Voltar
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Orçamento #{orcamento?.id || 'Novo'}</h1>

          </div>

          {/* Container principal com maior amplitude */}
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={orcamento.status}
                onChange={(e) => setOrcamento({ ...orcamento, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Orçamento Solicitado">Orçamento Solicitado</option>
                <option value="Orçamento Gerado">Orçamento Gerado</option>
                <option value="Orçamento Aprovado">Orçamento Aprovado</option>
              </select>
            </div>

            {/* Dados do Cliente e Representante - Layout lado a lado */}
            <div className="flex gap-6 mb-6 print-client-info">
              {/* Dados do Cliente */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Dados do cliente</h3>
                
                {/* Campo de busca de clientes */}
                <div className="mb-4">
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      placeholder="Digite o email do cliente"
                      disabled={isViewOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onFocus={() => clientSearchTerm && setShowClientDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                    />
                    {isSearchingClients && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    
                    {/* Dropdown com resultados da busca de clientes */}
                    {showClientDropdown && clientSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {clientSearchResults.map((client, index) => (
                          <div
                            key={`client-${client.id}-${index}`}
                            onClick={() => selectClient(client)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{client.nome}</div>
                            <div className="text-sm text-gray-600">{client.empresa}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mensagem quando não há resultados */}
                    {showClientDropdown && clientSearchTerm.length >= 2 && clientSearchResults.length === 0 && !isSearchingClients && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                  
                  {/* Mensagem de feedback */}
                  {clientSearchMessage && (
                    <div className={`mt-2 p-2 rounded-md text-sm ${
                      clientSearchMessage.includes('sucesso') 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {clientSearchMessage}
                    </div>
                  )}
                </div>
                
                {/* Dados do cliente selecionado */}
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Empresa:</span> {clienteSelecionado?.empresa || 'Não informado'}</div>
                  <div><span className="font-medium">Nome:</span> {clienteSelecionado?.nome || 'Não informado'}</div>
                  <div><span className="font-medium">CNPJ:</span> {clienteSelecionado?.cnpj || 'Não informado'}</div>
                  <div><span className="font-medium">Telefone:</span> {clienteSelecionado?.telefone || 'Não informado'}</div>
                  <div><span className="font-medium">Email:</span> {clienteSelecionado?.email || 'Não informado'}</div>
                  <div><span className="font-medium">Endereço:</span> {
                    clienteSelecionado?.endereco ? 
                      `${clienteSelecionado.endereco.rua || ''} ${clienteSelecionado.endereco.numero || ''} - ${clienteSelecionado.endereco.bairro || ''}, ${clienteSelecionado.endereco.cidade || ''} - ${clienteSelecionado.endereco.estado || ''}`.trim().replace(/^[,\s-]+|[,\s-]+$/g, '') || 'Não informado'
                      : 'Não informado'
                  }</div>
                </div>
              </div>

              {/* Representante */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Representante</h3>
                <div className="mb-4">
                  <select
                    value={representante?.id?.toString() || ''}
                    onChange={(e) => {
                      const consultorId = e.target.value;
                      if (consultorId) {
                        const consultor = consultores.find(c => c.id.toString() === consultorId);
                        if (consultor) {
                          setRepresentante({
                            id: consultor.id,
                            user_name: consultor.nome,
                            user_email: consultor.email,
                            role: 'Consultor'
                          });
                        }
                      } else {
                        setRepresentante(null);
                      }
                    }}
                    disabled={isViewOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um consultor</option>
                    {consultores.map((consultor) => (
                      <option key={consultor.id} value={consultor.id.toString()}>
                        {consultor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dados do Representante */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 truncate" title="Dados do representante">Dados do representante</h4>
                  <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-md">
                    <div><span className="font-medium">Empresa:</span> Ecologic Brindes</div>        
                    <div><span className="font-medium">Nome:</span> {representante?.user_name || 'Não informado'}</div>
                    <div><span className="font-medium">Email:</span> {representante?.user_email || 'Não informado'}</div>
                    <div><span className="font-medium">CNPJ:</span> 12.345.678/0001-90</div>
                    <div><span className="font-medium">Telefone:</span> Não informado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-6">

        {/* Adicionar Produtos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Produtos</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para incluir um produto digite o nome ou referência:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome ou referência do produto"
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onFocus={() => searchTerm && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {/* Dropdown com resultados da busca */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product, index) => (
                      <div
                        key={`${product.source}-${product.id}-${index}`}
                        onClick={() => selectProduct(product)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          {/* Imagem do produto */}
                          <div className="flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) nextElement.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                                IMG
                              </div>
                            )}
                          </div>
                          
                          {/* Informações do produto */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</div>
                            )}
                            <div className="flex gap-4 mt-1">
                              {product.reference && (
                                <span className="text-xs text-blue-600">Ref: {product.reference}</span>
                              )}
                              {product.category && (
                                <span className="text-xs text-gray-500">{product.category}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Fonte */}
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {product.source === 'products_solicitacao' ? 'Solicitação' : 'Catálogo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Mensagem quando não há resultados */}
                {showDropdown && searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tabela de Produtos */}
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtos Adicionados</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 print-products-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>PRODUTO & VARIAÇÕES</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>INFORMAÇÕES</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '70px', minWidth: '70px' }}>QTD</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '80px', minWidth: '80px' }}>Custo Unit</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>Person</th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>Layout</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '80px', minWidth: '80px' }}>Frete Forn</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '80px', minWidth: '80px' }}>Frete Cliente</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '90px', minWidth: '90px' }}>CUSTO</th>
                    {/* colunas removidas: PREÇO UNIT. FORN., Preço Unitário, Fator (Tabela) */}
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '70px', minWidth: '70px' }}>Fator</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '90px', minWidth: '90px' }}>VENDA UNIT.</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '80px', minWidth: '80px' }}>VALOR DE VENDA</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print" style={{ width: '60px', minWidth: '60px' }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Função para consolidar produtos por ID - Versão Corrigida
                    const consolidateProducts = (products: any[]) => {
                      const consolidated: { [key: string]: any } = {};
                      
                      products.forEach((product, index) => {
                        const key = product.id.toString();
                        
                        if (!consolidated[key]) {
                          // Primeiro produto com este ID - preservar valores existentes
                          consolidated[key] = {
                            ...product,
                            originalIndexes: [index],
                            quantity1: product.quantity || 0,
                            quantity2: product.quantity2 || 0,
                            quantity3: product.quantity3 || 0,
                            preco1: product.price || 0,
                            preco2: product.preco2 || 0,
                            preco3: product.preco3 || 0
                          };
                        } else {
                          // Produto duplicado - adicionar como quantidade adicional
                          const existing = consolidated[key];
                          existing.originalIndexes.push(index);
                          
                          // Preservar valores já existentes nos campos quantity2/3 e preco2/3
                          if (existing.quantity2 === 0 && (product.quantity2 > 0 || product.quantity > 0)) {
                            existing.quantity2 = product.quantity2 || product.quantity || 0;
                            existing.preco2 = product.preco2 || product.price || 0;
                          } else if (existing.quantity3 === 0 && (product.quantity3 > 0 || product.quantity > 0)) {
                            existing.quantity3 = product.quantity3 || product.quantity || 0;
                            existing.preco3 = product.preco3 || product.price || 0;
                          }
                        }
                      });
                      
                      return Object.values(consolidated);
                    };
                    
                    const consolidatedProducts = consolidateProducts(selectedProducts);
                    
                    return consolidatedProducts.map((product, consolidatedIndex) => {
                    const quantidade1 = product.quantity || 0;
                    const quantidade2 = product.quantity2 || 0;

                    // Garantir que os preços sejam números válidos
                    const preco1 = typeof product.price === 'number' ? product.price : (parseFloat(String(product.price)) || 0);
                    const preco2 = typeof product.preco2 === 'number' ? product.preco2 : (parseFloat(String(product.preco2)) || 0);

                    // Garantir que os fatores sejam números válidos (padrão 1.0)
                    const fator1 = typeof product.fator1 === 'number' ? product.fator1 : (parseFloat(String(product.fator1)) || 1);
                    const fator2 = typeof product.fator2 === 'number' ? product.fator2 : (parseFloat(String(product.fator2)) || 1);
                    const fator3 = typeof product.fator3 === 'number' ? product.fator3 : (parseFloat(String(product.fator3)) || 1);

                    const valPers1 = 0;
                    const valPers2 = 0;
                    const valPers3 = 0;
                    const precoVendaReal1 = (preco1 * fator1) + valPers1;
                    const precoVendaReal2 = (preco2 * fator2) + valPers2;
                    const precoVendaReal3 = ((product.preco3 || 0) * fator3) + valPers3;

                    const subtotal1 = quantidade1 * precoVendaReal1;
                    const subtotal2 = quantidade2 * precoVendaReal2;
                    
                    // Novos campos para cálculo de CUSTO
                    const custoUnit1 = typeof product.custoUnit1 === 'number' ? product.custoUnit1 : (parseFloat(String(product.custoUnit1)) || 0);
                    const custoUnit2 = typeof product.custoUnit2 === 'number' ? product.custoUnit2 : (parseFloat(String(product.custoUnit2)) || 0);
                    const custoUnit3 = typeof product.custoUnit3 === 'number' ? product.custoUnit3 : (parseFloat(String(product.custoUnit3)) || 0);
                    const freteFornecedor1 = typeof product.freteFornecedor1 === 'number' ? product.freteFornecedor1 : (parseFloat(String(product.freteFornecedor1)) || 0);
                    const freteFornecedor2 = typeof product.freteFornecedor2 === 'number' ? product.freteFornecedor2 : (parseFloat(String(product.freteFornecedor2)) || 0);
                    const freteFornecedor3 = typeof product.freteFornecedor3 === 'number' ? product.freteFornecedor3 : (parseFloat(String(product.freteFornecedor3)) || 0);
                    const freteCliente1 = typeof product.freteCliente1 === 'number' ? product.freteCliente1 : (parseFloat(String(product.freteCliente1)) || 0);
                    const freteCliente2 = typeof product.freteCliente2 === 'number' ? product.freteCliente2 : (parseFloat(String(product.freteCliente2)) || 0);
                    const freteCliente3 = typeof product.freteCliente3 === 'number' ? product.freteCliente3 : (parseFloat(String(product.freteCliente3)) || 0);
                    const person1Val = typeof product.person1 === 'number' ? product.person1 : (parseFloat(String(product.person1)) || 0);
                    const person2Val = typeof product.person2 === 'number' ? product.person2 : (parseFloat(String(product.person2)) || 0);
                    const person3Val = typeof product.person3 === 'number' ? product.person3 : (parseFloat(String(product.person3)) || 0);
                    const layout1Val = typeof product.layout1 === 'number' ? product.layout1 : (parseFloat(String(product.layout1)) || 0);
                    const layout2Val = typeof product.layout2 === 'number' ? product.layout2 : (parseFloat(String(product.layout2)) || 0);
                    const layout3Val = typeof product.layout3 === 'number' ? product.layout3 : (parseFloat(String(product.layout3)) || 0);
                    
                    const custoCalculado1 = (quantidade1 * custoUnit1) + freteFornecedor1 + freteCliente1 + person1Val + layout1Val;
                    const custoCalculado2 = (quantidade2 * custoUnit2) + freteFornecedor2 + freteCliente2 + person2Val + layout2Val;
                    const custoCalculado3 = ((product.quantity3 || 0) * custoUnit3) + freteFornecedor3 + freteCliente3 + person3Val + layout3Val;
                    
                    const subtotalCalculado1 = custoCalculado1 * (fator1 || 1);
                    const subtotalCalculado2 = custoCalculado2 * (fator2 || 1);
                    const subtotalCalculado3 = custoCalculado3 * (fator3 || 1);
                    
                    return (
                        <tr key={`consolidated-${product.id}-${consolidatedIndex}-${product.groupIndex || 0}`} className="hover:bg-gray-50">
                        {/* Coluna Produto - Expandida para incluir informações */}
                        <td className="px-2 py-3" style={{ width: '180px', minWidth: '180px' }}>
                          <div className="flex flex-col space-y-2">
                            {/* Seção Principal do Produto */}
                            <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg border">
                              {/* Imagem do Produto */}
                              <ProductImage key={`${product.id}-${product.color || 'no-color'}`} product={product} />
                              
                              {/* Informações do Produto */}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900" style={{ display: '-webkit-box', WebkitLineClamp: showTitles?.[product.id] ? 'unset' as any : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                                  {product.name || product.titulo || 'Produto sem nome'}
                                </div>
                                <button
                                  type="button"
                                  className="text-[10px] text-blue-600 mt-1"
                                  onClick={() => setShowTitles(prev => ({ ...prev, [product.id]: !prev?.[product.id] }))}
                                >
                                  {showTitles?.[product.id] ? 'ver menos' : 'ver mais'}
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {product.id}
                                </p>
                                {product.color && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Cor: {product.color}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Seção de Variações/Opções */}
                            <div className="border border-gray-200 rounded-lg p-2 bg-white">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Variações
                                </h5>
                                <span className="text-xs text-gray-500">
                                  {(() => {
                                    // Debug: Log product data to console
                                    console.log('Product data for variations:', {
                                      product: product,
                                      originalData: product.originalData,
                                      variacoes: product.variacoes,
                                      originalDataVariacoes: product.originalData?.variacoes,
                                      ecologicVariacoes: product.originalData?.ecologic_products_site?.variacoes
                                    });
                                    
                                    // Try multiple sources for variations
                                    const productData = product.originalData?.ecologic_products_site || product.originalData || product;
                                    const variacoesData = product.variacoes || productData?.variacoes || product.originalData?.variacoes;
                                    
                                    if (variacoesData) {
                                      try {
                                        let variacoes = variacoesData;
                                        if (typeof variacoes === 'string') {
                                          variacoes = JSON.parse(variacoes);
                                        }
                                        if (Array.isArray(variacoes)) {
                                          console.log('Found variations:', variacoes);
                                          return `${variacoes.length} opções`;
                                        }
                                      } catch (error) {
                                        console.error('Error parsing variations:', error);
                                        return '0 opções';
                                      }
                                    }
                                    console.log('No variations found');
                                    return '0 opções';
                                  })()}
                                </span>
                              </div>
                              
                              {/* Lista de Variações com Checkboxes - Com scroll */}
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {(() => {
                                  const productData = product.originalData?.ecologic_products_site || product.originalData || product;
                                  const variacoesData = product.variacoes || productData?.variacoes || product.originalData?.variacoes;
                                  
                                  if (variacoesData) {
                                    try {
                                      let variacoes = variacoesData;
                                      
                                      if (typeof variacoes === 'string') {
                                        variacoes = JSON.parse(variacoes);
                                      }
                                      
                                      if (Array.isArray(variacoes) && variacoes.length > 0) {
                                        return <ColorVariationSelector 
                                          product={product} 
                                          variacoes={variacoes} 
                                          onSelect={handleColorVariationSelect}
                                          isViewOnly={isViewOnly}
                                        />;
                                      }
                                    } catch (error) {
                                      return (
                                        <div className="text-xs text-gray-500 text-center py-1">
                                          Erro ao carregar variações
                                        </div>
                                      );
                                    }
                                  }
                                  
                                  return null;
                                })()}
                              </div>
                              
                              {/* Resumo das Seleções */}
                              {product.selectedVariations && product.selectedVariations.length > 0 && (
                                <div className="mt-2 pt-1 border-t border-gray-100">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Selecionadas:</span> {product.selectedVariations.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Personalização removida */}
                          </div>
                        </td>
                        
                        {/* Coluna Informações - Campo completo do produto */}
                        <td className="px-2 py-3" style={{ width: '200px', minWidth: '200px' }}>
                          <div className="space-y-1 p-1 border border-gray-200 rounded-lg bg-gray-50">
                            {/* Título e Descrição Combinados */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Título e Descrição
                              </label>
                              <RichTextEditor
                                content={`${product.titulo || product.name || ''}<br>${(product.descricao || product.description || '').replace(/\n/g, '<br>')}`}
                                onChange={(content) => {
                                  // Extrair título e descrição do conteúdo HTML
                                  const tempDiv = document.createElement('div');
                                  tempDiv.innerHTML = content;
                                  const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                  const lines = textContent.split('\n');
                                  const titulo = lines[0] || '';
                                  const descricao = lines.slice(1).join('\n') || '';
                                  
                                  const updatedProducts = [...selectedProducts];
                                  
                                  if (product.originalIndexes && product.originalIndexes.length > 0) {
                                    product.originalIndexes.forEach((originalIndex: number) => {
                                      if (updatedProducts[originalIndex]) {
                                        updatedProducts[originalIndex].titulo = titulo;
                                        updatedProducts[originalIndex].descricao = descricao;
                                      }
                                    });
                                  } else {
                                    const originalIndex = selectedProducts.findIndex(p => p.id === product.id);
                                    if (originalIndex !== -1) {
                                      updatedProducts[originalIndex].titulo = titulo;
                                      updatedProducts[originalIndex].descricao = descricao;
                                    }
                                  }
                                  
                                  setSelectedProducts(updatedProducts);
                                }}
                                placeholder="Digite o título e descrição do produto"
                                disabled={false}
                                className="min-h-[60px]"
                              />
                            </div>

                            {/* Espaço para informações adicionais removido */}
                          </div>
                        </td>
                        

                        
                        {/* Coluna Quantidade com 3 campos e rótulos */}
                        <td className="px-2 py-3" style={{ width: '70px', minWidth: '70px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            {/* Primeiro campo de quantidade com rótulo lateral */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={product.quantity1 || product.quantity || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseInt(e.target.value) || 0;
                                  
                                  if (product.originalIndexes && product.originalIndexes.length > 0) {
                                    // Para produtos consolidados, atualizar apenas o primeiro produto original
                                    const firstOriginalIndex = product.originalIndexes[0];
                                    if (updatedProducts[firstOriginalIndex]) {
                                      updatedProducts[firstOriginalIndex].quantity = newValue;
                                      updatedProducts[firstOriginalIndex].quantity1 = newValue;
                                      updatedProducts[firstOriginalIndex].quantidade1 = newValue;
                                      updatedProducts[firstOriginalIndex].valor_total = newValue * (updatedProducts[firstOriginalIndex].price || 0);
                                      // Recalcular fator1 se uma tabela estiver selecionada
                                  if (updatedProducts[firstOriginalIndex].tabelaFator1) {
                                        updatedProducts[firstOriginalIndex].fator1 = obterFatorPorQuantidade(updatedProducts[firstOriginalIndex].tabelaFator1, newValue);
                                        // Atualizar o fator principal com base no fator1 (usando quantidade 01 como referência)
                                        updatedProducts[firstOriginalIndex].fator = obterFatorPorQuantidade(updatedProducts[firstOriginalIndex].tabelaFator1, newValue);
                                      }
                                      // Personalizações removidas
                                    }
                                  } else {
                                    // Produto único, usar índice consolidado
                                    const originalIndex = selectedProducts.findIndex(p => p.id === product.id);
                                    if (originalIndex !== -1) {
                                      updatedProducts[originalIndex].quantity = newValue;
                                      updatedProducts[originalIndex].quantity1 = newValue;
                                      updatedProducts[originalIndex].quantidade1 = newValue;
                                      updatedProducts[originalIndex].valor_total = newValue * (updatedProducts[originalIndex].price || 0);
                                      // Recalcular fator1 se uma tabela estiver selecionada
                                      if (updatedProducts[originalIndex].tabelaFator1) {
                                        updatedProducts[originalIndex].fator1 = obterFatorPorQuantidade(updatedProducts[originalIndex].tabelaFator1, newValue);
                                        // Atualizar o fator principal com base no fator1 (usando quantidade 01 como referência)
                                        updatedProducts[originalIndex].fator = obterFatorPorQuantidade(updatedProducts[originalIndex].tabelaFator1, newValue);
                                      }
                                      // Personalizações removidas
                                    }
                                  }
                                  
                                  setSelectedProducts(updatedProducts);
                                }}
                                placeholder="0"
                                min="0"
                                disabled={isViewOnly}
                                className={`flex-1 px-1 h-7 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isViewOnly 
                                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                                }`}
                              />
                            </div>
                            
                            {/* Segundo campo de quantidade com rótulo lateral */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={product.quantity2 || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseInt(e.target.value) || 0;

                                  // Atualizar todos os produtos com o mesmo ID
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        quantity2: newValue,
                                        quantidade2: newValue,
                                        // Recalcular fator2 se uma tabela estiver selecionada
                                        fator2: updatedProducts[index].tabelaFator2 ? 
                                          obterFatorPorQuantidade(updatedProducts[index].tabelaFator2, newValue) : 
                                          updatedProducts[index].fator2
                                      };
                                    }
                                  });

                                  setSelectedProducts(updatedProducts);
                                }}
                                placeholder="0"
                                min="0"
                                disabled={false}
                                className="flex-1 px-1 h-7 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>

                            {/* Terceiro campo de quantidade com rótulo lateral */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={product.quantity3 || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseInt(e.target.value) || 0;

                                  // Atualizar todos os produtos com o mesmo ID
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        quantity3: newValue,
                                        quantidade3: newValue,
                                        // Recalcular fator3 se uma tabela estiver selecionada
                                        fator3: updatedProducts[index].tabelaFator3 ? 
                                          obterFatorPorQuantidade(updatedProducts[index].tabelaFator3, newValue) : 
                                          updatedProducts[index].fator3
                                      };
                                    }
                                  });

                                  setSelectedProducts(updatedProducts);
                                }}
                                placeholder="0"
                                min="0"
                                disabled={false}
                                className="flex-1 px-1 h-7 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* Coluna Custo Unit com 3 campos */}
                        <td className="px-2 py-3" style={{ width: '80px', minWidth: '80px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.custoUnit1 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(newValue) || newValue < 0) {
                                    toast.error('Informe um valor numérico válido para Custo Unit');
                                    return;
                                  }
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        custoUnit1: newValue
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.custoUnit2 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(newValue) || newValue < 0) {
                                    toast.error('Informe um valor numérico válido para Custo Unit');
                                    return;
                                  }
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        custoUnit2: newValue
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.custoUnit3 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const newValue = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(newValue) || newValue < 0) {
                                    toast.error('Informe um valor numérico válido para Custo Unit');
                                    return;
                                  }
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        custoUnit3: newValue
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* Coluna Person com 3 campos */}
                        <td className="px-2 py-3" style={{ width: '120px', minWidth: '120px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.person1 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], person1: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.person2 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], person2: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.person3 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], person3: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                          </div>
                        </td>
                        
                        {/* Coluna Layout com 3 campos */}
                        <td className="px-2 py-3" style={{ width: '120px', minWidth: '120px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.layout1 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], layout1: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.layout2 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], layout2: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={formatCurrencyRightToLeft(String((product.layout3 ?? 0) * 100))}
                              onChange={(e) => {
                                const updated = [...selectedProducts];
                                const val = parseCurrencyRightToLeft(e.target.value);
                                if (isNaN(val) || val < 0) return;
                                updated.forEach((p, idx) => {
                                  if (p.id === product.id) {
                                    updated[idx] = { ...updated[idx], layout3: val };
                                  }
                                });
                                setSelectedProducts(updated);
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = formatCurrencyRightToLeft(target.value);
                              }}
                              inputMode="numeric"
                              pattern="[0-9.,]*"
                              placeholder="0,00"
                              className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300"
                            />
                          </div>
                        </td>
                        
                        {/* Coluna Frete Fornecedor com 3 campos */}
                        <td className="px-2 py-3" style={{ width: '80px', minWidth: '80px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteFornecedor1 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Forn');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteFornecedor1: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteFornecedor2 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Forn');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteFornecedor2: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteFornecedor3 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Forn');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteFornecedor3: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* Coluna Frete Cliente com 3 campos */}
                        <td className="px-2 py-3" style={{ width: '80px', minWidth: '80px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteCliente1 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Cliente');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteCliente1: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteCliente2 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Cliente');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteCliente2: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={formatCurrencyRightToLeft(String((product.freteCliente3 ?? 0) * 100))}
                                onChange={(e) => {
                                  const updated = [...selectedProducts];
                                  const val = parseCurrencyRightToLeft(e.target.value);
                                  if (isNaN(val) || val < 0) {
                                    toast.error('Informe um valor numérico válido para Frete Cliente');
                                    return;
                                  }
                                  updated.forEach((p, idx) => {
                                    if (p.id === product.id) {
                                      updated[idx] = { ...updated[idx], freteCliente3: val };
                                    }
                                  });
                                  setSelectedProducts(updated);
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement;
                                  target.value = formatCurrencyRightToLeft(target.value);
                                }}
                                inputMode="numeric"
                                pattern="[0-9.,]*"
                                placeholder="0,00"
                                className="flex-1 px-1 h-7 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* Coluna CUSTO calculada */}
                        <td className="px-2 py-3" style={{ width: '90px', minWidth: '90px' }}>
                          <div className="grid grid-rows-3 gap-1">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(custoCalculado1)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(custoCalculado2)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(custoCalculado3)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* inputs de preço unit movidos para a coluna Fator */}
                        
                        {/* coluna removida: Preço Unitário (calculado) */}

                        {/* Coluna Fator com 3 campos (alinhada sob cabeçalho Fator) e inputs de preço unit inseridos */}
                        <td className="px-2 py-3" style={{ width: '70px', minWidth: '70px' }}>
                          <div className="grid grid-rows-3 gap-1 items-center">
                            <div className="flex items-center gap-1">
                              <select
                                value={product.tabelaFator1 || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const nomeTabela = e.target.value;
                                  const quantidade = (product.quantity ?? product.quantity1 ?? product.quantidade1 ?? 0);
                                  const fatorCalculado = nomeTabela ? obterFatorPorQuantidade(nomeTabela, quantidade) : 1;
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        tabelaFator1: nomeTabela,
                                        fator1: fatorCalculado
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                disabled={isViewOnly}
                                className={`flex-1 px-1 h-7 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isViewOnly 
                                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                                }`}
                              >
                                <option value="">Selecione</option>
                                {tabelasFator.map((tabela) => (
                                  <option key={tabela.nome_tabela} value={tabela.nome_tabela}>
                                    Fator {tabela.nome_tabela}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <select
                                value={product.tabelaFator2 || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const nomeTabela = e.target.value;
                                  const quantidade = (product.quantity2 ?? product.quantidade2 ?? 0);
                                  const fatorCalculado = nomeTabela ? obterFatorPorQuantidade(nomeTabela, quantidade) : 1;
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        tabelaFator2: nomeTabela,
                                        fator2: fatorCalculado
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                disabled={isViewOnly}
                                className={`flex-1 px-1 h-7 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500`}
                              >
                                <option value="">Selecione</option>
                                {tabelasFator.map((tabela) => (
                                  <option key={tabela.nome_tabela} value={tabela.nome_tabela}>
                                    Fator {tabela.nome_tabela}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <select
                                value={product.tabelaFator3 || ''}
                                onChange={(e) => {
                                  const updatedProducts = [...selectedProducts];
                                  const nomeTabela = e.target.value;
                                  const quantidade = (product.quantity3 ?? product.quantidade3 ?? 0);
                                  const fatorCalculado = nomeTabela ? obterFatorPorQuantidade(nomeTabela, quantidade) : 1;
                                  updatedProducts.forEach((p, index) => {
                                    if (p.id === product.id) {
                                      updatedProducts[index] = {
                                        ...updatedProducts[index],
                                        tabelaFator3: nomeTabela,
                                        fator3: fatorCalculado
                                      };
                                    }
                                  });
                                  setSelectedProducts(updatedProducts);
                                }}
                                disabled={isViewOnly}
                                className="flex-1 px-1 h-7 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 hover:border-gray-400 focus:border-blue-500"
                              >
                                <option value="">Selecione</option>
                                {tabelasFator.map((tabela) => (
                                  <option key={tabela.nome_tabela} value={tabela.nome_tabela}>
                                    Fator {tabela.nome_tabela}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* coluna removida: PREÇO UNIT (calculado) */}
                        
                        {/* coluna removida: Fator (ao lado do Sub-total) */}
                        
                        {/* Coluna R$ Sub-Total com 3 campos e rótulos */}
                        <td className="px-2 py-3" style={{ width: '80px', minWidth: '80px' }}>
                          <div className="grid grid-rows-3 gap-1">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency((quantidade1 > 0) ? (subtotalCalculado1 / quantidade1) : 0)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency((quantidade2 > 0) ? (subtotalCalculado2 / quantidade2) : 0)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(((product.quantity3 || 0) > 0) ? (subtotalCalculado3 / (product.quantity3 || 0)) : 0)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-2 py-3" style={{ width: '90px', minWidth: '90px' }}>
                          <div className="grid grid-rows-3 gap-1">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs font-medium text-gray-900 text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(subtotalCalculado1)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs font-medium text-gray-900 text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(subtotalCalculado2)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 text-xs font-medium text-gray-900 text-right px-1 h-7 bg-gray-50 rounded border flex items-center justify-end">
                                {formatSubtotalCurrency(subtotalCalculado3)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Coluna Ações */}
                        <td className="px-1 py-3 text-center text-sm font-medium" style={{ width: '60px', minWidth: '60px' }}>
                          {!isViewOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                if (product.originalIndexes) {
                                  // Para produtos consolidados, remover todos os produtos originais
                                  const updatedProducts = selectedProducts.filter((_, idx) => 
                                    !product.originalIndexes.includes(idx)
                                  );
                                  setSelectedProducts(updatedProducts);
                                } else {
                                  // Para produto único, usar a função original
                                  const originalIndex = selectedProducts.findIndex(p => p.id === product.id);
                                  if (originalIndex !== -1) {
                                    removeSelectedProduct(originalIndex);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
                  {selectedProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Nenhum produto adicionado. Use o campo de busca acima para adicionar produtos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Campos adicionais */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validade da Proposta</label>
                <select
                  value={orcamento.validade_proposta || ''}
                  onChange={(e) => setOrcamento({ ...orcamento, validade_proposta: e.target.value })}
                  disabled={isViewOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione</option>
                  <option value="10 dias">10 dias</option>
                  <option value="20 dias">20 dias</option>
                  <option value="30 dias">30 dias</option>
                  <option value="50 dias">50 dias</option>
                  <option value="60 dias">60 dias</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Entrega</label>
                <select
                  value={orcamento.prazo_entrega || ''}
                  onChange={(e) => setOrcamento({ ...orcamento, prazo_entrega: e.target.value })}
                  disabled={isViewOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione</option>
                  <option value="5 dias úteis">5 dias úteis</option>
                  <option value="7 / 10 dias úteis">7 / 10 dias úteis</option>
                  <option value="12 dias úteis">12 dias úteis</option>
                  <option value="15 dias úteis">15 dias úteis</option>
                  <option value="15 / 20 dias úteis">15 / 20 dias úteis</option>
                  <option value="20 dias úteis">20 dias úteis</option>
                  <option value="25 dias úteis">25 dias úteis</option>
                  <option value="30 dias úteis">30 dias úteis</option>
                  <option value="40 dias úteis">40 dias úteis</option>
                  <option value="50 dias úteis">50 dias úteis</option>
                  <option value="60 dias úteis">60 dias úteis</option>
                  <option value="120 dias úteis">120 dias úteis</option>
                  <option value="3 dias úteis">3 dias úteis</option>
                  <option value="4 dias úteis">4 dias úteis</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <select
                  value={orcamento.forma_pagamento || ''}
                  onChange={(e) => setOrcamento({ ...orcamento, forma_pagamento: e.target.value })}
                  disabled={isViewOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione</option>
                  <option value="50% no pedido e 50% quando a mercadoria estiver pronta, disponível para entrega ou retirada do cliente (pix, depósito ou boleto). Caso precisem de prazo para pagamento, informe-nos para que possamos verificar a possibilidade e adequar o valor">50% no pedido e 50% quando a mercadoria estiver pronta, disponível para entrega ou retirada do cliente (pix, depósito ou boleto). Caso precisem de prazo para pagamento, informe-nos para que possamos verificar a possibilidade e adequar o valor</option>
                  <option value="50% no pedido e 50% em até 07 dias após emissão da NF">50% no pedido e 50% em até 07 dias após emissão da NF</option>
                  <option value="50% com 30 dias e 50% com 60 dias">50% com 30 dias e 50% com 60 dias</option>
                  <option value="50% no pedido e 50% em até 10 dias após emissão da NF">50% no pedido e 50% em até 10 dias após emissão da NF</option>
                  <option value="50% no pedido e 50% em até 15 dias após emissão da NF">50% no pedido e 50% em até 15 dias após emissão da NF</option>
                  <option value="50% no pedido e 50% em até 30 dias após emissão da NF">50% no pedido e 50% em até 30 dias após emissão da NF</option>
                  <option value="50% no pedido e 50% em até 45 dias após emissão da NF">50% no pedido e 50% em até 45 dias após emissão da NF</option>
                  <option value="50% no pedido e 2 vezes no cartão de crédito para retirada">50% no pedido e 2 vezes no cartão de crédito para retirada</option>
                  <option value="50% no pedido e 3 vezes no cartão de crédito para retirada">50% no pedido e 3 vezes no cartão de crédito para retirada</option>
                  <option value="50% no pedido e 4 vezes no cartão de crédito para retirada">50% no pedido e 4 vezes no cartão de crédito para retirada</option>
                  <option value="50% no pedido, 25% 15 dias após a emissão da NF e 25% após 30 dias da emissão da NF">50% no pedido, 25% 15 dias após a emissão da NF e 25% após 30 dias da emissão da NF</option>
                  <option value="50% no pedido, 25% 20 dias após a emissão da NF e 25% após 40 dias da emissão da NF">50% no pedido, 25% 20 dias após a emissão da NF e 25% após 40 dias da emissão da NF</option>
                  <option value="50% no pedido, 25% 30 dias após a emissão da NF e 25% após 60 dias da emissão da NF">50% no pedido, 25% 30 dias após a emissão da NF e 25% após 60 dias da emissão da NF</option>
                  <option value="50% com 5 dias após a emissão da NF + 25% com 28 dias após emissão da NF + 25% com 42 dias após emissão da NF">50% com 5 dias após a emissão da NF + 25% com 28 dias após emissão da NF + 25% com 42 dias após emissão da NF</option>
                  <option value="50% no pedido + 20D + 40D + 60D após abertura do pedido">50% no pedido + 20D + 40D + 60D após abertura do pedido</option>
                  <option value="50% no pedido + 30D + 60D + 90D após abertura do pedido">50% no pedido + 30D + 60D + 90D após abertura do pedido</option>
                  <option value="100% No fechamento do pedido">100% No fechamento do pedido</option>
                  <option value="100% na entrega do pedido">100% na entrega do pedido</option>
                  <option value="100% 03 dias após emissão da NF">100% 03 dias após emissão da NF</option>
                  <option value="100% 05 dias após emissão da NF">100% 05 dias após emissão da NF</option>
                  <option value="100% 07 dias após emissão da NF">100% 07 dias após emissão da NF</option>
                  <option value="100% 10 dias após emissão da NF">100% 10 dias após emissão da NF</option>
                  <option value="100% 15 dias após emissão da NF">100% 15 dias após emissão da NF</option>
                  <option value="100% 20 dias após emissão da NF">100% 20 dias após emissão da NF</option>
                  <option value="100% 21 dias após emissão da NF">100% 21 dias após emissão da NF</option>
                  <option value="100% 28 dias após emissão da NF">100% 28 dias após emissão da NF</option>
                  <option value="100% 30 dias após emissão da NF">100% 30 dias após emissão da NF</option>
                  <option value="100% 35 dias após emissão da NF">100% 35 dias após emissão da NF</option>
                  <option value="100% 40 dias após emissão da NF">100% 40 dias após emissão da NF</option>
                  <option value="100% 45 dias após emissão da NF">100% 45 dias após emissão da NF</option>
                  <option value="100% 50 dias após emissão da NF">100% 50 dias após emissão da NF</option>
                  <option value="100% 60 dias após emissão da NF">100% 60 dias após emissão da NF</option>
                  <option value="100% 10 DDL após a entrega depósito em conta corrente">100% 10 DDL após a entrega depósito em conta corrente</option>
                  <option value="Cartão de débito">Cartão de débito</option>
                  <option value="1vez no Cartão de Crédito">1vez no Cartão de Crédito</option>
                  <option value="2 vezes no Cartão de Crédito">2 vezes no Cartão de Crédito</option>
                  <option value="3 vezes no cartão de crédito">3 vezes no cartão de crédito</option>
                  <option value="4 vezes no Cartão de Crédito">4 vezes no Cartão de Crédito</option>
                  <option value="15 / 30 dias após entrega">15 / 30 dias após entrega</option>
                  <option value="15 / 45 dias após entrega">15 / 45 dias após entrega</option>
                  <option value="28 / 42 dias após a entrega">28 / 42 dias após a entrega</option>
                  <option value="30% antecipado após o recebimento da Nota Fiscal, em 72 hrs, e o restante após o recebimento da mercadoria, 72 hrs">30% antecipado após o recebimento da Nota Fiscal, em 72 hrs, e o restante após o recebimento da mercadoria, 72 hrs</option>
                  <option value="30 e 60 dias à partir da disponibilidade do produto para entrega">30 e 60 dias à partir da disponibilidade do produto para entrega</option>
                  <option value="Entrada / 20 / 40 dias após emissão da NF">Entrada / 20 / 40 dias após emissão da NF</option>
                  <option value="Entrada / 30 / 60 dias após abertura do pedido">Entrada / 30 / 60 dias após abertura do pedido</option>
                  <option value="Entrada / 30 / 60 / 90 dias após abertura do pedido">Entrada / 30 / 60 / 90 dias após abertura do pedido</option>
                  <option value="Entrada via depósito + 4x no cartão de crédito">Entrada via depósito + 4x no cartão de crédito</option>
                  <option value="50% via pix ou transferência + 25% via pix ou transferência + 25% cartão de crédito">50% via pix ou transferência + 25% via pix ou transferência + 25% cartão de crédito</option>
                  <option value="40% no pedido + 30% com 20 dias + 30% com 40 dias via boleto">40% no pedido + 30% com 20 dias + 30% com 40 dias via boleto</option>
                  <option value="30 / 60 / 90 dias após após emissão da NF">30 / 60 / 90 dias após após emissão da NF</option>
                  <option value="100% 120 dias após emissão da NF">100% 120 dias após emissão da NF</option>
                  <option value="Pagamento 50% no pedido e 50% com prazo de até 10 dias após a entrega">Pagamento 50% no pedido e 50% com prazo de até 10 dias após a entrega</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opção de Frete</label>
                <select
                  value={orcamento.opcao_frete || ''}
                  onChange={(e) => setOrcamento({ ...orcamento, opcao_frete: e.target.value })}
                  disabled={isViewOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione</option>
                  <option value="Cliente retira">Cliente retira</option>
                  <option value="Frete CIF - Incluso">Frete CIF - Incluso</option>
                  <option value="Frete CIF - Incluso para Grande Vitória, exceto Cariacica, Viana e Guarapari">Frete CIF - Incluso para Grande Vitória, exceto Cariacica, Viana e Guarapari</option>
                  <option value="Frete FOB - Não incluso, por conta do cliente">Frete FOB - Não incluso, por conta do cliente</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <RichTextEditor
                content={orcamento.observacoes || ''}
                onChange={(content) => setOrcamento({ ...orcamento, observacoes: content })}
                placeholder="Observações sobre o orçamento"
                disabled={isViewOnly}
                className="min-h-[120px]"
              />
            </div>
            

          </div>
        </div>

        {/* Local de Entrega e Cobrança */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Local de Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local da Entrega
                </label>
                <RichTextEditor
                  content={orcamento.local_entrega || ''}
                  onChange={(content) => setOrcamento({ ...orcamento, local_entrega: content })}
                  placeholder="Endereço de entrega"
                  disabled={isViewOnly}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local da Cobrança
                </label>
                <RichTextEditor
                  content={orcamento.local_cobranca || ''}
                  onChange={(content) => setOrcamento({ ...orcamento, local_cobranca: content })}
                  placeholder="Endereço de cobrança"
                  disabled={isViewOnly}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>



        {/* Seção de Anexos - Aparece quando uma proposta é criada */}
        {orcamento.status === 'Orçamento Enviado' && (
          <div className="bg-white rounded-lg shadow-sm border no-print">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Anexos da Proposta</h2>
              
              {/* Upload de Anexos */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Anexos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="anexos-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      // Arquivos selecionados - removido log desnecessário
                      // TODO: Implementar upload para Supabase Storage
                      toast.success(`${files.length} arquivo(s) selecionado(s)`);
                    }}
                  />
                  <label
                    htmlFor="anexos-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Clique para selecionar arquivos ou arraste e solte aqui
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, DOC, XLS, JPG, PNG (máx. 10MB cada)
                    </span>
                  </label>
                </div>
              </div>

              {/* Lista de Anexos */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Anexos Adicionados</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 text-center">
                    Nenhum anexo adicionado ainda
                  </p>
                  {/* TODO: Listar anexos existentes aqui */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/orcamentos')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {isViewOnly ? 'Voltar' : 'Cancelar'}
          </button>
          {!isViewOnly && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || updating}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {loading || updating ? 'Salvando...' : 'Salvar'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    
                    // Primeiro, salvar o orçamento se necessário
                    let orcamentoId = id;
                    if (!isEditing) {
                      // Se não está editando, precisa salvar primeiro
                      const savedOrcamento = await handleSubmit(new Event('submit') as any);
                      orcamentoId = savedOrcamento?.id || orcamento.id;
                    } else {
                      // Se está editando, atualizar o orçamento
                      await handleUpdate(new Event('submit') as any);
                    }
                    
                    if (!orcamentoId) {
                      toast.error('Erro: ID do orçamento não encontrado');
                      return;
                    }
                    
                    // Salvar informações detalhadas dos produtos antes de gerar o orçamento
                    if (selectedProducts && selectedProducts.length > 0) {
                      try {
                        await salvarInformacoesProdutos(orcamentoId, selectedProducts);
                        console.log('Produtos salvos com informações detalhadas');
                      } catch (productError) {
                        console.error('Erro ao salvar produtos detalhados:', productError);
                        toast.error('Erro ao salvar informações dos produtos');
                        return;
                      }
                    }
                    
                    // Atualizar status do orçamento para "Gerado"
                    const { error: updateError } = await supabase
                      .from('solicitacao_orcamentos')
                      .update({ 
                        status: 'Orçamento Gerado'
                      })
                      .eq('solicitacao_id', orcamentoId);
                    
                    if (updateError) {
                      console.error('Erro ao atualizar status do orçamento:', updateError);
                      toast.error('Erro ao gerar orçamento');
                      return;
                    }
                    
                    toast.success('Orçamento gerado com sucesso!');
                    
                    // Navegar para a visualização do orçamento
                    navigate(`/orcamentos/${orcamentoId}/detalhes`, { replace: true });
                    
                  } catch (error) {
                    console.error('Erro ao gerar orçamento:', error);
                    toast.error('Erro ao gerar orçamento');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || updating}
                className="px-6 py-2 bg-[#2CB20B] text-white rounded-md hover:bg-[#25a009] disabled:opacity-50"
              >
                {loading || updating ? 'Processando...' : (orcamento.status === 'Orçamento Gerado' ? 'Criar orçamento' : 'Gerar orçamento')}
              </button>
            </>
          )}
        </div>
        
        {/* CSS específico para impressão */}
        <style jsx="true">{`
          @media print {
            /* Reset e configurações básicas */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Ocultar elementos desnecessários na impressão */
            .no-print,
            button,
            .print-hidden,
            nav,
            .sidebar,
            .navigation,
            .toast,
            .modal,
            .dropdown,
            input[type="search"],
            .search-container,
            .action-buttons {
              display: none !important;
            }
            
            /* Configurações gerais da página */
            @page {
              margin: 1.5cm;
              size: A4;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11pt;
              line-height: 1.3;
              color: #000;
              background: white;
              margin: 0;
              padding: 0;
            }
            
            /* Container principal */
            .print-container {
              max-width: none;
              margin: 0;
              padding: 0;
              box-shadow: none;
              border: none;
              background: white;
            }
            
            /* Cabeçalho do orçamento */
            .print-header {
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 25px;
              text-align: center;
            }
            
            .print-header h1 {
              font-size: 20pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #333;
              letter-spacing: 1px;
            }
            
            .print-header .company-info {
              font-size: 9pt;
              color: #666;
              margin-bottom: 10px;
            }
            
            .print-header .budget-info {
              font-size: 10pt;
              color: #333;
              font-weight: 500;
            }
            
            /* Informações do cliente */
            .print-client-info {
              margin-bottom: 25px;
              border: 1px solid #ddd;
              padding: 12px;
              background: #fafafa;
              border-radius: 4px;
            }
            
            .print-client-info h3 {
              font-size: 12pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
            }
            
            .print-client-info p {
              margin: 3px 0;
              font-size: 10pt;
              color: #555;
            }
            
            /* Tabela de produtos */
            .print-products-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 9pt;
              border: 1px solid #333;
            }
            
            .print-products-table th {
              background: #f8f9fa;
              border: 1px solid #333;
              padding: 6px 4px;
              text-align: center;
              font-weight: bold;
              font-size: 9pt;
              color: #333;
            }
            
            .print-products-table td {
              border: 1px solid #333;
              padding: 6px 4px;
              text-align: left;
              vertical-align: top;
              font-size: 9pt;
            }
            
            .print-products-table .product-image {
              width: 40px;
              height: 40px;
              object-fit: cover;
              border-radius: 2px;
            }
            
            .print-products-table .text-right {
              text-align: right;
            }
            
            .print-products-table .text-center {
              text-align: center;
            }
            
            /* Totais */
            .print-totals {
              margin: 20px 0;
              padding: 15px;
              border: 2px solid #333;
              background: #f8f9fa;
              page-break-inside: avoid;
            }
            
            .print-totals h3 {
              font-size: 12pt;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #333;
              text-align: center;
              border-bottom: 1px solid #333;
              padding-bottom: 5px;
            }
            
            .print-totals .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              padding: 3px 0;
              font-size: 11pt;
            }
            
            .print-totals .total-final {
              border-top: 2px solid #333;
              font-weight: bold;
              font-size: 13pt;
              padding-top: 8px;
              margin-top: 8px;
              color: #333;
            }
            
            /* Observações */
            .print-observations {
              margin: 20px 0;
              border: 1px solid #ddd;
              padding: 12px;
              background: #fafafa;
              page-break-inside: avoid;
            }
            
            .print-observations h4 {
              font-size: 11pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #333;
            }
            
            .print-observations p {
              font-size: 10pt;
              line-height: 1.4;
              margin: 0;
              color: #555;
            }
            
            /* Rodapé */
            .print-footer {
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
            
            /* Quebras de página */
            .page-break-before {
              page-break-before: always;
            }
            
            .page-break-after {
              page-break-after: always;
            }
            
            .page-break-inside-avoid {
              page-break-inside: avoid;
            }
            
            /* Estilos específicos para campos de texto */
            .print-text-field {
              font-size: 10pt;
              color: #333;
              margin: 2px 0;
            }
            
            .print-text-field strong {
              font-weight: bold;
              color: #000;
            }
            
            /* Quebras de página */
            .page-break {
              page-break-before: always;
            }
            
            /* Evitar quebras indesejadas */
            .print-client-info,
            .print-totals,
            .print-observations {
              page-break-inside: avoid;
            }
          }
        `}</style>
        
        {/* Mensagem de modo apenas visualização */}
        {isViewOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 no-print">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Modo apenas visualização:</strong> Este orçamento foi gerado e não pode mais ser editado.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
