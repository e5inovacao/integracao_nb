import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  requireAuth = true
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // Verificar se requer autenticação
  if (requireAuth && !user) {
    // Redirecionar para login salvando a localização atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar role específica
  if (requiredRole && user?.role !== requiredRole) {
    // Redirecionar para página não autorizada ou dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar roles permitidas
  if (allowedRoles && allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    // Redirecionar para página não autorizada ou dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  // Se passou por todas as verificações, renderizar o componente
  return <>{children}</>;
};

export default ProtectedRoute;