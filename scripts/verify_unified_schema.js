import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to get service role key for full access, or anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('Verifying Unified Schema Integration...');
  console.log('Target URL:', supabaseUrl);

  const tablesToCheck = ['partners', 'orders', 'order_items', 'commissions', 'company_expenses'];
  const columnsToCheck = {
    'ecologic_products': ['supplier_id', 'cost_price'],
    'itens_orcamento_sistema': ['unit_price', 'total_price']
  };

  let allPassed = true;

  // Check Tables
  for (const table of tablesToCheck) {
    // We select count instead of id to avoid permission issues if RLS blocks 'select *'
    // But 'count' also respects RLS. 
    // If we use service role key, we bypass RLS.
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // undefined_table
        console.error(`❌ Table '${table}' does NOT exist.`);
      } else {
        console.error(`⚠️ Error checking '${table}':`, error.message);
      }
      allPassed = false;
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }

  // Check Columns (by trying to select them)
  for (const [table, columns] of Object.entries(columnsToCheck)) {
    const { error } = await supabase.from(table).select(columns.join(',')).limit(1);
    if (error) {
      console.error(`❌ Columns [${columns.join(',')}] missing or inaccessible in '${table}':`, error.message);
      allPassed = false;
    } else {
      console.log(`✅ Columns [${columns.join(',')}] exist in '${table}'.`);
    }
  }

  // Check Function Existence (via RPC call attempt or just assume if migrations ran)
  // We can't easily check function existence via client without calling it.
  // We'll skip function check in this simple script.

  if (allPassed) {
    console.log('\n🎉 SUCCESS: Database structure appears correct for integration.');
  } else {
    console.log('\n❌ FAILURE: Some schema elements are missing. Run migrations 022, 023, 024.');
  }
}

verifySchema();
