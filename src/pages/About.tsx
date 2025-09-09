import React from 'react';
import {
  Leaf,
  Heart,
  Target,
  Eye,
  Award,
  Users,
  TreePine,
  Recycle,
  Shield,
  Globe,
  CheckCircle,
  Star,
  Calendar,
  Building2,
} from 'lucide-react';
import { COMPANY_INFO, SUSTAINABILITY_FEATURES } from '../constants';
import SEOHead from '../components/SEOHead';

const About: React.FC = () => {
  const values = [
    {
      icon: Leaf,
      title: 'Sustentabilidade',
      description: 'Comprometidos com práticas que preservam o meio ambiente e promovem um futuro sustentável para as próximas gerações.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Heart,
      title: 'Responsabilidade Social',
      description: 'Acreditamos que as empresas têm o dever de contribuir positivamente para a sociedade e o meio ambiente.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Award,
      title: 'Qualidade',
      description: 'Oferecemos produtos de alta qualidade que atendem aos mais rigorosos padrões de sustentabilidade e durabilidade.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Users,
      title: 'Parceria',
      description: 'Construímos relacionamentos duradouros baseados na confiança, transparência e resultados mútuos.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const milestones = [
    {
      year: '2018',
      title: 'Fundação da Empresa',
      description: 'Início das atividades com foco em brindes corporativos sustentáveis.',
    },
    {
      year: '2019',
      title: 'Primeira Certificação',
      description: 'Obtivemos nossa primeira certificação ambiental, validando nosso compromisso.',
    },
    {
      year: '2020',
      title: 'Expansão do Catálogo',
      description: 'Ampliamos nossa linha de produtos com mais de 500 itens ecológicos.',
    },
    {
      year: '2021',
      title: 'Parcerias Estratégicas',
      description: 'Estabelecemos parcerias com fornecedores certificados internacionalmente.',
    },
    {
      year: '2022',
      title: 'Reconhecimento',
      description: 'Recebemos o prêmio de Empresa Sustentável do Ano no setor de brindes.',
    },
    {
      year: '2023',
      title: 'Inovação Contínua',
      description: 'Lançamos nossa plataforma digital e expandimos para todo o Brasil.',
    },
  ];

  const stats = [
    {
      number: '5000+',
      label: 'Clientes Atendidos',
      icon: Users,
    },
    {
      number: '500+',
      label: 'Produtos Sustentáveis',
      icon: Leaf,
    },
    {
      number: '50+',
      label: 'Toneladas de CO₂ Evitadas',
      icon: TreePine,
    },
    {
      number: '98%',
      label: 'Satisfação dos Clientes',
      icon: Star,
    },
  ];

  const team = [
    {
      name: 'Maria Silva',
      role: 'CEO & Fundadora',
      description: 'Especialista em sustentabilidade empresarial com mais de 15 anos de experiência.',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20woman%20CEO%20smiling%20corporate%20headshot%20sustainable%20business%20leader&image_size=square',
    },
    {
      name: 'João Santos',
      role: 'Diretor Comercial',
      description: 'Expert em relacionamento B2B e desenvolvimento de parcerias estratégicas.',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20man%20director%20smiling%20corporate%20headshot%20sales%20executive&image_size=square',
    },
    {
      name: 'Ana Costa',
      role: 'Gerente de Sustentabilidade',
      description: 'Responsável por garantir que todos os produtos atendam aos padrões ambientais.',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20woman%20sustainability%20manager%20smiling%20corporate%20headshot%20environmental%20expert&image_size=square',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Sobre Nós - Natureza Brindes | História, Valores e Compromisso Sustentável"
        description="Conheça a história da Natureza Brindes, empresa especializada em brindes corporativos sustentáveis. Nossa missão, visão, valores e compromisso com a responsabilidade ambiental desde 2018."
        keywords="sobre natureza brindes, história empresa sustentável, valores ambientais, equipe sustentabilidade, missão visão valores, empresa brindes ecológicos, responsabilidade social corporativa"
        url="https://naturezabrindes.com.br/sobre"
        type="website"
        image="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=sustainable%20corporate%20gifts%20company%20team%20office%20eco%20friendly%20business%20environment%20green%20workspace&image_size=landscape_16_9"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "Natureza Brindes",
            "description": "Empresa especializada em brindes corporativos sustentáveis e ecológicos, oferecendo soluções personalizadas para empresas que valorizam a responsabilidade ambiental.",
            "foundingDate": "2018",
            "founder": {
              "@type": "Person",
              "name": "Maria Silva",
              "jobTitle": "CEO & Fundadora"
            },
            "numberOfEmployees": "10-50",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "BR"
            },
            "url": "https://naturezabrindes.com.br",
            "sameAs": [
              "https://instagram.com/naturezabrindes",
              "https://linkedin.com/company/naturezabrindes"
            ],
            "award": "Empresa Sustentável do Ano no setor de brindes (2022)",
            "knowsAbout": [
              "Brindes Corporativos Sustentáveis",
              "Produtos Ecológicos",
              "Responsabilidade Ambiental",
              "Marketing Sustentável"
            ]
          }
        }}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-green-600 text-white">
        <div className="container-custom py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sobre a {COMPANY_INFO.name}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8">
              Especializada em brindes corporativos sustentáveis e ecológicos, oferecendo soluções personalizadas para empresas que valorizam a responsabilidade ambiental.
            </p>
            <div className="flex items-center justify-center space-x-2 text-green-100">
              <Leaf size={24} />
              <span className="text-lg">{COMPANY_INFO.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Mission */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Missão</h3>
            <p className="text-gray-600 leading-relaxed">
              Fornecer brindes corporativos sustentáveis de alta qualidade, 
              ajudando empresas a fortalecer suas marcas enquanto contribuem 
              para um mundo mais verde e responsável.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="text-blue-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Visão</h3>
            <p className="text-gray-600 leading-relaxed">
              Ser a referência nacional em brindes corporativos sustentáveis, 
              inspirando empresas a adotarem práticas mais conscientes e 
              responsáveis em suas estratégias de marketing.
            </p>
          </div>

          {/* Values Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="text-green-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Valores</h3>
            <p className="text-gray-600 leading-relaxed">
              Nossos valores fundamentais guiam cada decisão e ação, 
              garantindo que mantenhamos nosso compromisso com a 
              sustentabilidade e excelência.
            </p>
          </div>
        </div>

        {/* Detailed Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nossos Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Os princípios que norteiam nossa empresa e definem nossa cultura organizacional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className={`w-12 h-12 ${value.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                    <IconComponent className={value.color} size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nossos Números
            </h2>
            <p className="text-xl text-green-100">
              Resultados que demonstram nosso impacto positivo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent size={24} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-green-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="container-custom py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossa História
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Uma jornada de crescimento sustentável e inovação constante
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-primary h-full hidden md:block"></div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className={`flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <Calendar className="text-primary" size={20} />
                      <span className="text-primary font-bold text-lg">{milestone.year}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="hidden md:flex w-2/12 justify-center">
                  <div className="w-4 h-4 bg-primary rounded-full border-4 border-white shadow-lg"></div>
                </div>

                <div className="w-full md:w-5/12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-100 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nossa Equipe
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Profissionais apaixonados por sustentabilidade e excelência
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-primary font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sustainability Commitment */}
      <div className="container-custom py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Compromisso com a Sustentabilidade
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cada produto que oferecemos segue rigorosos padrões ambientais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {SUSTAINABILITY_FEATURES.map((feature) => {
            const getIcon = (iconName: string) => {
              const icons: Record<string, React.ComponentType<any>> = {
                Leaf,
                Recycle,
                TreePine,
                CloudSnow: Shield,
              };
              return icons[iconName] || Leaf;
            };
            const IconComponent = getIcon(feature.icon);
            
            return (
              <div key={feature.id} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border-l-4 border-l-primary">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="text-primary" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
                <div className="mt-4">
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary"
                  >
                    {feature.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary to-green-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <Globe className="mx-auto mb-6" size={48} />
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Juntos por um Futuro Sustentável
          </h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Faça parte da mudança. Escolha brindes que fazem a diferença para o planeta e para sua marca.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/catalogo"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <Leaf size={20} />
              <span>Ver Catálogo</span>
            </a>
            <a
              href="/contato"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-flex items-center justify-center space-x-2"
            >
              <Users size={20} />
              <span>Fale Conosco</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;