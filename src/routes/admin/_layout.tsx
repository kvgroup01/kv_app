import * as React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router';
import { Sidebar } from '../../components/admin/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../../components/ui/skeleton';

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-muted/20">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <Skeleton className="h-4 w-[250px]" />
      </div>
    );
  }

  // Verifica Autenticação: Se não tem dados, redireciona pro login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-(--content-bg) w-full flex flex-col md:flex-row">
      <Sidebar 
         usuario={{ 
           nome: user.name || 'Gestor KV', 
           email: user.email 
         }} 
         onLogout={handleLogout} 
      />
      
      {/* Contêiner Principal ao lado da Sidebar */}
      <main className="flex-1 md:ml-64 w-full h-full min-h-screen relative p-8 md:p-10 pb-20 overflow-y-auto overflow-x-hidden">
         {/* O Outlet renderiza as rotas filhas ali dentro */}
         <div className="max-w-[1400px] mx-auto w-full">
            <Outlet />
         </div>
      </main>
    </div>
  );
}
