import * as React from 'react';
import { useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Search, 
  Plus, 
  Copy, 
  ExternalLink, 
  Pencil, 
  MoreVertical, 
  CheckCircle,
  Play,
  CopyPlus,
  Trash2,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { useLancamentos, usePublicarLancamento, useEncerrarLancamento, useDeletarLancamento } from '../../../hooks/useLancamentos';
import { useClientes } from '../../../hooks/useClientes';

import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../../../components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../../../components/ui/alert-dialog';

export default function DashboardsIndex() {
  const navigate = useNavigate();
  const { data: lancamentos, isLoading: isLancamentosLoading } = useLancamentos();
  const { data: clientes } = useClientes();
  
  const publicarMutation = usePublicarLancamento();
  const encerrarMutation = useEncerrarLancamento();
  const deletarMutation = useDeletarLancamento();
  // Duplicate mutation implementation not explicitly required for backend right now, 
  // but if needed, we'll wait for the next files. The prompt asks to have "Duplicar" in the menu.

  const [busca, setBusca] = React.useState('');
  const [filtroCliente, setFiltroCliente] = React.useState('todos');
  const [filtroStatus, setFiltroStatus] = React.useState('todos');
  
  const [lancamentoParaDeletar, setLancamentoParaDeletar] = React.useState<string | null>(null);

  const lancamentosFiltrados = React.useMemo(() => {
    if (!lancamentos) return [];
    
    return lancamentos.filter(lanc => {
      const matchBusca = lanc.nome?.toLowerCase().includes(busca.toLowerCase());
      const matchCliente = filtroCliente === 'todos' || lanc.cliente_id === filtroCliente;
      const matchStatus = filtroStatus === 'todos' || lanc.status === filtroStatus;
      
      return matchBusca && matchCliente && matchStatus;
    });
  }, [lancamentos, busca, filtroCliente, filtroStatus]);

  const copiarLink = (clienteSlug: string, lancamentoSlug: string) => {
    const url = `${window.location.origin}/dashboard/${clienteSlug}/${lancamentoSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const getCliente = (id: string | undefined) => {
    if (!id || !clientes) return null;
    return clientes.find(c => c.$id === id);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>;
      case 'encerrado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Encerrado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Rascunho</Badge>;
    }
  };

  const getTipoBadge = (tipo: string | undefined) => {
    switch (tipo) {
      case 'ambos':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Ambos</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Leads</Badge>;
    }
  };

  const confirmarExclusao = async () => {
    if (!lancamentoParaDeletar) return;
    try {
      await deletarMutation.mutateAsync(lancamentoParaDeletar);
      toast.success('Dashboard excluído com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir o dashboard');
    } finally {
      setLancamentoParaDeletar(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          </div>
          <p className="text-muted-foreground mt-1">Gerencie os dashboards dos seus clientes</p>
        </div>
        
        <Button onClick={() => navigate('/admin/dashboards/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo dashboard
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/50 p-4 border rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar lançamento..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes?.map(cliente => (
              <SelectItem key={cliente.$id} value={cliente.$id!}>{cliente.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Cards */}
      {isLancamentosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : lancamentosFiltrados?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LayoutDashboard className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum dashboard encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Você ainda não tem nenhum dashboard com os filtros selecionados, ou precisa criar seu primeiro.
          </p>
          <Button onClick={() => navigate('/admin/dashboards/novo')}>
            Criar primeiro dashboard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {lancamentosFiltrados?.map((lancamento) => {
              const cliente = getCliente(lancamento.cliente_id);
              
              return (
                <motion.div
                  key={lancamento.$id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full flex flex-col group overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        {getStatusBadge(lancamento.status)}
                        {getTipoBadge(lancamento.tipo)}
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-1" title={lancamento.nome}>
                        {lancamento.nome}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 text-sm font-medium">
                        {cliente?.nome || 'Cliente não encontrado'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 space-y-4">
                      {lancamento.status === 'ativo' && cliente?.slug && lancamento.slug && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <code className="text-xs flex-1 truncate text-muted-foreground mr-1">
                            /dashboard/{cliente.slug}/{lancamento.slug}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => copiarLink(cliente.slug!, lancamento.slug!)}
                            title="Copiar link do dashboard"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-1">
                        <span>Lançamento #{lancamento.$id?.substring(0, 8)}</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-4 bg-muted/20 gap-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => window.open(`/dashboard/${cliente?.slug}/${lancamento.slug}`, '_blank')}
                        disabled={lancamento.status === 'rascunho' || !cliente?.slug}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      
                      <Button 
                        variant="default"
                        className="flex-[0.5]"
                        onClick={() => navigate(`/admin/dashboards/${lancamento.$id}/editor`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0 w-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {lancamento.status === 'rascunho' && (
                            <DropdownMenuItem 
                              onClick={() => {
                                toast.promise(publicarMutation.mutateAsync(lancamento.$id!), {
                                  loading: 'Publicando...',
                                  success: 'Dashboard publicado com sucesso!',
                                  error: 'Erro ao publicar.'
                                });
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Publicar Agora
                            </DropdownMenuItem>
                          )}
                          
                          {lancamento.status === 'ativo' && (
                            <DropdownMenuItem 
                              onClick={() => {
                                toast.promise(encerrarMutation.mutateAsync(lancamento.$id!), {
                                  loading: 'Encerrando...',
                                  success: 'Dashboard encerrado!',
                                  error: 'Erro ao encerrar.'
                                });
                              }}
                            >
                              <StopCircle className="h-4 w-4 mr-2" />
                              Encerrar Dashboard
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => {
                            toast.info("Em breve: Duplicar dashboard");
                          }}>
                            <CopyPlus className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setLancamentoParaDeletar(lancamento.$id!)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* AlertDialog Delete */}
      <AlertDialog open={!!lancamentoParaDeletar} onOpenChange={(open) => !open && setLancamentoParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o 
              dashboard e interromperá qualquer coleta de leads do webhook!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, deletar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
