import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

interface TabelaFator {
  id: string
  nome_tabela: string
  status: 'ativo' | 'inativo'
  quantidade_inicial: number
  quantidade_final: number
  fator: number
  created_at: string
  updated_at: string
}

interface NovaLinha {
  quantidade_inicial: string
  quantidade_final: string
  fator: string
}

interface TabelaResumo {
  nome_tabela: string
  status: 'ativo' | 'inativo'
  total_linhas: number
  created_at: string
}

export default function TabelaFator() {
  const [tabelasResumo, setTabelasResumo] = useState<TabelaResumo[]>([])
  const [tabelaAtual, setTabelaAtual] = useState<string | null>(null)
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo')
  const [fatores, setFatores] = useState<TabelaFator[]>([])
  const [novasLinhas, setNovasLinhas] = useState<NovaLinha[]>([])
  const [loading, setLoading] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  // Carregar resumo das tabelas
  const carregarTabelasResumo = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tabelas_fator')
        .select('nome_tabela, status, created_at')
        .order('nome_tabela')

      if (error) throw error
      
      // Agrupar por nome_tabela e contar linhas
      const resumo: TabelaResumo[] = []
      const tabelasAgrupadas = data?.reduce((acc, item) => {
        if (!acc[item.nome_tabela]) {
          acc[item.nome_tabela] = {
            nome_tabela: item.nome_tabela,
            status: item.status,
            total_linhas: 0,
            created_at: item.created_at
          }
        }
        acc[item.nome_tabela].total_linhas++
        return acc
      }, {} as Record<string, TabelaResumo>)

      if (tabelasAgrupadas) {
        resumo.push(...Object.values(tabelasAgrupadas))
      }
      
      setTabelasResumo(resumo)
    } catch (error) {
      console.error('Erro ao carregar resumo das tabelas:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados da tabela específica
  const carregarFatores = async (nomeTabela: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tabelas_fator')
        .select('*')
        .eq('nome_tabela', nomeTabela)
        .order('quantidade_inicial')

      if (error) throw error
      setFatores(data || [])
      
      // Definir status baseado nos dados existentes
      if (data && data.length > 0) {
        setStatus(data[0].status)
      }
    } catch (error) {
      console.error('Erro ao carregar fatores:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tabelaAtual) {
      carregarFatores(tabelaAtual)
    } else {
      carregarTabelasResumo()
    }
  }, [tabelaAtual])

  // Adicionar nova linha
  const adicionarLinha = () => {
    setNovasLinhas([...novasLinhas, { quantidade_inicial: '', quantidade_final: '', fator: '' }])
  }

  // Remover linha nova
  const removerNovaLinha = (index: number) => {
    setNovasLinhas(novasLinhas.filter((_, i) => i !== index))
  }

  // Atualizar nova linha
  const atualizarNovaLinha = (index: number, campo: keyof NovaLinha, valor: string) => {
    const novasLinhasAtualizadas = [...novasLinhas]
    novasLinhasAtualizadas[index][campo] = valor
    setNovasLinhas(novasLinhasAtualizadas)
  }

  // Salvar dados
  const salvar = async () => {
    if (!tabelaAtual) return

    try {
      setLoading(true)

      // Validar novas linhas
      const linhasValidas = novasLinhas.filter(linha => 
        linha.quantidade_inicial && linha.quantidade_final && linha.fator
      )

      if (linhasValidas.length > 0) {
        const dadosParaInserir = linhasValidas.map(linha => ({
          nome_tabela: tabelaAtual,
          status,
          quantidade_inicial: parseInt(linha.quantidade_inicial),
          quantidade_final: parseInt(linha.quantidade_final),
          fator: parseFloat(linha.fator)
        }))

        const { error } = await supabase
          .from('tabelas_fator')
          .insert(dadosParaInserir)

        if (error) throw error
      }

      // Atualizar status da tabela se necessário
      if (fatores.length > 0 && fatores[0].status !== status) {
        const { error } = await supabase
          .from('tabelas_fator')
          .update({ status })
          .eq('nome_tabela', tabelaAtual)

        if (error) throw error
      }

      setNovasLinhas([])
      await carregarFatores(tabelaAtual)
      toast.success('Dados salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar dados')
    } finally {
      setLoading(false)
    }
  }

  // Deletar fator
  const deletarFator = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    try {
      const { error } = await supabase
        .from('tabelas_fator')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      if (tabelaAtual) {
        await carregarFatores(tabelaAtual)
      }
      toast.success('Item excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao excluir item')
    }
  }

  // Atualizar fator existente
  const atualizarFator = async (id: string, campo: string, valor: any) => {
    try {
      const { error } = await supabase
        .from('tabelas_fator')
        .update({ [campo]: valor })
        .eq('id', id)

      if (error) throw error
      
      if (tabelaAtual) {
        await carregarFatores(tabelaAtual)
      }
      toast.success('Item atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      toast.error('Erro ao atualizar item')
    }
  }

  // Criar nova tabela de fator
  const criarNovaTabela = async (nomeTabela: string) => {
    setTabelaAtual(nomeTabela)
    setFatores([])
    setNovasLinhas([{ quantidade_inicial: '', quantidade_final: '', fator: '' }])
    setStatus('ativo')
  }

  // Renderizar vista de cards (lista de tabelas)
  const renderVistaCards = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Tabelas de Fator</h1>
          
          {/* Botão Criar Nova Tabela */}
          <button
            onClick={() => {
              const nomeTabela = prompt('Digite o nome da nova tabela de fator (ex: A, B, C):')
              if (nomeTabela && nomeTabela.trim()) {
                criarNovaTabela(nomeTabela.trim().toUpperCase())
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Tabela de Fator
          </button>
        </div>

        {/* Cards das Tabelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabelasResumo.map((tabela) => (
            <div key={tabela.nome_tabela} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tabela {tabela.nome_tabela}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tabela.status === 'ativo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tabela.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>{tabela.total_linhas} linha{tabela.total_linhas !== 1 ? 's' : ''} de fator</p>
                <p>Criada em {new Date(tabela.created_at).toLocaleDateString('pt-BR')}</p>
              </div>

              <button
                onClick={() => setTabelaAtual(tabela.nome_tabela)}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Editar
              </button>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        )}

        {!loading && tabelasResumo.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma tabela de fator encontrada</p>
            <p className="text-gray-400 mt-2">Clique em "Nova Tabela de Fator" para começar</p>
          </div>
        )}
      </div>
    </div>
  )

  // Renderizar vista de edição (tabela específica)
  const renderVistaEdicao = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => setTabelaAtual(null)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Tabela de Fator {tabelaAtual}
              </h1>
            </div>
          </div>
          
          {/* Botão Incluir Novo */}
          <button
            onClick={adicionarLinha}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Incluir Novo
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nome da Tabela */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Tabela
              </label>
              <input
                type="text"
                value={tabelaAtual || ''}
                onChange={(e) => setTabelaAtual(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade Inicial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FATOR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Fatores existentes */}
                {fatores.map((fator) => (
                  <tr key={fator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={fator.quantidade_inicial}
                        onChange={(e) => atualizarFator(fator.id, 'quantidade_inicial', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={fator.quantidade_final}
                        onChange={(e) => atualizarFator(fator.id, 'quantidade_final', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.001"
                        value={fator.fator}
                        onChange={(e) => atualizarFator(fator.id, 'fator', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => deletarFator(fator.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Novas linhas */}
                {novasLinhas.map((linha, index) => (
                  <tr key={`nova-${index}`} className="hover:bg-gray-50 bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={linha.quantidade_inicial}
                        onChange={(e) => atualizarNovaLinha(index, 'quantidade_inicial', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={linha.quantidade_final}
                        onChange={(e) => atualizarNovaLinha(index, 'quantidade_final', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 100"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.001"
                        value={linha.fator}
                        onChange={(e) => atualizarNovaLinha(index, 'fator', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 1.800"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => removerNovaLinha(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botão para adicionar linha */}
          <div className="mt-4">
            <button
              onClick={adicionarLinha}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sair
            </button>
            <button
              onClick={salvar}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={async () => {
                await salvar()
                window.history.back()
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Salvar & Sair
            </button>
            <button
              onClick={async () => {
                await salvar()
                setNovasLinhas([{ quantidade_inicial: '', quantidade_final: '', fator: '' }])
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Salvar & Novo
            </button>
            <button
              onClick={async () => {
                await salvar()
                toast.success('Produtos atualizados com base nos fatores!')
              }}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Salvar & Atualizar Produtos
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return tabelaAtual ? renderVistaEdicao() : renderVistaCards()
}