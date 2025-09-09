import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Leaf,
  Recycle,
  TreePine,
  Shield,
  Star,
  Users,
  Award,
  CheckCircle,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { SUSTAINABILITY_FEATURES, PRODUCT_CATEGORIES } from '../constants';
import { Product } from '../../shared/types';
import { productsApi } from '../services/api';
import SEOHead from '../components/SEOHead';

interface HomeState {
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
}

const Home: React.FC = () => {
  const [state, setState] = useState<HomeState>({
    featuredProducts: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await productsApi.getFeaturedProducts(4);
        if (response.success) {
          setState(prev => ({ ...prev, featuredProducts: response.data || [], loading: false }));
        } else {
          throw new Error(response.error || 'Erro ao carregar produtos');
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erro ao carregar produtos em destaque', 
          loading: false 
        }));
      }
    };

    loadFeaturedProducts();
  }, []);

  // Dados mockados removidos - agora usando API

  const stats = [
    { icon: Users, value: '500+', label: 'Clientes Satisfeitos' },
    { icon: Award, value: '1000+', label: 'Produtos Entregues' },
    { icon: Leaf, value: '100%', label: 'Sustentáveis' },
    { icon: CheckCircle, value: '5 Anos', label: 'de Experiência' },
  ];

  const getSustainabilityIcon = (featureId: string) => {
    const feature = SUSTAINABILITY_FEATURES.find(f => f.id === featureId);
    const icons: Record<string, React.ComponentType<any>> = {
      Leaf,
      Recycle,
      TreePine,
      CloudSnow: Shield,
    };
    return feature ? icons[feature.icon] || Leaf : Leaf;
  };

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Natureza Brindes",
    "description": "Especialista em brindes sustentáveis e ecológicos para empresas",
    "url": "https://naturezabrindes.com.br",
    "logo": "https://naturezabrindes.com.br/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-99999-9999",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      "https://www.instagram.com/naturezabrindes",
      "https://www.linkedin.com/company/naturezabrindes"
    ]
  };

  return (
    <div className="animate-fade-in">
      <SEOHead
        title="Natureza Brindes - Brindes Sustentáveis e Ecológicos"
        description="Fortaleça sua marca com brindes sustentáveis e ecológicos. Mais de 500 produtos personalizados para empresas que se preocupam com o meio ambiente. Orçamento gratuito!"
        keywords="brindes sustentáveis, brindes ecológicos, produtos personalizados, brindes corporativos, meio ambiente, sustentabilidade, brindes empresariais, produtos ecológicos"
        url="/"
        type="website"
        structuredData={homeStructuredData}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-green-50 to-white">
        <div className="container-custom section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge variant="success" icon={<Leaf size={14} />}>
                  100% Sustentável
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Brindes <span className="text-gradient">Ecológicos</span> para sua Empresa
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Fortaleça sua marca com produtos sustentáveis que demonstram
                  responsabilidade ambiental e inovação. Mais de 500 opções
                  ecológicas para impressionar seus clientes.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" icon={<Search size={20} />}>Ver Catálogo</Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  icon={<ArrowRight size={20} />}
                  iconPosition="right"
                >
                  Solicitar Orçamento
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <IconComponent className="text-primary" size={24} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=collection%20of%20eco-friendly%20corporate%20gifts%20bamboo%20products%20recycled%20materials%20sustainable%20branding%20items&image_size=square_hd"
                  alt="Produtos Sustentáveis Natureza Brindes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Produtos 100% Sustentáveis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conheça alguns dos nossos produtos mais populares, todos com
              certificação de sustentabilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {state.loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} padding="none" className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  <Card.Content className="p-4">
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </Card.Content>
                  <Card.Footer className="p-4 pt-0">
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </Card.Footer>
                </Card>
              ))
            ) : state.error ? (
              <div className="col-span-full text-center py-8">
                <p className="text-red-600 mb-4">{state.error}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : (
              state.featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <Card hover padding="none" className={`group ${product.isEcological ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-white' : ''}`}>
                <div className="aspect-square overflow-hidden rounded-t-lg relative">

                  <img
                    src={product.images?.[0] || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20product%20sustainable%20corporate%20gift&image_size=square'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <Card.Content className="p-4">
                  <div className="space-y-3">

                    
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Informações especiais para produtos XBZ */}
                    {product.isEcological && product.ecologicalClassification && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-green-700 text-xs font-medium">
                          <Award className="w-3 h-3" />
                          {product.ecologicalClassification}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {product.featured && (
                        <Badge variant="success" size="sm">Destaque</Badge>
                      )}
                    </div>
                  </div>
                </Card.Content>
                <Card.Footer className="p-4 pt-0">
                  <Button className="w-full" size="sm">
                    Ver Detalhes
                  </Button>
                </Card.Footer>
                  </Card>
                </Link>
              ))
            )}
          </div>

          <div className="text-center">
            <Link to="/catalogo">
              <Button size="lg" icon={<ArrowRight size={20} />} iconPosition="right">
                Ver Todos os Produtos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sustainability Features */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nosso Compromisso Sustentável
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cada produto é cuidadosamente selecionado para garantir o menor
              impacto ambiental possível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUSTAINABILITY_FEATURES.map((feature) => {
              const IconComponent = getSustainabilityIcon(feature.id);
              return (
                <Card key={feature.id} className="text-center group hover:shadow-lg transition-shadow">
                  <Card.Content>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="text-primary" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Categorias de Produtos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore nossa ampla variedade de produtos sustentáveis organizados
              por categoria.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODUCT_CATEGORIES.map((category) => {
              const getIcon = (iconName: string) => {
                const icons: Record<string, React.ComponentType<any>> = {
                  Building2: Shield,
                  Smartphone: Shield,
                  Coffee: Shield,
                  ShoppingBag: Shield,
                  PenTool: Shield,
                };
                return icons[iconName] || Shield;
              };
              const IconComponent = getIcon(category.icon);
              
              return (
                <Link
                  key={category.id}
                  to={`/catalogo?categoria=${category.id}`}
                  className="group"
                >
                  <Card hover className="text-center h-full">
                    <Card.Content>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="text-primary" size={24} />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {category.description}
                      </p>
                    </Card.Content>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para Impressionar seus Clientes?
            </h2>
            <p className="text-lg text-green-100">
              Solicite um orçamento personalizado e descubra como nossos produtos
              sustentáveis podem fortalecer sua marca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/orcamento">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Solicitar Orçamento Gratuito
                </Button>
              </Link>
              <Link to="/contato">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Falar com Especialista
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;