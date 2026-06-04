import * as React from 'react';
import { useNavigate, Link } from 'react-router';
import { Plus, Copy, MoreVertical, Eye, CircleCheck, XCircle, Trash2, FileText, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

import { useOrcamentos, useAtualizarStatusOrcamento, useDeletarOrcamento } from '../../../hooks/useOrcamentos';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../components/ui/dropdown-menu';
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
import { fmtBRL, fmtDataString } from '../../../lib/utils';
import { CONFIG } from '../../../lib/constants';
import { cn } from '../../../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { Separator } from '../../../components/ui/separator';
import { supabase } from '../../../lib/supabase';

export default function OrcamentosIndex() {
  const navigate = useNavigate();
  const { data: orcamentos, isLoading } = useOrcamentos();
  const updateStatusMut = useAtualizarStatusOrcamento();
  const deletarMut = useDeletarOrcamento();

  const [orcamentoToDelete, setOrcamentoToDelete] = React.useState<string | null>(null);

  const [detalhesOrcamento, setDetalhesOrcamento] = React.useState<any | null>(null);
  const [pagamento, setPagamento] = React.useState<any | null>(null);
  const [loadingPagamento, setLoadingPagamento] = React.useState(false);

  const handleVerDetalhes = async (orcamento: any) => {
    setDetalhesOrcamento(orcamento);
    setPagamento(null);
    setLoadingPagamento(true);
    try {
      const { data } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('orcamento_id', orcamento.$id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .single();
      setPagamento(data);
    } catch {
      setPagamento(null);
    } finally {
      setLoadingPagamento(false);
    }
  };

  // Ordenação: mais recente primeiro
  const listaOrdenada = React.useMemo(() => {
    if (!orcamentos) return [];
    return [...orcamentos].sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
  }, [orcamentos]);

  const handleCopyLink = (token: string) => {
    const domain = CONFIG.APP_URL;
    const url = `${domain}/orcamento/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do orçamento copiado para área de transferência!');
  };

  const handleChangeStatus = (id: string, status: 'pendente' | 'pago' | 'cancelado') => {
    updateStatusMut.mutate({ id, status }, {
      onSuccess: () => {
        toast.success(`Status foi atualizado para ${status}.`);
      }
    });
  };

  const handleDeletar = (id: string) => {
    deletarMut.mutate(id, {
      onSuccess: () => {
        toast.success('Orçamento excluído com sucesso!');
        setOrcamentoToDelete(null);
      },
      onError: () => {
        toast.error('Erro ao excluir orçamento.');
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-emerald-500/10 text-emerald-500">Pago</span>;
      case 'pendente':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-amber-500/10 text-amber-500">Pendente</span>;
      case 'cancelado':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-white dark:bg-[#1c1c1e]/5 text-(--text-tertiary)">Cancelado</span>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-12">
        <Skeleton className="h-20 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-(--text-primary)">Orçamentos</h2>
          <p className="text-[13px] text-(--text-secondary) mt-1">Gere propostas comerciais e envie links de pagamento.</p>
        </div>
        <Button onClick={() => navigate('/admin/orcamentos/novo')} className="w-full sm:w-auto bg-[#FBB03B] hover:bg-[#f0a830] text-black h-10 px-6 rounded-lg text-[13px] font-medium">
          <Plus className="mr-2 h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] overflow-hidden shadow-premium">
        {!isLoading && listaOrdenada.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 py-24 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">Nenhum orçamento</h3>
            <p className="text-(--text-secondary) text-[13px] mb-8 max-w-sm">Voce ainda não gerou propostas ou links de cobrança.</p>
            <Button onClick={() => navigate('/admin/orcamentos/novo')} variant="outline" className="border-(--card-border) hover:bg-[#1a1a1a]">Criar primeiro orçamento</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-(--card-border)">
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12 px-6">Data</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12">Qtd. Itens</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12">Valor Total</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12 w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaOrdenada.map((orcamento) => {
                  const parsedItens = typeof orcamento.itens === 'string' ? JSON.parse(orcamento.itens) : orcamento.itens;
                  const itemsCount = Array.isArray(parsedItens) ? parsedItens.length : 0;

                  return (
                    <TableRow key={orcamento.$id} className="hover:bg-(--card-hover) border-b border-(--card-border) transition-colors group">
                      <TableCell className="px-6 py-4 text-[11px] text-(--text-tertiary) font-medium">
                        {fmtDataString(orcamento.$createdAt)}
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-medium text-(--text-primary)">{orcamento.cliente_nome}</TableCell>
                      <TableCell className="py-4 text-[13px] text-(--text-secondary)">{itemsCount} itens</TableCell>
                      <TableCell className="py-4 text-[13px] font-semibold text-(--text-primary)">{fmtBRL(orcamento.valor_total)}</TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(orcamento.status)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Copiar Link" className="h-8 w-8 text-(--text-tertiary) hover:text-(--text-primary)" onClick={() => handleCopyLink(orcamento.token)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-(--text-tertiary) hover:text-(--text-primary)" disabled={updateStatusMut.isPending}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-(--card-bg) border-(--card-border) text-(--text-primary)">
                              <DropdownMenuItem onClick={() => handleVerDetalhes(orcamento)} className="cursor-pointer hover:bg-(--card-hover)">
                                <Eye className="mr-2 h-4 w-4 text-(--text-tertiary)" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-(--card-border)" />
                              {orcamento.status !== 'pago' && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(orcamento.$id, 'pago')} className="cursor-pointer hover:bg-(--card-hover)">
                                  <CircleCheck className="mr-2 h-4 w-4 text-emerald-500" /> Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              {orcamento.status !== 'cancelado' && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(orcamento.$id, 'cancelado')} className="cursor-pointer hover:bg-(--card-hover)">
                                  <XCircle className="mr-2 h-4 w-4 text-(--text-tertiary)" /> Cancelar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-(--card-border)" />
                              <DropdownMenuItem 
                                onSelect={() => setOrcamentoToDelete(orcamento.$id)} 
                                className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Orçamento
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!orcamentoToDelete} onOpenChange={(open) => !open && setOrcamentoToDelete(null)}>
        <AlertDialogContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription className="text-(--text-secondary)">
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-(--card-border) hover:bg-white dark:bg-[#1c1c1e]/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => orcamentoToDelete && handleDeletar(orcamentoToDelete)}
              className="bg-red-500 text-white hover:bg-red-600 border-none"
              disabled={deletarMut.isPending}
            >
              {deletarMut.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!detalhesOrcamento} onOpenChange={(open) => !open && setDetalhesOrcamento(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detalhesOrcamento && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg font-semibold">Detalhes do Orçamento</SheetTitle>
              </SheetHeader>

              {/* Informações do orçamento */}
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-widest">Proposta</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-(--text-secondary)">Cliente</span>
                      <span className="font-medium text-(--text-primary)">{detalhesOrcamento.cliente_nome}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-(--text-secondary)">Emissão</span>
                      <span className="font-medium text-(--text-primary)">{fmtDataString(detalhesOrcamento.$createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-(--text-secondary)">Valor total</span>
                      <span className="font-semibold text-(--text-primary)">{fmtBRL(detalhesOrcamento.valor_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-(--text-secondary)">Status</span>
                      <span>{getStatusBadge(detalhesOrcamento.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Itens */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-widest">Itens</p>
                  {(() => {
                    const itens = typeof detalhesOrcamento.itens === 'string'
                      ? JSON.parse(detalhesOrcamento.itens)
                      : detalhesOrcamento.itens;
                    return (Array.isArray(itens) ? itens : []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm py-2 border-b border-(--card-border)">
                        <span className="text-(--text-primary) max-w-[60%]">{item.descricao}</span>
                        <span className="text-(--text-secondary)">{item.quantidade}x · {fmtBRL(item.quantidade * item.valor_unitario)}</span>
                      </div>
                    ));
                  })()}
                </div>

                <Separator />

                {/* Pagamento */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-widest">Pagamento</p>
                  {loadingPagamento ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : pagamento ? (
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-(--text-secondary)">Data do pagamento</span>
                        <span className="font-medium text-(--text-primary)">
                          {new Date(pagamento.criado_em).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-(--text-secondary)">Método</span>
                        <span className="font-medium text-(--text-primary) uppercase">{pagamento.metodo || 'PIX'}</span>
                      </div>
                      {pagamento.observacao && (
                        <div className="text-sm">
                          <span className="text-(--text-secondary) block mb-1">Observação do cliente</span>
                          <p className="text-(--text-primary) bg-muted/50 rounded-lg p-2 text-[13px]">{pagamento.observacao}</p>
                        </div>
                      )}
                      {pagamento.comprovante_url && (
                        <div className="pt-2 space-y-2">
                          <p className="text-[11px] font-semibold text-(--text-tertiary) uppercase tracking-widest">Comprovante</p>
                          {pagamento.comprovante_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <img
                              src={pagamento.comprovante_url}
                              alt="Comprovante"
                              className="w-full rounded-xl border border-(--card-border) object-cover max-h-64"
                            />
                          ) : null}
                          <a
                            href={pagamento.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#FBB03B] hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir comprovante
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-(--text-tertiary) italic">Nenhum pagamento registrado ainda.</p>
                  )}
                </div>

                <Separator />

                {/* Link do orçamento */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(`/orcamento/${detalhesOrcamento.token}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver proposta completa
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Removing manual import as added to top
