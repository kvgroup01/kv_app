import * as React from 'react';
import { useNavigate, Link } from 'react-router';
import { Plus, Copy, MoreVertical, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useOrcamentos, useAtualizarStatusOrcamento } from '../../../hooks/useOrcamentos';
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
import { fmtBRL, fmtDataString } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

export default function OrcamentosIndex() {
  const navigate = useNavigate();
  const { data: orcamentos, isLoading } = useOrcamentos();
  const updateStatusMut = useAtualizarStatusOrcamento();

  // Ordenação: mais recente primeiro
  const listaOrdenada = React.useMemo(() => {
    if (!orcamentos) return [];
    return [...orcamentos].sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
  }, [orcamentos]);

  const handleCopyLink = (token: string) => {
    const url = `\${import.meta.env.VITE_APP_URL || window.location.origin}/orcamento/\${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do orçamento copiado para área de transferência!');
  };

  const handleChangeStatus = (id: string, status: 'pendente' | 'pago' | 'cancelado') => {
    updateStatusMut.mutate({ id, status }, {
      onSuccess: () => {
        toast.success(`Status foi atualizado para \${status}.`);
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
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-white/5 text-(--text-tertiary)">Cancelado</span>;
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
        <Button onClick={() => navigate('/admin/orcamentos/novo')} className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 h-10 px-6 rounded-lg text-[13px] font-medium">
          <Plus className="mr-2 h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] overflow-hidden shadow-premium">
        {!isLoading && listaOrdenada.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 py-24 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-(--text-tertiary)" />
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <DropdownMenuItem onClick={() => window.open(`/orcamento/\${orcamento.token}`, '_blank')} className="cursor-pointer hover:bg-(--card-hover)">
                                <Eye className="mr-2 h-4 w-4 text-(--text-tertiary)" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-(--card-border)" />
                              {orcamento.status !== 'pago' && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(orcamento.$id, 'pago')} className="cursor-pointer hover:bg-(--card-hover)">
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              {orcamento.status !== 'cancelado' && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(orcamento.$id, 'cancelado')} className="cursor-pointer hover:bg-(--card-hover)">
                                  <XCircle className="mr-2 h-4 w-4 text-(--text-tertiary)" /> Cancelar
                                </DropdownMenuItem>
                              )}
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
    </div>
  );
}

// Adding missing icon since not exported at the top
import { FileText } from 'lucide-react';
