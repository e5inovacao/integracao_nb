-- Grant permissions for ecologic_products table to anon and authenticated roles

-- Grant SELECT permission to anon role (for public access)
GRANT SELECT ON public.ecologic_products TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON public.ecologic_products TO authenticated;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- Verify permissions were granted
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'ecologic_products' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;