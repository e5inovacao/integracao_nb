import html2canvas from 'html2canvas';

interface PDFGeneratorData {
  orcamento: any;
  cliente: any;
  consultor?: any;
  produtos: any[];
  customMessage?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para carregar jsPDF dinamicamente
const loadJsPDF = async () => {
  try {
    // Tentar importar jsPDF localmente primeiro
    const jsPDF = await import('jspdf');
    return jsPDF.default || jsPDF;
  } catch (error) {
    console.warn('Falha ao carregar jsPDF localmente, tentando CDN...', error);
    
    // Fallback para CDN
    return new Promise((resolve, reject) => {
      // Verificar se jsPDF já está carregado globalmente
      if (typeof window !== 'undefined' && (window as any).jspdf) {
        resolve((window as any).jspdf.jsPDF);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        if ((window as any).jspdf) {
          resolve((window as any).jspdf.jsPDF);
        } else {
          reject(new Error('jsPDF não foi carregado corretamente'));
        }
      };
      script.onerror = () => {
        reject(new Error('Falha ao carregar jsPDF do CDN'));
      };
      document.head.appendChild(script);
    });
  }
};

export const generatePDFFromHTML = async (data: PDFGeneratorData): Promise<Blob> => {
  const { orcamento, cliente, consultor, produtos, customMessage } = data;
  
  try {
    // Carregar jsPDF dinamicamente
    const jsPDF = await loadJsPDF();
    
    // Criar um elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    
    // HTML do PDF (similar ao template de email, mas otimizado para PDF)
    tempDiv.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c3e50; line-height: 1.6;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2CB20B 0%, #1a8a08 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 20px;">
              <div style="width: 60px; height: 60px; background: #2CB20B; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">NB</div>
            </div>
            <div>
              <h1 style="font-size: 32px; margin: 0;">NATUREZA BRINDES</h1>
              <h2 style="font-size: 26px; margin: 0;">ORÇAMENTO</h2>
              <p style="font-size: 18px; margin: 0;">Sua marca para todo mundo ver</p>
            </div>
          </div>
        </div>

        <!-- Informações do Cliente e Empresa -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px;">
            <h3 style="color: #2CB20B; margin-bottom: 15px;">Dados do Cliente</h3>
            <div style="margin-bottom: 8px;"><strong>Nome:</strong> ${cliente?.nome || 'N/A'}</div>
            <div style="margin-bottom: 8px;"><strong>Email:</strong> ${cliente?.email || 'N/A'}</div>
            <div style="margin-bottom: 8px;"><strong>Telefone:</strong> ${cliente?.telefone || 'N/A'}</div>
            ${cliente?.empresa ? '<div style="margin-bottom: 8px;"><strong>Empresa:</strong> ' + cliente.empresa + '</div>' : ''}
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px;">
            <h3 style="color: #2CB20B; margin-bottom: 15px;">Natureza Brindes</h3>
            <div style="margin-bottom: 8px;"><strong>Telefone:</strong> (27) 3238-9726</div>
            <div style="margin-bottom: 8px;"><strong>Email:</strong> orcamentos@naturezabrindes.com.br</div>
            <div style="margin-bottom: 8px;"><strong>CNPJ:</strong> 57225892000146</div>
            <div style="margin-bottom: 8px;"><strong>Endereço:</strong> 11A RUA GIRASSOL, 25 - MIRANTE DA PRAIA</div>
          </div>
        </div>

        <!-- Produtos -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2CB20B; margin-bottom: 20px; font-size: 24px;">Produtos Selecionados</h3>
          ${produtos.map((produto, index) => `
            <div style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: white;">
              <div style="display: flex; gap: 20px; align-items: flex-start;">
                <div style="width: 120px; height: 120px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="color: #999; font-size: 12px;">Imagem do Produto</span>
                </div>
                <div style="flex: 1;">
                  <h4 style="color: #2c3e50; margin-bottom: 10px; font-size: 18px;">${produto.titulo || produto.descricao || 'Produto'}</h4>
                  <p style="color: #666; margin-bottom: 8px; font-size: 14px;">${produto.descricao || ''}</p>
                  ${produto.categoria ? '<p style="color: #666; margin-bottom: 8px; font-size: 14px;"><strong>Categoria:</strong> ' + produto.categoria + '</p>' : ''}
                  ${produto.codigo ? '<p style="color: #666; margin-bottom: 8px; font-size: 14px;"><strong>Código:</strong> ' + produto.codigo + '</p>' : ''}
                  ${produto.color ? '<p style="color: #666; margin-bottom: 8px; font-size: 14px;"><strong>Cor:</strong> ' + produto.color + '</p>' : ''}
                  <div style="display: flex; gap: 20px; margin-top: 15px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                      <strong style="color: #2CB20B;">Quantidade:</strong> ${produto.quantidade || 0}
                    </div>
                    ${produto.valor_unitario > 0 ? `
                      <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <strong style="color: #2CB20B;">Valor Unit.:</strong> ${formatCurrency(produto.valor_unitario)}
                      </div>
                      <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <strong style="color: #2CB20B;">Total:</strong> ${formatCurrency(produto.valor_total)}
                      </div>
                    ` : `
                      <div style="background: #fff3cd; padding: 10px; border-radius: 6px; border: 1px solid #ffeaa7;">
                        <strong style="color: #856404;">Preço:</strong> A consultar
                      </div>
                    `}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Informações Adicionais -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
          <h3 style="color: #2CB20B; margin-bottom: 15px;">Informações do Orçamento</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Validade:</strong> ${orcamento?.validade_proposta || '10'} dias</div>
            <div><strong>Prazo de Entrega:</strong> ${orcamento?.prazo_entrega || '20'} dias úteis</div>
            <div><strong>Forma de Pagamento:</strong> ${orcamento?.forma_pagamento || '100% 15 dias após emissão da NF'}</div>
            <div><strong>Frete:</strong> ${orcamento?.opcao_frete || 'CIF - Incluso para Grande Vitória'}</div>
          </div>
          ${orcamento?.observacoes ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <strong>Observações:</strong><br>
              <span style="color: #666;">${orcamento.observacoes}</span>
            </div>
          ` : ''}
        </div>

        ${customMessage ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border-left: 4px solid #2CB20B; margin-bottom: 30px;">
            <h3 style="color: #2CB20B; margin-bottom: 10px;">Mensagem Personalizada</h3>
            <p style="color: #2c3e50; margin: 0;">${customMessage}</p>
          </div>
        ` : ''}

        <!-- Rodapé -->
        <div style="text-align: center; padding: 30px; background: #2c3e50; color: white; border-radius: 12px;">
          <h3 style="margin-bottom: 15px;">Natureza Brindes</h3>
          <p style="margin: 5px 0;">Telefone: (27) 3238-9726</p>
          <p style="margin: 5px 0;">Email: orcamentos@naturezabrindes.com.br</p>
          <p style="margin: 5px 0;">Endereço: 11A RUA GIRASSOL, 25 - MIRANTE DA PRAIA</p>
          <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.8;">Sua marca para todo mundo ver</p>
        </div>
      </div>
    `;

    // Adicionar ao DOM temporariamente
    document.body.appendChild(tempDiv);

    try {
      // Aguardar um pouco para garantir que o elemento seja renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capturar o elemento como canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Retornar como Blob
      return pdf.output('blob');
    } finally {
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF. Tente novamente ou use a opção de impressão alternativa.');
  }
};

export const generatePDFFileName = (orcamento: any): string => {
  const numeroOrcamento = orcamento?.numero_solicitacao || orcamento?.solicitacao_id || 'N/A';
  const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  return `Orcamento_${numeroOrcamento}_${data}.pdf`;
};

// Função alternativa para impressão sem PDF
export const printAlternative = () => {
  try {
    // Usar a função nativa de impressão do navegador
    window.print();
  } catch (error) {
    console.error('Erro na impressão alternativa:', error);
    throw new Error('Falha na impressão. Verifique as configurações do seu navegador.');
  }
};