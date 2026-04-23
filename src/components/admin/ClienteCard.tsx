import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Copy, ExternalLink, MoreVertical, Edit2, FolderInput, Trash2, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Cliente } from '../../lib/types';
import { cn } from '../../lib/utils';
import { CONFIG } from '../../lib/constants';

interface ClienteCardProps {
  cliente: Cliente;
  onEditar: () => void;
  onDeletar: () => void;
  onMoverPasta: () => void;
}

export function ClienteCard({ cliente, onEditar, onDeletar, onMoverPasta }: ClienteCardProps) {
  
  const getBadgeColors = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400';
      case 'leads':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400';
      case 'ambos':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const dashboardUrl = `${CONFIG.APP_URL}/dashboard/${cliente.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dashboardUrl);
    toast.success('Link do dashboard copiado!');
  };

  return (
    <div className="group bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
      {/* Header (Avatar + Actions) */}
      <div className="flex justify-between items-start mb-6">
        <Avatar className="h-14 w-14 rounded-[10px] border border-(--card-border) shadow-sm">
          <AvatarImage src={cliente.logo_url} alt={cliente.nome} className="object-cover" />
          <AvatarFallback className="bg-[#1a1a1a] text-(--text-primary) font-semibold rounded-[10px] text-lg">
            {getInitials(cliente.nome)}
          </AvatarFallback>
        </Avatar>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-(--text-secondary) hover:text-(--text-primary) hover:bg-[#1a1a1a]">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <DropdownMenuItem onClick={onEditar} className="hover:bg-(--card-hover) cursor-pointer">
              <Edit2 className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoverPasta} className="hover:bg-(--card-hover) cursor-pointer">
              <FolderInput className="mr-2 h-4 w-4" /> Mover para pasta
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-(--card-border)" />
            <DropdownMenuItem onClick={onEditar} className="hover:bg-(--card-hover) cursor-pointer">
              <PowerOff className="mr-2 h-4 w-4" /> 
              {cliente.ativo ? 'Desativar' : 'Reativar'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeletar} className="text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-[17px] text-(--text-primary) leading-tight line-clamp-1" title={cliente.nome}>
          {cliente.nome}
        </h3>
        
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight",
            cliente.tipo_campanha === 'whatsapp' ? "bg-emerald-500/10 text-emerald-500" :
            cliente.tipo_campanha === 'leads' ? "bg-blue-500/10 text-blue-500" :
            "bg-purple-500/10 text-purple-500"
          )}>
            {cliente.tipo_campanha}
          </span>
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight border border-transparent",
            cliente.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-(--text-tertiary)"
          )}>
            {cliente.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-5 border-t border-(--card-border)">
        <Button 
          variant="outline" 
          className="flex-1 bg-transparent border-(--card-border) hover:bg-[#1a1a1a] text-(--text-primary) text-[13px] h-9" 
          onClick={() => window.open(dashboardUrl, '_blank')}
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          Acessar
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-[#1a1a1a] border border-(--card-border)"
          onClick={handleCopyLink} 
          title="Copiar link"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
