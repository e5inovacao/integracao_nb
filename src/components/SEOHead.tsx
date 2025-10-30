import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Natureza Brindes - Brindes Sustentáveis e Ecológicos',
  description = 'Natureza Brindes - Especialista em brindes sustentáveis e ecológicos. Produtos personalizados para empresas que se preocupam com o meio ambiente.',
  keywords = 'brindes sustentáveis, brindes ecológicos, produtos personalizados, meio ambiente, sustentabilidade, brindes corporativos',
  image = '/og-image.jpg',
  url = 'https://naturezabrindes.com.br',
  type = 'website',
  siteName = 'Natureza Brindes',
  structuredData
}) => {
  const fullTitle = title.includes('Natureza Brindes') ? title : `${title} | Natureza Brindes`;
  const fullUrl = url.startsWith('http') ? url : `https://naturezabrindes.com.br${url}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Natureza Brindes" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#22c55e" />
      <meta name="msapplication-TileColor" content="#22c55e" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;