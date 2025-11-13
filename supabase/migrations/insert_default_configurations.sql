-- Inserir configurações padrão para o sistema de orçamentos
-- Este arquivo adiciona configurações de exemplo para testar o sistema

-- Configurações de orçamento
INSERT INTO configuracoes (chave, valor, descricao, categoria, tipo, ativo) VALUES
('validade_proposta_padrao', '15 dias', 'Validade padrão para propostas de orçamento', 'orcamento', 'texto', true),
('validade_proposta_30', '30 dias', 'Validade de 30 dias para propostas especiais', 'orcamento', 'texto', true),
('validade_proposta_60', '60 dias', 'Validade de 60 dias para projetos grandes', 'orcamento', 'texto', true),

('prazo_entrega_rapido', '3 dias úteis', 'Prazo de entrega para produtos em estoque', 'orcamento', 'texto', true),
('prazo_entrega_normal', '15 dias úteis', 'Prazo de entrega padrão', 'orcamento', 'texto', true),
('prazo_entrega_personalizado', '20 dias úteis', 'Prazo para produtos personalizados', 'orcamento', 'texto', true),
('prazo_entrega_especial', '30 dias úteis', 'Prazo para produtos especiais ou importados', 'orcamento', 'texto', true),

('pagamento_avista', 'À vista', 'Pagamento à vista com desconto', 'orcamento', 'texto', true),
('pagamento_30dias', '30 dias', 'Pagamento em 30 dias', 'orcamento', 'texto', true),
('pagamento_parcelado_2x', 'Parcelado em 2x', 'Pagamento parcelado em 2 vezes', 'orcamento', 'texto', true),
('pagamento_parcelado_3x', 'Parcelado em 3x', 'Pagamento parcelado em 3 vezes', 'orcamento', 'texto', true),
('pagamento_entrada_30', 'Entrada + 30 dias', 'Entrada mais 30 dias', 'orcamento', 'texto', true),

('frete_cliente_retira', 'Cliente retira', 'Cliente retira no local', 'orcamento', 'texto', true),
('frete_cif_incluso', 'Frete CIF - Incluso', 'Frete por conta da empresa', 'orcamento', 'texto', true),
('frete_cif_grande_vitoria', 'Frete CIF - Incluso para Grande Vitória, exceto Cariacica, Viana e Guarapari', 'Frete incluso para região metropolitana', 'orcamento', 'texto', true),
('frete_fob_cliente', 'Frete FOB - Por conta do cliente', 'Frete por conta do cliente', 'orcamento', 'texto', true);

-- Configurações da empresa
INSERT INTO configuracoes (chave, valor, descricao, categoria, tipo, ativo) VALUES
('empresa_nome', 'NB Ecologic', 'Nome da empresa', 'empresa', 'texto', true),
('empresa_cnpj', '12.345.678/0001-90', 'CNPJ da empresa', 'empresa', 'texto', true),
('empresa_telefone', '(27) 3333-4444', 'Telefone principal da empresa', 'empresa', 'texto', true),
('empresa_email', 'contato@nbecologic.com.br', 'Email principal da empresa', 'empresa', 'texto', true),
('empresa_endereco', 'Rua das Flores, 123 - Centro - Vitória/ES', 'Endereço completo da empresa', 'empresa', 'texto', true);

-- Configurações gerais do sistema
INSERT INTO configuracoes (chave, valor, descricao, categoria, tipo, ativo) VALUES
('sistema_moeda', 'BRL', 'Moeda padrão do sistema', 'geral', 'texto', true),
('sistema_timezone', 'America/Sao_Paulo', 'Fuso horário do sistema', 'geral', 'texto', true),
('sistema_formato_data', 'DD/MM/YYYY', 'Formato de data padrão', 'geral', 'texto', true),
('desconto_maximo', '15', 'Desconto máximo permitido em percentual', 'geral', 'numero', true),
('margem_lucro_minima', '20', 'Margem de lucro mínima em percentual', 'geral', 'numero', true);

-- Configurações de email
INSERT INTO configuracoes (chave, valor, descricao, categoria, tipo, ativo) VALUES
('email_assinatura', 'Atenciosamente,\nEquipe NB Ecologic', 'Assinatura padrão para emails', 'email', 'texto', true),
('email_rodape', 'NB Ecologic - Soluções Sustentáveis\nTelefone: (27) 3333-4444 | Email: contato@nbecologic.com.br', 'Rodapé padrão para emails', 'email', 'texto', true);

COMMENT ON TABLE configuracoes IS 'Tabela de configurações do sistema com valores padrão inseridos';