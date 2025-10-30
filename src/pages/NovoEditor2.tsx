import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusIcon, TrashIcon, MinusIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useVariationColorImage } from '@/hooks/useVariationColorImage';
import { parseVariacoes } from '@/utils/variationImages';
import { getValidImageUrl } from '@/utils/imageUtils';

// Helpers utilitários para normalização
const norm = (s?: string) =>
  s?.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim() ?? '';

// Interface para produtos
interface Product {
  id: number;
  titulo: string;
  descricao?: string;
  categoria?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
  variacoes?: any;
  originalData?: any;
}

// Interface para itens do orçamento
interface QuoteItem {
  id: number;
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedImageIndex: number;
  allProductImages: string[];
  selectedVariationImage?: string;
}

const NovoEditor2: React.FC = () => {
  // Estados principais
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar produtos
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const normalizedTerm = norm(term);
      
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('*')
        .or(`titulo.ilike.%${term}%,descricao.ilike.%${term}%,id.eq.${parseInt(term) || 0}`)
        .limit(20);

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao buscar produtos');
        return;
      }

      // Filtrar e normalizar resultados
      const filteredResults = data?.filter(product => {
        const normalizedTitle = norm(product.titulo);
        const normalizedDesc = norm(product.descricao);
        return normalizedTitle.includes(normalizedTerm) || 
               normalizedDesc.includes(normalizedTerm) ||
               product.id.toString() === term;
      }) || [];

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);



  // Função para obter todas as imagens do produto
  const getAllProductImages = (product: Product): string[] => {
    const productData = product?.originalData?.ecologic_products_site || product?.originalData || product;
    const images = [
      productData?.img_0,
      productData?.img_1,
      productData?.img_2
    ].filter(Boolean);

    // Adicionar imagens das variações
    const variacoesData = product.variacoes || productData?.variacoes;
    if (variacoesData) {
      let variacoes = variacoesData;
      if (typeof variacoes === 'string') {
        try {
          variacoes = JSON.parse(variacoes);
        } catch (error) {
          console.error('Error parsing variations:', error);
        }
      }

      if (Array.isArray(variacoes)) {
        variacoes.forEach(v => {
          if (v?.imagem && !images.includes(v.imagem)) {
            images.push(v.imagem);
          }
        });
      }
    }

    return images.length > 0 ? images : ['/placeholder-product.svg'];
  };

  // Função para obter variações do produto
  const getProductVariations = (product: Product) => {
    const productData = product?.originalData?.ecologic_products_site || product?.originalData || product;
    const variacoesData = product.variacoes || productData?.variacoes;
    
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

  // Função para obter código da cor (para exibição visual)
  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'branco': '#FFFFFF',
      'preto': '#000000',
      'azul': '#0066CC',
      'vermelho': '#CC0000',
      'verde': '#00CC00',
      'amarelo': '#FFCC00',
      'rosa': '#FF69B4',
      'roxo': '#800080',
      'laranja': '#FF8C00',
      'marrom': '#8B4513',
      'cinza': '#808080',
      'verde escuro': '#006400',
      'azul escuro': '#000080',
      'vermelho escuro': '#8B0000'
    };

    const normalizedColor = norm(colorName);
    return colorMap[normalizedColor] || '#CCCCCC';
  };

  // Adicionar produto ao orçamento
  const addToQuote = (product: Product) => {
    const allImages = getAllProductImages(product);
    const variations = getProductVariations(product);
    const defaultColor = variations.length > 0 ? variations[0].cor : '';

    const newItem: QuoteItem = {
      id: Date.now(), // ID único temporário
      product,
      quantity: 1,
      selectedColor: defaultColor,
      selectedImageIndex: 0,
      allProductImages: allImages,
      selectedVariationImage: ''
    };

    setQuoteItems(prev => [...prev, newItem]);
    toast.success('Produto adicionado ao orçamento');
  };

  // Atualizar quantidade
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setQuoteItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remover item
  const removeItem = (itemId: number) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removido do orçamento');
  };



  // Componente QuoteProductCard
  const QuoteProductCard: React.FC<{ item: QuoteItem }> = ({ item }) => {
    const variacoes = parseVariacoes(item.product?.variacoes);
    const { imgs, src, color, setColor, idx, onError } = useVariationColorImage({
      variacoes: item.product?.variacoes,
      initialColor: item.selectedColor,
      initialIndex: item.selectedImageIndex ?? 0
    });

    const onSelect = (v: { cor: string }) => {
      setQuoteItems(prev => prev.map(it => 
        it.id === item.id 
          ? { ...it, selectedColor: v.cor, selectedImageIndex: idx }
          : it
      ));
      setColor(v.cor);
    };

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        {/* Imagem do produto */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0 h-20 w-20">
            <img
              src={src}
              alt={item.product?.titulo || "produto"}
              className="h-20 w-20 object-contain rounded-md border border-gray-200 p-1 bg-white"
              onError={onError}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {item.product.titulo}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              ID: {item.product.id}
            </p>
            {color && (
              <p className="text-xs text-blue-600 mt-1">
                Cor: {color}
              </p>
            )}
          </div>
        </div>

        {/* Seletor de cores */}
        {variacoes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Cores disponíveis:</h4>
            <div className="flex flex-wrap gap-2">
              {variacoes.map((v, index) => (
                <button
                  key={`${v.cor}-${index}`}
                  aria-pressed={color === v.cor}
                  onClick={() => onSelect(v)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === v.cor
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: getColorCode(v.cor) }}
                  title={v.cor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Remover item"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Componente ProductSearchComponent
  const ProductSearchComponent: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Produtos</h2>
      
      {/* Input de busca */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, descrição ou ID do produto..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Resultados da busca */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Buscando produtos...</p>
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3 mb-3">
                <img
                  src={getValidImageUrl(product.img_0 || '/placeholder-product.svg', [product.img_0, product.img_1, product.img_2].filter(Boolean))}
                  alt={product.titulo}
                  className="h-12 w-12 object-contain rounded border border-gray-200 p-1 bg-white"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.src.includes('placeholder-product.svg')) {
                      img.src = '/placeholder-product.svg';
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {product.titulo}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {product.id}</p>
                  {product.categoria && (
                    <p className="text-xs text-blue-600">{product.categoria}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => addToQuote(product)}
                disabled={quoteItems.some(item => item.product.id === product.id)}
                className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                {quoteItems.some(item => item.product.id === product.id) ? 'Já adicionado' : 'Adicionar ao Orçamento'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && searchTerm && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum produto encontrado para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );

  // Componente QuoteSummary
  const QuoteSummary: React.FC = () => {
    const totalItems = quoteItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Orçamento</h2>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de itens:</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Produtos únicos:</span>
            <span className="font-medium">{quoteItems.length}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            disabled={quoteItems.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Salvar Orçamento
          </button>
          
          <button
            disabled={quoteItems.length === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Enviar Orçamento
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novo Editor 2.0</h1>
        <p className="text-gray-600 mt-1">Crie e edite orçamentos com facilidade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Busca e itens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Busca de produtos */}
          <ProductSearchComponent />

          {/* Lista de itens selecionados */}
          {quoteItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Itens do Orçamento ({quoteItems.length})
              </h2>
              
              <div className="space-y-4">
                {quoteItems.map((item) => (
                  <QuoteProductCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {quoteItems.length === 0 && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <DocumentTextIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item no orçamento</h3>
              <p className="text-gray-500">Busque e adicione produtos para começar a criar seu orçamento.</p>
            </div>
          )}
        </div>

        {/* Sidebar - Resumo */}
        <div className="lg:col-span-1">
          <QuoteSummary />
        </div>
      </div>
    </div>
  );
};

export default NovoEditor2;