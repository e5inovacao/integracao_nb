import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, Calendar, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { QuoteRequest, CartItem, CustomerInfo, Address, UrgencyLevel } from '../types';
import { URGENCY_LEVELS, COMPANY_INFO } from '../constants';
import { quotesApi } from '../services/api';
import { supabase } from '../../supabase/client';

interface FormData {
  customerInfo: CustomerInfo;
  deliveryAddress: Address;
  urgencyLevel: UrgencyLevel;
  eventDate?: string;
  additionalNotes: string;
  acceptTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function Quote() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Dados vindos do carrinho ou produto individual
  const cartItems: CartItem[] = location.state?.cartItems || [];
  const preSelectedProduct = location.state?.preSelectedProduct;
  
  const [formData, setFormData] = useState<FormData>({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: ''
    },
    deliveryAddress: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    urgencyLevel: 'normal',
    eventDate: '',
    additionalNotes: '',
    acceptTerms: false
  });

  // Se não há itens no carrinho nem produto pré-selecionado, redirecionar
  useEffect(() => {
    if (cartItems.length === 0 && !preSelectedProduct) {
      navigate('/catalog');
    }
  }, [cartItems, preSelectedProduct, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validação de informações do cliente
    if (!formData.customerInfo.name.trim()) {
      newErrors['customerInfo.name'] = 'Nome é obrigatório';
    }
    
    if (!formData.customerInfo.email.trim()) {
      newErrors['customerInfo.email'] = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerInfo.email)) {
      newErrors['customerInfo.email'] = 'E-mail inválido';
    }
    
    if (!formData.customerInfo.phone.trim()) {
      newErrors['customerInfo.phone'] = 'Telefone é obrigatório';
    }
    
    if (!formData.customerInfo.company.trim()) {
      newErrors['customerInfo.company'] = 'Empresa é obrigatória';
    }

    // Validação de endereço
    if (!formData.deliveryAddress.street.trim()) {
      newErrors['deliveryAddress.street'] = 'Rua é obrigatória';
    }
    
    if (!formData.deliveryAddress.number.trim()) {
      newErrors['deliveryAddress.number'] = 'Número é obrigatório';
    }
    
    if (!formData.deliveryAddress.neighborhood.trim()) {
      newErrors['deliveryAddress.neighborhood'] = 'Bairro é obrigatório';
    }
    
    if (!formData.deliveryAddress.city.trim()) {
      newErrors['deliveryAddress.city'] = 'Cidade é obrigatória';
    }
    
    if (!formData.deliveryAddress.state.trim()) {
      newErrors['deliveryAddress.state'] = 'Estado é obrigatório';
    }
    
    if (!formData.deliveryAddress.zipCode.trim()) {
      newErrors['deliveryAddress.zipCode'] = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.deliveryAddress.zipCode)) {
      newErrors['deliveryAddress.zipCode'] = 'CEP inválido';
    }

    // Validação de data do evento (se urgência for para evento)
    if (formData.urgencyLevel === 'urgent' && !formData.eventDate) {
      newErrors['eventDate'] = 'Data do evento é obrigatória para urgência alta';
    }

    // Validação de termos
    if (!formData.acceptTerms) {
      newErrors['acceptTerms'] = 'Você deve aceitar os termos e condições';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (section: keyof FormData, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section], [field]: value }
        : value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    const errorKey = typeof formData[section] === 'object' ? `${section}.${field}` : section;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Função de cálculo removida - preços serão definidos no orçamento

  const getTotalItems = () => {
    if (preSelectedProduct) {
      return preSelectedProduct.quantity;
    }
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const testStoredProcedures = async () => {
    console.log('🧪 Testando stored procedures...');
    
    try {
      // Teste 1: Verificar se a função buscar_orcamentos_usuario existe
      const { data: searchResult, error: searchError } = await supabase
        .rpc('buscar_orcamentos_usuario', {
          p_usuario_id: 1,
          p_limite: 5,
          p_offset: 0
        });
      
      if (searchError) {
        console.log('❌ Erro ao testar buscar_orcamentos_usuario:', searchError.message);
      } else {
        console.log('✅ buscar_orcamentos_usuario funcionando:', searchResult);
      }
      
      // Teste 2: Verificar tabelas básicas
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .limit(1);
      
      if (clientesError) {
        console.log('❌ Erro ao acessar tabela clientes:', clientesError.message);
      } else {
        console.log('✅ Tabela clientes acessível:', clientesData);
      }
      
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1);
      
      if (usuariosError) {
        console.log('❌ Erro ao acessar tabela usuarios:', usuariosError.message);
      } else {
        console.log('✅ Tabela usuarios acessível:', usuariosData);
      }
      
      alert('Teste concluído! Verifique o console para os resultados.');
      
    } catch (error) {
      console.error('❌ Erro geral no teste:', error);
      alert('Erro no teste. Verifique o console.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const quoteRequest = {
        customerInfo: formData.customerInfo,
        items: (preSelectedProduct ? [preSelectedProduct] : cartItems).map(item => ({
          productId: item.product?.id || item.id,
          productName: item.product?.name || item.name || 'Produto',
          quantity: item.quantity,
          customizations: item.customizations || {},
          notes: item.observations || ''
        })),
        notes: formData.additionalNotes || ''
      };
      
      const response = await quotesApi.createQuote(quoteRequest);
      
      if (response.success) {
        console.log('Solicitação de orçamento enviada:', response.data);
        setIsSubmitted(true);
      } else {
        throw new Error(response.error || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      alert('Erro ao enviar solicitação de orçamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <Card.Content className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de orçamento foi enviada com sucesso. Nossa equipe entrará em contato em até 24 horas.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                Voltar ao Início
              </Button>
              <Button variant="outline" onClick={() => navigate('/catalog')} className="w-full">
                Continuar Comprando
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Orçamento</h1>
          <p className="text-gray-600">Preencha os dados abaixo para receber seu orçamento personalizado</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Botão de Teste das Stored Procedures - Apenas para desenvolvimento */}
        <div className="mb-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={testStoredProcedures}
            className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          >
            🧪 Testar Stored Procedures (Dev)
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações do Cliente */}
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">Informações do Cliente</h2>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.customerInfo.name}
                        onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['customerInfo.name'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Digite seu nome completo"
                      />
                      {errors['customerInfo.name'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['customerInfo.name']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={formData.customerInfo.email}
                        onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['customerInfo.email'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="seu@email.com"
                      />
                      {errors['customerInfo.email'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['customerInfo.email']}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={formData.customerInfo.phone}
                        onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['customerInfo.phone'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="(11) 99999-9999"
                      />
                      {errors['customerInfo.phone'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['customerInfo.phone']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={formData.customerInfo.position}
                        onChange={(e) => handleInputChange('customerInfo', 'position', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Seu cargo na empresa"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.customerInfo.company}
                      onChange={(e) => handleInputChange('customerInfo', 'company', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors['customerInfo.company'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome da sua empresa"
                    />
                    {errors['customerInfo.company'] && (
                      <p className="text-red-500 text-sm mt-1">{errors['customerInfo.company']}</p>
                    )}
                  </div>
                </Card.Content>
              </Card>

              {/* Endereço de Entrega */}
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">Endereço de Entrega</h2>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rua *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.street}
                        onChange={(e) => handleInputChange('deliveryAddress', 'street', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.street'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nome da rua"
                      />
                      {errors['deliveryAddress.street'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.street']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.number}
                        onChange={(e) => handleInputChange('deliveryAddress', 'number', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.number'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="123"
                      />
                      {errors['deliveryAddress.number'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.number']}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.complement}
                        onChange={(e) => handleInputChange('deliveryAddress', 'complement', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Apto, sala, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.neighborhood}
                        onChange={(e) => handleInputChange('deliveryAddress', 'neighborhood', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.neighborhood'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nome do bairro"
                      />
                      {errors['deliveryAddress.neighborhood'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.neighborhood']}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.city}
                        onChange={(e) => handleInputChange('deliveryAddress', 'city', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.city'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nome da cidade"
                      />
                      {errors['deliveryAddress.city'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.city']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.state}
                        onChange={(e) => handleInputChange('deliveryAddress', 'state', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.state'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="SP"
                      />
                      {errors['deliveryAddress.state'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.state']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.zipCode}
                        onChange={(e) => handleInputChange('deliveryAddress', 'zipCode', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['deliveryAddress.zipCode'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="00000-000"
                      />
                      {errors['deliveryAddress.zipCode'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['deliveryAddress.zipCode']}</p>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>

              {/* Detalhes do Pedido */}
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">Detalhes do Pedido</h2>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nível de Urgência
                    </label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => handleInputChange('urgencyLevel', '', e.target.value as UrgencyLevel)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {URGENCY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.urgencyLevel === 'urgent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data do Evento *
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => handleInputChange('eventDate', '', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors['eventDate'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors['eventDate'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['eventDate']}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações Adicionais
                    </label>
                    <textarea
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', '', e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Descreva detalhes específicos sobre seu pedido, preferências de personalização, etc."
                    />
                  </div>
                </Card.Content>
              </Card>

              {/* Termos e Condições */}
              <Card>
                <Card.Content className="p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', '', e.target.checked)}
                      className={`mt-1 rounded border-gray-300 text-primary focus:ring-primary ${
                        errors['acceptTerms'] ? 'border-red-300' : ''
                      }`}
                    />
                    <div className="text-sm">
                      <span className="text-gray-700">
                        Eu aceito os{' '}
                        <a href="#" className="text-primary hover:underline">
                          termos e condições
                        </a>{' '}
                        e a{' '}
                        <a href="#" className="text-primary hover:underline">
                          política de privacidade
                        </a>
                        .
                      </span>
                      {errors['acceptTerms'] && (
                        <p className="text-red-500 mt-1">{errors['acceptTerms']}</p>
                      )}
                    </div>
                  </label>
                </Card.Content>
              </Card>
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <Card.Header>
                  <h2 className="text-xl font-bold text-gray-900">Resumo do Pedido</h2>
                </Card.Header>
                
                <Card.Content className="space-y-4">
                  {/* Itens */}
                  <div className="space-y-3">
                    {preSelectedProduct ? (
                      <div className="flex gap-3">
                        <img
                          src={preSelectedProduct.product.images[0]}
                          alt={preSelectedProduct.product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0MkMzNy4zMDM3IDQyIDQxLjYgMzcuNzAzMyA0MS42IDMyQzQxLjYgMjYuMjk2NyAzNy4zMDM3IDIyIDMyIDIyQzI2LjY5NjMgMjIgMjIuNCAyNi4yOTY3IDIyLjQgMzJDMjIuNCAzNy43MDMzIDI2LjY5NjMgNDIgMzIgNDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {preSelectedProduct.product.name}
                          </h4>
                          <p className="text-gray-600 text-xs">
                            Qtd: {preSelectedProduct.quantity}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Preço no orçamento
                          </p>
                        </div>
                      </div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id} className="flex gap-3">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0MkMzNy4zMDM3IDQyIDQxLjYgMzcuNzAzMyA0MS42IDMyQzQxLjYgMjYuMjk2NyAzNy4zMDM3IDIyIDMyIDIyQzI2LjY5NjMgMjIgMjIuNCAyNi4yOTY3IDIyLjQgMzJDMjIuNCAzNy43MDMzIDI2LjY5NjMgNDIgMzIgNDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {item.product.name}
                            </h4>
                            <p className="text-gray-600 text-xs">
                              Qtd: {item.quantity}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Preço no orçamento
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Total de itens:</span>
                      <span className="text-gray-900 font-medium">
                        {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800">
                        Receba um orçamento personalizado com os melhores preços para seus produtos sustentáveis.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Solicitar Orçamento'}
                  </Button>
                </Card.Content>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}