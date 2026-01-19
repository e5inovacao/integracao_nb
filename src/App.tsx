import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import TelaInicial from './pages/Dashboard'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Clientes from './pages/Clientes'
import ClienteForm from './pages/ClienteForm'
import Consultores from './pages/Consultores'
import ConsultorForm from './pages/ConsultorForm'
import Administradores from './pages/Administradores'
import Produtos from './pages/Produtos'
import ProdutoForm from './pages/ProdutoForm';
import Orcamentos from './pages/Orcamentos';
import OrcamentoForm from './pages/OrcamentoForm';
import OrcamentoDetalhes from './pages/OrcamentoDetalhes';
import OrcamentoView from './pages/OrcamentoView';
import AdminSetup from './pages/AdminSetup';
import AdminForm from './pages/AdminForm';
import ConsultorSignup from './pages/ConsultorSignup';
import ProdutosDestaque from './pages/ProdutosDestaque';
import CMS from './pages/CMS';
import MensagensClientes from './pages/MensagensClientes';
import ModelosEmail from './pages/ModelosEmail';
import TesteProdutoVariacoes from './pages/TesteProdutoVariacoes';
import NovoEditor from './pages/NovoEditor';
import NovoEditor2 from './pages/NovoEditor2';
import GestaoColaboradores from './pages/GestaoColaboradores';
import Configuracoes from './pages/Configuracoes';
import TabelaFator from './pages/TabelaFator';
import TabelaFatorCopia from './pages/TabelaFatorCopia';
import Pedidos from './pages/Pedidos';
// Personalização removida

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota raiz redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/consultor/registro" element={<ConsultorSignup />} />
        
        {/* Rota para cadastro de administradores - Apenas Super Admin */}
        <Route path="/admin/cadastro" element={
          <ProtectedRoute requiredRole="admin">
            <AdminForm />
          </ProtectedRoute>
        } />
        
        {/* Rotas protegidas */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TelaInicial />} />
          
          {/* Rotas de Clientes - Apenas Admin */}
          <Route path="clientes" element={
            <ProtectedRoute requiredRole="admin">
              <Clientes />
            </ProtectedRoute>
          } />
          <Route path="clientes/novo" element={
            <ProtectedRoute requiredRole="admin">
              <ClienteForm />
            </ProtectedRoute>
          } />
          <Route path="clientes/:id/editar" element={
            <ProtectedRoute requiredRole="admin">
              <ClienteForm />
            </ProtectedRoute>
          } />
          
          {/* Rotas de Consultores - Apenas Admin */}
          <Route path="consultores" element={
            <ProtectedRoute requiredRole="admin">
              <Consultores />
            </ProtectedRoute>
          } />
          <Route path="consultores/novo" element={
            <ProtectedRoute requiredRole="admin">
              <ConsultorForm />
            </ProtectedRoute>
          } />
          <Route path="consultores/:id/editar" element={
            <ProtectedRoute requiredRole="admin">
              <ConsultorForm />
            </ProtectedRoute>
          } />
          
          {/* Rotas de Consultores - Apenas Admin */}
          <Route path="consultores" element={
            <ProtectedRoute requiredRole="admin">
              <Consultores />
            </ProtectedRoute>
          } />
          <Route path="consultores/novo" element={
            <ProtectedRoute requiredRole="admin">
              <ConsultorForm />
            </ProtectedRoute>
          } />
          <Route path="consultores/:id" element={
            <ProtectedRoute requiredRole="admin">
              <ConsultorForm />
            </ProtectedRoute>
          } />
          
          {/* Rotas de Administradores - Apenas Admin */}
          <Route path="administradores" element={
            <ProtectedRoute requiredRole="admin">
              <Administradores />
            </ProtectedRoute>
          } />
          
          {/* Rota de Gestão de Colaboradores - Apenas Admin */}
          <Route path="gestao-colaboradores" element={
            <ProtectedRoute requiredRole="admin">
              <GestaoColaboradores />
            </ProtectedRoute>
          } />
          
          {/* Rotas de Produtos - Admin pode tudo, Consultor apenas visualizar e adicionar */}
          <Route path="produtos" element={<Produtos />} />
          <Route path="produtos/novo" element={<ProdutoForm />} />
          <Route path="produtos/:id/editar" element={
            <ProtectedRoute requiredRole="admin">
              <ProdutoForm />
            </ProtectedRoute>
          } />
          
          {/* Rota de Produtos em Destaque - Apenas Admin */}
          <Route path="produtos-destaque" element={
            <ProtectedRoute requiredRole="admin">
              <ProdutosDestaque />
            </ProtectedRoute>
          } />
          
          {/* Rota CMS - Apenas Admin */}
          <Route path="cms" element={
            <ProtectedRoute requiredRole="admin">
              <CMS />
            </ProtectedRoute>
          } />
          
          {/* Rota Mensagens de Clientes - Apenas Admin */}
          <Route path="mensagens-clientes" element={
            <ProtectedRoute requiredRole="admin">
              <MensagensClientes />
            </ProtectedRoute>
          } />
          
          {/* Rota Modelos de Email - Apenas Admin */}
          <Route path="modelos-email" element={
            <ProtectedRoute requiredRole="admin">
              <ModelosEmail />
            </ProtectedRoute>
          } />
          
          {/* Rotas de Orçamentos - Ambos podem acessar com filtros */}
          <Route path="orcamentos" element={<Orcamentos />} />
          <Route path="orcamentos/novo" element={<OrcamentoForm />} />
          <Route path="orcamentos/:id/editar" element={<OrcamentoForm />} />
          <Route path="orcamentos/:id/detalhes" element={<OrcamentoDetalhes />} />
          
          {/* Rota para visualização do orçamento */}
          <Route path="orcamento/:id" element={<OrcamentoView />} />
          
          {/* Rota de Pedidos - Novo Módulo */}
          <Route path="pedidos" element={<Pedidos />} />

          {/* Rota de Configurações - Apenas Admin */}
          <Route path="configuracoes" element={
            <ProtectedRoute requiredRole="admin">
              <Configuracoes />
            </ProtectedRoute>
          } />
          
          {/* Rota de Tabela de Fator - Apenas Admin */}
          <Route path="fatores" element={
            <ProtectedRoute requiredRole="admin">
              <TabelaFator />
            </ProtectedRoute>
          } />

          {/* Rota de Cópia de Fator - Apenas Admin */}
          <Route path="fatores-copia" element={
            <ProtectedRoute requiredRole="admin">
              <TabelaFatorCopia />
            </ProtectedRoute>
          } />

          {/* Personalizações removidas */}
          
          {/* Rota de teste para variações de produto */}
          <Route path="teste-produto-variacoes" element={<TesteProdutoVariacoes />} />
          
          {/* Rota do Novo Editor */}
          <Route path="novo-editor" element={<NovoEditor />} />
          
          {/* Rota do Novo Editor 2.0 */}
          <Route path="novo-editor-2" element={<NovoEditor2 />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
