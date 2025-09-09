import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingCart, Mail, Phone, Building, FileText, Check, AlertCircle, User, X } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SuccessPopup from '../components/SuccessPopup';
import { useCartStore } from '../store/cartStore';
import { createQuoteRequest, checkPhoneExists, checkEmailExists } from '../services/quotesService';



interface FormData {
  email: string;
  name: string;
  phone: string;
  company: string;
  cnpj: string;
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

export default function Cart() {
  const navigate = useNavigate();
  const { items, observations, updateQuantity, removeItem, updateItemColor, updateItemNotes, updateObservations, getTotalItems, clearCart } = useCartStore();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Debug: Monitorar mudanças no estado showSuccessPopup
  useEffect(() => {
    console.log('🔍 Estado showSuccessPopup mudou para:', showSuccessPopup);
  }, [showSuccessPopup]);
  

  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phone: '',
    company: '',
    cnpj: '',
    acceptTerms: false,
    receiveNews: false
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCNPJ = (cnpj: string) => {
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
      console.log('🔍 Verificando se e-mail existe:', formData.email);
      const exists = await checkEmailExists(formData.email);
      console.log('📧 Resultado da verificação:', exists ? 'E-mail encontrado' : 'E-mail não encontrado');
      
      setEmailExists(exists);
      
      if (exists) {
        console.log('✅ E-mail existe - prosseguindo diretamente para envio do orçamento');
        handleSubmitQuote();
      } else {
        console.log('ℹ️ E-mail não existe - mostrando campos de cadastro');
        setStep('register');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar e-mail:', error);
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
    console.log('🚀 INICIANDO handleSubmitQuote');
    
    if (step === 'register' && !validateForm()) {
      console.log('❌ Validação do formulário falhou');
      return;
    }
    
    if (items.length === 0) {
      console.log('❌ Carrinho vazio');
      alert('Adicione produtos ao carrinho antes de solicitar orçamento');
      return;
    }

    console.log('✅ Validações iniciais passaram');
    console.log('📋 Dados do formulário:', formData);
    console.log('🛒 Itens do carrinho:', items);
    console.log('📝 Observações:', observations);

    setLoading(true);
    console.log('⏳ Estado loading definido como true');

    try {
      // Preparar dados da solicitação de orçamento
      const quoteRequestData: QuoteRequestData = {
        customerData: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          company: formData.company || undefined,
          cnpj: formData.cnpj || undefined,
          address: undefined // Pode ser adicionado no futuro se necessário
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          customizations: undefined,
          ecologicalId: item.ecologicalId,
          selectedColor: item.selectedColor,
          itemNotes: item.itemNotes
        })),
        notes: observations || undefined
      };

      console.log('📤 Enviando dados para processQuoteRequest:', quoteRequestData);
      
      // Processar solicitação de orçamento no Supabase
      const result = await processQuoteRequest(quoteRequestData);
      console.log('✅ processQuoteRequest retornou sucesso:', result);
      
      // Limpeza completa do carrinho e formulário
      console.log('🧹 Limpando formulário e carrinho...');
      clearCart();
      updateObservations('');
      resetForm();
      setShowQuoteForm(false);
      console.log('✅ Formulário e carrinho limpos');
      
      // FORÇAR exibição do popup de sucesso com múltiplas tentativas
      console.log('🎉 FORÇANDO exibição do popup de sucesso...');
      
      // Primeira tentativa imediata
      setShowSuccessPopup(true);
      console.log('✅ Primeira tentativa - showSuccessPopup definido como true');
      
      // Segunda tentativa com delay mínimo
      setTimeout(() => {
        console.log('🔄 Segunda tentativa - forçando showSuccessPopup...');
        setShowSuccessPopup(true);
      }, 50);
      
      // Terceira tentativa com delay maior
      setTimeout(() => {
        console.log('🔄 Terceira tentativa - forçando showSuccessPopup...');
        setShowSuccessPopup(true);
      }, 200);
      
      // Verificação final
      setTimeout(() => {
        console.log('🔍 Verificação final - showSuccessPopup atual:', showSuccessPopup);
        if (!showSuccessPopup) {
          console.log('⚠️ POPUP NÃO APARECEU - Forçando novamente!');
          setShowSuccessPopup(true);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ ERRO ao enviar solicitação de orçamento:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      alert('Erro ao enviar solicitação de orçamento. Tente novamente.');
    } finally {
      console.log('🏁 Definindo loading como false...');
      setLoading(false);
      console.log('✅ loading definido como false');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
      acceptTerms: false,
      receiveNews: false
    });
    setErrors({});
  };

  const handleFinishQuote = () => {
    setShowQuoteForm(!showQuoteForm);
    if (!showQuoteForm) {
      resetForm();
    }
  };

  const handleAddMoreProducts = () => {
    window.scrollTo(0, 0);
    navigate('/catalogo');
  };



  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-6">
              Adicione produtos ao seu carrinho para solicitar um orçamento personalizado.
            </p>
            <Button 
              onClick={() => navigate('/catalogo')}
              className="bg-green-600 hover:bg-green-700"
            >
              Explorar Catálogo
            </Button>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Carrinho de Compras</h1>
              {getTotalItems() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
                </Badge>
              )}
            </div>

