import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { UserIcon, EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface AdminFormData {
  user_name: string
  user_email: string
  password: string
  confirmPassword: string
  role: 'admin' | 'super_admin'
}

interface FormErrors {
  user_name?: string
  user_email?: string
  password?: string
  confirmPassword?: string
}

export default function AdminForm() {
  const navigate = useNavigate()
  const [loading, setSaving] = useState(false)
  const [formData, setFormData] = useState<AdminFormData>({
    user_name: '',
    user_email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const handleInputChange = (field: keyof AdminFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Nome é obrigatório'
    }

    if (!formData.user_email.trim()) {
      newErrors.user_email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
      newErrors.user_email = 'Email inválido'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem'
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
      // Verificar se já existe um usuário com este email
      const { data: existingUser } = await supabase
        .from('usuarios_sistema')
        .select('id')
        .eq('user_email', formData.user_email)
        .single()

      if (existingUser) {
        toast.error('Já existe um usuário com este email')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('usuarios_sistema')
        .insert({
          user_name: formData.user_name,
          user_email: formData.user_email,
          passaword: formData.password, // Mantendo o nome da coluna como está no banco
          role: formData.role
        })

      if (error) {
        console.error('Erro ao criar administrador:', error)
        toast.error('Erro ao criar administrador')
        return
      }

      toast.success('Administrador criado com sucesso!')
      navigate('/admin/usuarios')
    } catch (error) {
      console.error('Erro ao criar administrador:', error)
      toast.error('Erro ao criar administrador')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Cadastro de Administrador
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crie uma nova conta administrativa
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="user_name"
                value={formData.user_name}
                onChange={(e) => handleInputChange('user_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.user_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome completo"
              />
              {errors.user_name && (
                <p className="mt-1 text-sm text-red-600">{errors.user_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="user_email"
                value={formData.user_email}
                onChange={(e) => handleInputChange('user_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.user_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o email"
              />
              {errors.user_email && (
                <p className="mt-1 text-sm text-red-600">{errors.user_email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <LockClosedIcon className="w-4 h-4 inline mr-1" />
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite a senha (mín. 8 caracteres)"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                <LockClosedIcon className="w-4 h-4 inline mr-1" />
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirme a senha"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                Nível de Acesso
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'super_admin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Administrador</option>
                <option value="super_admin">Super Administrador</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/usuarios')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Administrador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}