import * as React from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus } from 'lucide-react';

import { useClientes, usePastas, useDeletarCliente, useAtualizarCliente } from '../../../hooks/useClientes';
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

  const isLoading = loadingClientes || loadingPastas;

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
      data: { pasta_id: pastaDestino === 'sem-pasta' ? undefined : pastaDestino } 
    }, {
      onSuccess: () => {
        setClienteToMove(null);
        setPastaDestino('');
      }
    });
  };

  return (
    <div className="space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)">Meus Clientes</h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Gerencie seus painéis e base de clientes.</p>
        </div>
        <Button onClick={() => navigate('/admin/clientes/novo')} className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 h-10 px-6 rounded-lg text-[13px] font-medium">
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
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
              </span>
            ))}
         </div>
      )}

      {/* Grid de Clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {Array.from({length: 6}).map((_, i) => (
             <Skeleton key={i} className="h-48 w-full rounded-xl" />
           ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
             <ClienteCard 
               key={cliente.$id} 
               cliente={cliente}
               onEditar={() => navigate(`/admin/clientes/\${cliente.$id}`)}
               onDeletar={() => setClienteToDelete(cliente)}
               onMoverPasta={() => setClienteToMove(cliente)}
             />
          ))}
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
    </div>
  );
}
