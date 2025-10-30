-- Fix Stored Procedures for Current Database Schema
-- Update criar_orcamento_completo to use correct table names

-- Drop the old function
DROP FUNCTION IF EXISTS criar_orcamento_completo(UUID, JSONB, JSONB[], TEXT, DATE, VARCHAR) CASCADE;

-- Create updated function for current schema
CREATE OR REPLACE FUNCTION criar_orcamento_completo(
    p_usuario_id UUID,
    p_cliente_data JSONB,
    p_itens_data JSONB[],
    p_observacoes TEXT DEFAULT NULL,
    p_data_evento DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_orcamento_id UUID;
    v_item JSONB;
    v_resultado JSONB;
    v_produto_id BIGINT;
    v_quantidade INTEGER;
BEGIN
    -- Iniciar transação
    BEGIN
        -- Criar orçamento na tabela orcamentos_sistema
        INSERT INTO orcamentos_sistema (
            usuario_id,
            observacoes,
            data_evento,
            status,
            valor_total
        )
        VALUES (
            p_usuario_id,
            p_observacoes,
            p_data_evento,
            'pendente',
            0
        )
        RETURNING id INTO v_orcamento_id;
        
        -- Adicionar itens ao orçamento
        FOR v_item IN SELECT * FROM unnest(p_itens_data)
        LOOP
            -- Extrair dados do item
            v_produto_id := (v_item->>'produto_id')::BIGINT;
            v_quantidade := (v_item->>'quantidade')::INTEGER;
            
            -- Inserir item na tabela itens_orcamento_sistema
            INSERT INTO itens_orcamento_sistema (
                orcamento_id,
                produto_ecologico_id,
                quantidade,
                observacoes
            )
            VALUES (
                v_orcamento_id,
                v_produto_id,
                v_quantidade,
                v_item->>'observacoes'
            );
        END LOOP;
        
        -- Retornar resultado
        SELECT jsonb_build_object(
            'success', true,
            'orcamento_id', v_orcamento_id,
            'message', 'Orçamento criado com sucesso'
        ) INTO v_resultado;
        
        RETURN v_resultado;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático em caso de erro
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao criar orçamento: ' || SQLERRM
            );
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION criar_orcamento_completo(UUID, JSONB, JSONB[], TEXT, DATE) TO anon;
GRANT EXECUTE ON FUNCTION criar_orcamento_completo(UUID, JSONB, JSONB[], TEXT, DATE) TO authenticated;

-- Comment
COMMENT ON FUNCTION criar_orcamento_completo IS 'Cria um orçamento completo com itens em uma transação atômica - versão atualizada para schema atual';