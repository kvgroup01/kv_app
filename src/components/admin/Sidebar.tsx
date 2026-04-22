import * as React from 'react';
import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';

interface SidebarProps {
  usuario: {
    nome: string;
    email: string;
  };
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/admin/orcamentos', icon: FileText, label: 'Orçamentos' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar({ usuario, onLogout, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const SidebarContent = ({ showLabels = true }: { showLabels?: boolean }) => (
    <div className="relative flex h-full flex-col bg-(--sidebar-bg) border-r border-(--sidebar-border) text-(--text-primary) transition-all duration-300">
      {/* Header */}
      <div className={cn(
        "flex h-20 shrink-0 items-center justify-between border-b border-(--sidebar-border) transition-all duration-300",
        showLabels ? "px-6" : "px-4 justify-center"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-white text-black text-[13px] font-bold px-2 py-1">
            KV
          </div>
          {showLabels && (
            <span className="text-[15px] font-semibold text-white tracking-tight animate-in fade-in duration-300 truncate">
              Dashboard KV
            </span>
          )}
        </div>

        {/* Toggle Button for Desktop */}
        {showLabels && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 text-(--text-tertiary) hover:bg-white/5 hover:text-white transition-all"
            title="Recolher Menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {!showLabels && (
          <div className="absolute -right-3 top-7 hidden md:block">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onToggleCollapse}
              className="h-6 w-6 rounded-full bg-[#1a1a1a] border-(--sidebar-border) text-white hover:bg-white hover:text-black transition-all shadow-xl"
              title="Expandir Menu"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto pt-6 transition-all duration-300",
        showLabels ? "p-4" : "p-2"
      )}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex w-full items-center transition-all duration-200 rounded-lg",
                showLabels ? "gap-3 px-3 py-2 text-[13px]" : "justify-center p-2",
                isActive 
                  ? "bg-[#1f1f1f] text-white shadow-sm" 
                  : "text-(--text-secondary) hover:bg-[#1a1a1a] hover:text-white"
              )
            }
            title={!showLabels ? item.label : undefined}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              "group-hover:text-white"
            )} />
            {showLabels && (
              <span className="truncate animate-in fade-in slide-in-from-left-1 duration-300">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-(--sidebar-border) transition-all duration-300",
        showLabels ? "p-6" : "p-2 py-4 flex flex-col items-center gap-4"
      )}>
        <div className={cn(
          "flex items-center w-full",
          showLabels ? "gap-3" : "flex-col gap-4"
        )}>
          <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-[#333]">
            <AvatarFallback className="bg-[#1a1a1a] text-(--text-primary) text-xs font-medium rounded-lg">
              {usuario.nome ? getInitials(usuario.nome) : 'US'}
            </AvatarFallback>
          </Avatar>
          
          {showLabels ? (
            <>
              <div className="flex flex-1 flex-col overflow-hidden animate-in fade-in duration-300">
                <span className="truncate text-[13px] font-medium text-white">{usuario.nome || 'Usuário'}</span>
                <span className="truncate text-[11px] text-(--text-tertiary)">{usuario.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} title="Sair" className="h-8 w-8 text-(--text-secondary) hover:bg-[#1a1a1a] hover:text-red-400">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={onLogout} title="Sair" className="h-8 w-8 text-(--text-secondary) hover:bg-[#1a1a1a] hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex h-16 w-full items-center justify-between border-b border-(--sidebar-border) bg-(--sidebar-bg) text-white px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-8 items-center justify-center rounded-md bg-white text-black text-[11px] font-bold">
             KV
          </div>
          <span className="text-sm font-semibold tracking-tight">Dashboard KV</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#1a1a1a]">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-(--sidebar-border) bg-(--sidebar-bg)">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">Navegue pelas áreas administrativas</SheetDescription>
            <SidebarContent showLabels={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col md:fixed md:inset-y-0 z-30 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent showLabels={!isCollapsed} />
      </div>
    </>
  );
}
