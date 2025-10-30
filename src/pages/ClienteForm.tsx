import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { Cliente } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type TabType = 'dados' | 'endereco' | 'contato' | 'observacoes'

interface ClienteFormData {
  nome: string
  email: string
  telefone: string
  documento: string
  tipo_pessoa: 'fisica' | 'juridica'
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  contato_nome: string
  contato_cargo: string
  contato_telefone: string
  contato_email: string
  observacoes: string
  consultor_id: number | null
}

interface Consultor {
  id: number
  nome: string
  email: string
  ativo: boolean
}

const initialFormData: ClienteFormData = {
  nome: '',
  email: '',
  telefone: '',
  documento: '',
  tipo_pessoa: 'fisica',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  contato_nome: '',
  contato_cargo: '',
  contato_telefone: '',
  contato_email: '',
  observacoes: '',
  consultor_id: null
}

const tabs = [
  { id: 'dados' as TabType, name: 'Dados Básicos', icon: UserIcon },
  { id: 'endereco' as TabType, name: 'Endereço', icon: MapPinIcon },
  { id: 'contato' as TabType, name: 'Contato', icon: PhoneIcon },
  { id: 'observacoes' as TabType, name: 'Observações', icon: DocumentTextIcon }
]

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const isEditing = !!id

  const [activeTab, setActiveTab] = useState<TabType>('dados')
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<ClienteFormData>>({})
  const [consultores, setConsultores] = useState<Consultor[]>([])

  useEffect(() => {
    loadConsultores();
    if (isEditing) {
      loadCliente()
    }
  }, [id, isEditing])

  const loadConsultores = async () => {
    try {
      const { data, error } = await supabase
        .from('consultores')
        .select('id, nome, email, ativo')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setConsultores(data || []);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
    }
  };

  const loadCliente = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios_clientes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        // Extrair dados do campo endereco JSONB
        const endereco = data.endereco || {}
        
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          documento: data.cnpj || '', // Usar cnpj da tabela
          tipo_pessoa: data.cnpj ? 'juridica' : 'fisica', // Inferir tipo baseado na presença do CNPJ
          cep: endereco.cep || '',
          endereco: endereco.rua || '',
          numero: endereco.numero || '',
          complemento: endereco.complemento || '',
          bairro: endereco.bairro || '',
          cidade: endereco.cidade || '',
          estado: endereco.estado || '',
          contato_nome: data.contato_nome || '',
          contato_cargo: data.contato_cargo || '',
          contato_telefone: data.contato_telefone || '',
          contato_email: data.contato_email || '',
          observacoes: data.observacoes || '',
          consultor_id: data.consultor_id || null
        })
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ClienteFormData> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.documento) {
      const doc = formData.documento.replace(/\D/g, '')
      if (formData.tipo_pessoa === 'fisica' && doc.length !== 11) {
        newErrors.documento = 'CPF deve ter 11 dígitos'
      } else if (formData.tipo_pessoa === 'juridica' && doc.length !== 14) {
        newErrors.documento = 'CNPJ deve ter 14 dígitos'
      }
    }

    if (formData.contato_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contato_email)) {
      newErrors.contato_email = 'Email de contato inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      // Preparar dados do endereço em formato JSONB
      const enderecoData = {
        rua: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep.replace(/\D/g, '')
      }

      const clienteData = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone.replace(/\D/g, '') || null,
        cnpj: formData.tipo_pessoa === 'juridica' ? formData.documento.replace(/\D/g, '') : null,
        endereco: enderecoData,
        consultor_id: formData.consultor_id
      }

      if (isEditing) {
        const { error } = await supabase
          .from('usuarios_clientes')
          .update(clienteData)
          .eq('id', id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('usuarios_clientes')
          .insert([clienteData])

        if (error) throw error
      }

      navigate('/clientes')
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ClienteFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatDocument = (value: string, tipo: 'fisica' | 'juridica') => {
    const numbers = value.replace(/\D/g, '')
    
    if (tipo === 'fisica') {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 10) {
      // Fixo: (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      // Celular: (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Dados Básicos */}
            {activeTab === 'dados' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nome ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Pessoa
                    </label>
                    <select
                      value={formData.tipo_pessoa}
                      onChange={(e) => handleInputChange('tipo_pessoa', e.target.value as 'fisica' | 'juridica')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fisica">Pessoa Física</option>
                      <option value="juridica">Pessoa Jurídica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                    </label>
                    <input
                      type="text"
                      value={formData.documento ? formatDocument(formData.documento, formData.tipo_pessoa) : ''}
                      onChange={(e) => handleInputChange('documento', e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.documento ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={formData.tipo_pessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                      maxLength={formData.tipo_pessoa === 'fisica' ? 14 : 18}
                    />
                    {errors.documento && (
                      <p className="mt-1 text-sm text-red-600">{errors.documento}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formData.telefone ? formatPhone(formData.telefone) : ''}
                      onChange={(e) => handleInputChange('telefone', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consultor Responsável
                      </label>
                      <select
                        value={formData.consultor_id || ''}
                        onChange={(e) => handleInputChange('consultor_id', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um consultor...</option>
                        {consultores.map(consultor => (
                          <option key={consultor.id} value={consultor.id}>
                            {consultor.nome} - {consultor.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Endereço */}
            {activeTab === 'endereco' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.cep ? formatCEP(formData.cep) : ''}
                      onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complemento}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Apto, Sala, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contato */}
            {activeTab === 'contato' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Contato
                    </label>
                    <input
                      type="text"
                      value={formData.contato_nome}
                      onChange={(e) => handleInputChange('contato_nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da pessoa de contato"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.contato_cargo}
                      onChange={(e) => handleInputChange('contato_cargo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cargo ou função"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone do Contato
                    </label>
                    <input
                      type="text"
                      value={formData.contato_telefone ? formatPhone(formData.contato_telefone) : ''}
                      onChange={(e) => handleInputChange('contato_telefone', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Contato
                    </label>
                    <input
                      type="email"
                      value={formData.contato_email}
                      onChange={(e) => handleInputChange('contato_email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contato_email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="contato@exemplo.com"
                    />
                    {errors.contato_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.contato_email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {activeTab === 'observacoes' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="w-4 h-4 mr-2 inline" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckIcon className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}