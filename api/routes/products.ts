import express, { Request, Response } from 'express';
import { Product, PaginatedResponse } from '../../shared/types.js';
import { supabaseAdmin } from '../../supabase/server.js';

const router = express.Router();



// Função auxiliar para gerar IDs consistentes para produtos ecológicos
function generateConsistentEcologicId(data: any): string {
  // Usar o código do produto se disponível, senão usar o ID da base de dados
  const baseId = data.codigo || data.id?.toString() || 'unknown';
  return `ecologic-${baseId}`;
}

// Função auxiliar para mapear produtos da tabela ecologic_products_site para o tipo Product
function mapEcologicToProduct(data: any): Product & {
  isEcological?: boolean;
  isExternal?: boolean;
  externalSource?: string;
  supplier?: string;
  supplierCode?: string;
  reference?: string;
  ecologicDatabaseId?: number;
  allImages?: string[];
} {
  // Coletar todas as imagens disponíveis dos campos img_0, img_1, img_2
  const images = [];
  if (data.img_0) images.push(data.img_0);
  if (data.img_1) images.push(data.img_1);
  if (data.img_2) images.push(data.img_2);

  // Processar variações de cores e suas imagens
  const colorVariations = [];
  if (data.variacoes && Array.isArray(data.variacoes)) {
    data.variacoes.forEach((variacao: any) => {
      if (variacao.cor && variacao.link_image) {
        colorVariations.push({
          color: variacao.cor,
          image: variacao.link_image
        });
        // Adicionar imagem da variação às imagens gerais se não estiver presente
        if (!images.includes(variacao.link_image)) {
          images.push(variacao.link_image);
        }
      }
    });
  }

  // Processar categorias
  let category = 'ecologico';
  if (data.categoria) {
    category = data.categoria.toString() || 'ecologico';
  }

  // Processar preço
  let price = 0;
  if (data.preco) {
    price = typeof data.preco === 'number' ? data.preco : parseFloat(data.preco) || 0;
  }

  // Verificar se está em estoque
  const inStock = data.status !== 'indisponivel' && data.status !== 'esgotado';

  // Verificar se está em promoção
  const featured = data.promocao === true || data.promocao === 'true' || data.promocao === 1;

  return {
    id: generateConsistentEcologicId(data),
    name: data.titulo || 'Produto Ecológico',
    description: data.descricao || 'Produto sem descrição disponível',
    category: category,
    images: images,
    sustainabilityFeatures: ['Produto Ecológico'],
    customizationOptions: [], // Não há campo específico para variações na nova estrutura
    price: price,
    inStock: inStock,
    featured: featured,
    // Propriedades específicas para produtos ecológicos
    isEcological: true,
    isExternal: false,
    externalSource: 'Supabase',
    supplier: 'Ecologic',
    supplierCode: data.codigo || null,
    reference: data.codigo || null,
    ecologicDatabaseId: data.id,
    allImages: images,
    // Dimensões físicas
    dimensions: {
      height: data.altura ? parseFloat(data.altura) : undefined,
      width: data.largura ? parseFloat(data.largura) : undefined,
      length: data.comprimento ? parseFloat(data.comprimento) : undefined,
      weight: data.peso ? parseFloat(data.peso) : undefined
    },
    // Cor principal
    primaryColor: data.cor_web_principal || undefined,
    // Variações de cores com suas imagens
    colorVariations: colorVariations
  };
}





