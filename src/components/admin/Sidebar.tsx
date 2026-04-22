import * as React from 'react';
import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut, 
  Menu 
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
}

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/admin/orcamentos', icon: FileText, label: 'Orçamentos' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar({ usuario, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-(--sidebar-bg) border-r border-(--sidebar-border) text-(--text-primary)">
      {/* Header */}
      <div className="flex h-20 shrink-0 items-center px-8 border-b border-(--sidebar-border)">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-9 items-center justify-center rounded-md bg-white text-black text-[13px] font-bold px-2 py-1">
            KV
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">Dashboard KV</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 pt-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#1f1f1f] text-white" 
                  : "text-(--text-secondary) hover:bg-[#1a1a1a] hover:text-white"
              )
            }
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              "group-hover:text-white"
            )} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-(--sidebar-border) p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-lg border border-[#333]">
            <AvatarFallback className="bg-[#1a1a1a] text-(--text-primary) text-xs font-medium rounded-lg">
              {usuario.nome ? getInitials(usuario.nome) : 'US'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-[13px] font-medium text-white">{usuario.nome || 'Usuário'}</span>
            <span className="truncate text-[11px] text-(--text-tertiary)">{usuario.email}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Sair" className="h-8 w-8 text-(--text-secondary) hover:bg-[#1a1a1a] hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </Button>
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
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </div>
    </>
  );
}
