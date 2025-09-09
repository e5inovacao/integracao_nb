-- Enable RLS and refresh schema for ecologic_products table

-- Enable RLS on ecologic_products
ALTER TABLE public.ecologic_products ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.ecologic_products TO anon;
GRANT ALL PRIVILEGES ON public.ecologic_products TO authenticated;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON public.ecologic_products
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access" ON public.ecologic_products
    FOR ALL USING (true);

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'ecologic_products'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;