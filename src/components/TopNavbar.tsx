import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  UserGroupIcon, 
  CubeIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  UserIcon,
  CalculatorIcon,
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCartIcon, current: false },
  { name: 'Cadastros', href: '#', icon: UserGroupIcon, current: false, children: [
    { name: 'Clientes', href: '/clientes' },
    { name: 'Consultores', href: '/consultores' },
    { name: 'Produtos', href: '/produtos' },
    { name: 'Administradores', href: '/administradores' },
    { name: 'Colaboradores', href: '/gestao-colaboradores' },
  ]},
  { name: 'Vendas', href: '/orcamentos', icon: ChartBarIcon, current: false },
  { name: 'Financeiro', href: '#', icon: CalculatorIcon, current: false, children: [
    { name: 'Comissões', href: '/comissoes' },
    { name: 'Fatores', href: '/fatores' },
    { name: 'Relatórios', href: '/relatorios' },
  ]},
  { name: 'Configurações', href: '/configuracoes', icon: Cog6ToothIcon, current: false },
];

export default function TopNavbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.nav-dropdown-trigger')) {
        setActiveDropdown(null);
      }
      if (!target.closest('.user-dropdown-trigger')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CubeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 hidden md:block">Cristal Brindes</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <div key={item.name} className="relative flex items-center h-full">
                  {item.children ? (
                    <div className="relative nav-dropdown-trigger h-full flex items-center">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          activeDropdown === item.name
                            ? 'border-blue-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        {item.name}
                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === item.name && (
                        <div className="absolute top-16 left-0 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full ${
                        isActive(item.href)
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile Dropdown */}
            <div className="ml-3 relative user-dropdown-trigger">
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 items-center gap-2"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>
              </div>
              
              {userDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Logado como</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/admin-setup"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
