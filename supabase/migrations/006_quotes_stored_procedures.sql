-- Migration 006: Stored Procedures para Sistema de Orçamentos
-- Implementação de todas as funções CRUD para orçamentos

-- 1. Função para criar orçamento completo
CREATE OR REPLACE FUNCTION criar_orcamento_completo(
    p_usuario_id UUID,
    p_cliente_data JSONB,
    p_itens_data JSONB[],
    p_observacoes TEXT DEFAULT NULL,
    p_data_evento DATE DEFAULT NULL,
    p_urgencia VARCHAR(20) DEFAULT 'normal'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_orcamento_id UUID;
    v_cliente_id UUID;
    v_item JSONB;
    v_resultado JSONB;
BEGIN
    -- Iniciar transação
    BEGIN
        -- Criar ou buscar cliente
        INSERT INTO clientes (nome, email, telefone, empresa)
        VALUES (
            p_cliente_data->>'nome',
            p_cliente_data->>'email',
            p_cliente_data->>'telefone',
            p_cliente_data->>'empresa'
        )
        ON CONFLICT (email) DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            empresa = EXCLUDED.empresa,
            updated_at = NOW()
        RETURNING id INTO v_cliente_id;
        
        -- Criar orçamento
        INSERT INTO orcamentos (
            usuario_id,
            cliente_id,
            status,
            observacoes_cliente,
            data_evento,
            urgencia
        )
        VALUES (
            p_usuario_id,
            v_cliente_id,
            'rascunho',
            p_observacoes,
            p_data_evento,
            p_urgencia
        )
        RETURNING id INTO v_orcamento_id;
        
        -- Adicionar itens ao orçamento
        FOR v_item IN SELECT * FROM unnest(p_itens_data)
        LOOP
            INSERT INTO itens_orcamento (
                orcamento_id,
                produto_id,
                quantidade,
                valor_unitario,
                personalizacoes
            )
            VALUES (
                v_orcamento_id,
                (v_item->>'produto_id')::UUID,
                (v_item->>'quantidade')::INTEGER,
                (v_item->>'valor_unitario')::DECIMAL(10,2),
                v_item->'personalizacoes'
            );
        END LOOP;
        
        -- Retornar resultado
        SELECT jsonb_build_object(
            'success', true,
            'orcamento_id', v_orcamento_id,
            'cliente_id', v_cliente_id,
            'message', 'Orçamento criado com sucesso'
        ) INTO v_resultado;
        
        RETURN v_resultado;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático em caso de erro
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao criar orçamento'
            );
    END;
END;
$$;

-- 2. Função para adicionar item ao orçamento
CREATE OR REPLACE FUNCTION adicionar_item_orcamento(
    p_orcamento_id UUID,
    p_produto_id UUID,
    p_quantidade INTEGER,
    p_valor_unitario DECIMAL(10,2),
    p_personalizacoes JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_item_id UUID;
    v_resultado JSONB;
BEGIN
    BEGIN
        -- Verificar se o orçamento existe
        IF NOT EXISTS (SELECT 1 FROM orcamentos WHERE id = p_orcamento_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Orçamento não encontrado'
            );
        END IF;
        
        -- Inserir item
        INSERT INTO itens_orcamento (
            orcamento_id,
            produto_id,
            quantidade,
            valor_unitario,
            personalizacoes
        )
        VALUES (
            p_orcamento_id,
            p_produto_id,
            p_quantidade,
            p_valor_unitario,
            p_personalizacoes
        )
        RETURNING id INTO v_item_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'item_id', v_item_id,
            'message', 'Item adicionado com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao adicionar item'
            );
    END;
END;
$$;

-- 3. Função para remover item do orçamento
CREATE OR REPLACE FUNCTION remover_item_orcamento(
    p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    BEGIN
        -- Verificar se o item existe
        IF NOT EXISTS (SELECT 1 FROM itens_orcamento WHERE id = p_item_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Item não encontrado'
            );
        END IF;
        
        -- Remover item
        DELETE FROM itens_orcamento WHERE id = p_item_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Item removido com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao remover item'
            );
    END;
END;
$$;

-- 4. Função para atualizar quantidade de item
CREATE OR REPLACE FUNCTION atualizar_quantidade_item(
    p_item_id UUID,
    p_nova_quantidade INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    BEGIN
        -- Verificar se o item existe
        IF NOT EXISTS (SELECT 1 FROM itens_orcamento WHERE id = p_item_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Item não encontrado'
            );
        END IF;
        
        -- Atualizar quantidade
        UPDATE itens_orcamento 
        SET quantidade = p_nova_quantidade,
            updated_at = NOW()
        WHERE id = p_item_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Quantidade atualizada com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao atualizar quantidade'
            );
    END;
END;
$$;

-- 5. Função para buscar orçamentos por usuário
CREATE OR REPLACE FUNCTION buscar_orcamentos_usuario(
    p_usuario_id UUID,
    p_limite INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'orcamentos', jsonb_agg(
            jsonb_build_object(
                'id', o.id,
                'numero', o.numero,
                'status', o.status,
                'valor_total', o.valor_total,
                'subtotal', o.subtotal,
                'desconto', o.desconto,
                'valor_frete', o.valor_frete,
                'data_evento', o.data_evento,
                'urgencia', o.urgencia,
                'observacoes_cliente', o.observacoes_cliente,
                'created_at', o.created_at,
                'updated_at', o.updated_at,
                'cliente', jsonb_build_object(
                    'id', c.id,
                    'nome', c.nome,
                    'email', c.email,
                    'telefone', c.telefone,
                    'empresa', c.empresa
                ),
                'total_itens', (
                    SELECT COUNT(*) 
                    FROM itens_orcamento 
                    WHERE orcamento_id = o.id
                )
            )
        )
    ) INTO v_resultado
    FROM orcamentos o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.usuario_id = p_usuario_id
    ORDER BY o.created_at DESC
    LIMIT p_limite OFFSET p_offset;
    
    RETURN COALESCE(v_resultado, jsonb_build_object('success', true, 'orcamentos', '[]'::jsonb));
