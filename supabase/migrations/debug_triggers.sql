-- Debug: Check all triggers and functions on orcamentos_sistema

-- List all triggers on orcamentos_sistema
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orcamentos_sistema';

-- List all functions that might be related
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%orcamento%' OR routine_name LIKE '%quote%')
ORDER BY routine_name;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orcamentos_sistema'
ORDER BY ordinal_position;