import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface SignupFormData {
  nome: string
  email: string
  telefone: string
  senha: string
  confirmarSenha: string
}

export default function ConsultorSignup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  })

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return false
    }
    if (!formData.telefone.trim()) {
      toast.error('Telefone é obrigatório')
      return false
    }
    if (!formData.senha) {
      toast.error('Senha é obrigatória')
      return false
    }
    if (formData.senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return false
    }
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('Senhas não coincidem')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Primeiro, verificar se o email pode se registrar como consultor
      const { data: canRegister, error: checkError } = await supabase
        .rpc('can_register_as_consultor', { p_email: formData.email })
      
      if (checkError) {
        toast.error('Erro ao verificar email: ' + checkError.message)
        return
      }
      
      if (!canRegister) {
        toast.error('Este email não está autorizado para registro. Entre em contato com o administrador.')
        return
      }
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            telefone: formData.telefone
          }
        }
      })
      
      if (authError) {
        toast.error('Erro ao criar conta: ' + authError.message)
        return
      }
      
      if (authData.user) {
        // Registrar o consultor vinculando ao usuário criado
        const { data: registerData, error: registerError } = await supabase
          .rpc('register_consultor', {
            p_nome: formData.nome,
            p_email: formData.email,
            p_telefone: formData.telefone,
            p_senha: formData.senha
          })
        
        if (registerError) {
          toast.error('Erro ao registrar consultor: ' + registerError.message)
          return
        }
        
        toast.success('Conta criada com sucesso! Você pode fazer login agora.')
        navigate('/login')
      }
      
    } catch (error: any) {
      toast.error('Erro inesperado: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
          <p className="text-gray-600">Registre-se como consultor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu nome completo"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu email"
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => handleInputChange('senha', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}