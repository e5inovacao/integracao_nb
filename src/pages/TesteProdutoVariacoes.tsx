import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Utility helpers (mesmos do OrcamentoForm.tsx)
const norm = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const safeParse = <T,>(data: any): T | null => {
  if (!data) return null;
  if (typeof data === 'object') return data as T;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return null;
};

// Interface para produtos reais
interface RealProduct {
  id: number;
  codigo: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
  variacoes?: any;
  cor_web_principal?: string;
}

interface ProductVariation {
  cor: string;
  imagem?: string;
  preco?: string;
}

interface TestProduct {
  id: string | number;
  name: string;
  titulo: string;
  color: string;
  selectedVariationImage: string;
  originalData: {
    img_0?: string;
    img_1?: string;
    img_2?: string;
    variacoes?: string | ProductVariation[];
  };
}

const TesteProdutoVariacoes: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para busca de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RealProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRealProduct, setSelectedRealProduct] = useState<RealProduct | null>(null);
  
  // Estados do teste (mantidos)
  const [product, setProduct] = useState<TestProduct | null>(null);
  const [imageUpdateTrigger, setImageUpdateTrigger] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  
  // Estados para diagnóstico de imagens
  const [imageDiagnosis, setImageDiagnosis] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Função para adicionar logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Buscar produtos reais com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchProducts = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('id, codigo, titulo, descricao, categoria, img_0, img_1, img_2, variacoes, cor_web_principal')
        .or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`)
        .order('titulo')
        .limit(10);

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        addLog(`Erro na busca: ${error.message}`);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
        addLog(`Encontrados ${data?.length || 0} produtos para "${searchTerm}"`);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      addLog(`Erro na busca: ${error}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Selecionar produto real para teste
  const selectProduct = (realProduct: RealProduct) => {
    addLog(`Produto selecionado: ${realProduct.titulo} (ID: ${realProduct.id})`);
    
    // Converter produto real para formato de teste
    const testProduct: TestProduct = {
      id: realProduct.id,
      name: realProduct.titulo,
      titulo: realProduct.titulo,
      color: realProduct.cor_web_principal || 'padrão',
      selectedVariationImage: '',
      originalData: {
        img_0: realProduct.img_0,
        img_1: realProduct.img_1,
        img_2: realProduct.img_2,
        variacoes: realProduct.variacoes
      }
    };

    setSelectedRealProduct(realProduct);
    setProduct(testProduct);
    setSearchResults([]);
    setSearchTerm('');
    setImageUpdateTrigger(prev => prev + 1);
    
    // Log das variações encontradas
    const variations = safeParse<ProductVariation[]>(realProduct.variacoes);
    if (variations && variations.length > 0) {
      addLog(`Variações encontradas: ${variations.length}`);
      variations.forEach((v, i) => {
        addLog(`  ${i + 1}. Cor: ${v.cor}, Preço: ${v.preco || 'N/A'}`);
      });
    } else {
      addLog('Nenhuma variação encontrada para este produto');
    }
    
    // Executar diagnóstico automático de imagens
    runImageDiagnosis();
  };

  // Função para executar diagnóstico de imagens
  const runImageDiagnosis = async () => {
    if (!selectedRealProduct) return;
    
    setIsDiagnosing(true);
    addLog('🔍 Iniciando diagnóstico de imagens...');
    
    try {
      const diagnosis = await diagnoseProductImages(selectedRealProduct);
      setImageDiagnosis(diagnosis);
      
      addLog(`📊 Diagnóstico concluído:`);
      addLog(`   • Imagens principais: ${diagnosis.summary.workingMainImages}/${diagnosis.summary.totalMainImages} funcionando`);
      addLog(`   • Imagens de variações: ${diagnosis.summary.workingVariationImages}/${diagnosis.summary.totalVariationImages} funcionando`);
      
      // Log detalhado dos problemas
      diagnosis.mainImages.forEach(img => {
        if (!img.ok) {
          addLog(`❌ ${img.field}: ${img.error || `Status ${img.status}`}`);
        }
      });
      
      diagnosis.variationImages.forEach(img => {
        if (!img.ok) {
          addLog(`❌ Variação ${img.variation}: ${img.error || `Status ${img.status}`}`);
        }
      });
      
    } catch (error) {
      addLog(`❌ Erro no diagnóstico: ${error}`);
      console.error('Erro no diagnóstico:', error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Função para obter imagem baseada na cor (com logs detalhados)
  const getImageForColor = (product: TestProduct): string => {
    console.log(`🔍 [getImageForColor] ===== INICIANDO CÁLCULO DE IMAGEM =====`);
    
    if (!product) {
      console.log(`❌ [getImageForColor] Produto não fornecido`);
      return '';
    }

    const normalizedColor = norm(product.color);
    console.log(`🎨 [getImageForColor] Cor do produto: "${product.color}" → normalizada: "${normalizedColor}"`);
    
    // Priorizar imagem selecionada da variação
    if (product.selectedVariationImage) {
      console.log(`✅ [getImageForColor] USANDO IMAGEM DA VARIAÇÃO SELECIONADA:`);
      console.log(`   📸 URL: ${product.selectedVariationImage}`);
      console.log(`🔍 [getImageForColor] ===== RESULTADO: IMAGEM DA VARIAÇÃO =====`);
      return product.selectedVariationImage;
    }

    // Tentar encontrar variação correspondente
    const variacoesData = safeParse<ProductVariation[]>(product.originalData?.variacoes);
    console.log(`📋 [getImageForColor] Variações disponíveis: ${variacoesData?.length || 0}`);
    
    if (variacoesData && Array.isArray(variacoesData)) {
      console.log(`🔍 [getImageForColor] Detalhes das variações:`);
      variacoesData.forEach((v, index) => {
        console.log(`   ${index + 1}. Cor: "${v.cor}" (normalizada: "${norm(v.cor)}") | Imagem: ${v.imagem ? `"${v.imagem}"` : 'NENHUMA'}`);
      });
      
      const matchingVariation = variacoesData.find(v => {
        const normalizedVariationColor = norm(v.cor);
        const isMatch = normalizedVariationColor === normalizedColor;
        console.log(`🔍 [getImageForColor] Comparando: "${normalizedColor}" === "${normalizedVariationColor}" → ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        return isMatch;
      });
      
      if (matchingVariation) {
        console.log(`🎯 [getImageForColor] VARIAÇÃO CORRESPONDENTE ENCONTRADA:`);
        console.log(`   🏷️ Cor: "${matchingVariation.cor}"`);
        console.log(`   💰 Preço: ${matchingVariation.preco || 'N/A'}`);
        console.log(`   📸 Imagem: ${matchingVariation.imagem || 'NENHUMA'}`);
        
        if (matchingVariation.imagem) {
          console.log(`✅ [getImageForColor] USANDO IMAGEM DA VARIAÇÃO CORRESPONDENTE: ${matchingVariation.imagem}`);
          console.log(`🔍 [getImageForColor] ===== RESULTADO: IMAGEM DA VARIAÇÃO CORRESPONDENTE =====`);
          return matchingVariation.imagem;
        } else {
          console.log(`⚠️ [getImageForColor] Variação encontrada mas SEM IMAGEM - usando fallback`);
        }
      } else {
        console.log(`❌ [getImageForColor] NENHUMA variação correspondente encontrada para cor "${normalizedColor}"`);
      }
    } else {
      console.log(`❌ [getImageForColor] Dados de variações inválidos ou vazios`);
    }

    // Fallback para imagens principais
    console.log(`🔄 [getImageForColor] USANDO FALLBACK - verificando imagens principais:`);
    console.log(`   📸 img_0: ${product.originalData?.img_0 || 'NENHUMA'}`);
    console.log(`   📸 img_1: ${product.originalData?.img_1 || 'NENHUMA'}`);
    console.log(`   📸 img_2: ${product.originalData?.img_2 || 'NENHUMA'}`);
    
    const fallbackImage = product.originalData?.img_0 || 
           product.originalData?.img_1 || 
           product.originalData?.img_2 || 
           'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRTVFN0VCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij5TZW0gSW1hZ2VtPC90ZXh0Pgo8L3N2Zz4K';
    
    const imageType = product.originalData?.img_0 ? 'img_0' : 
                     product.originalData?.img_1 ? 'img_1' : 
                     product.originalData?.img_2 ? 'img_2' : 'SVG_PLACEHOLDER';
    
    console.log(`🔄 [getImageForColor] FALLBACK SELECIONADO: ${imageType}`);
    console.log(`📸 [getImageForColor] URL final: ${fallbackImage?.substring(0, 100)}${fallbackImage?.length > 100 ? '...' : ''}`);
    console.log(`🔍 [getImageForColor] ===== RESULTADO: FALLBACK (${imageType}) =====`);
    
    return fallbackImage;
  };

  // Handler para seleção de variação (com debug completo)
  const handleColorVariationSelect = (variation: ProductVariation) => {
    console.log(`🚀 [handleColorVariationSelect] ===== INICIANDO SELEÇÃO DE VARIAÇÃO =====`);
    console.log(`📋 [handleColorVariationSelect] Variação clicada:`, variation);
    
    if (!product) {
      console.log(`❌ [handleColorVariationSelect] ERRO: Produto não existe!`);
      return;
    }

    console.log(`📋 [handleColorVariationSelect] Estado atual do produto:`, {
      name: product.name,
      color: product.color,
      selectedVariationImage: product.selectedVariationImage
    });
    
    addLog(`🎯 Variação selecionada: ${variation.cor} (Preço: ${variation.preco || 'N/A'})`);
    
    // Calcular URL da imagem atual antes da mudança
    const oldImageUrl = getImageForColor(product);
    console.log(`📸 [handleColorVariationSelect] Imagem ANTES: ${oldImageUrl}`);
    
    // SEMPRE forçar atualização, mesmo se cor for igual
    console.log(`🔄 [handleColorVariationSelect] FORÇANDO atualização (mesmo se cor igual)`);
    console.log(`🎨 [handleColorVariationSelect] Cor: "${product.color}" → "${variation.cor}"`);
    console.log(`🖼️ [handleColorVariationSelect] Imagem selecionada: "${variation.imagem || 'NENHUMA'}"`);
    
    // Atualizar produto com nova variação
    const updatedProduct = {
      ...product,
      color: variation.cor,
      selectedVariationImage: variation.imagem || ''
    };
    
    console.log(`📋 [handleColorVariationSelect] Produto atualizado:`, {
      name: updatedProduct.name,
      color: updatedProduct.color,
      selectedVariationImage: updatedProduct.selectedVariationImage
    });
    
    // Atualizar estado do produto
    setProduct(updatedProduct);
    console.log(`✅ [handleColorVariationSelect] setProduct() executado`);
    
    // SEMPRE incrementar trigger para forçar re-render
    setImageUpdateTrigger(prev => {
      const newTrigger = prev + 1;
      console.log(`🔄 [handleColorVariationSelect] FORÇANDO re-render: trigger ${prev} → ${newTrigger}`);
      return newTrigger;
    });
    
    // Verificar resultado após delay para garantir que estado foi atualizado
    setTimeout(() => {
      console.log(`⏰ [handleColorVariationSelect] ===== VERIFICANDO RESULTADO =====`);
      
      // Calcular nova imagem com produto atualizado
      const newImageUrl = getImageForColor(updatedProduct);
      console.log(`📸 [handleColorVariationSelect] Imagem DEPOIS: ${newImageUrl}`);
      
      // Comparar URLs
      const imageChanged = newImageUrl !== oldImageUrl;
      console.log(`🔍 [handleColorVariationSelect] Comparação de URLs:`);
      console.log(`   ANTES: "${oldImageUrl}"`);
      console.log(`   DEPOIS: "${newImageUrl}"`);
      console.log(`   MUDOU: ${imageChanged ? '✅ SIM' : '❌ NÃO'}`);
      
      if (imageChanged) {
        console.log(`✅ [handleColorVariationSelect] SUCESSO: Imagem alterada!`);
        addLog(`✅ Imagem alterada com sucesso para variação ${variation.cor}`);
        setTestResults(prev => ({ ...prev, [`variation_${variation.cor}`]: true }));
      } else {
        console.log(`❌ [handleColorVariationSelect] PROBLEMA: Imagem não alterou!`);
        console.log(`🔍 [handleColorVariationSelect] Possíveis causas:`);
        console.log(`   1. Variação não tem imagem própria`);
        console.log(`   2. Usando mesma imagem fallback`);
        console.log(`   3. Produto já estava na cor selecionada`);
        addLog(`⚠️ Imagem não alterou para variação ${variation.cor}`);
        setTestResults(prev => ({ ...prev, [`variation_${variation.cor}`]: false }));
      }
      
      console.log(`🚀 [handleColorVariationSelect] ===== PROCESSO CONCLUÍDO =====`);
    }, 150);
  };

  // Calcular URL da imagem com useMemo para evitar re-renders
  const imageUrl = useMemo(() => {
    console.log(`🧮 [useMemo imageUrl] RECALCULANDO...`);
    if (!product) {
      console.log(`❌ [useMemo imageUrl] Produto não existe, retornando string vazia`);
      return '';
    }
    
    console.log(`📋 [useMemo imageUrl] Produto para cálculo:`, {
      color: product.color,
      selectedVariationImage: product.selectedVariationImage,
      trigger: imageUpdateTrigger
    });
    
    const url = getImageForColor(product);
    console.log(`✅ [useMemo imageUrl] URL calculada: ${url}`);
    console.log(`🔄 [useMemo imageUrl] Dependências: color="${product?.color}", selectedImage="${product?.selectedVariationImage}", trigger=${imageUpdateTrigger}`);
    return url;
  }, [product?.color, product?.selectedVariationImage, imageUpdateTrigger]);

  // Resetar teste
  const resetTest = () => {
    setProduct(null);
    setSelectedRealProduct(null);
    setImageUpdateTrigger(0);
    setLogs([]);
    setTestResults({});
    setSearchTerm('');
    setSearchResults([]);
    setImageDiagnosis(null);
    setIsDiagnosing(false);
    addLog('Teste resetado - pronto para novo produto');
  };

  // Parse das variações para exibição
  const variacoesData = product ? safeParse<ProductVariation[]>(product.originalData?.variacoes) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Teste de Variações de Produto - Produtos Reais
              </h1>
            </div>
            <button
              onClick={resetTest}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Teste
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Painel de Busca de Produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Buscar Produto Real
              </h2>
              
              {/* Input de Busca */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome, código ou descrição do produto..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Resultados da Busca */}
              {searchResults.length > 0 && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-medium text-gray-700">
                    Produtos encontrados ({searchResults.length})
                  </h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((realProduct) => (
                      <div
                        key={realProduct.id}
                        onClick={() => selectProduct(realProduct)}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-shrink-0 h-12 w-12 mr-3">
                          {realProduct.img_0 ? (
                            <img
                              src={realProduct.img_0}
                              alt={realProduct.titulo}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">
                                {realProduct.titulo.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {realProduct.titulo}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {realProduct.codigo} • {realProduct.categoria || 'Sem categoria'}
                          </p>
                          {realProduct.descricao && (
                            <p className="text-xs text-gray-400 truncate">
                              {realProduct.descricao.substring(0, 60)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produto Selecionado */}
              {selectedRealProduct && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Produto Selecionado para Teste
                  </h3>
                  <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-shrink-0 h-12 w-12 mr-3">
                      {selectedRealProduct.img_0 ? (
                        <img
                          src={selectedRealProduct.img_0}
                          alt={selectedRealProduct.titulo}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-blue-200 flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {selectedRealProduct.titulo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedRealProduct.titulo}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {selectedRealProduct.id} • Código: {selectedRealProduct.codigo}
                      </p>
                      <p className="text-xs text-gray-500">
                        Categoria: {selectedRealProduct.categoria || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem quando nenhum produto está selecionado */}
            {!product && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6 text-center">
                <div className="text-blue-600 text-lg font-medium mb-2">
                  🔍 Selecione um produto primeiro
                </div>
                <p className="text-blue-700">
                  Para testar as variações de cor, você precisa primeiro pesquisar e selecionar um produto na lista acima.
                </p>
              </div>
            )}

            {/* Painel Principal do Produto (só aparece quando produto selecionado) */}
            {product && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Teste de Variações - {product.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Imagem do Produto */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                      <img
                        key={`product-image-${imageUpdateTrigger}`}
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onLoad={() => {
                            console.log(`🖼️ [Imagem] CARREGADA COM SUCESSO: ${imageUrl}`);
                            addLog(`✅ Imagem carregada com sucesso`);
                          }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.log(`❌ [Imagem] ERRO ao carregar: ${imageUrl}`);
                          addLog(`❌ Erro ao carregar imagem: ${imageUrl}`);
                          target.style.display = 'none';
                          // Mostrar placeholder quando a imagem falha
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-100"
                        style={{ display: 'none' }}
                      >
                        <div className="text-4xl mb-2">🚫</div>
                        <p className="text-sm font-medium">Imagem não disponível</p>
                        <p className="text-xs text-gray-400 mt-1 px-2 break-all">
                          {imageUrl}
                        </p>
                        <div className="mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                          Erro de carregamento
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Cor atual: <span className="font-medium">{product.color}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Trigger: {imageUpdateTrigger}
                      </p>
                      <p className="text-xs text-gray-400 break-all">
                        URL: {imageUrl.substring(0, 80)}{imageUrl.length > 80 ? '...' : ''}
                      </p>
                      {!imageUrl && (
                        <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded">
                          Sem imagem no banco de dados
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações e Variações */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">ID: {product.id}</p>
                    </div>

                    {/* Variações Disponíveis */}
                    {variacoesData && variacoesData.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Variações Disponíveis ({variacoesData.length})
                        </h4>
                        <div className="space-y-2">
                          {variacoesData.map((variation, index) => (
                            <label
                              key={`${variation.cor}-${index}`}
                              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="radio"
                                name="color-variation"
                                value={variation.cor}
                                checked={norm(product.color) === norm(variation.cor)}
                                onChange={() => {
                                  console.log(`🔘 [Radio Button] ===== CLIQUE NO RADIO BUTTON =====`);
                                  console.log(`🎯 [Radio Button] Variação clicada: "${variation.cor}"`);
                                  console.log(`🎨 [Radio Button] Cor atual: "${product.color}"`);
                                  console.log(`🔍 [Radio Button] Normalização: "${norm(product.color)}" === "${norm(variation.cor)}" = ${norm(product.color) === norm(variation.cor)}`);
                                  console.log(`📋 [Radio Button] Dados completos da variação:`, {
                                    cor: variation.cor,
                                    preco: variation.preco,
                                    imagem: variation.imagem,
                                    hasImage: !!variation.imagem
                                  });
                                  console.log(`🖼️ [Radio Button] URL da imagem: ${variation.imagem ? `"${variation.imagem}"` : 'NENHUMA IMAGEM'}`);
                                  console.log(`✅ [Radio Button] Chamando handleColorVariationSelect...`);
                                  handleColorVariationSelect(variation);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="ml-3 flex items-center space-x-3 flex-1">
                                <div className="flex-shrink-0">
                                  {variation.imagem ? (
                                    <img
                                      src={variation.imagem}
                                      alt={variation.cor}
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-500">
                                        {variation.cor.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {variation.cor}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Normalizado: {norm(variation.cor)} | Preço: {variation.preco || 'N/A'}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    Imagem: {variation.imagem ? '✅ Disponível' : '❌ Não disponível'}
                                  </div>
                                  {variation.imagem && (
                                    <div className="text-xs text-gray-400 truncate max-w-xs">
                                      URL: {variation.imagem.substring(0, 60)}{variation.imagem.length > 60 ? '...' : ''}
                                    </div>
                                  )}
                                </div>
                                {testResults[`variation_${variation.cor}`] !== undefined && (
                                  <div className="flex-shrink-0">
                                    {testResults[`variation_${variation.cor}`] ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Nenhuma variação encontrada para este produto</p>
                        <p className="text-xs mt-1">
                          Verifique se o campo 'variacoes' contém dados válidos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Painel de Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Logs de Debug
                </h3>
                {selectedRealProduct && (
                  <button
                    onClick={runImageDiagnosis}
                    disabled={isDiagnosing}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDiagnosing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Diagnosticar
                  </button>
                )}
              </div>
              
              {/* Resumo do Diagnóstico */}
              {imageDiagnosis && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Resumo do Diagnóstico</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div>
                      🖼️ Imagens principais: {imageDiagnosis.summary.workingMainImages}/{imageDiagnosis.summary.totalMainImages} funcionando
                    </div>
                    <div>
                      🎨 Imagens de variações: {imageDiagnosis.summary.workingVariationImages}/{imageDiagnosis.summary.totalVariationImages} funcionando
                    </div>
                    {(imageDiagnosis.summary.totalMainImages === 0 && imageDiagnosis.summary.totalVariationImages === 0) && (
                      <div className="text-red-600 font-medium">
                        ⚠️ Nenhuma imagem encontrada neste produto!
                      </div>
                    )}
                  </div>
                  
                  {/* Detalhes das imagens testadas */}
                  <div className="mt-3 space-y-2">
                    {imageDiagnosis.mainImages.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-blue-900 mb-1">Imagens Principais:</div>
                        {imageDiagnosis.mainImages.map((img, idx) => (
                          <div key={idx} className="text-xs text-blue-700 ml-2">
                            {img.ok ? '✅' : '❌'} {img.field}: Status {img.status}
                            {img.error && <span className="text-red-600"> - {img.error}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {imageDiagnosis.variationImages.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-blue-900 mb-1">Imagens de Variações:</div>
                        {imageDiagnosis.variationImages.map((img, idx) => (
                          <div key={idx} className="text-xs text-blue-700 ml-2">
                            {img.ok ? '✅' : '❌'} {img.variation}: Status {img.status}
                            {img.error && <span className="text-red-600"> - {img.error}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                <div className="space-y-1 text-xs font-mono">
                  {logs.length === 0 ? (
                    <p className="text-gray-500">Nenhum log ainda...</p>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.includes('✅') ? 'text-green-600' :
                          log.includes('⚠️') ? 'text-yellow-600' :
                          log.includes('❌') || log.includes('Erro') ? 'text-red-600' :
                          log.includes('🔍') || log.includes('📊') ? 'text-blue-600' :
                          'text-gray-700'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesteProdutoVariacoes;

// Função para testar conectividade de URLs de imagens
const testImageUrl = async (url: string): Promise<{ url: string; status: number; ok: boolean; error?: string }> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

// Função para diagnóstico completo de imagens
const diagnoseProductImages = async (product: RealProduct): Promise<{
  mainImages: { field: string; url: string; status: number; ok: boolean; error?: string }[];
  variationImages: { variation: string; url: string; status: number; ok: boolean; error?: string }[];
  summary: {
    totalMainImages: number;
    workingMainImages: number;
    totalVariationImages: number;
    workingVariationImages: number;
  };
}> => {
  console.log('🔍 Iniciando diagnóstico completo de imagens para produto:', product.codigo);
  
  const mainImages = [];
  const variationImages = [];
  
  // Testar imagens principais
  for (const field of ['img_0', 'img_1', 'img_2'] as const) {
    const url = product[field];
    if (url) {
      console.log(`📸 Testando ${field}:`, url);
      const result = await testImageUrl(url);
      mainImages.push({ field, ...result });
      console.log(`   ${result.ok ? '✅' : '❌'} Status: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
    }
  }
  
  // Testar imagens de variações
  if (product.variacoes) {
    try {
      const variations = safeParse<ProductVariation[]>(product.variacoes) || [];
      console.log(`🎨 Testando ${variations.length} variações...`);
      
      for (const [index, variation] of variations.entries()) {
        if (variation.imagem) {
          console.log(`   Variação ${index + 1} (${variation.cor}):`, variation.imagem);
          const result = await testImageUrl(variation.imagem);
          variationImages.push({ variation: `${variation.cor} (${index + 1})`, ...result });
          console.log(`   ${result.ok ? '✅' : '❌'} Status: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar variações:', error);
    }
  }
  
  const summary = {
    totalMainImages: mainImages.length,
    workingMainImages: mainImages.filter(img => img.ok).length,
    totalVariationImages: variationImages.length,
    workingVariationImages: variationImages.filter(img => img.ok).length
  };
  
  console.log('📊 Resumo do diagnóstico:', summary);
  
  return { mainImages, variationImages, summary };
};