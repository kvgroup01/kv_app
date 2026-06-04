import * as React from "react";
import { useNavigate } from "react-router";
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
  StopCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import {
  useLancamentos,
  usePublicarLancamento,
  useEncerrarLancamento,
  useDeletarLancamento,
} from "../../../hooks/useLancamentos";
import { useClientes } from "../../../hooks/useClientes";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";

export default function DashboardsIndex() {
  const navigate = useNavigate();
  const { data: lancamentos, isLoading: isLancamentosLoading } =
    useLancamentos();
  const { data: clientes } = useClientes();

  const publicarMutation = usePublicarLancamento();
  const encerrarMutation = useEncerrarLancamento();
  const deletarMutation = useDeletarLancamento();
  // Duplicate mutation implementation not explicitly required for backend right now,
  // but if needed, we'll wait for the next files. The prompt asks to have "Duplicar" in the menu.

  const [busca, setBusca] = React.useState("");
  const [filtroCliente, setFiltroCliente] = React.useState("todos");
  const [filtroStatus, setFiltroStatus] = React.useState("todos");

  const [lancamentoParaDeletar, setLancamentoParaDeletar] = React.useState<
    string | null
  >(null);

  const lancamentosFiltrados = React.useMemo(() => {
    if (!lancamentos) return [];

    return lancamentos.filter((lanc) => {
      const matchBusca = lanc.nome?.toLowerCase().includes(busca.toLowerCase());
      const matchCliente =
        filtroCliente === "todos" || lanc.cliente_id === filtroCliente;
      const matchStatus =
        filtroStatus === "todos" || lanc.status === filtroStatus;

      return matchBusca && matchCliente && matchStatus;
    });
  }, [lancamentos, busca, filtroCliente, filtroStatus]);

  const copiarLink = (clienteSlug: string, lancamentoSlug: string) => {
    const url = `${window.location.origin}/dashboard/${clienteSlug}/${lancamentoSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const getCliente = (id: string | undefined) => {
    if (!id || !clientes) return null;
    return clientes.find((c) => c.$id === id);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "ativo":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            Ativo
          </Badge>
        );
      case "encerrado":
      case "finalizado":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            Finalizado
          </Badge>
        );
      case "pausado":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Pausado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Rascunho
          </Badge>
        );
    }
  };

  const getTipoBadge = (tipo: string | undefined) => {
    switch (tipo) {
      case "ambos":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20"
          >
            Ambos
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            Leads
          </Badge>
        );
    }
  };

  const confirmarExclusao = async () => {
    if (!lancamentoParaDeletar) return;
    try {
      await deletarMutation.mutateAsync(lancamentoParaDeletar);
      toast.success("Dashboard excluído com sucesso");
    } catch (err) {
      toast.error("Erro ao excluir o dashboard");
    } finally {
      setLancamentoParaDeletar(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>
            Dashboards
          </h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Gerencie os dashboards dos seus clientes</p>
        </div>
        <Button onClick={() => navigate('/admin/dashboards/novo')} className="btn-brand h-9 px-4 text-[13px] rounded-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo dashboard
        </Button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-2 bg-(--card-bg) border border-(--card-border) rounded-[12px] p-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--text-tertiary)" />
          <Input
            placeholder="Buscar lançamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 bg-transparent border-none focus-visible:ring-0 text-[13px] text-(--text-primary) placeholder:text-(--text-tertiary)"
          />
        </div>
        <div className="w-px bg-(--card-border) hidden sm:block self-stretch my-1" />
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 bg-transparent border-none focus:ring-0 text-[13px] text-(--text-secondary)">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes?.map((c) => (
              <SelectItem key={c.$id} value={c.$id!}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px bg-(--card-border) hidden sm:block self-stretch my-1" />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 bg-transparent border-none focus:ring-0 text-[13px] text-(--text-secondary)">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ── */}
      {isLancamentosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-[14px]" />
          ))}
        </div>
      ) : lancamentosFiltrados.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed bg-(--card-bg) border-(--card-border) rounded-[14px]">
          <div className="w-14 h-14 bg-(--card-hover) border border-(--card-border) rounded-full flex items-center justify-center mb-4">
            <LayoutDashboard className="h-6 w-6 text-(--text-tertiary)" />
          </div>
          <h3 className="text-[15px] font-semibold text-(--text-primary) mb-1">Nenhum dashboard encontrado</h3>
          <p className="text-[13px] text-(--text-tertiary) max-w-xs mb-6">
            Crie seu primeiro dashboard ou ajuste os filtros.
          </p>
          <Button onClick={() => navigate('/admin/dashboards/novo')} className="btn-brand h-9 px-4 text-[13px] rounded-full">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar dashboard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {lancamentosFiltrados.map((lancamento) => {
              const cliente = getCliente(lancamento.cliente_id);
              return (
                <motion.div
                  key={lancamento.$id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full flex flex-col group bg-(--card-bg) border border-(--card-border) rounded-[14px] overflow-hidden hover:border-[#FBB03B]/30 transition-all">
                    <CardHeader className="pb-3 px-5 pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(lancamento.status)}
                          {getTipoBadge(lancamento.tipo)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover) opacity-0 group-hover:opacity-100 transition-all rounded-[7px]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                            {lancamento.status === 'rascunho' && (
                              <DropdownMenuItem className="cursor-pointer hover:bg-(--card-hover)" onClick={() => {
                                toast.promise(publicarMutation.mutateAsync(lancamento.$id!), {
                                  loading: 'Publicando...', success: 'Dashboard publicado!', error: 'Erro ao publicar.',
                                });
                              }}>
                                <Play className="h-4 w-4 mr-2 text-green-500" /> Publicar agora
                              </DropdownMenuItem>
                            )}
                            {lancamento.status === 'ativo' && (
                              <DropdownMenuItem className="cursor-pointer hover:bg-(--card-hover)" onClick={() => {
                                toast.promise(encerrarMutation.mutateAsync(lancamento.$id!), {
                                  loading: 'Encerrando...', success: 'Dashboard encerrado!', error: 'Erro ao encerrar.',
                                });
                              }}>
                                <StopCircle className="h-4 w-4 mr-2 text-blue-500" /> Encerrar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer hover:bg-(--card-hover)" onClick={() => toast.info('Em breve: Duplicar dashboard')}>
                              <CopyPlus className="h-4 w-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-(--card-border)" />
                            <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10" onClick={() => setLancamentoParaDeletar(lancamento.$id!)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-[15px] font-semibold text-(--text-primary) truncate leading-snug" style={{ letterSpacing: '-0.2px' }} title={lancamento.nome}>
                        {lancamento.nome}
                      </CardTitle>
                      <CardDescription className="text-[12px] text-(--text-tertiary) truncate">
                        {cliente?.nome || 'Cliente não encontrado'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 px-5 pb-0">
                      {lancamento.status === 'ativo' && cliente?.slug && lancamento.slug && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-(--card-hover) rounded-[8px] border border-(--card-border)">
                          <code className="text-[11px] text-(--text-tertiary) flex-1 truncate">
                            /dashboard/{cliente.slug}/{lancamento.slug}
                          </code>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-(--text-tertiary) hover:text-(--text-primary) p-0" onClick={() => copiarLink(cliente.slug!, lancamento.slug!)} title="Copiar link">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="px-5 py-3 mt-4 border-t border-(--card-border) bg-(--card-hover)/30 gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-8 text-[12px] border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-hover) rounded-[8px]"
                        onClick={() => window.open(`/dashboard/${cliente?.slug}/${lancamento.slug}`, '_blank')}
                        disabled={lancamento.status === 'rascunho' || !cliente?.slug}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver
                      </Button>
                      <Button
                        className="flex-1 h-8 text-[12px] bg-[#FBB03B] hover:bg-[#f5a623] text-black rounded-[8px] border-none"
                        onClick={() => navigate(`/admin/dashboards/${lancamento.$id}/editor`)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── AlertDialog ── */}
      <AlertDialog open={!!lancamentoParaDeletar} onOpenChange={(open) => !open && setLancamentoParaDeletar(null)}>
        <AlertDialogContent className="bg-(--card-bg) border-(--card-border)">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-(--text-primary)">Excluir dashboard?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--text-secondary)">
              Esta ação não pode ser desfeita. O dashboard será removido permanentemente e a coleta de leads será interrompida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-(--card-border) text-(--text-secondary)">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-500 hover:bg-red-600 text-white border-none">
              {deletarMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
