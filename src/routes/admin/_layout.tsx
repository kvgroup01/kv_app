import * as React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../../components/admin/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFunilCanvas = location.pathname.includes('/funis/') && 
    location.pathname.includes('/canvas');
  const isPageEditor = location.pathname.includes('/pages/') && 
    location.pathname.includes('/editor');
  const isFullscreen = isFunilCanvas || isPageEditor;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-(--content-bg)">
        <Skeleton className="h-12 w-12 rounded-[10px]" />
        <Skeleton className="h-3 w-[180px]" />
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
    <div className="h-screen bg-(--content-bg) w-full flex flex-col md:flex-row overflow-hidden">
      {!isFullscreen && (
        <Sidebar 
           usuario={{ 
             nome: user.user_metadata?.nome || user.email, 
             email: user.email 
           }} 
           onLogout={handleLogout} 
           isCollapsed={isSidebarCollapsed}
           onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
      
      {/* Contêiner Principal ao lado da Sidebar */}
      {isFullscreen ? (
        <div className="flex-1 w-full overflow-hidden" style={{ height: '100dvh' }}>
          <Outlet />
        </div>
      ) : (
        <main className={cn(
          "flex-1 w-full h-full min-h-screen relative p-4 md:p-6 lg:p-8 pb-20 overflow-y-auto overflow-x-hidden transition-all duration-300",
          isSidebarCollapsed ? "md:ml-[68px]" : "md:ml-[220px]"
        )}>
           {/* O Outlet renderiza as rotas filhas ali dentro */}
           <div className="max-w-[1400px] mx-auto w-full">
              <Outlet />
           </div>
        </main>
      )}
    </div>
  );
}
