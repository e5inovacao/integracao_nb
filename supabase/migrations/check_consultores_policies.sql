-- Verificar e corrigir políticas RLS da tabela consultores

-- Primeiro, vamos ver as políticas atuais (isso será mostrado nos logs)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Políticas RLS atuais para a tabela consultores:';
    
    FOR policy_record IN 
        SELECT policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'consultores'
    LOOP
        RAISE NOTICE 'Policy: %, Permissive: %, Roles: %, Command: %, Qual: %, With_check: %', 
            policy_record.policyname, 
            policy_record.permissive, 
            policy_record.roles, 
            policy_record.cmd, 
            policy_record.qual, 
            policy_record.with_check;
    END LOOP;
    
    -- Verificar permissões da tabela
    RAISE NOTICE 'Verificando permissões da tabela consultores:';
    FOR policy_record IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_schema = 'public' 
            AND table_name = 'consultores' 
            AND grantee IN ('anon', 'authenticated')
    LOOP
        RAISE NOTICE 'Grantee: %, Privilege: %', policy_record.grantee, policy_record.privilege_type;
    END LOOP;
END $$;