            <div className="space-y-6">
            {/* Cart Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Produto</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Descrição</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Cor</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Observações</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Quantidade</th>
                      <th className="w-16 py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className={index !== items.length - 1 ? 'border-b' : ''}>
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              Mochila em poliéster reciclado 290T e sarja com forro em poliéster reciclado 210D. Possui um compa...
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <AlertCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-600">Produto Sustentável</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <select 
                            value={item.selectedColor || ''}
                            onChange={(e) => updateItemColor(item.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                          >
                            <option value="">Selecionar cor</option>
                            <option value="AZUL">AZUL</option>
                            <option value="PRETO">PRETO</option>
                            <option value="VERMELHO">VERMELHO</option>
                            <option value="VERDE">VERDE</option>
                            <option value="BRANCO">BRANCO</option>
                            <option value="AMARELO">AMARELO</option>
                            <option value="ROSA">ROSA</option>
                            <option value="CINZA">CINZA</option>
                          </select>
                        </td>
                        <td className="py-6 px-6">
                          <textarea
                            value={item.itemNotes || ''}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            placeholder="Observações específicas para este item..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="py-6 px-6">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 p-2 border border-gray-300 rounded-md text-sm text-center"
                          />
                        </td>
                        <td className="py-6 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
  
            {/* Observações */}
            <Card className="p-6">
              <textarea
                 placeholder="Observações"
                 value={observations}
                 onChange={(e) => updateObservations(e.target.value)}
                 className="w-full p-4 border border-gray-300 rounded-md resize-none text-sm"
                 rows={4}
               />
            </Card>
  
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleAddMoreProducts}
                className="flex-1 py-4 px-6 text-lg bg-gray-400 hover:bg-gray-500 text-white border-gray-400 hover:border-gray-500"
              >
                ADICIONAR MAIS PRODUTOS
              </Button>
              <Button
                 onClick={() => setShowQuoteForm(true)}
                 className="flex-1 py-4 px-6 text-lg bg-green-600 hover:bg-green-700"
               >
                 FINALIZAR ORÇAMENTO
               </Button>
            </div>
                {/* Formulário Expandido */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  showQuoteForm ? 'max-h-screen opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Solicitar Orçamento</h2>
                      <p className="text-sm text-gray-600">Para solicitar seu orçamento personalizado, informe seu e-mail.</p>
                    </div>
                  </div>
  
                  {step === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="seu@email.com"
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
  
  
                      </div>
                      <Button
                        onClick={handleEmailCheck}
                        disabled={loading || !formData.email}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        {loading ? 'Verificando...' : 'Continuar'}
                      </Button>
                    </div>
                  )}
  
                  {step === 'register' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                              errors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Seu nome completo"
                            disabled={loading}
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Telefone *
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                              errors.phone ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="(11) 99999-9999"
                            disabled={loading}
                          />
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building className="w-4 h-4 inline mr-1" />
                          Nome da Empresa *
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.company ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Nome da sua empresa"
                          disabled={loading}
                        />
                        {errors.company && (
                          <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FileText className="w-4 h-4 inline mr-1" />
                          CNPJ (opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.cnpj}
                          onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.cnpj ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="00.000.000/0000-00"
                          disabled={loading}
                        />
                        {errors.cnpj && (
                          <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-700">
                            Aceito os{' '}
                            <a href="#" className="text-green-600 hover:text-green-700 underline">
                              termos de uso
                            </a>{' '}
                            e{' '}
                            <a href="#" className="text-green-600 hover:text-green-700 underline">
                              política de privacidade
                            </a>
                            *
                          </span>
                        </label>
                        {errors.acceptTerms && (
                          <p className="text-sm text-red-600">{errors.acceptTerms}</p>
                        )}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.receiveNews}
                            onChange={(e) => handleInputChange('receiveNews', e.target.checked)}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-700">
                            Desejo receber novidades e promoções por e-mail
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setStep('email')}
                          variant="outline"
                          disabled={loading}
                          className="flex-1 py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleSubmitQuote}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                          {loading ? 'Enviando...' : 'Enviar Orçamento'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
                 </div>
               </div>
             </>
           )}

         {/* Success Popup */}
         <SuccessPopup
           isOpen={showSuccessPopup}
           onClose={() => {
             setShowSuccessPopup(false);
             clearCart();
             navigate('/');
           }}
         />
       </div>
     </div>
   </>
   );
}