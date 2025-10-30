import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EmailModal from '../components/EmailModal';
import { sendEmailWithBrevo } from '../utils/brevoApi';
import { generateOrcamentoEmailHTML } from '../utils/emailTemplate';
// Removido import da imagem SVG - usando favicon

interface OrcamentoData {
  solicitacao_id: string;
  numero_solicitacao?: string;
  created_at: string;
  user_id: string;
  status: string;
  observacoes?: string;
  validade_proposta?: string;
  prazo_entrega?: string;
  forma_pagamento?: string;
  opcao_frete?: string;
  consultor_id?: string;
}

interface ClienteData {
  id: string;
  empresa: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco?: string;
}

interface ProdutoOrcamento {
  id: string;
  produto_id: string;
  descricao: string;
  titulo: string;
  quantidade: number;
  products_quantidade_01?: number;
  products_quantidade_02?: number;
  products_quantidade_03?: number;
  valor_unitario: number;
  valor_total: number;
  categoria?: string;
  codigo?: string;
  color?: string;
  customizations?: string;
  personalizacao?: string;
  img_0?: string;
  img_1?: string;
  img_2?: string;
  // Campos para variação selecionada
  cor_selecionada?: string;
  imagem_variacao?: string;
  variacao_selecionada?: string;
  variacoes?: any;
  // Campos para preços múltiplos
  preco1?: number;
  preco2?: number;
  preco3?: number;
  valor_qtd01?: number;
  valor_qtd02?: number;
  valor_qtd03?: number;
  // Campos para linhas expandidas
  linha_tipo?: string;
  quantidade_linha?: number;
  preco_linha?: number;
  valor_linha?: number;
}



const OrcamentoDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [orcamento, setOrcamento] = useState<OrcamentoData | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [consultorId, setConsultorId] = useState<string>('');
  const [consultores, setConsultores] = useState<any[]>([]);
  const [consultorSelecionado, setConsultorSelecionado] = useState<string>('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  


  // Função para buscar dados do orçamento
  const fetchOrcamentoData = async (orcamentoId: string) => {
    try {
      // Para admin, buscar sem filtros (RLS já permite acesso total)
      // Para outros usuários, deixar o RLS controlar o acesso
      const { data, error } = await supabase
        .from('solicitacao_orcamentos')
        .select('*')
        .eq('solicitacao_id', orcamentoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Verificar se é admin antes de lançar erro de permissão
          if (userRole === 'admin') {
            throw new Error('Orçamento não encontrado');
          } else {
            throw new Error('Orçamento não encontrado ou você não tem permissão para visualizá-lo');
          }
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Erro ao buscar orçamento:', err);
      throw err;
    }
  };

  // Função para buscar dados do cliente
  const fetchClienteData = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar cliente:', err);
      throw err;
    }
  };

  // Função para buscar produtos do orçamento
  const fetchProdutosOrcamento = async (orcamentoId: string) => {
    try {
      console.log('Buscando produtos para orçamento ID:', orcamentoId);
      
      const { data, error } = await supabase
        .from('products_solicitacao')
        .select(`
          *,
          ecologic_products_site (
            id,
            titulo,
            descricao,
            categoria,
            codigo,
            img_0,
            img_1,
            img_2,
            variacoes
          )
        `)
        .eq('solicitacao_id', orcamentoId);

      if (error) {
        console.error('Erro na query:', error);
        throw error;
      }
      
      // Mapear os dados criando apenas uma entrada por produto
      const produtosMapeados: ProdutoOrcamento[] = [];
      
      data?.forEach((item: any) => {
        // Criar apenas uma entrada por produto, preservando todas as quantidades
        produtosMapeados.push({
          id: item.id,
          produto_id: item.products_id,
          descricao: item.ecologic_products_site?.descricao || 'Produto sem descrição',
          titulo: item.ecologic_products_site?.titulo || 'Produto sem título',
          valor_unitario: item.valor_unitario || 0,
          valor_total: item.valor_total || 0,
          categoria: item.ecologic_products_site?.categoria,
          codigo: item.ecologic_products_site?.codigo,
          color: item.color,
          customizations: item.customizations,
          personalizacao: item.personalizacao,
          img_0: item.ecologic_products_site?.img_0,
          img_1: item.ecologic_products_site?.img_1,
          img_2: item.ecologic_products_site?.img_2,
          products_quantidade_01: item.products_quantidade_01,
          products_quantidade_02: item.products_quantidade_02,
          products_quantidade_03: item.products_quantidade_03,
          // Usar a primeira quantidade não-zero como quantidade principal para compatibilidade
          quantidade: item.products_quantidade_01 || item.products_quantidade_02 || item.products_quantidade_03 || 0,
          // Campos de variação selecionada
          cor_selecionada: item.cor_selecionada,
          imagem_variacao: item.imagem_variacao,
          variacao_selecionada: item.variacao_selecionada,
          variacoes: item.ecologic_products_site?.variacoes,
          // Campos para preços múltiplos
          preco1: item.preco1,
          preco2: item.preco2,
          preco3: item.preco3,
          valor_qtd01: item.valor_qtd01,
          valor_qtd02: item.valor_qtd02,
          valor_qtd03: item.valor_qtd03
        });
      });
      
      return produtosMapeados;
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      throw err;
    }
  };

  // Função para buscar consultores disponíveis
  const fetchConsultores = async () => {
    try {
      const { data, error } = await supabase
        .from('consultores')
        .select('id, nome, email')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar consultores:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erro ao buscar consultores:', err);
      return [];
    }
  };



  // Carregar dados do usuário e role
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Verificar se é email administrativo
        if (user.email === 'admin@naturezabrindes.com.br') {
          setUserRole('admin');
          console.log('Usuário administrativo identificado:', user.email);
          return;
        }

        // Verificar se é consultor
        const { data: consultorData, error: consultorError } = await supabase
          .from('consultores')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (consultorData && !consultorError) {
          setUserRole('consultor');
          setConsultorId(consultorData.id);
          console.log('Usuário consultor identificado:', user.email);
        } else {
          // Usuário cliente
          setUserRole('cliente');
          console.log('Usuário cliente identificado:', user.email);
        }
      } catch (error) {
        console.error('Erro ao verificar role do usuário:', error);
        // Em caso de erro, definir como cliente por segurança
        setUserRole('cliente');
      }
    };

    loadUserData();
  }, [user]);

  // Carregar consultores disponíveis
  useEffect(() => {
    const loadConsultores = async () => {
      const consultoresData = await fetchConsultores();
      setConsultores(consultoresData);
    };

    loadConsultores();
  }, []);

  // Função para salvar consultor no orçamento
  const handleSalvarConsultor = async (consultorId: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('solicitacao_orcamentos')
        .update({ consultor_id: consultorId })
        .eq('solicitacao_id', id);

      if (error) {
        console.error('Erro ao salvar consultor:', error);
        toast.error('Erro ao vincular consultor');
        return;
      }

      setConsultorSelecionado(consultorId);
      toast.success('Consultor vinculado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar consultor:', err);
      toast.error('Erro ao vincular consultor');
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    const loadData = async () => {
      if (!id || !userRole) {
        if (!id) setError('ID do orçamento não encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Carregando dados do orçamento
        const orcamentoData = await fetchOrcamentoData(id);
        // Orçamento carregado com sucesso
        setOrcamento(orcamentoData);
        
        // Definir consultor selecionado se existir
        if (orcamentoData.consultor_id) {
          setConsultorSelecionado(orcamentoData.consultor_id);
        }

        // Buscar dados do cliente
        if (orcamentoData.user_id) {
          // Carregando dados do cliente
          const clienteData = await fetchClienteData(orcamentoData.user_id);
          // Cliente carregado com sucesso
          setCliente(clienteData);
        }

        // Buscar produtos do orçamento
        // Carregando produtos do orçamento
        const produtosData = await fetchProdutosOrcamento(id);
        // Produtos carregados com sucesso
        setProdutos(produtosData);



      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
        setError(errorMessage);
        console.error('Erro geral:', err);
        if (errorMessage.includes('permissão')) {
          toast.error('Você não tem permissão para visualizar este orçamento');
        }
      } finally {
        setLoading(false);
        // Carregamento finalizado
      }
    };

    loadData();
  }, [id, userRole, consultorId]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função robusta para normalizar cor_selecionada (trata tanto string quanto JSON)
  const normalizarCorSelecionada = (corSelecionada?: string): string => {
    console.log('🎨 Normalizando cor_selecionada:', corSelecionada);
    
    if (!corSelecionada) {
      console.log('❌ Cor vazia ou undefined');
      return '';
    }
    
    // Se for uma string JSON, fazer parse e extrair o nome da cor
    if (corSelecionada.startsWith('{') && corSelecionada.endsWith('}')) {
      try {
        const corObj = JSON.parse(corSelecionada);
        console.log('📦 Objeto cor parseado:', corObj);
        
        // Priorizar campos na ordem: cor > nome > color
        const corNormalizada = corObj.cor || corObj.nome || corObj.color || '';
        console.log('✅ Cor normalizada do JSON:', corNormalizada);
        return corNormalizada;
      } catch (e) {
        console.warn('⚠️ Erro ao fazer parse da cor_selecionada:', e);
        console.log('🔄 Retornando string original:', corSelecionada);
        return corSelecionada;
      }
    }
    
    // Se for string simples, retornar diretamente
    console.log('✅ Cor string simples:', corSelecionada);
    return corSelecionada;
  };

  // Função para obter a imagem da cor selecionada com lógica robusta de priorização
  const getImageForColor = (produto: ProdutoOrcamento, corProduto?: string) => {
    console.log('🎯 getImageForColor - Produto:', produto.titulo, {
      img_ref_url: (produto as any).img_ref_url,
      imagem_variacao_capturada: (produto as any).imagem_variacao_capturada,
      imagem_variacao: produto.imagem_variacao,
      cor_selecionada: produto.cor_selecionada,
      color: produto.color,
      corProduto,
      variacoes: produto.variacoes
    });

    // PRIORIDADE 0: img_ref_url (imagem salva no banco durante a captura)
    if ((produto as any).img_ref_url) {
      console.log('✅ Usando img_ref_url:', (produto as any).img_ref_url);
      return (produto as any).img_ref_url;
    }

    // PRIORIDADE 1: imagem_variacao_capturada (NOVA PRIORIDADE MÁXIMA)
    if ((produto as any).imagem_variacao_capturada) {
      console.log('✅ Usando imagem_variacao_capturada:', (produto as any).imagem_variacao_capturada);
      return (produto as any).imagem_variacao_capturada;
    }

    // PRIORIDADE 2: imagem_variacao (salva diretamente no banco)
    if (produto.imagem_variacao) {
      console.log('✅ Usando imagem_variacao:', produto.imagem_variacao);
      return produto.imagem_variacao;
    }

    // Extrair cor selecionada do JSON cor_selecionada
    let corSel = null;
    if (produto.cor_selecionada) {
      try {
        const parsed = JSON.parse(produto.cor_selecionada);
        if (typeof parsed === 'string') {
          corSel = parsed;
        } else if (parsed?.cor) {
          corSel = parsed.cor;
        } else if (Array.isArray(parsed) && parsed[0]) {
          corSel = parsed[0];
        }
      } catch {
        // Se não conseguir fazer parse, usar como string
      }
    }

    // Determinar cor para usar na busca
    const corParaUsar = (corSel || produto.color || corProduto || '').trim();

    // PRIORIDADE 3: busca nas variações do produto usando a cor selecionada
    if (produto.variacoes && corParaUsar) {
      let variacoesData;
      
      // Parse das variações se for string JSON
      if (typeof produto.variacoes === 'string') {
        try {
          variacoesData = JSON.parse(produto.variacoes);
        } catch (e) {
          console.warn('Erro ao fazer parse das variações:', e);
        }
      } else if (Array.isArray(produto.variacoes)) {
        variacoesData = produto.variacoes;
      }
      
      // Procurar pela variação correspondente à cor selecionada (case-insensitive)
      if (Array.isArray(variacoesData)) {
        const wanted = corParaUsar.toLowerCase();
        const variacaoCorrespondente = variacoesData.find((v: any) => 
          String(v?.cor || '').trim().toLowerCase() === wanted
        );
        
        if (variacaoCorrespondente) {
          const imageUrl = variacaoCorrespondente.link_image || variacaoCorrespondente.imagem || '';
          if (imageUrl) {
            console.log('✅ Usando imagem das variações para cor selecionada:', imageUrl);
            return imageUrl;
          }
        }
      }
    }

    // PRIORIDADE 4: mapeamento estático expandido usando a cor selecionada
    const colorImageMap: { [key: string]: string } = {
      'verde escuro': produto.img_0 || '',
      'marrom': produto.img_1 || '',
      'preto': produto.img_2 || '',
      'azul': produto.img_0 || '',
      'vermelho': produto.img_1 || '',
      'branco': produto.img_2 || '',
      'inox': produto.img_0 || '',
      'rosa': produto.img_1 || '',
      'amarelo': produto.img_0 || '',
      'cinza': produto.img_1 || '',
      'transparente': produto.img_0 || '',
      // Adicionar variações comuns
      'red': produto.img_1 || '',
      'blue': produto.img_0 || '',
      'black': produto.img_2 || '',
      'white': produto.img_2 || '',
      'green': produto.img_0 || '',
      'yellow': produto.img_0 || '',
      'gray': produto.img_1 || '',
      'grey': produto.img_1 || ''
    };

    // Tentar encontrar a imagem específica da cor no mapeamento estático
    if (corParaUsar) {
      // Normalizar a cor para busca (lowercase e trim)
      const corNormalizadaParaBusca = corParaUsar.toLowerCase();
      const imagemCor = colorImageMap[corNormalizadaParaBusca];
      
      console.log('🔍 Buscando cor no mapeamento:', {
        corOriginal: corParaUsar,
        corNormalizada: corNormalizadaParaBusca,
        imagemEncontrada: imagemCor,
        mapeamentoDisponivel: Object.keys(colorImageMap)
      });
      
      if (imagemCor) {
        console.log('✅ Usando mapeamento estático para cor selecionada:', imagemCor);
        return imagemCor;
      }
    }

    // PRIORIDADE 5: fallback inteligente
    const fallbackImage = produto.img_0 || produto.img_1 || produto.img_2;
    console.log('⚠️ Usando fallback:', fallbackImage);
    return fallbackImage;
  };

  // Função padronizada para gerar chave de agrupamento
  const gerarChaveAgrupamento = (produto: ProdutoOrcamento): string => {
    const corNormalizada = normalizarCorSelecionada(produto.cor_selecionada);
    const corFinal = corNormalizada || produto.color || 'sem-cor';
    const tituloNormalizado = produto.titulo?.trim() || 'sem-titulo';
    const codigoNormalizado = produto.codigo?.trim() || produto.produto_id || 'sem-codigo';
    
    // Chave única: codigo-titulo-cor para garantir agrupamento correto
    return `${codigoNormalizado}-${tituloNormalizado}-${corFinal}`.toLowerCase();
  };

  // Primeiro, agrupar produtos por chave padronizada para evitar duplicatas
  const produtosAgrupados = produtos.reduce((acc: any[], produto) => {
    console.log('🔍 Processando produto para agrupamento:', {
      titulo: produto.titulo,
      codigo: produto.codigo,
      cor_selecionada: produto.cor_selecionada,
      color: produto.color
    });

    // Gerar chave única padronizada
    const chaveUnica = gerarChaveAgrupamento(produto);
    
    console.log('🔑 Chave gerada:', chaveUnica);
    
    // Verificar se já existe um produto com a mesma chave
    const produtoExistente = acc.find(p => gerarChaveAgrupamento(p) === chaveUnica);
    
    if (produtoExistente) {
      console.log('🔄 Produto duplicado encontrado, somando quantidades');
      
      // Somar quantidades e valores se o produto já existe
      produtoExistente.quantidade += produto.quantidade || 0;
      produtoExistente.products_quantidade_01 = (produtoExistente.products_quantidade_01 || 0) + (produto.products_quantidade_01 || 0);
      produtoExistente.products_quantidade_02 = (produtoExistente.products_quantidade_02 || 0) + (produto.products_quantidade_02 || 0);
      produtoExistente.products_quantidade_03 = (produtoExistente.products_quantidade_03 || 0) + (produto.products_quantidade_03 || 0);
      produtoExistente.valor_total += produto.valor_total || 0;
      
      // Manter os preços do primeiro produto encontrado
      produtoExistente.preco1 = produtoExistente.preco1 || produto.preco1;
      produtoExistente.preco2 = produtoExistente.preco2 || produto.preco2;
      produtoExistente.preco3 = produtoExistente.preco3 || produto.preco3;
      
      // Manter a melhor informação de cor e imagem
      if (!produtoExistente.imagem_variacao && produto.imagem_variacao) {
        produtoExistente.imagem_variacao = produto.imagem_variacao;
      }
      if (!produtoExistente.cor_selecionada && produto.cor_selecionada) {
        produtoExistente.cor_selecionada = produto.cor_selecionada;
      }
    } else {
      console.log('➕ Adicionando novo produto ao agrupamento');
      
      // Adicionar novo produto
      acc.push({
        ...produto
      });
    }
    
    return acc;
  }, []);

  // Função para consolidar quantidades em uma única linha por produto
  const consolidarQuantidades = (produto: ProdutoOrcamento) => {
    console.log('🔄 Consolidando quantidades para produto:', produto.titulo);
    
    // Somar todas as quantidades não-zero
    const quantidade01 = produto.products_quantidade_01 || 0;
    const quantidade02 = produto.products_quantidade_02 || 0;
    const quantidade03 = produto.products_quantidade_03 || 0;
    const quantidadePadrao = produto.quantidade || 0;
    
    // Calcular quantidade total consolidada
    const quantidadeTotal = quantidade01 + quantidade02 + quantidade03 + quantidadePadrao;
    
    console.log('📊 Quantidades encontradas:', {
      quantidade01,
      quantidade02,
      quantidade03,
      quantidadePadrao,
      quantidadeTotal
    });
    
    // Determinar o melhor preço (priorizar preco1, depois preco2, depois preco3, depois valor_unitario)
    let precoUnitario = produto.preco1 || produto.preco2 || produto.preco3 || produto.valor_unitario || 0;
    
    // Se temos múltiplas quantidades com preços diferentes, usar uma média ponderada
    if (quantidade01 > 0 && quantidade02 > 0 && quantidade03 > 0) {
      const preco1 = produto.preco1 || 0;
      const preco2 = produto.preco2 || 0;
      const preco3 = produto.preco3 || 0;
      
      if (preco1 > 0 || preco2 > 0 || preco3 > 0) {
        const valorTotal1 = quantidade01 * preco1;
        const valorTotal2 = quantidade02 * preco2;
        const valorTotal3 = quantidade03 * preco3;
        const valorTotalConsolidado = valorTotal1 + valorTotal2 + valorTotal3;
        
        precoUnitario = quantidadeTotal > 0 ? valorTotalConsolidado / quantidadeTotal : precoUnitario;
        
        console.log('💰 Usando média ponderada de preços:', {
          preco1, preco2, preco3,
          valorTotal1, valorTotal2, valorTotal3,
          valorTotalConsolidado,
          precoUnitarioFinal: precoUnitario
        });
      }
    }
    
    // Calcular valor total consolidado
    const valorTotalConsolidado = quantidadeTotal * precoUnitario;
    
    console.log('✅ Produto consolidado:', {
      quantidadeTotal,
      precoUnitario,
      valorTotalConsolidado
    });
    
    return {
      quantidadeTotal,
      precoUnitario,
      valorTotalConsolidado
    };
  };

  // Consolidar produtos agrupados em uma única linha por produto
  const produtosConsolidados = produtosAgrupados.map((produto) => {
    // Normalizar cor_selecionada para garantir consistência
    const corNormalizada = normalizarCorSelecionada(produto.cor_selecionada);
    const corProduto = corNormalizada || produto.color || 'sem-cor';
    
    // Consolidar quantidades e valores
    const { quantidadeTotal, precoUnitario, valorTotalConsolidado } = consolidarQuantidades(produto);
    
    // Retornar produto consolidado
    return {
      ...produto,
      color: corProduto, // Usar cor normalizada como cor principal
      quantidade: quantidadeTotal,
      valor_unitario: precoUnitario,
      valor_total: valorTotalConsolidado,
      linha_tipo: 'consolidada',
      quantidade_linha: quantidadeTotal,
      preco_linha: precoUnitario,
      valor_linha: valorTotalConsolidado
    };
  }).filter(produto => produto.quantidade > 0); // Filtrar produtos com quantidade zero

  // Usar produtos consolidados para exibição
  const produtosParaExibir = produtosConsolidados;

  // Estados de loading e error
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Orçamento não encontrado</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Função para imprimir
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (emailData: any) => {
    setEmailLoading(true);
    
    try {
      // Preparar dados para o template do email
      const emailTemplateData = {
        orcamento,
        cliente,
        consultor: consultorSelecionado,
        produtos: produtosParaExibir,
        customMessage: emailData.message
      };

      // Gerar HTML do email
      const emailResult = await generateOrcamentoEmailHTML(emailTemplateData);

      // Preparar lista de destinatários
      const recipients = emailData.recipients
        .filter((email: string) => email.trim() !== '')
        .map((email: string) => ({ email: email.trim() }));

      if (recipients.length === 0) {
        toast.error('Nenhum destinatário válido encontrado.');
        return;
      }

      // Enviar email via Brevo
      await sendEmailWithBrevo({
        to: recipients,
        subject: emailData.subject || `Orçamento ${orcamento.solicitacao_id} - Natureza Brindes`,
        htmlContent: emailResult.htmlContent,
        inlineImages: emailResult.inlineImages,
        sender: {
          name: 'Natureza Brindes',
          email: 'orcamentos@naturezabrindes.com.br'
        }
      });
      
      toast.success(`Email enviado com sucesso para ${recipients.length} destinatário(s)!`);
      setEmailModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      const errorMessage = error.message || 'Erro desconhecido ao enviar email';
      toast.error(`Erro ao enviar email: ${errorMessage}`);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Botão Voltar - Posicionado no canto superior direito */}
        <div className="mb-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={20} />
            Imprimir
          </button>
          
          <button
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors"
                  style={{backgroundColor: '#2CB20B'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
          >
            <Send size={20} />
            Enviar
          </button>
        </div>
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          /* Ocultar cabeçalho e rodapé do navegador */
          @page {
            margin: 0;
            size: A4;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }
          
          .max-w-4xl {
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .bg-gray-50 {
            background: white !important;
          }
          
          /* Layout lado a lado para impressão */
          .print-two-columns {
            display: flex !important;
            gap: 2rem !important;
          }
          
          .print-two-columns > div {
            flex: 1 !important;
          }
          
          /* Forçar quebra de página se necessário */
          .page-break {
            page-break-before: always;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

        {/* Container Principal */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Cabeçalho da Empresa */}
        <div className="bg-white p-8 text-center border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 flex items-center justify-center mr-3">
              <img 
                src="/favicon.webp" 
                alt="Natureza Brindes Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{color: '#2CB20B'}}>Natureza Brindes</h1>
              <p className="text-sm text-gray-600">Sua marca para todo mundo ver</p>
            </div>
          </div>
          
          <div className="text-gray-700 mb-4">
            <p>Obrigado(a) por sua solicitação.</p>
            <p>Estamos à sua disposição.</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p className="text-blue-500">Orçamento: {(() => {
              const numeroCompleto = orcamento.numero_solicitacao || orcamento.solicitacao_id;
              // Extrair apenas os últimos 4 dígitos (ex: SOL-20251013-000177 -> 0177)
              const match = numeroCompleto.match(/(\d{4})$/);
              return match ? match[1] : numeroCompleto;
            })()}</p>
            <p className="text-blue-400">Data: {formatDate(orcamento.created_at)}</p>
          </div>
        </div>



        {/* Seção de Informações em Duas Colunas */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print-two-columns">
            {/* Aos cuidados de */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Aos cuidados de</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Empresa: {cliente?.empresa || 'Não informado'}</p>
                <p>CNPJ: {cliente?.cnpj || 'Não informado'}</p>
                <p>Contato: {cliente?.nome || 'Não informado'}</p>
                <p>Email: {cliente?.email || 'Não informado'}</p>
                <p>Telefone: {cliente?.telefone || 'Não informado'}</p>
              </div>
            </div>
            
            {/* Dados do Atendimento */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Dados do Atendimento</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Equipe Natureza Brindes</p>
                <p>CNPJ: 57225892000146</p>
                
                {/* Seção do Representante/Consultor */}
                <div className="mt-4 print-hide-representante">
                  <p className="font-medium text-gray-700 mb-2">Representante:</p>
                  {userRole === 'admin' ? (
                    <div className="no-print">
                      <select
                        value={consultorSelecionado}
                        onChange={(e) => {
                          const novoConsultor = e.target.value;
                          setConsultorSelecionado(novoConsultor);
                          if (novoConsultor) {
                            handleSalvarConsultor(novoConsultor);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Selecione um consultor</option>
                        {consultores.map((consultor) => (
                          <option key={consultor.id} value={consultor.id}>
                            {consultor.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  
                  {/* Exibir dados do consultor selecionado */}
                  {consultorSelecionado && (() => {
                    const consultor = consultores.find(c => c.id === consultorSelecionado);
                    return consultor ? (
                      <div className="mt-2">
                        <p>Contato: {consultor.nome}</p>
                        <p>Email: {consultor.email}</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p>Contato: Administrador</p>
                        <p>Email: admin@naturezabrindes.com.br</p>
                      </div>
                    );
                  })()}
                  
                  {/* Caso nenhum consultor esteja selecionado */}
                  {!consultorSelecionado && (
                    <div className="mt-2">
                      <p>Contato: Administrador</p>
                      <p>Email: admin@naturezabrindes.com.br</p>
                    </div>
                  )}
                </div>
                
                <p>Telefone: (27)9995-47137</p>
              </div>
            </div>
          </div>

          {/* Seção ITENS DA PROPOSTA */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">ITENS DA PROPOSTA</h2>
            <p className="text-sm text-gray-600 mb-6">Para mais fotos e detalhes sobre os produtos clique na foto.</p>
            

            {produtosParaExibir.length > 0 ? (
              produtosParaExibir.map((produto, index) => (
                <div key={`produto-item-${produto.id}-${index}`} className="mb-8">
                  {/* Header do Item */}
                  <div className="bg-blue-600 text-white px-4 py-2 font-bold mb-4">
                    ITEM {index + 1}
                  </div>
                  
                  {/* Conteúdo do Item */}
                  <div className="flex gap-6 mb-8">
                    {/* Imagem do Produto */}
                    <div className="w-32 h-32 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {getImageForColor(produto) ? (
                        <img 
                          src={getImageForColor(produto)} 
                          alt={produto.titulo}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="w-20 h-20 bg-gray-300 rounded flex items-center justify-center"><span class="text-xs text-gray-500">Sem imagem</span></div>';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Detalhes do Produto */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-2 truncate" title={produto.titulo}>{produto.titulo}</h4>
                      <p className="text-sm text-gray-600 mb-2">{produto.descricao}</p>
                      {produto.categoria && (
                        <p className="text-sm text-gray-600 mb-2">Categoria: {produto.categoria}</p>
                      )}
                      {produto.codigo && (
                        <p className="text-sm text-gray-600 mb-2">Código: {produto.codigo}</p>
                      )}
                      {(() => {
                        const corNormalizada = normalizarCorSelecionada(produto.cor_selecionada);
                        const corParaExibir = corNormalizada || produto.color;
                        return corParaExibir ? (
                          <p className="text-sm text-gray-600 mb-2">Cor: {corParaExibir}</p>
                        ) : null;
                      })()}
                      {produto.personalizacao && (
                        <p className="text-sm text-gray-600 mb-2">Gravação: {produto.personalizacao}</p>
                      )}
                      {produto.customizations && (
                        <p className="text-sm text-gray-600">Personalizações: {produto.customizations}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum produto encontrado para este orçamento.</p>
              </div>
            )}
          </div>

          {/* Tabela de Preços */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-center font-bold">Produto</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-bold">Total por Quantidade</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-bold">Valor Unitário</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-bold">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosParaExibir.length > 0 ? (
                    produtosParaExibir.map((produto, index) => (
                      <tr key={`tabela-produto-${produto.id}-${produto.linha_tipo}-${index}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                        
                        {/* Nome do produto */}
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <div className="text-sm font-medium">{produto.titulo || produto.descricao || 'Produto sem nome'}</div>
                        </td>
                        
                        {/* Nova coluna: Total por Quantidade */}
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {produto.products_quantidade_01 > 0 && (
                            <div className="text-sm mb-1 p-1 bg-blue-100 rounded">{produto.products_quantidade_01}</div>
                          )}
                          {produto.products_quantidade_02 > 0 && (
                            <div className="text-sm mb-1 p-1 bg-blue-100 rounded">{produto.products_quantidade_02}</div>
                          )}
                          {produto.products_quantidade_03 > 0 && (
                            <div className="text-sm p-1 bg-blue-100 rounded">{produto.products_quantidade_03}</div>
                          )}
                          {(!produto.products_quantidade_01 && !produto.products_quantidade_02 && !produto.products_quantidade_03) && (
                            <div className="text-sm">{produto.quantidade ? `Qtd: ${produto.quantidade}` : 'A consultar'}</div>
                          )}
                        </td>
                        
                        {/* Valores em linhas */}
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {produto.valor_qtd01 > 0 && (
                            <div className="text-sm mb-1 p-1 bg-gray-100 rounded">{formatCurrency(produto.valor_qtd01)}</div>
                          )}
                          {produto.valor_qtd02 > 0 && (
                            <div className="text-sm mb-1 p-1 bg-gray-100 rounded">{formatCurrency(produto.valor_qtd02)}</div>
                          )}
                          {produto.valor_qtd03 > 0 && (
                            <div className="text-sm p-1 bg-gray-100 rounded">{formatCurrency(produto.valor_qtd03)}</div>
                          )}
                          {(!produto.valor_qtd01 && !produto.valor_qtd02 && !produto.valor_qtd03) && (
                            <div className="text-sm">{produto.valor_unitario > 0 ? formatCurrency(produto.valor_unitario) : 'A consultar'}</div>
                          )}
                        </td>
                        
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {(() => {
                            // Mostrar os valores totais individuais para cada combinação quantidade × valor unitário
                            const totais = [];
                            
                            if (produto.products_quantidade_01 > 0 && produto.valor_qtd01 > 0) {
                              totais.push(
                                <div key="total1" className="text-sm mb-1 p-1 bg-green-100 rounded font-medium">
                                  {formatCurrency(produto.products_quantidade_01 * produto.valor_qtd01)}
                                </div>
                              );
                            }
                            if (produto.products_quantidade_02 > 0 && produto.valor_qtd02 > 0) {
                              totais.push(
                                <div key="total2" className="text-sm mb-1 p-1 bg-green-100 rounded font-medium">
                                  {formatCurrency(produto.products_quantidade_02 * produto.valor_qtd02)}
                                </div>
                              );
                            }
                            if (produto.products_quantidade_03 > 0 && produto.valor_qtd03 > 0) {
                              totais.push(
                                <div key="total3" className="text-sm p-1 bg-green-100 rounded font-medium">
                                  {formatCurrency(produto.products_quantidade_03 * produto.valor_qtd03)}
                                </div>
                              );
                            }
                            
                            // Se não há quantidades específicas, usar quantidade geral
                            if (totais.length === 0 && produto.quantidade && produto.valor_unitario > 0) {
                              totais.push(
                                <div key="totalGeral" className="text-sm font-medium">
                                  {formatCurrency(produto.quantidade * produto.valor_unitario)}
                                </div>
                              );
                            }
                            
                            return totais.length > 0 ? totais : <div className="text-sm">A consultar</div>;
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4 mb-8">
            <div className="flex">
              <span className="font-bold text-gray-800 w-40">Opção de frete:</span>
              <span className="text-gray-600">{orcamento.opcao_frete || 'Frete CIF - Incluso para Grande Vitória, exceto Cariacica, Viana e Guarapari'}</span>
            </div>
            
            <div className="flex">
              <span className="font-bold text-gray-800 w-40">Validade da proposta:</span>
              <span className="text-gray-600">{orcamento.validade_proposta ? `${orcamento.validade_proposta} dias` : '10 dias'}</span>
            </div>
            
            <div className="flex">
              <span className="font-bold text-gray-800 w-40">Prazo de entrega:</span>
              <span className="text-gray-600">{orcamento.prazo_entrega ? `${orcamento.prazo_entrega} dias úteis` : '20 dias úteis'}</span>
            </div>
            
            {orcamento.observacoes && (
              <div className="flex">
                <span className="font-bold text-gray-800 w-40">Observações:</span>
                <span className="text-gray-600">{orcamento.observacoes}</span>
              </div>
            )}
          </div>

          {/* Texto de Confirmação em Destaque */}
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
            <p className="text-center text-gray-800 font-medium">
              A CONFIRMAÇÃO DO PEDIDO NÃO IMPLICA OBRIGATORIAMENTE NA<br />
              DISPONIBILIDADE DO ESTOQUE, ISSO SÓ SERÁ CONFIRMADO DURANTE<br />
              A SEPARAÇÃO DO MESMO OU DURANTE A COMPRA NO FORNECEDOR.
            </p>
          </div>

          {/* Observações Adicionais e Dados da Empresa */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <span className="font-bold text-gray-800">Observações Adicionais:</span>
            </div>
            
            <div className="flex mb-6">
              <span className="font-bold text-gray-800 w-40">Forma de pagamento:</span>
              <span className="text-gray-600">{orcamento.forma_pagamento || '100% 15 dias após emissão da NF'}</span>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Atenciosamente,</p>
                <p className="font-bold text-gray-800">Equipe Natureza Brindes</p>
                <p>Telefone:</p>
                <p>E-mail: vendas02@cristalbrindes.com.br</p>
                <p>CNPJ: 57225892000146</p>
              </div>
              
              <div className="text-right text-sm text-gray-600">
                <p>(27) 3238-9726</p>
                <p>11A RUA RUA GIRASSOL, 25</p>
                <p>MIRANTE DA PRAIA - CEP: 29187-000</p>
                <p>FUNDÃO - ES</p>
              </div>
            </div>
          </div>
        </div>
        
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          onSend={handleSendEmail}
          loading={emailLoading}
          clienteEmail={cliente?.email || ''}
        />
        </div>
      </div>
    </>
  );
};

export default OrcamentoDetalhes;