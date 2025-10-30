import React from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  CubeIcon,
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: 'Tela Inicial', href: '/', icon: HomeIcon },
  { 
    name: 'Cadastros', 
    href: '/clientes', 
    icon: UserGroupIcon,
    children: [
      { name: 'Clientes', href: '/clientes' },
      { name: 'Consultores', href: '/consultores' },
      { name: 'Gestão de Colaboradores', href: '/gestao-colaboradores' }
    ]
  },
  { 
    name: 'Produtos', 
    href: '/produtos', 
    icon: CubeIcon
  },
  { 
    name: 'Vendas', 
    href: '/orcamentos', 
    icon: ShoppingCartIcon
  }
]

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = React.useState<string | null>(null)
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false)
  const [isMenuVisible, setIsMenuVisible] = React.useState(true)
  const [lastScrollY, setLastScrollY] = React.useState(0)

  const handleLogout = async () => {
    await signOut()
    setUserDropdownOpen(false)
  }

  // Controlar visibilidade do menu baseado no scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        // No topo da página, sempre mostrar
        setIsMenuVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Rolando para baixo e passou de 100px, esconder
        setIsMenuVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Rolando para cima, mostrar
        setIsMenuVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-dropdown')) {
        setUserDropdownOpen(false)
      }
      if (!target.closest('.menu-dropdown')) {
        setDropdownOpen(null)
      }
    }

    if (userDropdownOpen || dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen, dropdownOpen])

  const getBreadcrumbs = () => {
    const path = location.pathname
    const breadcrumbs = [{ name: 'HOME', href: '/' }]
    
    if (path === '/clientes') breadcrumbs.push({ name: 'Lista de Clientes', href: '/clientes' })
    else if (path === '/clientes/novo') breadcrumbs.push({ name: 'Lista de Clientes', href: '/clientes' }, { name: 'Novo Cliente', href: '/clientes/novo' })
    else if (path.startsWith('/clientes/')) breadcrumbs.push({ name: 'Lista de Clientes', href: '/clientes' }, { name: 'Editar Cliente', href: path })
    else if (path === '/consultores') breadcrumbs.push({ name: 'Lista de Consultores', href: '/consultores' })
      else if (path === '/consultores/novo') breadcrumbs.push({ name: 'Lista de Consultores', href: '/consultores' }, { name: 'Novo Consultor', href: '/consultores/novo' })
      else if (path.startsWith('/consultores/')) breadcrumbs.push({ name: 'Lista de Consultores', href: '/consultores' }, { name: 'Editar Consultor', href: path })
    else if (path === '/administradores') breadcrumbs.push({ name: 'Administradores', href: '/administradores' })
    else if (path === '/gestao-colaboradores') breadcrumbs.push({ name: 'Gestão de Colaboradores', href: '/gestao-colaboradores' })
    else if (path === '/produtos') breadcrumbs.push({ name: 'Lista de Produtos', href: '/produtos' })
    else if (path === '/produtos/novo') breadcrumbs.push({ name: 'Lista de Produtos', href: '/produtos' }, { name: 'Novo Produto', href: '/produtos/novo' })
    else if (path === '/produtos-destaque') breadcrumbs.push({ name: 'Produtos em Destaque', href: '/produtos-destaque' })
    else if (path.startsWith('/produtos/')) breadcrumbs.push({ name: 'Lista de Produtos', href: '/produtos' }, { name: 'Editar Produto', href: path })
    else if (path === '/orcamentos') breadcrumbs.push({ name: 'Lista de Orçamentos', href: '/orcamentos' })
    else if (path === '/orcamentos/novo') breadcrumbs.push({ name: 'Lista de Orçamentos', href: '/orcamentos' }, { name: 'Novo Orçamento', href: '/orcamentos/novo' })
    else if (path.startsWith('/orcamentos/')) breadcrumbs.push({ name: 'Lista de Orçamentos', href: '/orcamentos' }, { name: 'Detalhes do Orçamento', href: path })
    else if (path === '/cms') breadcrumbs.push({ name: 'CMS', href: '/cms' })
    else if (path === '/mensagens-clientes') breadcrumbs.push({ name: 'Mensagens de Clientes', href: '/mensagens-clientes' })
    else if (path === '/modelos-email') breadcrumbs.push({ name: 'Modelos de Email', href: '/modelos-email' })
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  // Adicionado: Verificar se a rota atual é a de edição de orçamento
  const isOrcamentoEditPage = location.pathname.includes('/orcamentos/') && location.pathname.endsWith('/editar');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          .top-navbar {
            display: none !important;
          }
          
          .breadcrumb-container {
            display: none !important;
          }
          
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>
      
      {/* Top Navigation Bar */}
      <div className={`top-navbar fixed top-4 left-4 right-4 z-[100] transition-all duration-300 ease-in-out h-20 bg-sidebar-green shadow-xl rounded-2xl overflow-visible ${isMenuVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${isOrcamentoEditPage ? 'hidden' : ''}`}>
        <div className="flex items-center h-full px-6 overflow-visible">
            {/* Logo e Toggle */}
            <div className="flex items-center">
            </div>
    
            {/* Navigation */}
            {!isOrcamentoEditPage && (
              <nav className="flex-1 flex items-center space-x-1 overflow-x-auto overflow-y-visible">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.children && item.children.some(child => location.pathname === child.href))
                  
                  return (
                  <div key={item.name} className="relative flex-shrink-0 menu-dropdown">
                    {item.children ? (
                      <div className="menu-dropdown">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === item.name ? null : item.name)}
                          className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            isActive 
                              ? 'bg-menu-green text-white shadow-lg' 
                              : 'text-gray-300 hover:text-white hover:bg-menu-green-hover'
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-2 flex-shrink-0" />
                          <span className="hidden md:inline">{item.name}</span>
                          <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform duration-200 flex-shrink-0 ${
                            dropdownOpen === item.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        {dropdownOpen === item.name && (
                          <div className="absolute top-full mt-2 left-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-[110] overflow-hidden">
                            <div className="py-2">
                              {item.children.filter(child => child.name !== 'Fornecedores').map((child) => (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  onClick={() => setDropdownOpen(null)}
                                  className={`block px-4 py-3 text-sm transition-colors ${
                                    location.pathname === child.href
                                      ? 'bg-menu-green-light text-white'
                                      : 'text-gray-700 hover:bg-gray-50 hover:text-menu-green'
                                  }`}
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          isActive 
                            ? 'bg-menu-green text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-menu-green-hover'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="hidden md:inline">{item.name}</span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </nav>
            )}
    
            {/* User info */}
            <div className="relative user-dropdown">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center p-3 rounded-xl text-gray-300 hover:text-white hover:bg-menu-green-hover transition-all duration-200"
              >
                <UserIcon className="w-5 h-5" />
                <div className="ml-3 text-left hidden lg:block">
                  <div className="text-sm font-medium text-white truncate max-w-[140px]">
                    {user?.email || 'admin@example.com'}
                  </div>
                  <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded">Administrador</div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform duration-200 hidden lg:block ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>
              
              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="py-2">
                    <div className="px-5 py-3 text-sm text-gray-700 border-b border-gray-50 bg-gray-50">
                      <div className="font-semibold text-gray-900 mb-1">Logado como:</div>
                      <div className="text-xs text-gray-600 truncate font-mono bg-white px-2 py-1 rounded-md border">
                        {user?.email || 'admin@example.com'}
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 rounded-lg font-medium flex items-center space-x-2 group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair do Sistema</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="transition-all duration-300 ease-in-out pt-28 bg-white min-h-screen">
        {/* Main content */}
        <main className="px-6 py-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}