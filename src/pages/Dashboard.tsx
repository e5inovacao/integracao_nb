import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  UserGroupIcon,
  CubeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalClientes: number
  totalProdutos: number
  totalOrcamentos: number
  orcamentosAbertos: number
  valorTotalOrcamentos: number
  orcamentosRecentes: any[]
  totalConsultores?: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalProdutos: 0,
    totalOrcamentos: 0,
    orcamentosAbertos: 0,
    valorTotalOrcamentos: 0,
    orcamentosRecentes: [],
    totalConsultores: 0
  })
  const [loading, setLoading] = useState(true)
  const [consultorId, setConsultorId] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      let consultorIdAtual = null
      
      // Se for consultor, buscar o ID do consultor
      if (user?.role === 'consultor' && user) {
        const { data: consultorData } = await supabase
          .from('consultores')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        
        consultorIdAtual = consultorData?.id
        setConsultorId(consultorIdAtual)
      }

      // Queries baseadas no role
      const queries = []
      
      if (user?.role === 'admin') {
        // Admin vê todos os dados
        queries.push(
          supabase.from('usuarios_clientes').select('id', { count: 'exact' }),
        supabase.from('ecologic_products_site').select('id', { count: 'exact' }),
          supabase.from('solicitacao_orcamentos').select('*'),
          supabase.from('consultores').select('id', { count: 'exact' })
        )
      } else {
        // Consultor vê apenas dados relacionados a ele
        queries.push(
          supabase.from('usuarios_clientes').select('id', { count: 'exact' }),
        supabase.from('ecologic_products_site').select('id', { count: 'exact' }),
          consultorIdAtual 
            ? supabase.from('solicitacao_orcamentos').select('*').eq('consultor_id', consultorIdAtual)
            : Promise.resolve({ data: [], count: 0 }),
          Promise.resolve({ count: 0 }) // Consultores não veem estatísticas de outros consultores
        )
      }

      const [clientesResult, produtosResult, orcamentosResult, consultoresResult] = await Promise.all(queries)

      const totalClientes = clientesResult.count || 0
      const totalProdutos = produtosResult.count || 0
      const orcamentos = orcamentosResult.data || []
      const totalConsultores = consultoresResult?.count || 0
      
      const totalOrcamentos = orcamentos.length
      const orcamentosAbertos = orcamentos.filter(o => o.status === 'aberto').length
      const valorTotalOrcamentos = orcamentos.reduce((sum, o) => sum + (o.valor_total || 0), 0)
      
      // Orçamentos recentes (últimos 5)
      const orcamentosRecentes = orcamentos
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setStats({
        totalClientes,
        totalProdutos,
        totalOrcamentos,
        orcamentosAbertos,
        valorTotalOrcamentos,
        orcamentosRecentes,
        totalConsultores
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getStatCards = () => {
    const baseCards = [
      {
        name: 'Total de Produtos',
        value: stats.totalProdutos,
        icon: CubeIcon,
        color: '#2CB20B',
        link: '/produtos'
      },
      {
        name: user?.role === 'admin' ? 'Total de Orçamentos' : 'Meus Orçamentos',
        value: stats.totalOrcamentos,
        icon: DocumentTextIcon,
        color: 'bg-purple-500',
        link: '/orcamentos'
      },
      {
        name: 'Orçamentos Abertos',
        value: stats.orcamentosAbertos,
        icon: ChartBarIcon,
        color: 'bg-orange-500',
        link: '/orcamentos'
      }
    ]

    if (user?.role === 'admin') {
      return [
        {
          name: 'Total de Clientes',
          value: stats.totalClientes,
          icon: UserGroupIcon,
          color: 'bg-blue-500',
          link: '/clientes'
        },
        {
          name: 'Total de Consultores',
          value: stats.totalConsultores || 0,
          icon: UsersIcon,
          color: 'bg-indigo-500',
          link: '/consultores'
        },
        ...baseCards
      ]
    } else {
      return [
        {
          name: 'Total de Clientes',
          value: stats.totalClientes,
          icon: UserGroupIcon,
          color: 'bg-blue-500',
          link: '/clientes'
        },
        ...baseCards
      ]
    }
  }

  return (
    <div className="space-y-8">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Valor Total Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="bg-yellow-500 rounded-lg p-3">
            <CurrencyDollarIcon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Valor Total em Orçamentos</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.valorTotalOrcamentos)}</p>
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Orçamentos Recentes</h2>
            <Link
              to="/orcamentos"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.orcamentosRecentes.length > 0 ? (
            stats.orcamentosRecentes.map((orcamento, index) => (
              <div key={`orcamento-${orcamento.solicitacao_id || orcamento.id || index}`} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Orçamento #{orcamento.solicitacao_id || orcamento.id || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(orcamento.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(orcamento.valor_total || 0)}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                       orcamento.status === 'aberto' ? 'text-white' :
                       orcamento.status === 'aprovado' ? 'bg-blue-100 text-blue-800' :
                       orcamento.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                       'bg-gray-100 text-gray-800'
                     }`}
                     style={orcamento.status === 'aberto' ? {backgroundColor: '#2CB20B'} : {}}>
                      {orcamento.status || 'Pendente'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum orçamento encontrado</p>
              <Link
                to="/orcamentos/novo"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Criar primeiro orçamento
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'admin' && (
            <>
              <Link
                to="/clientes/novo"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Novo Cliente
              </Link>
              <Link
                to="/consultores/novo"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="w-5 h-5 mr-2" />
                Novo Consultor
              </Link>
            </>
          )}
          <Link
            to="/produtos/novo"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <CubeIcon className="w-5 h-5 mr-2" />
            Novo Produto
          </Link>
          <Link
            to="/orcamentos/novo"
            className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Novo Orçamento
          </Link>
        </div>
      </div>
    </div>
  )
}