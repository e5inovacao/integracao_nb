/**
 * Utilitários para compressão de imagens para uso em emails
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Comprime uma imagem base64 ou URL para reduzir seu tamanho
 */
export const compressImage = async (
  imageUrl: string, 
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 300,
    maxHeight = 300,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com compressão
        const mimeType = `image/${format}`;
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      // Se falhar ao carregar, retorna uma imagem placeholder pequena
      const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <rect width="128" height="128" fill="#f3f4f6"/>
          <text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="12" fill="#6b7280">
            Sem imagem
          </text>
        </svg>
      `)}`;
      resolve(placeholderSvg);
    };

    // Verificar se é uma URL de dados (base64) ou URL externa
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else if (imageUrl.startsWith('http')) {
      img.src = imageUrl;
    } else {
      // URL relativa ou inválida, usar placeholder
      img.onerror();
    }
  });
};

/**
 * Comprime múltiplas imagens em paralelo
 */
export const compressImages = async (
  imageUrls: string[], 
  options: CompressionOptions = {}
): Promise<string[]> => {
  const compressionPromises = imageUrls.map(url => 
    compressImage(url, options).catch(() => {
      // Em caso de erro, retorna placeholder
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <rect width="128" height="128" fill="#f3f4f6"/>
          <text x="64" y="64" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="12" fill="#6b7280">
            Erro ao carregar
          </text>
        </svg>
      `)}`;
    })
  );

  return Promise.all(compressionPromises);
};

/**
 * Estima o tamanho de uma string base64 em bytes
 */
export const estimateBase64Size = (base64String: string): number => {
  // Remove prefixo data: se existir
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Cada caractere base64 representa 6 bits, então 4 caracteres = 3 bytes
  // Mas precisamos considerar padding
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
};

/**
 * Converte bytes para formato legível
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};