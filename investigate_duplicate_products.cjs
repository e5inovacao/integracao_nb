const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZmRxZm10eW1xYXZma21ndGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzA4NzgsImV4cCI6MjA3MDUwNjg3OH0.Tw_UcOVEFiFhAblD4cTOyhV9u8SFO4EEbPO0eLFIx7I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateDuplicateProducts() {
  console.log('🔍 Investigating duplicate products in produtos_asia table...');
  
  try {
    // Check for duplicate referencia_pai (which seems to be the ID)
    console.log('\n1. Checking for duplicate referencia_pai...');
    const { data: allProducts, error: fetchError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai');
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }
    
    // Count occurrences of each referencia_pai
    const refCounts = {};
    allProducts.forEach(product => {
      const ref = product.referencia_pai;
      if (ref) {
        refCounts[ref] = (refCounts[ref] || 0) + 1;
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(refCounts).filter(([ref, count]) => count > 1);
    
    console.log(`Found ${duplicates.length} duplicate referencia_pai groups:`);
    duplicates.forEach(([ref, count]) => {
      console.log(`  - Referencia: ${ref} appears ${count} times`);
      // Show the products with this reference
      const products = allProducts.filter(p => p.referencia_pai === ref);
      products.forEach((product, index) => {
        console.log(`    ${index + 1}. Name: ${product.nome_pai}`);
      });
    });
    
    // Check products with 'asia_' in their referencia_pai
    console.log('\n2. Checking products with "asia_" in their referencia_pai...');
    const asiaProducts = allProducts.filter(p => p.referencia_pai && p.referencia_pai.includes('asia_'));
    
    console.log(`Found ${asiaProducts.length} products with 'asia_' in referencia_pai:`);
    asiaProducts.slice(0, 15).forEach(product => {
      console.log(`  - Ref: ${product.referencia_pai}, Name: ${product.nome_pai}`);
    });
    if (asiaProducts.length > 15) {
      console.log(`  ... and ${asiaProducts.length - 15} more`);
    }
    
    // Check for null or empty referencia_pai
    console.log('\n3. Checking for null or empty referencia_pai...');
    const emptyRefs = allProducts.filter(p => !p.referencia_pai || p.referencia_pai.trim() === '');
    console.log(`Found ${emptyRefs.length} products with empty referencia_pai`);
    
    console.log(`\n📊 Total products in table: ${allProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateDuplicateProducts();