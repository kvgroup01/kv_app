import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { FileText, DollarSign, Activity, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { useOrcamentos } from '../../../hooks/useOrcamentos';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { DateRangePicker } from '../../../components/shared/DateRangePicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { fmtBRL, fmtDataString } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

export default function FinanceiroIndex() {
  const { data: orcamentos, isLoading } = useOrcamentos();
  
  // Filtros
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [statusFilter, setStatusFilter] = React.useState<string>('todos');

  // Cálculos de Resumo (Cards baseados no Mês Atual)
  const { rcbMes, aguardando, criadosMes } = React.useMemo(() => {
    if (!orcamentos) return { rcbMes: 0, aguardando: 0, criadosMes: 0 };
    
    const now = new Date();
    const isThisMonth = (d: string) => {
      const date = new Date(d);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const rcb = orcamentos.filter(o => o.status === 'pago' && isThisMonth(o.$updatedAt || o.$createdAt)).reduce((acc, o) => acc + o.valor_total, 0);
    const aguarda = orcamentos.filter(o => o.status === 'pendente').reduce((acc, o) => acc + o.valor_total, 0);
    const criados = orcamentos.filter(o => isThisMonth(o.$createdAt)).length;
    
    return { rcbMes: rcb, aguardando: aguarda, criadosMes: criados };
  }, [orcamentos]);

  // Filtragem da Lista Principal
  const pagamentosFiltrados = React.useMemo(() => {
    if (!orcamentos) return [];
    
    return orcamentos.filter(o => {
      // Regra 1: Status
      if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
      
      // Regra 2: Data (dentro do DateRangePicker)
      if (dateRange?.from && dateRange?.to) {
        const itemDate = new Date(o.$createdAt);
        // Reseta as horas pra evitar offset
        itemDate.setHours(0,0,0,0);
        return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
      } else if (dateRange?.from) {
        const itemDate = new Date(o.$createdAt);
        return itemDate >= dateRange.from;
      }
      
      return true;
    }).sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()); // Decrescente
    
  }, [orcamentos, statusFilter, dateRange]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-emerald-500/10 text-emerald-500">Confirmado</span>;
      case 'pendente':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-amber-500/10 text-amber-500">Pendente</span>;
      case 'cancelado':
        return <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-white/5 text-(--text-tertiary)">Cancelado</span>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-[22px] font-semibold text-(--text-primary)">Financeiro</h2>
        <p className="text-[13px] text-(--text-secondary) mt-1">Acompanhamento e conferência de fluxos de caixa.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
           {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[12px]" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
            <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-green) rounded-full" />
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Total Recebido (Mês)</span>
              <DollarSign className="h-[18px] w-[18px] text-(--accent-green)" />
            </div>
            <div className="text-[32px] font-semibold text-(--text-primary)">{fmtBRL(rcbMes)}</div>
            <p className="text-[13px] text-(--text-tertiary) mt-1">Valores já liquidados</p>
          </div>

          <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
            <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-amber) rounded-full" />
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Aguardando Pagamento</span>
              <Activity className="h-[18px] w-[18px] text-(--accent-amber)" />
            </div>
            <div className="text-[32px] font-semibold text-(--text-primary)">{fmtBRL(aguardando)}</div>
            <p className="text-[13px] text-(--text-tertiary) mt-1">Pendências em aberto</p>
          </div>

          <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
            <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Orçamentos Criados</span>
              <FileText className="h-[18px] w-[18px] text-(--accent-blue)" />
            </div>
            <div className="text-[32px] font-semibold text-(--text-primary)">{criadosMes}</div>
            <p className="text-[13px] text-(--text-tertiary) mt-1">Volume de propostas no mês</p>
          </div>
        </div>
      )}

      {/* Toolbar e Filtros da Tabela */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] p-2 rounded-xl border border-(--card-border) shadow-premium">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-transparent border-none focus:ring-0 text-[13px] h-10 text-(--text-secondary)">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent className="bg-(--card-bg) border-(--card-border) text-(--text-primary)">
              <SelectItem value="todos">Todos os Orçamentos</SelectItem>
              <SelectItem value="pago">Status: Confirmado</SelectItem>
              <SelectItem value="pendente">Status: Pendente</SelectItem>
              <SelectItem value="cancelado">Status: Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="h-6 w-px bg-(--card-border) hidden sm:block" />
          <div className="w-full sm:w-auto">
            <DateRangePicker value={dateRange} onChange={setDateRange} className="bg-transparent border-none focus:ring-0 h-10 text-[13px] text-(--text-secondary)" />
          </div>
        </div>
      </div>

      <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] overflow-hidden shadow-premium">
        {isLoading ? (
          <div className="p-6 space-y-4">
             {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : pagamentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 py-24 text-center">
            <DollarSign className="h-12 w-12 text-(--text-tertiary) opacity-20 mb-4" />
            <p className="text-lg font-medium text-(--text-primary)">Nenhum pagamento encontrado</p>
            <p className="text-[13px] text-(--text-secondary)">Tente remover filtros ou pesquisar por outro período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-(--card-border)">
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12 px-6">Data</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12 max-w-[250px]">Resumo de Serviços</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12">Valor Total</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-12 w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentosFiltrados.map((orcamento) => {
                  const parsedItens = typeof orcamento.itens === 'string' ? JSON.parse(orcamento.itens) : orcamento.itens;
                  const servicosResumo = Array.isArray(parsedItens) 
                    ? parsedItens.map((i: any) => i.descricao).join(', ') 
                    : 'Itens de serviço';

                  return (
                    <TableRow key={orcamento.$id} className="hover:bg-(--card-hover) border-b border-(--card-border) transition-all group">
                      <TableCell className="px-6 py-4 text-[11px] text-(--text-tertiary) font-medium">
                        {fmtDataString(orcamento.$createdAt)}
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-medium text-(--text-primary)">{orcamento.cliente_nome}</TableCell>
                      <TableCell className="py-4 max-w-[250px] truncate text-(--text-secondary) text-[13px]" title={servicosResumo}>
                        {servicosResumo}
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-bold text-(--text-primary)">
                        {fmtBRL(orcamento.valor_total)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(orcamento.status)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        {orcamento.comprovante_url && orcamento.status === 'pago' && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Ver Comprovante" className="h-8 w-8 text-(--text-tertiary) hover:text-(--text-primary) hover:bg-[#1a1a1a]">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-(--card-bg) border-(--card-border) text-(--text-primary) shadow-premium">
                                <DialogHeader>
                                  <DialogTitle>Comprovante de Pagamento</DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center justify-center p-4 bg-black/40 border border-(--card-border) rounded-md">
                                   <img 
                                     src={orcamento.comprovante_url} 
                                     alt="Comprovante" 
                                     className="max-h-[70vh] object-contain rounded shadow"
                                   />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                   <Button variant="outline" className="border-(--card-border) hover:bg-[#1a1a1a]" onClick={() => window.open(orcamento.comprovante_url, '_blank')}>
                                      <ExternalLink className="w-4 h-4 mr-2" /> Abrir Original
                                   </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
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
