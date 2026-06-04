import * as React from 'react';
import { NavLink } from 'react-router';
import { KVMark } from '../brand/KVMark';
import {
  LayoutDashboard,
  Home,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plug2,
  GitBranch,
  Instagram,
  Megaphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  usuario: { nome: string; email: string };
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { href: '/admin',            icon: Home,          label: 'Início',                 exact: true },
  { href: '/admin/clientes',   icon: Users,         label: 'Clientes' },
  { href: '/admin/dashboards', icon: LayoutDashboard, label: 'Dashboards' },
  { href: '/admin/funis',      icon: GitBranch,     label: 'Funis' },
  { href: '/admin/financeiro', icon: Wallet,        label: 'Financeiro' },
  { href: '/admin/orcamentos', icon: FileText,      label: 'Orçamentos' },
  { href: '/admin/instagram',  icon: Instagram,     label: 'Instagram' },
  { href: '/admin/pages',      icon: FileText,      label: 'Páginas' },
  { href: '/admin/ads-manager',icon: Megaphone,     label: 'Gerenciador de Anúncios' },
  { href: '/admin/meta-connect',icon: Plug2,        label: 'Integrações' },
  { href: '/admin/configuracoes',icon: Settings,    label: 'Configurações' },
];

export function Sidebar({ usuario, onLogout, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const SidebarContent = ({ showLabels = true }: { showLabels?: boolean }) => (
    <div className="relative flex h-full flex-col bg-(--sidebar-bg) border-r border-(--sidebar-border) transition-all duration-300">

      {/* ── Logo ── */}
      <div className={cn(
        "flex h-[60px] shrink-0 items-center border-b border-(--sidebar-border)",
        showLabels ? "px-5 justify-between" : "px-0 justify-center"
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <KVMark size={26} />
          {showLabels && (
            <span
              className="text-[15px] font-semibold tracking-tight truncate animate-fade-in"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
            >
              KV<span style={{ color: 'var(--kvmark-color)' }}>ision</span>
            </span>
          )}
        </div>

        {/* Collapse toggle — desktop */}
        {showLabels && (
          <button
            onClick={onToggleCollapse}
            title="Recolher menu"
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover) transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!showLabels && (
          <div className="absolute -right-3 top-[18px] hidden md:block">
            <button
              onClick={onToggleCollapse}
              title="Expandir menu"
              className="h-6 w-6 rounded-full border border-(--sidebar-border) bg-(--sidebar-bg) text-(--text-secondary) hover:bg-(--brand) hover:text-black hover:border-transparent transition-all shadow-surface flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className={cn(
        "flex-1 overflow-y-auto scrollbar-none py-3 transition-all duration-300",
        showLabels ? "px-3" : "px-2"
      )}>
        {/* Separador visual de grupos */}
        {showLabels && (
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-(--text-tertiary)">
            Menu
          </p>
        )}

        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              onClick={() => setIsOpen(false)}
              title={!showLabels ? item.label : undefined}
            >
              {({ isActive }) => (
                <div className={cn(
                  "flex w-full items-center rounded-[10px] transition-all duration-150",
                  showLabels ? "gap-3 px-3 py-2" : "justify-center p-2.5",
                  isActive
                    ? "bg-[#FBB03B] text-black font-semibold"
                    : "text-(--text-secondary) hover:bg-(--card-hover) hover:text-(--text-primary)"
                )}>
                  <item.icon className={cn(
                    "shrink-0 transition-colors",
                    showLabels ? "h-[15px] w-[15px]" : "h-4 w-4",
                    isActive
                      ? "text-black"
                      : "text-(--text-tertiary) group-hover:text-(--text-primary)"
                  )} />
                  {showLabels && (
                    <span className="truncate text-[13px] leading-none" style={{ letterSpacing: '-0.1px' }}>
                      {item.label}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Footer / Usuário ── */}
      <div className={cn(
        "border-t border-(--sidebar-border) transition-all duration-300",
        showLabels ? "p-4" : "p-2 flex flex-col items-center gap-3 py-3"
      )}>
        {showLabels ? (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 rounded-[8px] border border-(--sidebar-border)">
              <AvatarFallback className="bg-(--card-bg) text-(--text-primary) text-[11px] font-semibold rounded-[8px]">
                {usuario.nome ? getInitials(usuario.nome) : 'KV'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
              <span className="truncate text-[12px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.1px' }}>
                {usuario.nome || 'Usuário'}
              </span>
              <span className="truncate text-[11px] text-(--text-tertiary)">
                {usuario.email}
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                onClick={onLogout}
                title="Sair"
                className="h-7 w-7 flex items-center justify-center rounded-md text-(--text-tertiary) hover:text-red-400 hover:bg-(--card-hover) transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Avatar className="h-8 w-8 shrink-0 rounded-[8px] border border-(--sidebar-border)">
              <AvatarFallback className="bg-(--card-bg) text-(--text-primary) text-[11px] font-semibold rounded-[8px]">
                {usuario.nome ? getInitials(usuario.nome) : 'KV'}
              </AvatarFallback>
            </Avatar>
            <ThemeToggle />
            <button
              onClick={onLogout}
              title="Sair"
              className="h-7 w-7 flex items-center justify-center rounded-md text-(--text-tertiary) hover:text-red-400 hover:bg-(--card-hover) transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex h-14 w-full items-center justify-between border-b border-(--sidebar-border) bg-(--sidebar-bg) px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <KVMark size={22} />
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
          >
            KV<span style={{ color: 'var(--kvmark-color)' }}>ision</span>
          </span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--card-hover) transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-(--sidebar-border) bg-(--sidebar-bg)">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">Navegue pelas áreas administrativas</SheetDescription>
            <SidebarContent showLabels={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop sidebar ── */}
      <div className={cn(
        "hidden md:flex flex-col md:fixed md:inset-y-0 z-30 transition-all duration-300",
        isCollapsed ? "w-[68px]" : "w-[220px]"
      )}>
        <SidebarContent showLabels={!isCollapsed} />
      </div>
    </>
  );
}
