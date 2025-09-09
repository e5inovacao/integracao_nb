import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOrcamentoInsert() {
  console.log('Testando inserção na tabela orcamentos_sistema...');
  
  try {
    // Primeiro, vamos buscar um usuário existente
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('Nenhum usuário encontrado. Criando um usuário de teste...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('usuarios_sistema')
        .insert({
          nome: 'Teste Usuario',
          email: 'teste@exemplo.com',
          telefone: '11999999999'
        })
        .select()
        .single();
      
      if (createUserError) {
        console.error('Erro ao criar usuário:', createUserError);
        return;
      }
      
      console.log('Usuário criado:', newUser);
      usuarios.push(newUser);
    }
    
    const usuarioId = usuarios[0].id;
    console.log('Usando usuário ID:', usuarioId);
    
    // Agora vamos inserir um orçamento
    const orcamentoData = {
      numero_orcamento: `ORC${Date.now()}`,
      usuario_id: usuarioId,
      data_evento: '2024-02-15',
      observacoes: 'Teste de inserção manual',
      status: 'pendente',
      valor_total: 150.00
    };
    
    console.log('Dados do orçamento a inserir:', orcamentoData);
    
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos_sistema')
      .insert(orcamentoData)
      .select()
      .single();
    
    if (orcamentoError) {
      console.error('Erro ao inserir orçamento:', orcamentoError);
      console.error('Detalhes do erro:', JSON.stringify(orcamentoError, null, 2));
    } else {
      console.log('Orçamento inserido com sucesso:', orcamento);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testOrcamentoInsert();