interface BrevoEmailData {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { name: string; email: string };
  attachment?: Array<{
    content: string;
    name: string;
  }>;
  inlineImages?: Array<{
    name: string;
    content: string; // base64 sem prefixo data:
  }>;
}

interface BrevoResponse {
  messageId: string;
}

// IMPORTANTE: Esta chave da API Brevo está inválida ou expirou
// Você precisa obter uma nova chave válida em https://app.brevo.com/settings/keys/api
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendEmailWithBrevo = async (emailData: BrevoEmailData): Promise<BrevoResponse> => {
  try {
    // Verificar se a chave da API está configurada
    if (!BREVO_API_KEY || BREVO_API_KEY.trim() === '') {
      throw new Error('Chave da API Brevo não configurada. Adicione VITE_BREVO_API_KEY no arquivo .env com uma chave válida obtida em https://app.brevo.com/settings/keys/api');
    }

    // Validar se o array 'to' não está vazio e contém emails válidos
    if (!emailData.to || emailData.to.length === 0) {
      throw new Error('Lista de destinatários não pode estar vazia');
    }

    // Filtrar emails válidos (não vazios e com formato básico de email)
    const validRecipients = emailData.to.filter(recipient => 
      recipient.email && 
      recipient.email.trim() !== '' && 
      recipient.email.includes('@')
    );

    if (validRecipients.length === 0) {
      throw new Error('Nenhum email válido encontrado na lista de destinatários');
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: emailData.sender || {
          name: 'Natureza Brindes',
          email: 'orcamentos@naturezabrindes.com.br'
        },
        to: validRecipients,
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent || emailData.htmlContent.replace(/<[^>]*>/g, ''),
        ...(emailData.attachment && { attachment: emailData.attachment }),
        ...(emailData.inlineImages && { inlineImages: emailData.inlineImages }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Brevo: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao enviar email via Brevo:', error);
    throw error;
  }
};

export type { BrevoEmailData, BrevoResponse };