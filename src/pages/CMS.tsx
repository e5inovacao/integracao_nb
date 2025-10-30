import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit, Eye, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

interface ProdutoDestaque {
  id: number
  created_at: string
  codigo_produto: string
  ecologic_products_site?: {
    titulo: string
    descricao: string
    img_0: string
    categoria: string
  }
}

interface EcologicProduct {
  codigo: string
  titulo: string
  descricao: string
  img_0: string
  categoria: string
}

export default function CMS() {
  const { user } = useAuth()
  const [produtosDestaque, setProdutosDestaque] = useState<ProdutoDestaque[]>([])
  const [produtos, setProdutos] = useState<EcologicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ProdutoDestaque | null>(null)
  const [codigoProduto, setCodigoProduto] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ show: boolean, item?: ProdutoDestaque }>({
    show: false
  })

  useEffect(() => {
    loadProdutosDestaque()
    loadProdutos()
  }, [])

  const loadProdutosDestaque = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos_destaque')
        .select(`
          *,
          ecologic_products_site (
            titulo,
            descricao,
            img_0,
            categoria
          )
        `)
        .order('id', { ascending: false })

      if (error) throw error

      setProdutosDestaque(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos em destaque:', error)
      toast.error('Erro ao carregar produtos em destaque')
    } finally {
      setLoading(false)
    }
  }

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('ecologic_products_site')
        .select('codigo, titulo, descricao, img_0, categoria')
        .order('titulo')

      if (error) throw error

      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleSave = async () => {
    if (!codigoProduto.trim()) {
      toast.error('Digite o código do produto')
      return
    }

    // Verificar se o produto existe
    const produtoExiste = produtos.find(p => p.codigo === codigoProduto.trim())
    if (!produtoExiste) {
      toast.error('Produto não encontrado com este código')
      return
    }

    try {
      if (editingItem) {
        // Atualizar
        const { error } = await supabase
          .from('produtos_destaque')
          .update({ codigo_produto: codigoProduto.trim() })
          .eq('id', editingItem.id)

        if (error) throw error
        toast.success('Produto em destaque atualizado com sucesso')
      } else {
        // Verificar se já existe
        const { data: existingData } = await supabase
          .from('produtos_destaque')
          .select('id')
          .eq('codigo_produto', codigoProduto.trim())
          .single()

        if (existingData) {
          toast.error('Este produto já está em destaque')
          return
        }

        // Criar novo
        const { error } = await supabase
          .from('produtos_destaque')
          .insert({ codigo_produto: codigoProduto.trim() })

        if (error) throw error
        toast.success('Produto adicionado aos destaques com sucesso')
      }

      setShowModal(false)
      setEditingItem(null)
      setCodigoProduto('')
      loadProdutosDestaque()
    } catch (error) {
      console.error('Erro ao salvar produto em destaque:', error)
      toast.error('Erro ao salvar produto em destaque')
    }
  }

  const handleEdit = (item: ProdutoDestaque) => {
    setEditingItem(item)
    setCodigoProduto(item.codigo_produto)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      const { error } = await supabase
        .from('produtos_destaque')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      setProdutosDestaque(prev => prev.filter(p => p.id !== deleteModal.item!.id))
      setDeleteModal({ show: false })
      toast.success('Produto removido dos destaques com sucesso')
    } catch (error) {
      console.error('Erro ao remover produto dos destaques:', error)
      toast.error('Erro ao remover produto dos destaques')
    }
  }

  const openModal = () => {
    setEditingItem(null)
    setCodigoProduto('')
    setShowModal(true)
  }

  const filteredProdutos = produtosDestaque.filter(item => {
    if (!searchTerm) return true
    const produto = item.ecologic_products_site
    return produto?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           produto?.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.codigo_produto.toLowerCase().includes(searchTerm.toLowerCase())
  })

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
            <Settings className="mr-3 h-8 w-8" style={{color: '#2CB20B'}} />
            CMS - Sistema de Gerenciamento
          </h1>
          <p className="text-gray-600">Gerencie o conteúdo do site</p>
        </div>
      </div>

      {/* Produtos em Destaque Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Produtos em Destaque</h2>
            <p className="text-gray-600">Gerencie os produtos em destaque do site</p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{backgroundColor: '#2CB20B'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Adicionar Produto
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos em destaque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUTO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORIA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CÓDIGO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATA ADIÇÃO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProdutos.map((item) => {
                  const produto = item.ecologic_products_site
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {produto?.img_0 ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={produto.img_0}
                                alt={produto.titulo}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {produto?.titulo || 'Produto não encontrado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {produto?.descricao?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {produto?.categoria || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.codigo_produto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, item })}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredProdutos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Nenhum produto em destaque encontrado</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar Produto em Destaque' : 'Adicionar Produto em Destaque'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código do Produto
                </label>
                <input
                  type="text"
                  value={codigoProduto}
                  onChange={(e) => setCodigoProduto(e.target.value)}
                  placeholder="Digite o código do produto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o código exato do produto que deseja adicionar aos destaques
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    setCodigoProduto('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{backgroundColor: '#2CB20B'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#25A009'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2CB20B'}
                >
                  {editingItem ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Tem certeza que deseja remover este produto dos destaques?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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