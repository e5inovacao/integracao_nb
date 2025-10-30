import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import { PencilIcon, TrashIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
interface EcologicProduct {
  id: number
  tipo: string
  codigo: string
  titulo: string
  descricao?: string
  img_0?: string
  img_1?: string
  img_2?: string
  categoria?: string
  cor_web_principal?: string
  altura?: number
  largura?: number
  comprimento?: number
  peso?: number
  variacoes?: any
}

export default function Produtos() {
  const { user } = useAuth()
  const [produtos, setProdutos] = useState<EcologicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [deleteModal, setDeleteModal] = useState<{ show: boolean, produto?: EcologicProduct }>({
    show: false
  })

  const itemsPerPage = 35

  useEffect(() => {
    loadProdutos()
  }, [currentPage])

  const loadProdutos = async (searchQuery?: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('ecologic_products_site')
        .select('*', { count: 'exact' })
        .order('titulo')

      const termToSearch = searchQuery !== undefined ? searchQuery : searchTerm
      if (termToSearch) {
        query = query.or(`titulo.ilike.%${termToSearch}%,categoria.ilike.%${termToSearch}%,tipo.ilike.%${termToSearch}%,codigo.ilike.%${termToSearch}%`)
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      setProdutos(data || [])
      setTotalItems(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadProdutos()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }



  const handleDelete = async () => {
    if (!deleteModal.produto) return

    // Verificar se o usuário tem permissão para excluir
    if (user?.role === 'consultor') {
      toast.error('Consultores não têm permissão para excluir produtos')
      setDeleteModal({ show: false })
      return
    }

    try {
      const { error } = await supabase
        .from('ecologic_products_site')
        .delete()
        .eq('id', deleteModal.produto.id)

      if (error) throw error

      setProdutos(prev => prev.filter(p => p.id !== deleteModal.produto!.id))
      setDeleteModal({ show: false })
      toast.success('Produto excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals).replace('.', ',')
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
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos</p>
        </div>
        <Link
          to="/produtos/novo"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{backgroundColor: '#2CB20B'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Novo Produto
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, categoria, código do fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{backgroundColor: '#2CB20B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUTO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORIA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código do Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {produtos.map((produto) => {
                return (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {produto.img_0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={produto.img_0}
                              alt={produto.titulo}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center ${produto.img_0 ? 'hidden' : ''}`}>
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {produto.titulo.length > 50 ? `${produto.titulo.substring(0, 50)}...` : produto.titulo}
                          </div>
                          {produto.descricao && (
                            <div className="text-sm text-gray-500">
                              {produto.descricao.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produto.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produto.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{backgroundColor: '#2CB20B'}}>
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {user?.role !== 'consultor' && (
                          <>
                            <Link
                               to={`/produtos/${produto.id}/editar`}
                               className="hover:opacity-75"
                               style={{color: '#2CB20B'}}
                             >
                               <PencilIcon className="w-4 h-4" />
                             </Link>
                            <button
                              onClick={() => setDeleteModal({ show: true, produto })}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user?.role === 'consultor' && (
                          <span className="text-gray-400 text-xs">Apenas visualização</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {produtos.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece adicionando um novo produto.'}
            </p>
          </div>
        )}
      </div>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Anterior
            </button>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                de <span className="font-medium">{totalItems}</span> resultados
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{backgroundColor: '#f8f9fa'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2CB20B20'
                  e.currentTarget.style.borderColor = '#2CB20B'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                Primeira
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2CB20B20'
                  e.currentTarget.style.borderColor = '#2CB20B'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <div className="flex items-center px-4 py-2 rounded-md"
              style={{backgroundColor: '#2CB20B20', borderColor: '#2CB20B', border: '1px solid'}}>
                <span className="text-sm font-medium"
                style={{color: '#2CB20B'}}>
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = '#2CB20B20'
                   e.currentTarget.style.borderColor = '#2CB20B'
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'white'
                   e.currentTarget.style.borderColor = '#d1d5db'
                 }}
              >
                Próximo
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                 disabled={currentPage === totalPages}
                 className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = '#2CB20B20'
                   e.currentTarget.style.borderColor = '#2CB20B'
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'white'
                   e.currentTarget.style.borderColor = '#d1d5db'
                 }}
              >
                Última
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <TrashIcon className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Excluir Produto</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir o produto <strong>{deleteModal.produto?.titulo}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteModal({ show: false })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}