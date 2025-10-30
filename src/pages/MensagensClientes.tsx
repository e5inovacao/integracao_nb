import { useState, useEffect } from 'react'
import { Mail, Search, Eye, Check, Clock, Filter, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

interface MensagemCliente {
  id: string
  usuario_cliente_id: string
  assunto: string
  mensagem: string
  status: 'nova' | 'respondida'
  created_at: string
  updated_at: string
  usuarios_clientes?: {
    nome: string
    email: string
  }
}

type StatusFilter = 'todas' | 'nova' | 'respondida'

export default function MensagensClientes() {
  const { user } = useAuth()
  const [mensagens, setMensagens] = useState<MensagemCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [selectedMensagem, setSelectedMensagem] = useState<MensagemCliente | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadMensagens()
  }, [])

  const loadMensagens = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mensagem_site')
        .select(`
          *,
          usuarios_clientes (
            nome,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMensagens(data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (mensagemId: string, novoStatus: 'nova' | 'respondida') => {
    try {
      const { error } = await supabase
        .from('mensagem_site')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', mensagemId)

      if (error) throw error

      setMensagens(prev => prev.map(msg => 
        msg.id === mensagemId 
          ? { ...msg, status: novoStatus, updated_at: new Date().toISOString() }
          : msg
      ))

      toast.success(`Status alterado para ${novoStatus === 'nova' ? 'Nova' : 'Respondida'}`)
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status da mensagem')
    }
  }

  const openMensagem = (mensagem: MensagemCliente) => {
    setSelectedMensagem(mensagem)
    setShowModal(true)
  }

  const filteredMensagens = mensagens.filter(mensagem => {
    // Filtro por status
    if (statusFilter !== 'todas' && mensagem.status !== statusFilter) {
      return false
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        mensagem.assunto.toLowerCase().includes(searchLower) ||
        mensagem.mensagem.toLowerCase().includes(searchLower) ||
        mensagem.usuarios_clientes?.nome?.toLowerCase().includes(searchLower) ||
        mensagem.usuarios_clientes?.email?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    if (status === 'nova') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Nova
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Respondida
      </span>
    )
  }

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'todas') return mensagens.length
    return mensagens.filter(m => m.status === status).length
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="mr-3 h-8 w-8" style={{color: '#2CB20B'}} />
            Mensagens de Clientes
          </h1>
          <p className="text-gray-600">Gerencie as mensagens recebidas dos clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Mensagens</dt>
                  <dd className="text-lg font-medium text-gray-900">{getStatusCount('todas')}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mensagens Novas</dt>
                  <dd className="text-lg font-medium text-gray-900">{getStatusCount('nova')}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mensagens Respondidas</dt>
                  <dd className="text-lg font-medium text-gray-900">{getStatusCount('respondida')}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="todas">Todas as mensagens</option>
                <option value="nova">Mensagens novas</option>
                <option value="respondida">Mensagens respondidas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CLIENTE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASSUNTO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMensagens.map((mensagem) => (
                  <tr key={mensagem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mensagem.usuarios_clientes?.nome || 'Cliente não encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mensagem.usuarios_clientes?.email || 'Email não disponível'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {mensagem.assunto}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {mensagem.mensagem}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(mensagem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mensagem.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openMensagem(mensagem)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar mensagem"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {mensagem.status === 'nova' ? (
                          <button
                            onClick={() => handleStatusChange(mensagem.id, 'respondida')}
                            className="text-green-600 hover:text-green-900"
                            title="Marcar como respondida"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(mensagem.id, 'nova')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Marcar como nova"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMensagens.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500">
                {searchTerm || statusFilter !== 'todas' 
                  ? 'Nenhuma mensagem encontrada com os filtros aplicados'
                  : 'Nenhuma mensagem recebida ainda'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Visualizar Mensagem */}
      {showModal && selectedMensagem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Mensagem de {selectedMensagem.usuarios_clientes?.nome || 'Cliente'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedMensagem.usuarios_clientes?.nome || 'Nome não disponível'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedMensagem.usuarios_clientes?.email || 'Email não disponível'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto
                  </label>
                  <p className="text-sm text-gray-900">{selectedMensagem.assunto}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedMensagem.mensagem}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {getStatusBadge(selectedMensagem.status)}
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Recebimento
                    </label>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMensagem.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
                {selectedMensagem.status === 'nova' ? (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedMensagem.id, 'respondida')
                      setSelectedMensagem({ ...selectedMensagem, status: 'respondida' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Marcar como Respondida
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedMensagem.id, 'nova')
                      setSelectedMensagem({ ...selectedMensagem, status: 'nova' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                  >
                    Marcar como Nova
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}