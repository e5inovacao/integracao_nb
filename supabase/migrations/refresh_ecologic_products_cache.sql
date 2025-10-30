-- Refresh cache for ecologic_products table
-- This migration forces Supabase to refresh the schema cache

-- Add a comment to the table to trigger cache refresh
COMMENT ON TABLE public.ecologic_products IS 'Ecological products table - cache refresh updated';

-- Refresh the schema cache by updating table statistics
ANALYZE public.ecologic_products;

-- Grant permissions to ensure proper access
GRANT SELECT ON public.ecologic_products TO anon;
GRANT ALL PRIVILEGES ON public.ecologic_products TO authenticated;