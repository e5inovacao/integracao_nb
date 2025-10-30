import React, { useState } from 'react';
import { X, Send, Plus, Minus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => void;
  loading?: boolean;
  clienteEmail?: string;
  defaultSubject?: string;
}

interface EmailData {
  method: 'email' | 'whatsapp';
  recipients: string[];
  subject: string;
  message: string;
  attachment?: File;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  loading = false,
  clienteEmail = '',
  defaultSubject = ''
}) => {
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email');
  const [recipients, setRecipients] = useState<string[]>([clienteEmail || '']);

  // Atualizar recipients quando clienteEmail mudar
  React.useEffect(() => {
    if (clienteEmail && !recipients.includes(clienteEmail)) {
      setRecipients(prev => {
        const newRecipients = [...prev];
        if (newRecipients[0] === '') {
          newRecipients[0] = clienteEmail;
        } else {
          newRecipients.unshift(clienteEmail);
        }
        return newRecipients;
      });
    }
  }, [clienteEmail]);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleSend = () => {
    const emailData: EmailData = {
      method,
      recipients: recipients.filter(email => email.trim() !== ''),
      subject: subject || (method === 'email' ? defaultSubject || 'Proposta 3 Ref. Orçamento 1' : ''),
      message,
      attachment: attachment || undefined
    };
    onSend(emailData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Enviar orçamento
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Method Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Escolha como enviar a proposta para seu cliente
              </p>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={method === 'email'}
                    onChange={(e) => setMethod(e.target.value as 'email')}
                    className="mr-2"
                  />
                  Email
                </label>

              </div>
            </div>

            {/* Recipients */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                A Proposta será enviada para o e-mail cadastrado <strong>{clienteEmail}</strong>. Para enviar para múltiplos destinatários, inclua os endereços de emails desejados abaixo.
              </p>
              
              {recipients.map((email, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    placeholder="Email"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleAddRecipient()}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      className="ml-2 p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do email
              </label>
              <p className="text-xs text-gray-500 mb-2">
                *para personalizar o assunto do envio do orçamento, escreva o texto desejado no campo abaixo. Caso não seja preenchido, o sistema enviará com o assunto padrão.
              </p>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={defaultSubject || "Natureza Brindes - Orçamento"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem Personalizada
              </label>
              <p className="text-xs text-gray-500 mb-2">
                *Para personalizar uma mensagem ao seu cliente escreva o texto desejado no campo abaixo
              </p>
              
              {/* Text formatting toolbar */}
              <div className="flex items-center space-x-2 mb-2 p-2 border border-gray-200 rounded-t-md bg-gray-50">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Bold className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Italic className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-2" />
                <button className="p-1 hover:bg-gray-200 rounded">
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-b-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Digite sua mensagem personalizada aqui..."
              />
            </div>

            {/* File attachment */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="attachment"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('attachment')?.click()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer border border-gray-300"
                >
                  Escolher arquivo
                </button>
                <span className="text-sm text-gray-500">
                  {attachment ? attachment.name : 'Nenhum arquivo escolhido'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={loading}
              onClick={handleSend}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;