import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Grid, List, ChevronDown, ChevronUp, Star, Leaf, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SearchComponent from '../components/SearchComponent';
import SEOHead from '../components/SEOHead';
import { Product, ProductCategory, SustainabilityFeature } from '../../shared/types';
import { PRODUCT_CATEGORIES, SUSTAINABILITY_FEATURES } from '../constants';
import { productsApi } from '../services/api';

interface CatalogState {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

// Dados mockados removidos - agora usando API

type SortOption = 'name' | 'featured';
type ViewMode = 'grid' | 'list';

// Definição das categorias hierárquicas
interface CategoryItem {
  id: string;
  name: string;
  subcategories: string[];
}

const HIERARCHICAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'escrita-papelaria',
    name: 'Escrita e Papelaria Sustentável',
    subcategories: [
      'Canetas ecológicas',
      'Lápis e estojos ecológicos',
      'Cadernos e blocos de anotações',
      'Agendas e post-its sustentáveis'
    ]
  },
  {
    id: 'bolsas-mochilas',
    name: 'Bolsas, Mochilas e Sacolas',
    subcategories: [
      'Ecobags',
      'Sacolas recicladas',
      'Mochilas sustentáveis',
      'Necessaires ecológicas'
    ]
  },
  {
    id: 'utensilios-diarios',
    name: 'Utensílios de Uso Diário',
    subcategories: [
      'Copos reutilizáveis',
      'Garrafas e squeezes',
      'Canudos reutilizáveis',
      'Talheres e kits refeição'
    ]
  },
  {
    id: 'tecnologia-eletronicos',
    name: 'Tecnologia e Eletrônicos Sustentáveis',
    subcategories: [
      'Pen drives ecológicos',
      'Caixas de som sustentáveis',
      'Carregadores solares',
      'Suportes para celular'
    ]
  },
  {
    id: 'casa-bem-estar',
    name: 'Casa e Bem-estar',
    subcategories: [
      'Velas naturais',
      'Kits de jardinagem',
      'Produtos de higiene natural',
      'Difusores e aromatizadores'
    ]
  },
  {
    id: 'moda-acessorios',
    name: 'Moda e Acessórios Ecológicos',
    subcategories: [
      'Camisetas orgânicas',
      'Bonés e chapéus sustentáveis',
      'Pulseiras e chaveiros',
      'Óculos e relógios de bambu'
    ]
  },
  {
    id: 'brindes-escritorio',
    name: 'Brindes de Escritório',
    subcategories: [
      'Suportes para notebook',
      'Organizadores de mesa',
      'Porta-cartões e crachás',
      'Relógios de mesa'
    ]
  },
  {
    id: 'kits-especiais',
    name: 'Kits Especiais',
    subcategories: [
      'Kits corporativos',
      'Kits de bem-estar',
      'Kits de escritório',
      'Kits de viagem'
    ]
  }
];

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para o sistema de categorias hierárquico
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedHierarchicalCategory, setSelectedHierarchicalCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  
  // Estado para dados da API
  const [catalogState, setCatalogState] = useState<CatalogState>({
    products: [],
    loading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });
  
  // Estado para controle de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [isPageChanging, setIsPageChanging] = useState(false);

  // Sincronizar com URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    const urlFeatures = searchParams.get('features');
    const urlSort = searchParams.get('sort');
    
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory as ProductCategory | 'all');
    }
    if (urlFeatures) {
      const features = urlFeatures.split(',').filter(Boolean);
      if (JSON.stringify(features) !== JSON.stringify(selectedFeatures)) {
        setSelectedFeatures(features);
      }
    }
    if (urlSort && urlSort !== sortBy) {
      setSortBy(urlSort as SortOption);
    }
  }, [searchParams]);

  // Atualizar URL quando filtros mudam
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('search', searchTerm);
    if (selectedCategory !== 'all') newParams.set('category', selectedCategory);
    if (selectedFeatures.length > 0) newParams.set('features', selectedFeatures.join(','));
    if (sortBy !== 'featured') newParams.set('sort', sortBy);
    
    setSearchParams(newParams, { replace: true });
  }, [searchTerm, selectedCategory, selectedFeatures, sortBy, setSearchParams]);

  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setCatalogState(prev => ({ ...prev, loading: true, error: null }));
        
        const params: any = {
          sort: sortBy === 'featured' ? 'featured' : 'name',
          page: currentPage,
          limit: itemsPerPage
        };
        
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        
        if (selectedFeatures.length > 0) {
          params.features = selectedFeatures.join(',');
        }

        if (searchTerm) {
          params.search = searchTerm;
        }
        
        const response = await productsApi.getProducts(params);
        
        if (response.success && response.data) {
          const { items, pagination } = response.data;
          
          setCatalogState(prev => ({
            ...prev,
            products: items || [],
            loading: false,
            error: null,
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalProducts: pagination.totalItems
          }));
          setIsPageChanging(false);
        } else {
          throw new Error('Erro ao carregar produtos');
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setCatalogState(prev => ({
          ...prev,
          products: [],
          loading: false,
          error: 'Erro ao carregar produtos. Tente novamente.',
          totalPages: 1,
          totalProducts: 0
        }));
        setIsPageChanging(false);
      }
    };

    loadProducts();
  }, [selectedCategory, sortBy, selectedFeatures, searchTerm, currentPage]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = catalogState.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrar por categoria hierárquica
      let matchesHierarchicalCategory = true;
      if (selectedHierarchicalCategory) {
        const categoryMapping: { [key: string]: string[] } = {
          'escrita-papelaria': ['canetas', 'lapis', 'cadernos', 'agendas'],
          'bolsas-mochilas': ['bolsas', 'mochilas', 'sacolas'],
          'utensilios-diarios': ['copos', 'garrafas', 'canudos', 'talheres'],
          'tecnologia-eletronicos': ['pen-drives', 'caixas-som', 'carregadores', 'suportes'],
          'casa-bem-estar': ['velas', 'jardinagem', 'higiene', 'difusores'],
          'moda-acessorios': ['camisetas', 'bones', 'pulseiras', 'oculos'],
          'brindes-escritorio': ['suportes-notebook', 'organizadores', 'porta-cartoes', 'relogios'],
          'kits-especiais': ['kits-corporativos', 'kits-bem-estar', 'kits-escritorio', 'kits-viagem']
        };
        
        const mappedCategories = categoryMapping[selectedHierarchicalCategory] || [];
        if (mappedCategories.length > 0) {
          matchesHierarchicalCategory = mappedCategories.some(cat => 
            product.category?.toLowerCase().includes(cat) ||
            product.name.toLowerCase().includes(cat) ||
            product.description?.toLowerCase().includes(cat)
          );
        }
      }

      // Filtrar por subcategoria
      let matchesSubcategory = true;
      if (selectedSubcategory) {
        matchesSubcategory = product.name.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
                           product.description?.toLowerCase().includes(selectedSubcategory.toLowerCase());
      }
      
      const matchesFeatures = selectedFeatures.length === 0 || 
                            selectedFeatures.every(feature => 
                              product.sustainabilityFeatures.includes(feature as SustainabilityFeature)
                            );
      
      return matchesSearch && matchesHierarchicalCategory && matchesSubcategory && matchesFeatures;
    });

    // A ordenação já é feita pela API, mas mantemos para filtros locais
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'featured') {
      filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }, [catalogState.products, searchTerm, selectedHierarchicalCategory, selectedSubcategory, selectedFeatures, sortBy]);

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Funções para controlar categorias hierárquicas
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    if (selectedHierarchicalCategory === categoryId) {
      setSelectedHierarchicalCategory('');
      setSelectedSubcategory('');
    } else {
      setSelectedHierarchicalCategory(categoryId);
      setSelectedSubcategory('');
      // Expandir automaticamente quando selecionar
      if (!expandedCategories.includes(categoryId)) {
        setExpandedCategories(prev => [...prev, categoryId]);
      }
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    if (selectedSubcategory === subcategory) {
      setSelectedSubcategory('');
    } else {
      setSelectedSubcategory(subcategory);
    }
  };

  // Funções de navegação removidas - sem paginação

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, selectedFeatures, sortBy]);
  
  // Funções de navegação de página
  const handlePageChange = async (page: number) => {
    if (page === currentPage || isPageChanging) return;
    
    setIsPageChanging(true);
    setCurrentPage(page);
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1 && !isPageChanging) {
      handlePageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < catalogState.totalPages && !isPageChanging) {
      handlePageChange(currentPage + 1);
    }
  };

  const catalogStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Brindes Sustentáveis",
    "description": "Catálogo completo de brindes ecológicos e sustentáveis para empresas",
    "url": "https://naturezabrindes.com.br/catalogo",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": catalogState.totalProducts,
      "itemListElement": filteredAndSortedProducts.slice(0, 10).map((product, index) => ({
        "@type": "Product",
        "position": index + 1,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "offers": {
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "BRL"
        }
      }))
    }
  };

  // Gerar título dinâmico baseado nos filtros
  const generateTitle = () => {
    let title = "Catálogo de Brindes Sustentáveis";
    if (selectedCategory !== 'all') {
      const categoryName = PRODUCT_CATEGORIES.find(cat => cat.id === selectedCategory)?.name;
      if (categoryName) {
        title = `${categoryName} - Brindes Sustentáveis`;
      }
    }
    if (searchTerm) {
      title = `${searchTerm} - Brindes Sustentáveis`;
    }
    return `${title} | Natureza Brindes`;
  };

  // Gerar descrição dinâmica
  const generateDescription = () => {
    let description = "Explore nosso catálogo completo de brindes sustentáveis e ecológicos. Mais de 500 produtos personalizados para empresas que valorizam a sustentabilidade.";
    if (selectedCategory !== 'all') {
      const categoryName = PRODUCT_CATEGORIES.find(cat => cat.id === selectedCategory)?.name;
      if (categoryName) {
        description = `Descubra nossa seleção de ${categoryName.toLowerCase()} sustentáveis. Produtos ecológicos personalizados para sua empresa.`;
      }
    }
    if (searchTerm) {
      description = `Resultados da busca por "${searchTerm}" em nosso catálogo de brindes sustentáveis e ecológicos.`;
    }
    return description;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={generateTitle()}
        description={generateDescription()}
        keywords="catálogo brindes sustentáveis, produtos ecológicos, brindes personalizados, sustentabilidade empresarial, brindes corporativos ecológicos"
        url="/catalogo"
        type="website"
        structuredData={catalogStructuredData}
      />
      {/* Header do Catálogo */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-gray-600">Descubra nossa linha completa de brindes sustentáveis</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de Filtros */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">


              {/* Categorias Hierárquicas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorias
                </label>
                <div className="space-y-2">
                  {/* Botão para limpar seleção */}
                  <button
                    onClick={() => {
                      setSelectedHierarchicalCategory('');
                      setSelectedSubcategory('');
                      setExpandedCategories([]);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                      !selectedHierarchicalCategory && !selectedSubcategory
                        ? 'bg-green-100 text-green-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Todas as Categorias
                  </button>
                  
                  {/* Categorias hierárquicas */}
                  {HIERARCHICAL_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id);
                    const isSelected = selectedHierarchicalCategory === category.id;
                    
                    return (
                      <div key={category.id} className="space-y-1">
                        {/* Categoria principal */}
                        <div className="flex items-center">
                          <button
                            onClick={() => handleCategorySelect(category.id)}
                            className={`flex-1 text-left px-3 py-2 rounded-md transition-colors text-sm ${
                              isSelected
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {category.name}
                          </button>
                          <button
                            onClick={() => toggleCategoryExpansion(category.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        
                        {/* Subcategorias */}
                        {isExpanded && (
                          <div className="ml-4 space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <button
                                key={subcategory}
                                onClick={() => handleSubcategorySelect(subcategory)}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                                  selectedSubcategory === subcategory
                                    ? 'bg-green-50 text-green-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


            </div>
          </div>

          {/* Área Principal */}
          <div className="flex-1">
            {/* Barra de Controles */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 relative">
              {/* Loading overlay para mudanças de página */}
              {isPageChanging && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600">Carregando página...</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  
                  <div className="flex-1 max-w-md">
                    <SearchComponent
                      onSearchChange={setSearchTerm}
                      placeholder="Buscar produtos..."
                      showSuggestions={false}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Ordenação */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="featured">Destaques</option>
                      <option value="name">Nome A-Z</option>
                    </select>
                  </div>

                  {/* Modo de Visualização */}
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid/Lista de Produtos */}
            {catalogState.loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando produtos...</p>
                </div>
              </div>
            ) : catalogState.error ? (
              <div className="text-center py-12">
                <p className="text-red-600 text-lg mb-2">{catalogState.error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros ou termos de busca</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {filteredAndSortedProducts.map((product, index) => (
                  <Link 
                    key={`${product.id}-${index}`} 
                    to={`/produto/${product.id}`}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <Card padding="none" className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      viewMode === 'list' ? 'flex flex-row' : 'flex flex-col h-[480px]'
                    } ${
                      product.isEcological ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-white' : ''
                    }`}>
                      <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                        <div className={`bg-gray-100 rounded-lg overflow-hidden relative ${
                          viewMode === 'list' ? 'aspect-square' : 'aspect-square'
                        }`}>
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzExNi41NjkgMTMwIDEzMCAxMTYuNTY5IDEzMCAxMDBDMTMwIDgzLjQzMTUgMTE2LjU2OSA3MCAxMDAgNzBDODMuNDMxNSA3MCA3MCA4My40MzE1IDcwIDEwMEM3MCAxMTYuNTY5IDgzLjQzMTUgMTMwIDEwMCAxMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                            }}
                          />
                          
                          {/* Badges sobrepostos */}
                          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                            {product.isEcological && (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center gap-1">
                                <Leaf className="w-3 h-3" />
                                Ecológico
                              </Badge>
                            )}
                            
                            {product.featured && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg flex items-center gap-1 ml-auto">
                                <Award className="w-3 h-3" />
                                Destaque
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'ml-4' : ''}`}>
                        <Card.Content className="p-6 flex-1 flex flex-col">
                          {/* Título do produto */}
                          <div className="mb-3">
                            <h3 className="text-lg font-bold group-hover:opacity-90 transition-colors leading-tight line-clamp-2" style={{color: '#2CB20B'}}>
                              {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
                            </h3>
                          </div>
                          
                          {/* Botão de ação - posicionado abaixo do título */}
                          <div className="mb-4">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="w-full font-medium"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Aqui você pode adicionar a lógica para solicitar orçamento
                                console.log('Solicitar orçamento para:', product.name);
                              }}
                            >
                              Solicitar Orçamento
                            </Button>
                          </div>
                          
                          {/* Badges de sustentabilidade */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {product.sustainabilityFeatures.slice(0, 2).map(featureId => {
                              const feature = SUSTAINABILITY_FEATURES.find(f => f.id === featureId);
                              return feature ? (
                                <Badge key={featureId} variant="success" size="sm">
                                  {feature.name}
                                </Badge>
                              ) : null;
                            })}
                            {product.sustainabilityFeatures.length > 2 && (
                              <Badge variant="secondary" size="sm">
                                +{product.sustainabilityFeatures.length - 2}
                              </Badge>
                            )}
                          </div>
                        </Card.Content>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Controles de Paginação */}
            {catalogState.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Informações da página */}
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, catalogState.totalProducts)} de {catalogState.totalProducts} produtos
                  </div>
                  
                  {/* Controles de navegação */}
                  <div className="flex items-center gap-2">
                    {/* Botão Anterior */}
                    <Button
                       variant="outline"
                       size="sm"
                       onClick={handlePreviousPage}
                       disabled={currentPage === 1 || catalogState.loading || isPageChanging}
                       className="flex items-center gap-2"
                     >
                       <ChevronLeft className="w-4 h-4" />
                       Anterior
                     </Button>
                    
                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {/* Primeira página */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            1
                          </Button>
                          {currentPage > 4 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                        </>
                      )}
                      
                      {/* Páginas próximas à atual */}
                      {Array.from({ length: Math.min(5, catalogState.totalPages) }, (_, i) => {
                        let pageNum;
                        if (catalogState.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= catalogState.totalPages - 2) {
                          pageNum = catalogState.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > catalogState.totalPages) return null;
                        if (catalogState.totalPages > 5 && currentPage > 3 && pageNum === 1) return null;
                        if (catalogState.totalPages > 5 && currentPage < catalogState.totalPages - 2 && pageNum === catalogState.totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {/* Última página */}
                      {currentPage < catalogState.totalPages - 2 && catalogState.totalPages > 5 && (
                        <>
                          {currentPage < catalogState.totalPages - 3 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={catalogState.totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(catalogState.totalPages)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            {catalogState.totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Botão Próxima */}
                    <Button
                       variant="outline"
                       size="sm"
                       onClick={handleNextPage}
                       disabled={currentPage === catalogState.totalPages || catalogState.loading || isPageChanging}
                       className="flex items-center gap-2"
                     >
                       Próxima
                       <ChevronRight className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}