import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugImages() {
  console.log('🔍 Investigando imagens dos produtos...\n')
  
  // Buscar alguns produtos para análise
  const { data: products, error } = await supabase
    .from('ecologic_products_site')
    .select('codigo, titulo, img_0, img_1, img_2, variacoes')
    .limit(10)
  
  if (error) {
    console.error('❌ Erro ao buscar produtos:', error)
    return
  }
  
  console.log(`📊 Encontrados ${products.length} produtos para análise:\n`)
  
  let productsWithImages = 0
  let productsWithVariationImages = 0
  
  for (const product of products) {
    console.log(`🏷️  Produto: ${product.titulo || 'Sem título'} (${product.codigo})`)
    
    // Verificar imagens principais
    const mainImages = [product.img_0, product.img_1, product.img_2].filter(Boolean)
    console.log(`   📸 Imagens principais: ${mainImages.length}`)
    
    if (mainImages.length > 0) {
      productsWithImages++
      mainImages.forEach((img, index) => {
        console.log(`      img_${index}: ${img}`)
      })
    }
    
    // Verificar variações
    if (product.variacoes) {
      try {
        const variations = typeof product.variacoes === 'string' 
          ? JSON.parse(product.variacoes) 
          : product.variacoes
        
        console.log(`   🎨 Variações: ${variations.length}`)
        
        let hasVariationImages = false
        variations.forEach((variation, index) => {
          if (variation.imagem_variacao) {
            hasVariationImages = true
            console.log(`      Variação ${index + 1} (${variation.cor}): ${variation.imagem_variacao}`)
          }
        })
        
        if (hasVariationImages) {
          productsWithVariationImages++
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao processar variações: ${e.message}`)
      }
    }
    
    console.log('')
  }
  
  console.log('📈 RESUMO:')
  console.log(`   • Produtos com imagens principais: ${productsWithImages}/${products.length}`)
  console.log(`   • Produtos com imagens de variações: ${productsWithVariationImages}/${products.length}`)
  
  // Testar conectividade de algumas URLs
  console.log('\n🌐 Testando conectividade das URLs...')
  
  const testUrls = []
  products.forEach(product => {
    if (product.img_0) testUrls.push(product.img_0)
    if (product.variacoes) {
      try {
        const variations = typeof product.variacoes === 'string' 
          ? JSON.parse(product.variacoes) 
          : product.variacoes
        variations.forEach(v => {
          if (v.imagem_variacao) testUrls.push(v.imagem_variacao)
        })
      } catch (e) {}
    }
  })
  
  const uniqueUrls = [...new Set(testUrls)].slice(0, 5) // Testar apenas 5 URLs
  
  for (const url of uniqueUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      console.log(`   ${response.ok ? '✅' : '❌'} ${url} - Status: ${response.status}`)
    } catch (error) {
      console.log(`   ❌ ${url} - Erro: ${error.message}`)
    }
  }
}

debugImages().catch(console.error)