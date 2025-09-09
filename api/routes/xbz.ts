import { Router } from 'express';
import xbzService from '../services/xbz.js';

const router = Router();

// Buscar todos os produtos ecológicos da XBZ
router.get('/ecological-products', async (req, res) => {
  try {
    const xbzProducts = await xbzService.getEcologicalProducts();
    const transformedProducts = xbzProducts.map(product => 
      xbzService.transformToLocalProduct(product)
    );
    
    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length
    });
  } catch (error) {
    console.error('Error fetching XBZ ecological products:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos ecológicos da XBZ',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Buscar produto específico da XBZ por ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const xbzProduct = await xbzService.getProductById(id);
    
    if (!xbzProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado na XBZ'
      });
    }
    
    const transformedProduct = xbzService.transformToLocalProduct(xbzProduct);
    
    res.json({
      success: true,
      data: transformedProduct
    });
  } catch (error) {
    console.error('Error fetching XBZ product:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produto da XBZ',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Buscar produtos ecológicos por termo de pesquisa
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro de busca é obrigatório'
      });
    }
    
    const xbzProducts = await xbzService.searchEcologicalProducts(q);
    const transformedProducts = xbzProducts.map(product => 
      xbzService.transformToLocalProduct(product)
    );
    
    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching XBZ products:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao pesquisar produtos ecológicos da XBZ',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint para verificar status da integração XBZ
router.get('/status', async (req, res) => {
  try {
    // Tenta fazer uma requisição simples para verificar se a API está funcionando
    await xbzService.getEcologicalProducts();
    
    res.json({
      success: true,
      message: 'Integração XBZ funcionando corretamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Integração XBZ indisponível',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;