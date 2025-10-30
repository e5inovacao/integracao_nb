import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ 
  isOpen, 
  onClose, 
  message = "Solicitação de orçamento enviada com sucesso! Entraremos em contato em breve." 
}) => {
  const navigate = useNavigate();
  
  // Fazer scroll para o topo quando o popup abrir
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Também prevenir scroll da página de fundo
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll quando fechar
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function para garantir que o overflow seja restaurado
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Log para debug
  console.log('🔍 SuccessPopup renderizado - isOpen:', isOpen);

  const handleOkClick = () => {
    console.log('🔍 SuccessPopup - Botão OK clicado');
    onClose();
    navigate('/');
  };

  if (!isOpen) {
    console.log('❌ SuccessPopup - Não renderizando (isOpen = false)');
    return null;
  }
  
  console.log('✅ SuccessPopup - Renderizando popup (isOpen = true)');

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-popup-title"
      aria-describedby="success-popup-description"
      onClick={handleOkClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 10000 }}
      >
        {/* Botão de fechar no canto superior direito */}
        <button
          onClick={handleOkClick}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Fechar popup"
        >
          <X size={20} />
        </button>

        {/* Conteúdo do popup */}
        <div className="p-8 text-center">
          {/* Ícone de sucesso */}
          <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle 
              size={32} 
              className="text-green-600" 
            />
          </div>

          {/* Título */}
          <h2 
            id="success-popup-title"
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Sucesso!
          </h2>

          {/* Mensagem */}
          <p 
            id="success-popup-description"
            className="text-gray-600 text-base leading-relaxed mb-8"
          >
            {message}
          </p>

          {/* Botão OK */}
          <button
            onClick={handleOkClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-200"
            aria-label="Voltar para página inicial"
          >
            OK - Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;