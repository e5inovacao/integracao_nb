-- Force PostgREST schema cache reload
-- This migration forces PostgREST to reload its schema cache

-- First, let's verify the table exists
SELECT 'Table ecologic_products exists' as status, count(*) as row_count 
FROM ecologic_products;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'ecologic_products' 
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Ensure all necessary permissions are granted
GRANT SELECT ON public.ecologic_products TO anon;
GRANT SELECT ON public.ecologic_products TO authenticated;
GRANT ALL PRIVILEGES ON public.ecologic_products TO service_role;

-- Force PostgREST to reload schema cache
-- Method 1: Use NOTIFY to signal PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Update pg_stat_statements to trigger cache invalidation
-- This forces PostgREST to detect schema changes
SELECT pg_stat_statements_reset();

-- Method 3: Create and drop a temporary function to trigger schema change detection
CREATE OR REPLACE FUNCTION temp_schema_reload_trigger() RETURNS void AS $$
BEGIN
    -- This function exists only to trigger schema reload
    RETURN;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION temp_schema_reload_trigger();

-- Verify the table is accessible
SELECT 'Verification: ecologic_products accessible' as status, 
       count(*) as total_rows,
       count(DISTINCT categoria) as categories
FROM public.ecologic_products
LIMIT 1;

-- Show sample data to confirm structure
SELECT id, tipo, codigo, titulo, categoria, cor_web_principal
FROM public.ecologic_products 
LIMIT 3;