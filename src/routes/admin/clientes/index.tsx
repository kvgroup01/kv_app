import * as React from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, FolderPlus, Trash2, Folder, FolderOpen, ChevronDown, ChevronRight, LayoutGrid, ListFilter } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { useClientes, usePastas, useDeletarCliente, useAtualizarCliente, useCriarPasta, useDeletarPasta } from '../../../hooks/useClientes';
import type { Cliente } from '../../../lib/types';
import { cn } from '../../../lib/utils';

import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { ClienteCard } from '../../../components/admin/ClienteCard';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

export default function ClientesIndex() {
  const navigate = useNavigate();
  
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: pastas, isLoading: loadingPastas } = usePastas();
  const criarPastaMut = useCriarPasta();
  const deletarPastaMut = useDeletarPasta();
  const deletarMut = useDeletarCliente();
  const atualizarMut = useAtualizarCliente();

  // Filtros
  const [busca, setBusca] = React.useState('');
  const [pastaFilter, setPastaFilter] = React.useState<string>('todas');
  const [tipoFilter, setTipoFilter] = React.useState<string>('todos');

  // Dialog States
  const [clienteToDelete, setClienteToDelete] = React.useState<Cliente | null>(null);
  const [clienteToMove, setClienteToMove] = React.useState<Cliente | null>(null);
  const [pastaDestino, setPastaDestino] = React.useState<string>('');
  const [isNovaPastaOpen, setIsNovaPastaOpen] = React.useState(false);
  const [novaPastaNome, setNovaPastaNome] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'folders' | 'grid'>('folders');
  const [collapsedPastas, setCollapsedPastas] = React.useState<Record<string, boolean>>({});

  const isLoading = loadingClientes || loadingPastas;

  const toggleFolder = (id: string) => {
    setCollapsedPastas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtragem da Lista
  const clientesFiltrados = React.useMemo(() => {
    if (!clientes) return [];
    return clientes.filter((c) => {
      const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
      const matchPasta = pastaFilter === 'todas' || c.pasta_id === pastaFilter;
      const matchTipo = tipoFilter === 'todos' || c.tipo_campanha === tipoFilter;
      return matchBusca && matchPasta && matchTipo;
    });
  }, [clientes, busca, pastaFilter, tipoFilter]);

  // Actions
  const handleDeletar = () => {
    if (!clienteToDelete) return;
    deletarMut.mutate((clienteToDelete as any).id || clienteToDelete.$id, {
      onSuccess: () => setClienteToDelete(null)
    });
  };

  const handleMover = () => {
    if (!clienteToMove) return;
    atualizarMut.mutate({ 
      id: (clienteToMove as any).id || clienteToMove.$id, 
      data: { pasta_id: pastaDestino === 'sem-pasta' ? '' : pastaDestino } 
    }, {
      onSuccess: () => {
        setClienteToMove(null);
        setPastaDestino('');
        toast.success("Cliente movido para a pasta!");
      },
      onError: (err: any) => {
        toast.error("Erro ao mover cliente: " + (err.message || "Erro desconhecido"));
      }
    });
  };

  const handleCriarPasta = () => {
    if (!novaPastaNome.trim()) return;
    criarPastaMut.mutate({ nome: novaPastaNome, cor: '#3b82f6' }, {
      onSuccess: () => {
        setIsNovaPastaOpen(false);
        setNovaPastaNome('');
      }
    });
  };

  const handleDeletarPasta = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta pasta? Clientes nesta pasta não serão excluídos.')) {
      deletarPastaMut.mutate(id);
    }
  };

  const groupedClientes = React.useMemo(() => {
    if (!clientes) return {};
    
    // Primeiro aplicamos filtros globais (busca e tipo)
    const filtered = clientes.filter((c) => {
      const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = tipoFilter === 'todos' || c.tipo_campanha === tipoFilter;
      return matchBusca && matchTipo;
    });

    // Se estiver filtrando por UMA pasta específica via Select, retornamos apenas ela
    if (pastaFilter !== 'todas') {
      return {
        [pastaFilter]: filtered.filter(c => (c.pasta_id || 'sem-pasta') === pastaFilter)
      };
    }

    // Caso contrário agrupamos todos
    const groups: Record<string, typeof clientes> = {};
    filtered.forEach(c => {
      const pid = c.pasta_id || 'sem-pasta';
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(c);
    });

    return groups;
  }, [clientes, busca, tipoFilter, pastaFilter]);

  const allPastaIds = React.useMemo(() => {
    const ids = pastas?.map(p => p.$id) || [];
    if (!ids.includes('sem-pasta')) ids.push('sem-pasta');
    return ids;
  }, [pastas]);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>
            Meus Clientes
          </h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Gerencie sua base de clientes e painéis.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex items-center bg-(--card-bg) border border-(--card-border) rounded-[10px] p-1 gap-0.5">
            <button
              onClick={() => setViewMode('folders')}
              title="Visão por pastas"
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-[7px] transition-colors",
                viewMode === 'folders'
                  ? "bg-[#FBB03B] text-black"
                  : "text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover)"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grade simples"
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-[7px] transition-colors",
                viewMode === 'grid'
                  ? "bg-[#FBB03B] text-black"
                  : "text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover)"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsNovaPastaOpen(true)}
            className="h-9 px-4 flex items-center gap-1.5 rounded-[10px] border border-(--card-border) text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-hover) transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Nova pasta
          </button>

          <button
            onClick={() => navigate('/admin/clientes/novo')}
            className="btn-brand h-9 px-4 text-[13px]"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo cliente
          </button>
        </div>
      </div>

      {/* ── Toolbar de filtros ── */}
      <div className="flex flex-col sm:flex-row gap-2 bg-(--card-bg) border border-(--card-border) rounded-[12px] p-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--text-tertiary)" />
          <input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-transparent text-[13px] text-(--text-primary) placeholder:text-(--text-tertiary) outline-none border-none"
          />
        </div>
        <div className="w-px bg-(--card-border) hidden sm:block self-stretch my-1" />
        <Select value={pastaFilter} onValueChange={setPastaFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 bg-transparent border-none focus:ring-0 text-[13px] text-(--text-secondary)">
            <SelectValue placeholder="Todas as pastas" />
          </SelectTrigger>
          <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <SelectItem value="todas">Todas as pastas</SelectItem>
            <SelectItem value="sem-pasta">Sem pasta</SelectItem>
            {pastas?.map((p: any) => (
              <SelectItem key={p.$id} value={p.$id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px bg-(--card-border) hidden sm:block self-stretch my-1" />
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 bg-transparent border-none focus:ring-0 text-[13px] text-(--text-secondary)">
            <SelectValue placeholder="Tipo de campanha" />
          </SelectTrigger>
          <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="leads">Leads</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Chips de pastas ── */}
      {!isLoading && pastas && pastas.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-wider mr-1">Pastas</span>
          <button
            onClick={() => setPastaFilter('todas')}
            className={cn(
              "px-3 py-1 text-[11px] font-semibold rounded-full border uppercase tracking-tight transition-all",
              pastaFilter === 'todas'
                ? "bg-[#FBB03B] text-black border-[#FBB03B]"
                : "text-(--text-secondary) border-(--card-border) hover:border-(--text-tertiary)"
            )}
          >
            Todas
          </button>
          {pastas.map((p: any) => (
            <span
              key={p.$id}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border uppercase tracking-tight transition-all cursor-pointer",
                pastaFilter === p.$id
                  ? "bg-[#FBB03B] text-black border-[#FBB03B]"
                  : "text-(--text-secondary) border-(--card-border) hover:border-(--text-tertiary)"
              )}
              onClick={() => setPastaFilter(p.$id)}
            >
              {p.nome}
              <Trash2
                className="h-3 w-3 opacity-40 hover:opacity-100 hover:text-red-500 transition-all"
                onClick={(e) => handleDeletarPasta(e, p.$id)}
              />
            </span>
          ))}
        </div>
      )}

      {/* ── Lista ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-[14px]" />
          ))}
        </div>
      ) : Object.keys(groupedClientes).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-(--card-border) rounded-[14px]">
          <div className="w-14 h-14 bg-(--card-bg) border border-(--card-border) rounded-full flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-(--text-tertiary)" />
          </div>
          <h3 className="text-[15px] font-semibold text-(--text-primary) mb-1">Nenhum cliente encontrado</h3>
          <p className="text-[13px] text-(--text-tertiary) max-w-xs mb-6">
            Tente ajustar os filtros ou criar um novo cliente.
          </p>
          <button
            onClick={() => { setBusca(''); setPastaFilter('todas'); setTipoFilter('todos'); }}
            className="h-9 px-4 rounded-[10px] border border-(--card-border) text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-hover) transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {[...(pastas || []).map(p => p.$id), 'sem-pasta']
            .filter(id => groupedClientes[id] && groupedClientes[id].length > 0)
            .map((id) => {
              const pasta = pastas?.find(p => p.$id === id);
              const clients = groupedClientes[id];
              const isCollapsed = collapsedPastas[id] || false;
              const nomePasta = pasta?.nome || 'Sem pasta';

              if (viewMode === 'grid') {
                return clients.map(cliente => (
                  <ClienteCard
                    key={cliente.id || cliente.$id}
                    cliente={cliente}
                    onEditar={() => navigate(`/admin/clientes/${cliente.id || cliente.$id}`)}
                    onDeletar={() => setClienteToDelete(cliente)}
                    onMoverPasta={() => setClienteToMove(cliente)}
                  />
                ));
              }

              return (
                <div key={id} className="group/pasta space-y-3">
                  {/* Header da pasta */}
                  <button
                    onClick={() => toggleFolder(id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-(--card-bg) border border-(--card-border) rounded-[12px] hover:border-[#FBB03B]/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-(--card-hover) border border-(--card-border) flex items-center justify-center shrink-0">
                        {isCollapsed
                          ? <Folder className="h-4 w-4 text-(--text-tertiary)" />
                          : <FolderOpen className="h-4 w-4 text-[#FBB03B]" />
                        }
                      </div>
                      <div>
                        <span className="text-[14px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.2px' }}>
                          {nomePasta}
                        </span>
                        <span className="ml-2 text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-wider">
                          {clients.length} {clients.length === 1 ? 'painel' : 'painéis'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {id !== 'sem-pasta' && (
                        <span
                          onClick={(e) => handleDeletarPasta(e, id)}
                          className="h-7 w-7 flex items-center justify-center rounded-[7px] opacity-0 group-hover/pasta:opacity-100 hover:bg-red-500/10 text-red-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {isCollapsed
                        ? <ChevronRight className="h-4 w-4 text-(--text-tertiary)" />
                        : <ChevronDown className="h-4 w-4 text-(--text-tertiary)" />
                      }
                    </div>
                  </button>

                  {/* Grid de clientes */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4 px-1">
                          {clients.map((cliente) => (
                            <ClienteCard
                              key={cliente.id || cliente.$id}
                              cliente={cliente}
                              onEditar={() => navigate(`/admin/clientes/${cliente.id || cliente.$id}`)}
                              onDeletar={() => setClienteToDelete(cliente)}
                              onMoverPasta={() => setClienteToMove(cliente)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Dialogs ── */}
      <AlertDialog open={!!clienteToDelete} onOpenChange={(open) => !open && setClienteToDelete(null)}>
        <AlertDialogContent className="bg-(--card-bg) border-(--card-border)">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-(--text-primary)">Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--text-secondary)">
              Esta ação não pode ser desfeita. O cliente <strong className="text-(--text-primary)">{clienteToDelete?.nome}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-(--card-border) text-(--text-secondary)">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-red-500 hover:bg-red-600 text-white border-none">
              {deletarMut.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!clienteToMove} onOpenChange={(open) => !open && setClienteToMove(null)}>
        <DialogContent className="bg-(--card-bg) border-(--card-border)">
          <DialogHeader>
            <DialogTitle className="text-(--text-primary)">Mover para pasta</DialogTitle>
            <DialogDescription className="text-(--text-secondary)">
              Selecione a pasta destino para <strong className="text-(--text-primary)">{clienteToMove?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={pastaDestino} onValueChange={setPastaDestino}>
              <SelectTrigger className="bg-(--card-hover) border-(--card-border) text-(--text-primary)">
                <SelectValue placeholder="Selecione uma pasta" />
              </SelectTrigger>
              <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                <SelectItem value="sem-pasta">Sem pasta</SelectItem>
                {pastas?.map((p: any) => (
                  <SelectItem key={p.$id} value={p.$id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setClienteToMove(null)} className="h-9 px-4 rounded-[10px] border border-(--card-border) text-[13px] text-(--text-secondary) hover:bg-(--card-hover) transition-colors">
              Cancelar
            </button>
            <button onClick={handleMover} disabled={atualizarMut.isPending || !pastaDestino} className="btn-brand h-9 px-4 text-[13px]">
              {atualizarMut.isPending ? 'Movendo...' : 'Mover'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNovaPastaOpen} onOpenChange={setIsNovaPastaOpen}>
        <DialogContent className="bg-(--card-bg) border-(--card-border)">
          <DialogHeader>
            <DialogTitle className="text-(--text-primary)">Nova pasta</DialogTitle>
            <DialogDescription className="text-(--text-secondary)">
              Organize seus clientes em categorias ou grupos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              placeholder="Nome da pasta..."
              value={novaPastaNome}
              onChange={(e) => setNovaPastaNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCriarPasta()}
              autoFocus
              style={{
                width: '100%', height: 40, padding: '0 12px',
                fontSize: 14, color: 'var(--text-primary)',
                background: 'var(--card-hover)',
                border: '1px solid var(--card-border)',
                borderRadius: 10, outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#FBB03B'}
              onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
            />
          </div>
          <DialogFooter>
            <button onClick={() => setIsNovaPastaOpen(false)} className="h-9 px-4 rounded-[10px] border border-(--card-border) text-[13px] text-(--text-secondary) hover:bg-(--card-hover) transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleCriarPasta}
              disabled={!novaPastaNome.trim() || criarPastaMut.isPending}
              className="btn-brand h-9 px-4 text-[13px]"
            >
              {criarPastaMut.isPending ? 'Criando...' : 'Criar pasta'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