END;
$$;

-- 6. Função para atualizar status do orçamento
CREATE OR REPLACE FUNCTION atualizar_status_orcamento(
    p_orcamento_id UUID,
    p_novo_status VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    BEGIN
        -- Verificar se o orçamento existe
        IF NOT EXISTS (SELECT 1 FROM orcamentos WHERE id = p_orcamento_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Orçamento não encontrado'
            );
        END IF;
        
        -- Atualizar status
        UPDATE orcamentos 
        SET status = p_novo_status,
            updated_at = NOW()
        WHERE id = p_orcamento_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Status atualizado com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao atualizar status'
            );
    END;
END;
$$;

-- 7. Função para buscar orçamento completo com itens
CREATE OR REPLACE FUNCTION buscar_orcamento_completo(
    p_orcamento_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'orcamento', jsonb_build_object(
            'id', o.id,
            'numero', o.numero,
            'status', o.status,
            'valor_total', o.valor_total,
            'subtotal', o.subtotal,
            'desconto', o.desconto,
            'valor_frete', o.valor_frete,
            'data_evento', o.data_evento,
            'urgencia', o.urgencia,
            'observacoes_cliente', o.observacoes_cliente,
            'created_at', o.created_at,
            'updated_at', o.updated_at,
            'cliente', jsonb_build_object(
                'id', c.id,
                'nome', c.nome,
                'email', c.email,
                'telefone', c.telefone,
                'empresa', c.empresa
            ),
            'usuario', jsonb_build_object(
                'id', u.id,
                'nome', u.nome,
                'email', u.email
            ),
            'itens', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', i.id,
                        'quantidade', i.quantidade,
                        'valor_unitario', i.valor_unitario,
                        'subtotal_item', i.subtotal_item,
                        'personalizacoes', i.personalizacoes,
                        'produto', jsonb_build_object(
                            'id', p.id,
                            'name', p.name,
                            'description', p.description,
                            'images', p.images
                        )
                    )
                )
                FROM itens_orcamento i
                LEFT JOIN products p ON i.produto_id = p.id
                WHERE i.orcamento_id = o.id
            ), '[]'::jsonb)
        )
    ) INTO v_resultado
    FROM orcamentos o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN usuarios u ON o.usuario_id = u.id
    WHERE o.id = p_orcamento_id;
    
    IF v_resultado IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Orçamento não encontrado'
        );
    END IF;
    
    RETURN v_resultado;
END;
$$;

-- 8. Função para duplicar orçamento
CREATE OR REPLACE FUNCTION duplicar_orcamento(
    p_orcamento_id UUID,
    p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_novo_orcamento_id UUID;
    v_orcamento_original RECORD;
    v_item RECORD;
    v_resultado JSONB;
BEGIN
    BEGIN
        -- Buscar orçamento original
        SELECT * INTO v_orcamento_original
        FROM orcamentos
        WHERE id = p_orcamento_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Orçamento original não encontrado'
            );
        END IF;
        
        -- Criar novo orçamento
        INSERT INTO orcamentos (
            usuario_id,
            cliente_id,
            status,
            observacoes_cliente,
            data_evento,
            urgencia,
            desconto,
            valor_frete
        )
        VALUES (
            p_usuario_id,
            v_orcamento_original.cliente_id,
            'rascunho',
            v_orcamento_original.observacoes_cliente,
            v_orcamento_original.data_evento,
            v_orcamento_original.urgencia,
            v_orcamento_original.desconto,
            v_orcamento_original.valor_frete
        )
        RETURNING id INTO v_novo_orcamento_id;
        
        -- Copiar itens
        FOR v_item IN 
            SELECT * FROM itens_orcamento 
            WHERE orcamento_id = p_orcamento_id
        LOOP
            INSERT INTO itens_orcamento (
                orcamento_id,
                produto_id,
                quantidade,
                valor_unitario,
                personalizacoes
            )
            VALUES (
                v_novo_orcamento_id,
                v_item.produto_id,
                v_item.quantidade,
                v_item.valor_unitario,
                v_item.personalizacoes
            );
        END LOOP;
        
        RETURN jsonb_build_object(
            'success', true,
            'novo_orcamento_id', v_novo_orcamento_id,
            'message', 'Orçamento duplicado com sucesso'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'Erro ao duplicar orçamento'
            );
    END;
END;
$$;

-- Comentários nas funções
COMMENT ON FUNCTION criar_orcamento_completo IS 'Cria um orçamento completo com cliente e itens em uma transação atômica';
COMMENT ON FUNCTION adicionar_item_orcamento IS 'Adiciona um item a um orçamento existente';
COMMENT ON FUNCTION remover_item_orcamento IS 'Remove um item específico de um orçamento';
COMMENT ON FUNCTION atualizar_quantidade_item IS 'Atualiza a quantidade de um item específico';
COMMENT ON FUNCTION buscar_orcamentos_usuario IS 'Busca todos os orçamentos de um usuário com paginação';
COMMENT ON FUNCTION atualizar_status_orcamento IS 'Atualiza o status de um orçamento';
COMMENT ON FUNCTION buscar_orcamento_completo IS 'Busca um orçamento completo com todos os dados relacionados';
COMMENT ON FUNCTION duplicar_orcamento IS 'Duplica um orçamento existente para um novo usuário';