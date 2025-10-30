-- Primeiro, criar um orçamento de teste se não existir
INSERT INTO solicitacao_orcamentos (
  solicitacao_id,
  user_id,
  status,
  observacoes,
  validade_proposta,
  prazo_entrega,
  forma_pagamento,
  opcao_frete,
  local_entrega,
  local_cobranca,
  created_at
) VALUES (
  1,
  (SELECT id FROM usuarios_clientes LIMIT 1), -- Usar o primeiro cliente disponível
  'pendente',
  'Orçamento de teste para proposta 107',
  '30 dias',
  '15 dias úteis',
  'À vista',
  'CIF',
  'Local de entrega padrão',
  'Local de cobrança padrão',
  NOW()
) ON CONFLICT (solicitacao_id) DO NOTHING;

-- Agora criar a proposta de teste com ID 107
INSERT INTO propostas (
  id,
  orcamento_id,
  numero_proposta,
  titulo,
  descricao,
  status,
  valor_total,
  observacoes,
  validade_proposta,
  prazo_entrega,
  forma_pagamento,
  opcao_frete,
  local_entrega,
  local_cobranca,
  created_at,
  updated_at,
  created_by
) VALUES (
  107,
  1, -- Referencia o orçamento criado acima
  'PROP-107',
  'Proposta de Teste 107',
  'Proposta criada para corrigir erro de consulta',
  'Proposta Criada',
  1000.00,
  'Proposta de teste para resolver erro de consulta',
  '30 dias',
  '15 dias úteis',
  'À vista',
  'CIF',
  'Local de entrega padrão',
  'Local de cobrança padrão',
  NOW(),
  NOW(),
  NULL
) ON CONFLICT (id) DO UPDATE SET
  numero_proposta = EXCLUDED.numero_proposta,
  titulo = EXCLUDED.titulo,
  updated_at = NOW();

-- Resetar a sequência para evitar conflitos futuros
SELECT setval('propostas_id_seq', GREATEST(107, (SELECT MAX(id) FROM propostas)));