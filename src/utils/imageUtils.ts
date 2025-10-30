// Utilitário para gerar thumbnails e gerenciar imagens para e-mail

/**
 * Gera thumbnail de uma imagem com dimensões e qualidade específicas
 * Otimizado para e-mail: 120x120 pixels com qualidade 0.6
 * @param imageUrl URL da imagem original
 * @param width Largura desejada (padrão: 120)
 * @param height Altura desejada (padrão: 120)
 * @param quality Qualidade da compressão (0.1 a 1.0, padrão: 0.6)
 * @returns Promise<string> Base64 da imagem comprimida sem prefixo data:
 */
export const generateThumbnail = async (
  imageUrl: string, 
  width: number = 120, 
  height: number = 120, 
  quality: number = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com qualidade especificada
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Remover prefixo data:image/jpeg;base64,
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Não foi possível obter contexto do canvas'));
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Erro ao carregar imagem: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Verifica se uma URL é pública e acessível via HTTPS
 * @param url URL para verificar
 * @returns boolean
 */
export const isPublicHttpsUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && 
           !url.includes('blob:') && 
           !url.includes('data:') &&
           !url.includes('localhost') &&
           !url.includes('127.0.0.1');
  } catch {
    return false;
  }
};

/**
 * Lógica de escolha da fonte da imagem (URL HTTPS ou CID)
 * @param produto Objeto do produto
 * @param index Índice do produto
 * @returns Objeto com src e cidName (se aplicável)
 */
export const toImageRef = (produto: any, index: number) => {
  const imageUrl = produto.imagem_url_publica || produto.img_0 || produto.img_1 || produto.img_2;
  
  if (isPublicHttpsUrl(imageUrl)) {
    return { src: imageUrl };
  }
  
  return { 
    src: `cid:p${index}.jpg`, 
    cidName: `p${index}.jpg`,
    originalUrl: imageUrl
  };
};

/**
 * Gera referência para o logo
 * @param logoUrl URL do logo (opcional)
 * @returns Objeto com src e cidName (se aplicável)
 */
export const toLogoRef = (logoUrl?: string) => {
  // URL padrão da logo da Natureza Brindes no Supabase (atualizada)
  const defaultLogoUrl = 'https://dntlbhmljceaefycdsbc.supabase.co/storage/v1/object/sign/Natureza%20Brindes/img/Frame-2.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80NzlhNDY1NC01Y2Q2LTQ1ZjItYmVmZi1hMGU1NTBjZTUxYWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJOYXR1cmV6YSBCcmluZGVzL2ltZy9GcmFtZS0yLndlYnAiLCJpYXQiOjE3NjE1MjMxMzYsImV4cCI6MjA3Njg4MzEzNn0.jax-ty2xbkD5ql0vBZUy0dc7MCZjuuW6NwJrYKPucoM';
  
  // Usar a URL fornecida ou a URL padrão do Supabase
  const finalLogoUrl = logoUrl || defaultLogoUrl;
  
  // Se a URL é HTTPS pública, usar diretamente
  if (isPublicHttpsUrl(finalLogoUrl)) {
    return { 
      src: finalLogoUrl,
      originalUrl: finalLogoUrl
    };
  }
  
  // Fallback para CID se a URL não for HTTPS pública
  return { 
    src: 'cid:logo.png', 
    cidName: 'logo.png',
    originalUrl: finalLogoUrl
  };
};

/**
 * Converte data URL para base64 puro
 * @param dataUrl Data URL completa
 * @returns string Base64 sem prefixo
 */
export const dataUrlToBase64 = (dataUrl: string): string => {
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
};

/**
 * Estima o tamanho de uma string base64 em bytes
 * @param base64String String base64
 * @returns number Tamanho em bytes
 */
export const estimateBase64Size = (base64String: string): number => {
  return Math.ceil(base64String.length * 0.75);
};

/**
 * Formata bytes para formato legível
 * @param bytes Número de bytes
 * @returns string Formato legível (ex: "1.2 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Verifica se uma URL de imagem é válida
 * @param url URL da imagem
 * @returns boolean indicando se a URL é válida
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Verificar se é uma URL válida
  try {
    new URL(url);
    return true;
  } catch {
    // Se não for uma URL válida, verificar se é um caminho relativo válido
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
};

/**
 * Obtém uma URL de imagem válida com fallbacks
 * @param primaryUrl URL principal da imagem
 * @param fallbacks Array de URLs de fallback
 * @returns URL válida ou placeholder
 */
export const getValidImageUrl = (primaryUrl: string, fallbacks: string[] = []): string => {
  // Verificar URL principal
  if (isValidImageUrl(primaryUrl)) {
    return primaryUrl;
  }
  
  // Verificar fallbacks
  for (const fallback of fallbacks) {
    if (isValidImageUrl(fallback)) {
      return fallback;
    }
  }
  
  // Retornar placeholder se nenhuma URL for válida
  return '/placeholder-product.svg';
};

/**
 * Cria um handler de erro para imagens com fallbacks
 * @param fallbacks Array de URLs de fallback
 * @returns Função de handler de erro
 */
export const createImageErrorHandler = (fallbacks: string[]) => {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    
    // Encontrar próximo fallback válido
    for (const fallback of fallbacks) {
      if (isValidImageUrl(fallback) && img.src !== fallback) {
        img.src = fallback;
        return;
      }
    }
    
    // Se não houver mais fallbacks, usar placeholder
    if (img.src !== '/placeholder-product.svg') {
      img.src = '/placeholder-product.svg';
    }
  };
};