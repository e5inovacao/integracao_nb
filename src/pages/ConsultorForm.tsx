import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface ConsultorFormData {
  nome: string
  email: string
  telefone: string
  senha: string
  ativo: boolean
}

export default function ConsultorForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ConsultorFormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    ativo: true
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (isEditing) {
      loadConsultor()
    }
  }, [id, isEditing])

  const loadConsultor = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('consultores')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          senha: '', // Não carregar senha existente por segurança
          ativo: data.ativo ?? true
        })
      }
    } catch (error) {
      console.error('Erro ao carregar consultor:', error)
      toast.error('Erro ao carregar consultor')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ConsultorFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    }

    if (!isEditing && !formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
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
      if (isEditing) {
        const updateData: any = {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          ativo: formData.ativo,
          updated_at: new Date().toISOString()
        }

        // Só atualiza a senha se foi fornecida
        if (formData.senha.trim()) {
          updateData.senha = formData.senha
        }

        const { error } = await supabase
          .from('consultores')
          .update(updateData)
          .eq('id', id)

        if (error) throw error
        toast.success('Consultor atualizado com sucesso!')
      } else {
        // Criar novo consultor com usuário de autenticação
        const { data, error } = await supabase
          .rpc('create_consultor_with_auth_user', {
            p_nome: formData.nome,
            p_email: formData.email,
            p_telefone: formData.telefone || '',
            p_senha: formData.senha,
            p_ativo: formData.ativo,
            p_role: 'consultor'
          })

        if (error) throw error
        
        // Verificar se a função retornou sucesso
        if (data && !data.success) {
          throw new Error(data.message || 'Erro ao criar consultor')
        }
        
        toast.success('Consultor criado com sucesso!')
      }

      navigate('/consultores')
    } catch (error) {
      console.error('Erro ao salvar consultor:', error)
      toast.error('Erro ao salvar consultor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderBottomColor: '#2CB20B'}}></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Consultor' : 'Novo Consultor'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-1" />
              Nome Completo
            </label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.nome ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{'--tw-ring-color': '#2CB20B'} as React.CSSProperties}
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <EnvelopeIcon className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{'--tw-ring-color': '#2CB20B'} as React.CSSProperties}
              placeholder="Digite o email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
              <PhoneIcon className="w-4 h-4 inline mr-1" />
              Telefone
            </label>
            <input
              type="tel"
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.telefone ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{'--tw-ring-color': '#2CB20B'} as React.CSSProperties}
              placeholder="Digite o telefone"
            />
            {errors.telefone && (
              <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>
            )}
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
              <LockClosedIcon className="w-4 h-4 inline mr-1" />
              Senha {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              id="senha"
              value={formData.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.senha ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{'--tw-ring-color': '#2CB20B'} as React.CSSProperties}
              placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
            />
            {errors.senha && (
              <p className="mt-1 text-sm text-red-600">{errors.senha}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleInputChange('ativo', e.target.checked)}
              className="h-4 w-4 border-gray-300 rounded"
              style={{'--tw-text-opacity': '1', color: '#2CB20B', '--tw-ring-color': '#2CB20B'} as React.CSSProperties}
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Consultor ativo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/consultores')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{'--tw-ring-color': '#2CB20B'} as React.CSSProperties}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#2CB20B', '--tw-ring-color': '#2CB20B'} as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}