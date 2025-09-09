import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, User, Phone, Building, FileText, Check, Heart, Star } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  observations: string;
}

interface FormData {
  email: string;
  name: string;
  phone: string;
  company: string;
  cnpj: string;
  observations: string;
  acceptTerms: boolean;
  receiveNews: boolean;
}

interface FormErrors {
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  cnpj?: string;
  acceptTerms?: string;
}

export default function QuoteForm({ isOpen, onClose, cartItems, observations }: QuoteFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phone: '',
    company: '',
    cnpj: '',
    observations: '',
    acceptTerms: false,
    receiveNews: false
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCNPJ = (cnpj: string) => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleEmailCheck = async () => {
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Por favor, insira um e-mail válido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Simular verificação de e-mail no backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular resultado - 30% chance de e-mail existir
      const exists = Math.random() < 0.3;
      setEmailExists(exists);
      
      if (exists) {
        // E-mail existe, prosseguir diretamente para envio
        handleSubmitQuote();
      } else {
        // E-mail não existe, mostrar formulário de cadastro
        setStep('register');
      }
    } catch (error) {
      setErrors({ email: 'Erro ao verificar e-mail. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Nome da empresa é obrigatório';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos para continuar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitQuote = async () => {
    if (step === 'register' && !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular envio do orçamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui seria feita a chamada real para a API
      console.log('Enviando orçamento:', {
        email: formData.email,
        customerData: step === 'register' ? {
          name: formData.name,
          phone: formData.phone,
          company: formData.company,
          cnpj: formData.cnpj,
          receiveNews: formData.receiveNews
        } : null,
        cartItems,
        observations
      });

      setStep('success');
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmailExists(false);
    setFormData({
      email: '',
      name: '',
      phone: '',
      company: '',
      cnpj: '',
      observations: '',
      acceptTerms: false,
      receiveNews: false
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccessClose = () => {
    resetForm();
    onClose();
    // Redirecionar para a página home após fechar o popup de sucesso
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <Card.Header className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'email' && 'Solicitar Orçamento'}
              {step === 'register' && 'Cadastro Rápido'}
              {step === 'success' && 'Orçamento Enviado!'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </Card.Header>

          <Card.Content className="space-y-4">
            {step === 'email' && (
              <>
                <p className="text-gray-600 text-sm">
                  Para solicitar seu orçamento personalizado, informe seu e-mail:
                </p>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email}</p>
                  )}
                </div>

                <Button
                  onClick={handleEmailCheck}
                  disabled={loading || !formData.email}
                  className="w-full"
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </Button>
              </>
            )}

            {step === 'register' && (
              <>
                <p className="text-gray-600 text-sm">
                  Seu e-mail não está cadastrado. Complete as informações abaixo para receber seu orçamento:
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Empresa *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Nome da sua empresa"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.company ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.company && (
                      <p className="text-red-500 text-xs">{errors.company}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CNPJ (opcional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.cnpj ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.cnpj && (
                      <p className="text-red-500 text-xs">{errors.cnpj}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => handleInputChange('observations', e.target.value)}
                      placeholder="Informações adicionais sobre seu pedido..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Aceito os{' '}
                        <a href="#" className="text-primary hover:underline">
                          termos de uso
                        </a>{' '}
                        e{' '}
                        <a href="#" className="text-primary hover:underline">
                          política de privacidade
                        </a>{' '}
                        *
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-red-500 text-xs">{errors.acceptTerms}</p>
                    )}

                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.receiveNews}
                        onChange={(e) => handleInputChange('receiveNews', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Desejo receber novidades e promoções por e-mail
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('email')}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSubmitQuote}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Enviando...' : 'Enviar Orçamento'}
                  </Button>
                </div>
              </>
            )}

            {step === 'success' && (
              <>
                <div className="text-center py-8">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Star className="w-4 h-4 text-yellow-800" />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      🎉 Parabéns pela Ótima Escolha!
                    </h3>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-green-800 font-semibold mb-2">
                        ✨ Obrigado por escolher produtos sustentáveis!
                      </p>
                      <p className="text-gray-700 text-sm">
                        Sua decisão contribui para um mundo mais verde e sustentável. 🌱
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <Heart className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-gray-800 font-medium">Próximos Passos</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📧 Você receberá uma cópia no e-mail <strong className="text-gray-800">{formData.email}</strong></p>
                      <p>⏰ Nossa equipe entrará em contato em até 24 horas</p>
                      <p>💼 Orçamento personalizado será enviado em breve</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-4">
                      Juntos construindo um futuro mais sustentável! 🌍
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSuccessClose}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 shadow-lg"
                >
                  Voltar ao Início 🏠
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}