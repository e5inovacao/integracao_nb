-- Migration 026: Compatibility Views for Frontend
-- Maps legacy table names used in React code to the new schema structure

-- 1. ecologic_products_site -> ecologic_products
-- The frontend expects 'titulo', 'descricao', 'categoria', 'id'
CREATE OR REPLACE VIEW ecologic_products_site AS
SELECT 
    id,
    titulo,
    descricao,
    categoria,
    img_0,
    img_1,
    img_2,
    codigo,
    tipo,
    cor_web_principal,
    variacoes
FROM ecologic_products;

-- 2. usuarios_clientes -> clientes_sistema
-- The frontend expects 'id', 'nome', 'email', 'telefone', 'empresa', 'cnpj', 'endereco'
CREATE OR REPLACE VIEW usuarios_clientes AS
SELECT 
    id,
    nome,
    email,
    telefone,
    empresa,
    NULL as cnpj, -- Placeholder as it might not exist in simple table
    NULL as endereco, -- Placeholder
    NULL as consultor_id -- Placeholder
FROM clientes_sistema;

-- 3. solicitacao_orcamentos -> orcamentos_sistema
-- The frontend expects 'solicitacao_id' instead of 'id'
-- And joins with 'usuarios_clientes' and 'consultores'
CREATE OR REPLACE VIEW solicitacao_orcamentos AS
SELECT 
    o.id as solicitacao_id, -- Alias for frontend compatibility
    o.id,
    o.numero_orcamento as numero_solicitacao,
    o.created_at,
    o.status,
    o.observacoes_cliente as solicitacao_observacao,
    o.cliente_id, -- Used for joins
    o.usuario_id,
    o.valor_total,
    -- Computed/Extra columns expected by frontend
    EXTRACT(YEAR FROM o.created_at)::int as ano_orcamento,
    CAST(SUBSTRING(o.numero_orcamento FROM '[0-9]+$') AS INTEGER) as numero_sequencial,
    NULL::int as consultor_id -- Placeholder if not directly linked
FROM orcamentos_sistema o;

-- 4. Grant access to these views
ALTER VIEW ecologic_products_site OWNER TO postgres;
GRANT SELECT ON ecologic_products_site TO anon, authenticated, service_role;

ALTER VIEW usuarios_clientes OWNER TO postgres;
GRANT SELECT ON usuarios_clientes TO anon, authenticated, service_role;

ALTER VIEW solicitacao_orcamentos OWNER TO postgres;
GRANT SELECT ON solicitacao_orcamentos TO anon, authenticated, service_role;
