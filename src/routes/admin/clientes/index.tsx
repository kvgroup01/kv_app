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
    deletarMut.mutate(clienteToDelete.$id, {
      onSuccess: () => setClienteToDelete(null)
    });
  };

  const handleMover = () => {
    if (!clienteToMove) return;
    atualizarMut.mutate({ 
      id: clienteToMove.$id, 
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
    <div className="space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)">Meus Clientes</h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Gerencie seus painéis e base de clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#141414] border border-(--card-border) rounded-lg p-1 mr-2 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded", viewMode === 'folders' ? "bg-white text-black hover:bg-white" : "text-(--text-tertiary)")}
              onClick={() => setViewMode('folders')}
              title="Visão por Pastas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded", viewMode === 'grid' ? "bg-white text-black hover:bg-white" : "text-(--text-tertiary)")}
              onClick={() => setViewMode('grid')}
              title="Grade Simples"
            >
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsNovaPastaOpen(true)} 
            className="border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 h-10 px-4 rounded-lg text-[13px]"
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
          <Button onClick={() => navigate('/admin/clientes/novo')} className="bg-white text-black hover:bg-zinc-200 h-10 px-6 rounded-lg text-[13px] font-medium">
            <Plus className="mr-2 h-4 w-4" /> Novo cliente
          </Button>
        </div>
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#141414] p-2 rounded-xl border border-(--card-border) shadow-premium">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--text-tertiary)" />
          <Input 
            placeholder="Buscar por nome..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-[13px] h-10 text-(--text-primary)" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="h-6 w-px bg-(--card-border) hidden sm:block" />

        <Select value={pastaFilter} onValueChange={setPastaFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-transparent border-none focus:ring-0 text-[13px] h-10 text-(--text-secondary)">
            <SelectValue placeholder="Filtrar por pasta" />
          </SelectTrigger>
          <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <SelectItem value="todas">Todas as pastas</SelectItem>
            <SelectItem value="sem-pasta">Sem pasta</SelectItem>
            {pastas?.map((p: any) => (
              <SelectItem key={p.$id} value={p.$id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-(--card-border) hidden sm:block" />

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-transparent border-none focus:ring-0 text-[13px] h-10 text-(--text-secondary)">
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

      {/* Pastas Chips Rápidos */}
      {!isLoading && pastas && pastas.length > 0 && (
         <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-medium text-(--text-tertiary) mr-2 uppercase tracking-wider">Pastas:</span>
            <span 
              className={cn(
                "px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-all border uppercase tracking-tight",
                pastaFilter === 'todas' ? "bg-white text-black border-white" : "text-(--text-secondary) border-(--card-border) hover:border-(--text-tertiary)"
              )}
              onClick={() => setPastaFilter('todas')}
            >
              Todas
            </span>
            {pastas.map((p: any) => (
              <span 
                key={p.$id}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-all border uppercase tracking-tight",
                  pastaFilter === p.$id ? "bg-white text-black border-white" : "text-(--text-secondary) border-(--card-border) hover:border-(--text-tertiary)"
                )}
                onClick={() => setPastaFilter(p.$id)}
              >
                {p.nome}
                <Trash2 
                  className="ml-2 h-3 w-3 text-red-500/50 hover:text-red-500 cursor-pointer" 
                  onClick={(e) => handleDeletarPasta(e, p.$id)}
                />
              </span>
            ))}
         </div>
      )}

      {/* Lista de Pastas/Clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {Array.from({length: 6}).map((_, i) => (
             <Skeleton key={i} className="h-48 w-full rounded-xl" />
           ))}
        </div>
      ) : Object.keys(groupedClientes).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 py-24 text-center bg-muted/10 rounded-xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Não encontramos nenhum cliente correspondente aos seus filtros atuais.
          </p>
          <Button variant="outline" onClick={() => { setBusca(''); setPastaFilter('todas'); setTipoFilter('todos'); }}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Ordenamos as pastas: primeiro as reais, depois "sem pasta" */}
          {[...(pastas || []).map(p => p.$id), 'sem-pasta']
            .filter(id => groupedClientes[id] && groupedClientes[id].length > 0)
            .map((id) => {
              const pasta = pastas?.find(p => p.$id === id);
              const clients = groupedClientes[id];
              const isCollapsed = collapsedPastas[id] || false;
              const nomePasta = pasta?.nome || 'Clientes Sem Pasta';
              
              if (viewMode === 'grid') {
                return clients.map(cliente => (
                  <ClienteCard 
                    key={cliente.$id} 
                    cliente={cliente}
                    onEditar={() => navigate(`/admin/clientes/${cliente.$id}`)}
                    onDeletar={() => setClienteToDelete(cliente)}
                    onMoverPasta={() => setClienteToMove(cliente)}
                  />
                ));
              }

              return (
                <div key={id} className="group/pasta space-y-4">
                  {/* Folder Tab-like Header */}
                  <div 
                    className="relative flex items-center justify-between bg-(--card-bg) hover:bg-(--card-bg)/80 p-4 py-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border-l-4 border-l-blue-500 border border-(--card-border) cursor-pointer transition-all shadow-sm"
                    onClick={() => toggleFolder(id)}
                  >
                    {/* Folder Tab Notch */}
                    <div className="absolute -top-3 left-0 h-3 w-24 bg-(--card-bg) border-t border-l border-r border-(--card-border) rounded-t-lg hidden sm:block" />
                    
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner",
                        id === 'sem-pasta' ? "text-zinc-500" : "text-blue-500"
                      )}>
                        {isCollapsed ? <Folder className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-(--text-primary) tracking-tight">{nomePasta}</h3>
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none rounded-full px-3 text-[11px] font-bold">
                            {clients.length} {clients.length === 1 ? 'PAINEL' : 'PAINÉIS'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                           {id !== 'sem-pasta' && (
                             <Trash2 
                                className="h-3.5 w-3.5 text-red-500/0 group-hover/pasta:text-red-500/60 hover:text-red-500 transition-all cursor-pointer" 
                                onClick={(e) => handleDeletarPasta(e, id)}
                              />
                           )}
                           <span className="text-[10px] text-(--text-tertiary) font-semibold uppercase tracking-widest flex items-center gap-1">
                              {isCollapsed ? 'Clique para expandir' : 'Clique para recolher'}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="h-8 w-px bg-(--card-border) mx-2 hidden sm:block" />
                       {isCollapsed ? (
                         <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/5">
                            <ChevronRight className="h-5 w-5 text-(--text-tertiary)" />
                         </div>
                       ) : (
                         <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                            <ChevronDown className="h-5 w-5 text-blue-500" />
                         </div>
                       )}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 pb-12 px-2">
                          {clients.map((cliente) => (
                             <ClienteCard 
                               key={cliente.$id} 
                               cliente={cliente}
                               onEditar={() => navigate(`/admin/clientes/${cliente.$id}`)}
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
            })
          }
        </div>
      )}

      {/* Alertas e Modais (Fora do DOM visual normal) */}
      <AlertDialog open={!!clienteToDelete} onOpenChange={(open) => !open && setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem absoluta certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Excluirá permanentemente o cliente 
              <strong> {clienteToDelete?.nome}</strong> e os dados salvos em cache na base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletarMut.isPending ? 'Deletando...' : 'Excluir Cliente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!clienteToMove} onOpenChange={(open) => !open && setClienteToMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para pasta</DialogTitle>
            <DialogDescription>
              Selecione a pasta destino para <strong>{clienteToMove?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Select value={pastaDestino} onValueChange={setPastaDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-pasta">Remover da pasta (Nenhuma)</SelectItem>
                  {pastas?.map((p: any) => (
                    <SelectItem key={p.$id} value={p.$id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteToMove(null)}>Cancelar</Button>
            <Button onClick={handleMover} disabled={atualizarMut.isPending || !pastaDestino}>
              {atualizarMut.isPending ? 'Movendo...' : 'Mover Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNovaPastaOpen} onOpenChange={setIsNovaPastaOpen}>
        <DialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
            <DialogDescription>
              Organize seus clientes em categorias ou grupos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Nome da pasta..." 
              value={novaPastaNome}
              onChange={(e) => setNovaPastaNome(e.target.value)}
              className="bg-black/20 border-(--card-border)"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNovaPastaOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleCriarPasta} 
              disabled={!novaPastaNome.trim() || criarPastaMut.isPending}
              className="bg-(--accent-blue) text-white hover:bg-blue-600"
            >
              {criarPastaMut.isPending ? 'Criando...' : 'Criar Pasta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