// GET /api/products - Listar todos os produtos com paginação
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, sort, category, page = '1', limit = '50' } = req.query;
    
    // Converter parâmetros de paginação para números
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50)); // Máximo 100 itens por página
    
    console.log('[DEBUG] Parâmetros recebidos:', { search, sort, category, page: pageNum, limit: limitNum });
    
    // Buscar produtos da tabela ecologic_products_site
    console.log('[DEBUG] Iniciando consulta à tabela ecologic_products_site...');
    const { data: ecologicProducts, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*');
    
    console.log('[DEBUG] Consulta concluída. Dados:', {
      hasData: !!ecologicProducts,
      dataLength: ecologicProducts?.length || 0,
      hasError: !!error,
      errorDetails: error
    });
    
    if (error) {
      console.error('[ERROR] Erro ao buscar produtos ecológicos do Supabase:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        debug: { supabaseError: error }
      });
    }
    
    console.log(`[DEBUG] Produtos ecológicos encontrados: ${ecologicProducts?.length || 0}`);
    
    // Log dos primeiros produtos para debug
    if (ecologicProducts && ecologicProducts.length > 0) {
      console.log('[DEBUG] Primeiro produto encontrado:', JSON.stringify(ecologicProducts[0], null, 2));
    }
    
    // Mapear produtos ecológicos
    const mappedProducts = ecologicProducts?.map(mapEcologicToProduct) || [];
    
    console.log(`[DEBUG] Total de produtos mapeados: ${mappedProducts.length}`);
    console.log(`[DEBUG] Primeiros 3 IDs gerados: ${mappedProducts.slice(0, 3).map(p => p.id).join(', ')}`);
    
    if (mappedProducts.length === 0) {
      console.log('[DEBUG] Nenhum produto encontrado no banco de dados');
      return res.json({ 
        success: true,
        data: []
      });
    }
    
    // Aplicar filtros
    let filteredProducts = mappedProducts;
    
    // Filtro por busca
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      console.log(`[DEBUG] Aplicando filtro de busca: "${searchTerm}"`);
      
      filteredProducts = filteredProducts.filter(product => {
        const matchesName = product.name.toLowerCase().includes(searchTerm);
        const matchesDescription = product.description && product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = product.category.toLowerCase().includes(searchTerm);
        
        return matchesName || matchesDescription || matchesCategory;
      });
      
      console.log(`[DEBUG] Produtos após filtro de busca: ${filteredProducts.length}`);
    }
    
    // Filtro por categoria
    if (category && typeof category === 'string' && category.trim()) {
      const categoryTerm = category.trim().toLowerCase();
      console.log(`[DEBUG] Aplicando filtro de categoria: "${categoryTerm}"`);
      
      filteredProducts = filteredProducts.filter(product => {
        return product.category.toLowerCase().includes(categoryTerm);
      });
      
      console.log(`[DEBUG] Produtos após filtro de categoria: ${filteredProducts.length}`);
    }
    
    // Aplicar ordenação
    switch (sort) {
      case 'name_asc':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'category_asc':
        filteredProducts.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'category_desc':
        filteredProducts.sort((a, b) => b.category.localeCompare(a.category));
        break;
      default:
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Calcular paginação
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`[DEBUG] Paginação: página ${pageNum} de ${totalPages}, ${paginatedProducts.length} produtos de ${totalItems} total`);
    
    // Retornar produtos paginados com metadados
    const response: ApiResponse<PaginatedResponse<Product>> = {
      success: true,
      data: {
        items: paginatedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para buscar um produto específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Buscando produto com ID: ${id}`);
    
    // Buscar produtos da tabela ecologic_products_site
    const { data: ecologicProducts, error: ecologicFetchError } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*');
    
    if (ecologicFetchError) {
      console.error('[ERROR] Erro ao buscar produtos ecológicos do Supabase:', ecologicFetchError);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor' 
      });
    }
    
    // Mapear produtos ecológicos
    const mappedProducts = ecologicProducts?.map(mapEcologicToProduct) || [];
    
    if (mappedProducts.length === 0) {
      console.log('[DEBUG] Nenhum produto encontrado no banco de dados');
      return res.status(404).json({ 
        success: false,
        error: 'Nenhum produto encontrado',
        debug: {
          searchedId: id,
          totalProducts: 0
        }
      });
    }
    
    console.log(`[DEBUG] Total de produtos encontrados no banco: ${mappedProducts.length}`);
    console.log(`[DEBUG] Primeiros 3 IDs gerados: ${mappedProducts.slice(0, 3).map(p => p.id).join(', ')}`);
    
    // Estratégia 1: Busca exata por ID
    let product = mappedProducts.find(p => p.id === id);
    console.log(`[DEBUG] Estratégia 1 (busca exata): ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    
    // Estratégia 2: Se não encontrou, tentar buscar por código
    if (!product) {
      console.log('[DEBUG] Tentando estratégia 2 (busca alternativa)');
      
      // Extrair possíveis valores do ID para busca alternativa
      const idParts = id.replace('ecologic_', '').split('_');
      
      product = mappedProducts.find(p => {
        // Buscar nos produtos ecológicos
        const ecologicData = ecologicProducts?.find(raw => generateConsistentEcologicId(raw) === p.id);
        if (ecologicData) {
          const matches = idParts.some(part => 
            (ecologicData.codigo && ecologicData.codigo.toString().includes(part)) ||
            (ecologicData.titulo && ecologicData.titulo.toLowerCase().includes(part.toLowerCase()))
          );
          
          if (matches) {
            console.log(`[DEBUG] Produto ecológico encontrado na estratégia 2 - Código: ${ecologicData.codigo}, Título: ${ecologicData.titulo}`);
          }
          
          return matches;
        }
        
        return false;
      });
      console.log(`[DEBUG] Estratégia 2: ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    }
    
    // Estratégia 3: Busca por similaridade de nome
    if (!product && id.length > 3) {
      console.log('[DEBUG] Tentando estratégia 3 (busca por similaridade)');
      const searchTerm = id.replace('ecologic_', '').replace(/_/g, ' ').toLowerCase();
      console.log(`[DEBUG] Termo de busca normalizado: ${searchTerm}`);
      
      product = mappedProducts.find(p => {
        const productName = p.name.toLowerCase();
        const matches = productName.includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm));
        
        if (matches) {
          console.log(`[DEBUG] Produto encontrado na estratégia 3 - Nome: ${p.name}`);
        }
        
        return matches;
      });
      console.log(`[DEBUG] Estratégia 3: ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    }
    
    if (!product) {
      console.log(`[DEBUG] Produto não encontrado após todas as estratégias. ID buscado: ${id}`);
      console.log(`[DEBUG] IDs disponíveis (primeiros 10): ${mappedProducts.slice(0, 10).map(p => p.id).join(', ')}`);
      
      return res.status(404).json({ 
        success: false,
        error: 'Produto não encontrado',
        debug: {
          searchedId: id,
          totalProducts: mappedProducts.length,
          sampleIds: mappedProducts.slice(0, 5).map(p => p.id)
        }
      });
    }
    
    console.log(`[DEBUG] Produto encontrado com sucesso: ${product.name} (ID: ${product.id})`);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('[ERROR] Erro na rota de produto por ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/products/featured - Buscar produtos em destaque (primeiros da lista)
router.get('/featured/list', async (req: Request, res: Response) => {
  try {
    const { limit = '4' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    // Buscar produtos da tabela ecologic_products_site
    const { data: productsData, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*')
      .limit(limitNum);

    if (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar produtos em destaque'
      });
    }

    const featuredProducts = productsData?.map(mapEcologicToProduct) || [];

    res.json({
      success: true,
      data: featuredProducts
    });
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/categories - Listar categorias disponíveis
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    // Buscar categorias únicas da tabela ecologic_products_site
    const { data: productsData, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('categoria');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar categorias'
      });
    }

    // Extrair categorias únicas
    const allCategories = new Set<string>();
    
    productsData?.forEach(product => {
      if (product.categoria) {
        // A coluna categoria é uma string simples
        if (typeof product.categoria === 'string') {
          allCategories.add(product.categoria.trim());
        }
      }
    });
    
    const categories = Array.from(allCategories).map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '_'),
      name: cat
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;