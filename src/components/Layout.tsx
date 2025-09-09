import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  cartItemsCount?: number;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  cartItemsCount = 0, 
  className = '' 
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={cartItemsCount} />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;