import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Quote from './pages/Quote';
import Componentes from './pages/Componentes';
import Contact from './pages/Contact';
import About from './pages/About';


// Placeholder components for routes that will be implemented
const Sustainability = () => <div className="container-custom section-padding"><h1>Sustentabilidade</h1><p>Em desenvolvimento...</p></div>;

function App() {
  // Mock cart items count - will be replaced with actual state management
  const cartItemsCount = 0;

  return (
    <HelmetProvider>
      <Router>
        <Layout cartItemsCount={cartItemsCount}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/produto/:id" element={<ProductDetails />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/orcamento" element={<Quote />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/sustentabilidade" element={<Sustainability />} />
          <Route path="/componentes" element={<Componentes />} />

          <Route path="*" element={
            <div className="container-custom section-padding text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Página não encontrada</p>
              <a href="/" className="btn btn-primary">Voltar ao Início</a>
            </div>
          } />
        </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
