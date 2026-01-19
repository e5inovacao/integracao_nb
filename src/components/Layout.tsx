import React from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TopNavbar from './TopNavbar'

export default function Layout() {
  const location = useLocation()
  
  // Adicionado: Verificar se a rota atual é a de edição de orçamento
  const isOrcamentoEditPage = location.pathname.includes('/orcamentos/') && location.pathname.endsWith('/editar');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          nav {
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
      
      {/* Top Navigation Bar - Hidden on print and edit page */}
      {!isOrcamentoEditPage && <TopNavbar />}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out bg-gray-50 min-h-screen ${!isOrcamentoEditPage ? 'pt-20' : ''}`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
