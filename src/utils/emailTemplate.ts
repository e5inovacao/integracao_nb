import { compressImage, estimateBase64Size, formatBytes } from './imageCompression';
import { generateThumbnail, toImageRef, toLogoRef, dataUrlToBase64 } from './imageUtils';

interface OrcamentoEmailData {
  orcamento: any;
  cliente: any;
  consultor: any;
  produtos: any[];
  customMessage?: string;
}

interface EmailImageData {
  src: string;
  cidName?: string;
  originalUrl?: string;
}

interface EmailGenerationResult {
  htmlContent: string;
  inlineImages: Array<{ name: string; content: string }>;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const generateOrcamentoEmailHTML = async (data: OrcamentoEmailData): Promise<EmailGenerationResult> => {
  const { orcamento, cliente, consultor, produtos, customMessage } = data;
  
  // Limitar produtos para máximo 10 para evitar emails muito grandes
  const produtosLimitados = produtos.slice(0, 10);
  
  // Array para armazenar imagens inline
  const inlineImages: Array<{ name: string; content: string }> = [];
  
  // Processar logo - usar URL do Supabase
  const logoRef = toLogoRef();
  console.log('Logo ref:', logoRef);
  
  // Se usar CID, adicionar às imagens inline
  if (logoRef.cidName) {
    try {
      // Logo SVG da Natureza Brindes convertido para base64
      const logoBase64 = 'PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBGdW5kbyBjaXJjdWxhciB2ZXJkZSAtLT4KICA8Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI1OCIgZmlsbD0iIzE2YTM0YSIgc3Ryb2tlPSIjMTU4MDNkIiBzdHJva2Utd2lkdGg9IjIiLz4KICAKICA8IS0tIEZvbGhhIHByaW5jaXBhbCAtLT4KICA8cGF0aCBkPSJNMzUgNjAgUTQ1IDM1LCA2MCA0NSBRNzUgMzUsIDg1IDYwIFE3NSA4NSwgNjAgNzUgUTQ1IDg1LCAzNSA2MCBaIiBmaWxsPSIjMjJjNTVlIi8+CiAgCiAgPCEtLSBOZXJ2dXJhIGNlbnRyYWwgZGEgZm9saGEgLS0+CiAgPHBhdGggZD0iTTYwIDQ1IEw2MCA3NSIgc3Ryb2tlPSIjMTU4MDNkIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIAogIDwhLS0gTmVydnVyYXMgbGF0ZXJhaXMgLS0+CiAgPHBhdGggZD0iTTUwIDU1IFE1NSA1MCwgNjAgNTUiIHN0cm9rZT0iIzE1ODAzZCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNNzAgNTUgUTY1IDUwLCA2MCA1NSIgc3Ryb2tlPSIjMTU4MDNkIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik01MCA2NSBRNTUgNzAsIDYwIDY1IiBzdHJva2U9IiMxNTgwM2QiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTcwIDY1IFE2NSA3MCwgNjAgNjUiIHN0cm9rZT0iIzE1ODAzZCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAKICA8IS0tIFRleHRvICJOQiIgLS0+CiAgPHRleHQgeD0iNjAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPk5CPC90ZXh0Pgo8L3N2Zz4=';
      inlineImages.push({ name: logoRef.cidName, content: logoBase64 });
      console.log('✅ Logo da Natureza Brindes adicionado como CID ao e-mail');
    } catch (error) {
      console.warn('Erro ao processar logo:', error);
    }
  } else {
    console.log('✅ Logo da Natureza Brindes será usado como URL HTTPS:', logoRef.src);
  }
  
  // Processar imagens dos produtos
  const produtosComImagensProcessadas = await Promise.all(
    produtosLimitados.map(async (produto, index) => {
      const imageRef = toImageRef(produto, index);
      
      if (imageRef.cidName && imageRef.originalUrl) {
        try {
          // Gerar thumbnail 120x120 com qualidade 0.6
          const thumbnailBase64 = await generateThumbnail(imageRef.originalUrl, 120, 120, 0.6);
          inlineImages.push({ name: imageRef.cidName, content: thumbnailBase64 });
        } catch (error) {
          console.warn(`Erro ao gerar thumbnail para produto ${produto.titulo}:`, error);
          // Fallback para imagem placeholder
          imageRef.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI2NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNmI3MjgwIj5TZW0gaW1hZ2VtPC90ZXh0Pgo8L3N2Zz4=';
        }
      }
      
      return {
        ...produto,
        imageRef
      };
    })
  );
  
  const totalGeral = produtos.reduce((sum, produto) => sum + produto.valor_total, 0);
  
  // Gerar HTML do email com placeholders corretos
  const htmlContent = generateEmailHTML(orcamento, cliente, consultor, produtosComImagensProcessadas, customMessage, totalGeral, produtos.length, logoRef);
  
  // Monitorar tamanho do email
  const emailSize = new Blob([htmlContent]).size;
  const emailSizeMB = emailSize / (1024 * 1024);
  
  console.log(`📧 Tamanho do email: ${formatBytes(emailSize)} (${emailSizeMB.toFixed(2)} MB)`);
  console.log(`📦 Produtos no email: ${produtosComImagensProcessadas.length}/${produtos.length}`);
  console.log(`🖼️ Imagens inline: ${inlineImages.length}`);
  
  // Verificar se o email está dentro do limite de tamanho
  if (emailSizeMB > 15) {
    console.warn('⚠️ Email muito grande, reduzindo imagens inline');
    // Manter apenas o logo e primeiras 3 imagens de produtos
    const reducedInlineImages = inlineImages.slice(0, 4);
    return { htmlContent, inlineImages: reducedInlineImages };
  }
  
  return { htmlContent, inlineImages };
};

const generateEmailHTML = (orcamento: any, cliente: any, consultor: any, produtosComImagensProcessadas: any[], customMessage: string | undefined, totalGeral: number, totalProdutos: number, logoRef: EmailImageData): string => {
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orçamento ${orcamento?.numero_solicitacao || 'N/A'}</title>
      <style>
        @media (max-width: 600px) {
          .container { width: 100% !important; }
          .stack { display: block !important; width: 100% !important; }
          .img { width: 100% !important; height: auto !important; }
        }
      </style>
      <!--[if mso]>
      <style type="text/css">
        table { border-collapse: collapse; }
        .fallback-text { font-family: Arial, sans-serif; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
      <center>
        <table width="100%" cellspacing="0" cellpadding="0" style="background: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 20px;">
              
              <!-- Container Principal -->
              <table class="container" width="600" style="background: #fff; border-radius: 6px;" cellpadding="0" cellspacing="0">
                
                <!-- Cabeçalho -->
                <tr>
                  <td align="center" style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <img src="${logoRef.src}" width="120" style="display:block;border:0;outline:0" alt="Natureza Brindes">
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 8px;">
                          <div style="font-weight: 700; color: #16a34a; font-size: 18px;">Natureza Brindes</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 4px;">
                          <div style="color: #6b7280; font-size: 12px;">Sua marca para todo mundo ver</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 8px;">
                          <div style="font-size: 12px;">
                            <strong>Orçamento:</strong> ${(() => {
                              // Extrair apenas os últimos 4 dígitos do número do orçamento
                              let numeroCompleto = '';
                              
                              if (orcamento?.numero_orcamento) {
                                numeroCompleto = orcamento.numero_orcamento;
                              } else if (orcamento?.numero_sequencial && orcamento?.ano_orcamento) {
                                numeroCompleto = `${orcamento.ano_orcamento}-${String(orcamento.numero_sequencial).padStart(4, '0')}`;
                              } else if (orcamento?.numero_solicitacao) {
                                numeroCompleto = orcamento.numero_solicitacao;
                              } else {
                                numeroCompleto = `ORC-${String(orcamento?.solicitacao_id || 'N/A').padStart(4, '0')}`;
                              }
                              
                              // Extrair apenas os últimos 4 dígitos numéricos
                              const matches = numeroCompleto.match(/(\d{4})$/);
                              return matches ? matches[1] : numeroCompleto;
                            })()} | 
                            <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Seção Aos Cuidados de / Dados do Atendimento -->
                <tr>
                  <td style="padding: 12px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="stack" width="50%" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; vertical-align: top;">
                          <strong>Aos cuidados de</strong><br>
                          Empresa: ${cliente?.empresa || 'Não informado'}<br>
                          CNPJ: ${cliente?.cnpj || 'Não informado'}<br>
                          Contato: ${cliente?.nome || 'Não informado'}<br>
                          Email: <a href="mailto:${cliente?.email || ''}" style="color: #2563eb;">${cliente?.email || 'Não informado'}</a><br>
                          Telefone: ${cliente?.telefone || 'Não informado'}
                        </td>
                        <td width="12"></td>
                        <td class="stack" width="50%" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; vertical-align: top;">
                          <strong>Dados do Atendimento</strong><br>
                          Equipe Natureza Brindes<br>
                          CNPJ: 57.225.892/0001-46<br>
                          Representante: ${consultor?.nome || 'Administrador'}<br>
                          Email: <a href="mailto:${consultor?.email || 'admin@naturezabrindes.com.br'}" style="color: #2563eb;">${consultor?.email || 'admin@naturezabrindes.com.br'}</a><br>
                          Telefone: ${consultor?.telefone || '(27)9995-47137'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                ${produtosComImagensProcessadas.map((produto, index) => `
                <!-- ITEM ${index + 1} -->
                <tr>
                  <td style="padding: 0 20px;">
                    <table width="100%" style="background: #2563EB; color: #fff; font-weight: 700; font-size: 12px; border-radius: 4px;" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 12px;">ITEM ${index + 1}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Card do Produto -->
                <tr>
                  <td style="padding: 12px 20px;">
                    <table width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px;" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="120" style="padding: 12px; vertical-align: top;">
                          ${produto.imageRef?.src ? 
                            `<img src="${produto.imageRef.src}" width="120" height="120" style="display:block;width:120px;height:120px;object-fit:cover;background:#f3f4f6;border:0" alt="${produto.titulo}">` : 
                            `<table width="120" height="120" style="background: #f3f4f6; border-radius: 4px;" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle" style="font-size: 10px; color: #6b7280;">Sem imagem</td></tr></table>`
                          }
                        </td>
                        <td style="padding: 12px; vertical-align: top;">
                          <strong>${produto.titulo}</strong><br>
                          ${produto.descricao ? `${produto.descricao}<br>` : ''}
                          <span style="font-size: 12px; color: #4b5563;">
                            ${produto.categoria ? `Categoria: ${produto.categoria} | ` : ''}
                            ${produto.codigo ? `Código: ${produto.codigo} | ` : ''}
                            ${produto.color ? `Cor: ${produto.color} | ` : ''}
                            ${produto.personalizacao ? `Gravação: ${produto.personalizacao}` : ''}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Tabela de Preços do Produto -->
                <tr>
                  <td style="padding: 6px 20px 16px;">
                    <table width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px;" cellpadding="8" cellspacing="0">
                      <tr style="background: #f9fafb; font-weight: 700; font-size: 12px;">
                        <td style="border-bottom: 1px solid #e5e7eb;">Produto</td>
                        <td align="center" style="border-bottom: 1px solid #e5e7eb;">Qtd</td>
                        <td align="center" style="border-bottom: 1px solid #e5e7eb;">Unit.</td>
                        <td align="center" style="border-bottom: 1px solid #e5e7eb;">Total</td>
                      </tr>
                      ${produto.products_quantidade_01 > 0 && produto.valor_qtd01 > 0 ? `
                      <tr>
                        <td>${produto.titulo}</td>
                        <td align="center">${produto.products_quantidade_01}</td>
                        <td align="center">${formatCurrency(produto.valor_qtd01)}</td>
                        <td align="center">${formatCurrency(produto.products_quantidade_01 * produto.valor_qtd01)}</td>
                      </tr>
                      ` : ''}
                      ${produto.products_quantidade_02 > 0 && produto.valor_qtd02 > 0 ? `
                      <tr>
                        <td>${produto.titulo}</td>
                        <td align="center">${produto.products_quantidade_02}</td>
                        <td align="center">${formatCurrency(produto.valor_qtd02)}</td>
                        <td align="center">${formatCurrency(produto.products_quantidade_02 * produto.valor_qtd02)}</td>
                      </tr>
                      ` : ''}
                      ${produto.products_quantidade_03 > 0 && produto.valor_qtd03 > 0 ? `
                      <tr>
                        <td>${produto.titulo}</td>
                        <td align="center">${produto.products_quantidade_03}</td>
                        <td align="center">${formatCurrency(produto.valor_qtd03)}</td>
                        <td align="center">${formatCurrency(produto.products_quantidade_03 * produto.valor_qtd03)}</td>
                      </tr>
                      ` : ''}
                      ${(!produto.products_quantidade_01 || !produto.valor_qtd01) && (!produto.products_quantidade_02 || !produto.valor_qtd02) && (!produto.products_quantidade_03 || !produto.valor_qtd03) ? `
                      <tr>
                        <td>${produto.titulo}</td>
                        <td align="center">${produto.quantidade || 'A consultar'}</td>
                        <td align="center">${produto.valor_unitario > 0 ? formatCurrency(produto.valor_unitario) : 'A consultar'}</td>
                        <td align="center">${produto.quantidade && produto.valor_unitario > 0 ? formatCurrency(produto.quantidade * produto.valor_unitario) : 'A consultar'}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
                `).join('')}
                
                <!-- Informações de Frete, Validade e Prazo -->
                <tr>
                  <td style="padding: 0 20px;">
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td class="stack" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
                          <strong>Frete:</strong> ${orcamento.opcao_frete || 'Frete CIF - Incluso'}
                        </td>
                        <td width="8"></td>
                        <td class="stack" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
                          <strong>Validade:</strong> ${orcamento.validade_proposta ? `${orcamento.validade_proposta} dias` : '15 dias'}
                        </td>
                        <td width="8"></td>
                        <td class="stack" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
                          <strong>Prazo:</strong> ${orcamento.prazo_entrega ? `${orcamento.prazo_entrega} dias úteis` : '15 / 20 dias úteis'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Observações e Forma de Pagamento -->
                <tr>
                  <td style="padding: 8px 20px;">
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td class="stack" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; vertical-align: top;">
                          <strong>Observações</strong><br>
                          ${orcamento.observacoes || '100% 15 dias após emissão da NF'}
                        </td>
                        <td width="8"></td>
                        <td class="stack" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; vertical-align: top;">
                          <strong>Pagamento</strong><br>
                          ${orcamento.forma_pagamento || 'À vista ou parcelado'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Aviso Importante -->
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 12px; font-weight: 700;">
                      A CONFIRMAÇÃO DO PEDIDO NÃO IMPLICA DISPONIBILIDADE IMEDIATA DE ESTOQUE; SERÁ VERIFICADA NA SEPARAÇÃO OU COMPRA.
                    </div>
                  </td>
                </tr>
                
                ${totalProdutos > 10 ? `
                <!-- Aviso de Produtos Limitados -->
                <tr>
                  <td style="padding: 0 20px 16px;">
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; font-size: 12px;">
                      ⚠️ Este email mostra apenas os primeiros 10 produtos de ${totalProdutos} no orçamento.
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                ${customMessage ? `
                <!-- Mensagem Personalizada -->
                <tr>
                  <td style="padding: 0 20px 16px;">
                    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; border-radius: 4px;">
                      <strong style="color: #0c4a6e;">Mensagem personalizada:</strong><br>
                      <span style="color: #0c4a6e;">${customMessage}</span>
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Rodapé -->
                <tr>
                  <td style="padding: 12px 20px; font-size: 12px; color: #374151; text-align: center; border-top: 1px solid #e5e7eb;">
                    <strong>Equipe Natureza Brindes</strong><br>
                    📞 (27) 3238-9726 | 📧 <a href="mailto:vendas02@cristalbrindes.com.br" style="color: #2563eb;">vendas02@cristalbrindes.com.br</a><br>
                    CNPJ: 57.225.892/0001-46<br>
                    <span style="font-size: 10px; color: #6b7280;">11A RUA SILVA GRASIOL, 25 - MIRANTE DA PRAIA - CEP: 29.197.306 - FUNDÃO - ES</span>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
  `;
};