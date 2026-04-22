import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Copy, ExternalLink, Activity, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';

import { useClientes } from '../../hooks/useClientes';
import { useOrcamentos } from '../../hooks/useOrcamentos';
import { fmtBRL, fmtDataString } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function AdminIndex() {
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentos();

  const isDataLoading = loadingClientes || loadingOrcamentos;

  // Cálculos do Painel Superior
  const clientesAtivos = React.useMemo(() => {
    if (!clientes) return 0;
    return clientes.filter(c => c.ativo).length;
  }, [clientes]);

  const orcamentosPendentes = React.useMemo(() => {
    if (!orcamentos) return 0;
    return orcamentos.filter(o => o.status === 'pendente').length;
  }, [orcamentos]);

  const { faturamentoMes, pagamentosRecentes } = React.useMemo(() => {
    if (!orcamentos) return { faturamentoMes: 0, pagamentosRecentes: 0 };
    
    const now = new Date();
    const isThisMonth = (dateString: string) => {
      const d = new Date(dateString);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const confirmadosDoMes = orcamentos.filter(o => o.status === 'pago' && isThisMonth(o.$updatedAt || o.$createdAt));
    
    const fat_mes = confirmadosDoMes.reduce((acc, o) => acc + o.valor_total, 0);

    return { faturamentoMes: fat_mes, pagamentosRecentes: confirmadosDoMes.length };
  }, [orcamentos]);

  // View Mocks/Helpers limiters
  const topClientesRecentes = clientes ? [...clientes].sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()).slice(0, 5) : [];
  const topOrcamentosPendentes = orcamentos ? [...orcamentos].filter(o => o.status === 'pendente').sort((a,b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()).slice(0, 5) : [];

  const handleCopyLink = (slug: string) => {
    const url = `\${import.meta.env.VITE_APP_URL || window.location.origin}/dashboard/\${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do dashboard copiado!');
  };

  if (isDataLoading) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
           <Skeleton className="h-[400px] w-full" />
           <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-[22px] font-semibold text-(--text-primary)">Visão Geral</h2>
        <p className="text-[13px] text-(--text-secondary) mt-1">Monitore o desempenho e métricas em tempo real</p>
      </div>
      
      {/* Cards Superiores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Clientes Ativos */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-blue) rounded-full" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Clientes Ativos</span>
            <Activity className="h-[18px] w-[18px] text-(--accent-blue)" />
          </div>
          <div className="text-[32px] font-semibold text-(--text-primary)">{clientesAtivos}</div>
          <p className="text-[13px] text-(--text-tertiary) mt-1">Conectados à plataforma</p>
        </div>

        {/* Orçamentos Pendentes */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-amber) rounded-full" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Orçamentos Pendentes</span>
            <FileText className="h-[18px] w-[18px] text-(--accent-amber)" />
          </div>
          <div className="text-[32px] font-semibold text-(--text-primary)">{orcamentosPendentes}</div>
          <p className="text-[13px] text-(--text-tertiary) mt-1">Aguardando pagamento</p>
        </div>

        {/* Faturamento Mês */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-green) rounded-full" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Faturamento Mês</span>
            <DollarSign className="h-[18px] w-[18px] text-(--accent-green)" />
          </div>
          <div className="text-[32px] font-semibold text-(--text-primary)">{fmtBRL(faturamentoMes)}</div>
          <p className="text-[13px] text-(--text-tertiary) mt-1">Acumulado no mês corrente</p>
        </div>

        {/* Pagamentos Confirmados */}
        <div className="group relative bg-(--card-bg) border border-(--card-border) rounded-[12px] p-6 shadow-premium hover:border-[#2a2a2a] transition-all duration-200">
          <div className="absolute top-0 left-6 right-6 h-[3px] bg-(--accent-purple) rounded-full" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] uppercase tracking-[0.8px] font-medium text-(--text-secondary)">Pagamentos Confirmados</span>
            <CheckCircle className="h-[18px] w-[18px] text-(--accent-purple)" />
          </div>
          <div className="text-[32px] font-semibold text-(--text-primary)">{pagamentosRecentes}</div>
          <p className="text-[13px] text-(--text-tertiary) mt-1">Liquidados este mês</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Clientes Recentes */}
        <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] overflow-hidden shadow-premium">
          <div className="p-6 border-b border-(--card-border)">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Clientes Recentes</h3>
          </div>
          <div className="p-4 space-y-1">
            {topClientesRecentes.map((cliente) => (
              <div key={cliente.$id} className="flex items-center justify-between p-3 rounded-lg hover:bg-(--card-hover) transition-all duration-200 group">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9 rounded-lg overflow-hidden border border-(--card-border)">
                    <AvatarImage src={cliente.logo_url} alt={cliente.nome} />
                    <AvatarFallback className={cn(
                      "font-semibold rounded-lg text-[10px]",
                      cliente.tipo_campanha === 'whatsapp' ? "bg-emerald-500/10 text-emerald-500" :
                      cliente.tipo_campanha === 'leads' ? "bg-blue-500/10 text-blue-500" :
                      "bg-purple-500/10 text-purple-500"
                    )}>
                      {cliente.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-(--text-primary) leading-none">{cliente.nome}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight",
                        cliente.tipo_campanha === 'whatsapp' ? "bg-emerald-500/10 text-emerald-500" :
                        cliente.tipo_campanha === 'leads' ? "bg-blue-500/10 text-blue-500" :
                        "bg-purple-500/10 text-purple-500"
                      )}>
                        {cliente.tipo_campanha}
                      </span>
                      {cliente.ativo && <span className="h-1.5 w-1.5 rounded-full bg-(--accent-green)" />}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Copiar Link" className="h-8 w-8 text-(--text-tertiary) hover:text-(--text-primary) opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyLink(cliente.slug)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {topClientesRecentes.length === 0 && (
              <div className="text-center text-[13px] text-(--text-tertiary) py-8">
                Nenhum cliente cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Orçamentos Pendentes */}
        <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] overflow-hidden shadow-premium">
          <div className="p-6 border-b border-(--card-border)">
            <h3 className="text-[13px] font-medium text-(--text-secondary) uppercase tracking-[0.6px]">Orçamentos Pendentes</h3>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-10">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-10 text-right">Valor</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.8px] text-(--text-secondary) h-10 text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOrcamentosPendentes.map((orcamento) => (
                  <TableRow key={orcamento.$id} className="hover:bg-(--card-hover) border-none transition-colors group rounded-lg">
                     <TableCell className="py-3 text-[13px] font-medium text-(--text-primary) rounded-l-lg">{orcamento.cliente_nome}</TableCell>
                     <TableCell className="py-3 text-[13px] font-medium text-right text-(--text-primary)">{fmtBRL(orcamento.valor_total)}</TableCell>
                     <TableCell className="py-3 text-right text-(--text-tertiary) text-[11px] rounded-r-lg">
                        <div className="flex items-center justify-end gap-2">
                          {fmtDataString(orcamento.$createdAt)}
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-(--text-tertiary) hover:text-(--text-primary) p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                     </TableCell>
                  </TableRow>
                ))}
                {topOrcamentosPendentes.length === 0 && (
                  <TableRow className="border-none">
                    <TableCell colSpan={3} className="text-center h-32 text-(--text-tertiary) text-[13px]">
                      Sem pendências financeiras.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
