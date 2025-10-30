import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { getValidImageUrl, isValidImageUrl } from '../utils/imageUtils';

// Interfaces
interface ProductVariation {
  cor: string;
  tamanho?: string;
  preco?: string;
  imagem?: string;
}

interface Product {
  id: number;
  titulo: string;
  descricao?: string;
  categoria?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
  variacoes?: string | ProductVariation[];
  selectedColor?: string;
  selectedVariationImage?: string;
}

// Função de normalização (reutilizada do OrcamentoForm)
const norm = (str?: string): string => {
  return str?.toLowerCase().trim().replace(/\s+/g, '') || '';
};

export default function NovoEditor() {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0);

  // Buscar produtos do Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('id, titulo, descricao, categoria, img_0, img_1, img_2, variacoes')
        .order('titulo');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        setProducts([]);
      } else {
        console.log('Produtos carregados:', data);
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos baseado no termo de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => 
      product.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Carregar produtos na inicialização
  useEffect(() => {
    fetchProducts();
  }, []);

  // Função para obter imagem baseada na cor (reutilizada do OrcamentoForm)
  const getImageForColor = (product: Product): string => {
    const fallback = product.img_0 || product.img_1 || product.img_2 || '/placeholder-product.svg';
    
    const colorKey = norm(product.selectedColor);
    if (!colorKey) return getValidImageUrl(fallback, [product.img_1 || '', product.img_2 || '']);

    let variacoes = product.variacoes;
    
    if (!variacoes) return getValidImageUrl(fallback, [product.img_1 || '', product.img_2 || '']);

    // Parse JSON se necessário
    if (typeof variacoes === 'string') {
      try {
        variacoes = JSON.parse(variacoes);
      } catch (error) {
        console.error('Error parsing variations:', error);
        return getValidImageUrl(fallback, [product.img_1 || '', product.img_2 || '']);
      }
    }

    if (!Array.isArray(variacoes)) return getValidImageUrl(fallback, [product.img_1 || '', product.img_2 || '']);

    const variation = variacoes.find((v: ProductVariation) => norm(v?.cor) === colorKey);
    const imageUrl = variation?.imagem || fallback;
    
    console.log('getImageForColor result:', {
      productId: product.id,
      color: product.selectedColor,
      colorKey,
      foundVariation: variation,
      imageUrl,
      allVariations: variacoes
    });
    
    return getValidImageUrl(imageUrl, [product.img_0 || '', product.img_1 || '', product.img_2 || '']);
  };

  // Handler para seleção de cor
  const handleColorVariationSelect = (product: Product, variacao: ProductVariation) => {
    const newColor = variacao?.cor ?? '';
    const newImage = variacao?.imagem ?? '';

    console.log('Color variation selected:', {
      productId: product.id,
      newColor,
      newImage,
      variacao,
      currentColor: product.selectedColor,
      currentImage: product.selectedVariationImage
    });

    // Atualizar produto com nova cor e imagem
    setFilteredProducts(prev => {
      const updated = prev.map(p => 
        p.id === product.id 
          ? {
              ...p,
              selectedColor: newColor,
              selectedVariationImage: newImage
            }
          : p
      );
      
      console.log('Updated products:', updated.find(p => p.id === product.id));
      return updated;
    });

    // Incrementar trigger para forçar re-render da imagem
    setImageUpdateTrigger(prev => {
      const newTrigger = prev + 1;
      console.log('Image update trigger:', newTrigger);
      return newTrigger;
    });
  };

  // Obter variações de um produto
  const getProductVariations = (product: Product): ProductVariation[] => {
    let variacoes = product.variacoes;
    
    if (!variacoes) return [];

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Editor</h1>
          <p className="text-gray-600">Pesquise produtos e visualize suas variações de cor</p>
        </div>

        {/* Campo de Pesquisa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Digite o nome do produto, descrição ou categoria..."
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Indicador de Loading */}
          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Carregando produtos...
              </div>
            </div>
          )}
        </div>

        {/* Resultados da Pesquisa */}
        {searchTerm && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados da Pesquisa
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''})
                </span>
              </h2>
            </div>

            <div className="p-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tente pesquisar com outros termos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const variations = getProductVariations(product);
                    
                    // Criar uma chave única que muda quando a cor ou imagem muda
                    const imageKey = `img-${product.id}-${product.selectedColor || 'none'}-${product.selectedVariationImage || 'none'}-${imageUpdateTrigger}`;
                    
                    // ✅ CORREÇÃO: Sempre usar getImageForColor que tem a lógica completa
                    const imageUrl = getImageForColor(product);

                    console.log('Rendering product:', {
                      id: product.id,
                      selectedColor: product.selectedColor,
                      selectedVariationImage: product.selectedVariationImage,
                      imageKey,
                      imageUrl,
                      trigger: imageUpdateTrigger
                    });

                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Imagem do Produto */}
                        <div className="aspect-square mb-4 bg-gray-50 rounded-lg overflow-hidden">
                          <img
                            key={imageKey}
                            src={imageUrl}
                            alt={product.titulo}
                            className="w-full h-full object-contain transition-all duration-300"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              console.log('Image error for:', imageUrl);
                              
                              // Tentar fallbacks em ordem
                              const fallbacks = [
                                product.img_0,
                                product.img_1, 
                                product.img_2,
                                '/placeholder-product.svg'
                              ].filter(Boolean);
                              
                              for (const fallback of fallbacks) {
                                if (fallback && isValidImageUrl(fallback) && target.src !== fallback) {
                                  console.log('Trying fallback:', fallback);
                                  target.src = fallback;
                                  return;
                                }
                              }
                              
                              // Se chegou aqui, usar placeholder
                              if (target.src !== '/placeholder-product.svg') {
                                target.src = '/placeholder-product.svg';
                              }
                            }}
                          />
                        </div>

                        {/* Informações do Produto */}
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                            {product.titulo}
                          </h3>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                          {product.selectedColor && (
                            <p className="text-xs text-blue-600 mt-1">
                              Cor selecionada: {product.selectedColor}
                            </p>
                          )}
                        </div>

                        {/* Variações de Cor */}
                        {variations.length > 0 && (
                          <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              Variações Disponíveis ({variations.length})
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {variations.map((variacao, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center space-x-2 p-2 rounded border transition-colors cursor-pointer ${
                                    product.selectedColor === variacao.cor
                                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                                      : 'border-gray-100 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleColorVariationSelect(product, variacao)}
                                >
                                  <input
                                    type="radio"
                                    name={`variacao-${product.id}`}
                                    checked={product.selectedColor === variacao.cor}
                                    onChange={() => {}} // Handled by onClick
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  
                                  {/* Miniatura da Variação */}
                                  <div className="flex-shrink-0 h-8 w-8">
                                    {variacao.imagem && isValidImageUrl(variacao.imagem) ? (
                                      <img
                                        src={getValidImageUrl(variacao.imagem)}
                                        alt={variacao.cor}
                                        className="h-8 w-8 object-cover rounded border border-gray-200"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          console.log('Erro ao carregar imagem da variação:', variacao.imagem);
                                          target.style.display = 'none';
                                          target.parentElement!.innerHTML = `<div class="h-8 w-8 bg-gray-200 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">${variacao.cor.charAt(0).toUpperCase()}</div>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="h-8 w-8 bg-gray-200 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                        {variacao.cor.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Label da Variação */}
                                  <div className="flex-1 text-xs text-gray-700">
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
                                  </div>
                                  
                                  {/* Indicador de Seleção */}
                                  {product.selectedColor === variacao.cor && (
                                    <div className="flex-shrink-0">
                                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Caso não tenha variações */}
                        {variations.length === 0 && (
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs text-gray-500 text-center py-2">
                              Nenhuma variação disponível
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado inicial - sem pesquisa */}
        {!searchTerm && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Comece sua pesquisa
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Digite o nome de um produto, descrição ou categoria no campo de pesquisa acima para visualizar os produtos e suas variações de cor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}