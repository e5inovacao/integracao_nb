import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { 
  CogIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Configuracao {
  id: number
  chave: string
  valor: string
  descricao: string
  categoria: string
  tipo: 'texto' | 'numero' | 'booleano' | 'json'
  ativo: boolean
  created_at: string
  updated_at: string
}

interface ConfiguracaoForm {
  chave: string
  valor: string
  descricao: string
  categoria: string
  tipo: 'texto' | 'numero' | 'booleano' | 'json'
  ativo: boolean
}

const categorias = [
  { value: 'geral', label: 'Geral' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'email', label: 'Email' },
  { value: 'financeiro', label: 'Financeiro' }
]

const tipos = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'booleano', label: 'Verdadeiro/Falso' },
  { value: 'json', label: 'JSON' }
]

export default function Configuracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formData, setFormData] = useState<ConfiguracaoForm>({
    chave: '',
    valor: '',
    descricao: '',
    categoria: 'geral',
    tipo: 'texto',
    ativo: true
  })

  useEffect(() => {
    loadConfiguracoes()
  }, [])

  const loadConfiguracoes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .order('categoria', { ascending: true })
        .order('chave', { ascending: true })

      if (error) throw error
      setConfiguracoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.chave.trim() || !formData.valor.trim()) {
      toast.error('Chave e valor são obrigatórios')
      return
    }

    try {
      if (editingId) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('configuracoes')
          .update({
            chave: formData.chave,
            valor: formData.valor,
            descricao: formData.descricao,
            categoria: formData.categoria,
            tipo: formData.tipo,
            ativo: formData.ativo
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Configuração atualizada com sucesso!')
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('configuracoes')
          .insert({
            chave: formData.chave,
            valor: formData.valor,
            descricao: formData.descricao,
            categoria: formData.categoria,
            tipo: formData.tipo,
            ativo: formData.ativo
          })

        if (error) throw error
        toast.success('Configuração criada com sucesso!')
      }

      resetForm()
      loadConfiguracoes()
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      
      let errorMessage = 'Erro ao salvar configuração'
      if (error?.message?.includes('duplicate key')) {
        errorMessage = 'Esta chave já existe. Use uma chave única.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const handleEdit = (config: Configuracao) => {
    setFormData({
      chave: config.chave,
      valor: config.valor,
      descricao: config.descricao || '',
      categoria: config.categoria,
      tipo: config.tipo,
      ativo: config.ativo
    })
    setEditingId(config.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('configuracoes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Configuração excluída com sucesso!')
      loadConfiguracoes()
    } catch (error) {
      console.error('Erro ao excluir configuração:', error)
      toast.error('Erro ao excluir configuração')
    }
  }

  const resetForm = () => {
    setFormData({
      chave: '',
      valor: '',
      descricao: '',
      categoria: 'geral',
      tipo: 'texto',
      ativo: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const filteredConfiguracoes = configuracoes.filter(config => {
    const matchesSearch = 
      config.chave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || config.categoria === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const groupedConfiguracoes = filteredConfiguracoes.reduce((acc, config) => {
    if (!acc[config.categoria]) {
      acc[config.categoria] = []
    }
    acc[config.categoria].push(config)
    return acc
  }, {} as Record<string, Configuracao[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Configuração
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por chave, valor ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Configurações */}
      <div className="space-y-6">
        {Object.entries(groupedConfiguracoes).map(([categoria, configs]) => (
          <div key={categoria} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {categorias.find(c => c.value === categoria)?.label || categoria}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {configs.map(config => (
                <div key={config.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{config.chave}</h3>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          config.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {tipos.find(t => t.value === config.tipo)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{config.valor}</p>
                      {config.descricao && (
                        <p className="text-xs text-gray-500 mt-1">{config.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredConfiguracoes.length === 0 && (
        <div className="text-center py-12">
          <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração encontrada</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando sua primeira configuração'
            }
          </p>
        </div>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Configuração' : 'Nova Configuração'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave *
                </label>
                <input
                  type="text"
                  value={formData.chave}
                  onChange={(e) => setFormData({ ...formData, chave: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ex: empresa_nome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <textarea
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Valor da configuração"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da configuração"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {tipos.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Configuração ativa
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}