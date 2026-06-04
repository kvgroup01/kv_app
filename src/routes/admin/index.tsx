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
import { fmtBRL, fmtDataString, cn } from '../../lib/utils';
import { CONFIG } from '../../lib/constants';

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
    const url = `${CONFIG.APP_URL}/dashboard/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do dashboard copiado!');
  };

  if (isDataLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40 rounded-[8px]" />
          <Skeleton className="h-4 w-64 rounded-[8px]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[110px] w-full rounded-[14px]" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[340px] w-full rounded-[14px]" />
          <Skeleton className="h-[340px] w-full rounded-[14px]" />
        </div>
      </div>
    );
  }

  // KPIs config
  const kpis = [
    {
      label: 'Clientes Ativos',
      value: clientesAtivos,
      sub: 'Conectados à plataforma',
      icon: Activity,
      accent: '#3b82f6',
      accentBg: 'rgba(59,130,246,0.08)',
    },
    {
      label: 'Orçamentos Pendentes',
      value: orcamentosPendentes,
      sub: 'Aguardando pagamento',
      icon: FileText,
      accent: '#FBB03B',
      accentBg: 'rgba(251,176,59,0.08)',
    },
    {
      label: 'Faturamento do Mês',
      value: fmtBRL(faturamentoMes),
      sub: 'Acumulado no mês corrente',
      icon: DollarSign,
      accent: '#22c55e',
      accentBg: 'rgba(34,197,94,0.08)',
    },
    {
      label: 'Pagamentos Confirmados',
      value: pagamentosRecentes,
      sub: 'Liquidados este mês',
      icon: CheckCircle,
      accent: '#a855f7',
      accentBg: 'rgba(168,85,247,0.08)',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Cabeçalho ── */}
      <div>
        <h2
          className="text-[22px] font-semibold text-(--text-primary)"
          style={{ letterSpacing: '-0.374px' }}
        >
          Visão Geral
        </h2>
        <p className="text-[13px] text-(--text-secondary) mt-1">
          Monitore o desempenho e métricas em tempo real
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative bg-(--card-bg) border border-(--card-border) rounded-[14px] p-5 transition-all duration-200 hover:border-[var(--brand)] group overflow-hidden"
          >
            {/* Ícone com fundo */}
            <div
              className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] mb-4"
              style={{ background: kpi.accentBg }}
            >
              <kpi.icon className="h-4 w-4" style={{ color: kpi.accent }} />
            </div>

            {/* Valor */}
            <div
              className="text-[28px] font-semibold text-(--text-primary) leading-none mb-1.5"
              style={{ letterSpacing: '-0.5px' }}
            >
              {kpi.value}
            </div>

            {/* Label + sub */}
            <p
              className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-wider leading-none mb-0.5"
            >
              {kpi.label}
            </p>
            <p className="text-[12px] text-(--text-tertiary)">{kpi.sub}</p>

            {/* Linha de acento no hover */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: kpi.accent }}
            />
          </div>
        ))}
      </div>

      {/* ── Tabelas ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Clientes Recentes */}
        <div className="bg-(--card-bg) border border-(--card-border) rounded-[14px] overflow-hidden">
          <div className="px-6 py-4 border-b border-(--card-border) flex items-center justify-between">
            <h3
              className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-wider"
            >
              Clientes Recentes
            </h3>
            <span className="text-[11px] text-(--text-tertiary)">
              {topClientesRecentes.length} de {clientes?.length || 0}
            </span>
          </div>
          <div className="p-3 space-y-0.5">
            {topClientesRecentes.map((cliente) => (
              <div
                key={cliente.$id}
                className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-(--card-hover) transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 rounded-[8px] shrink-0 border border-(--card-border)">
                    <AvatarImage src={cliente.logo_url} alt={cliente.nome} />
                    <AvatarFallback className={cn(
                      "font-semibold rounded-[8px] text-[10px]",
                      cliente.tipo_campanha === 'whatsapp' ? "bg-emerald-500/10 text-emerald-500" :
                      cliente.tipo_campanha === 'leads' ? "bg-blue-500/10 text-blue-500" :
                      "bg-purple-500/10 text-purple-500"
                    )}>
                      {cliente.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-(--text-primary) truncate leading-none mb-1">
                      {cliente.nome}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-[4px] font-semibold uppercase tracking-tight",
                        cliente.tipo_campanha === 'whatsapp' ? "bg-emerald-500/10 text-emerald-500" :
                        cliente.tipo_campanha === 'leads' ? "bg-blue-500/10 text-blue-500" :
                        "bg-purple-500/10 text-purple-500"
                      )}>
                        {cliente.tipo_campanha}
                      </span>
                      {cliente.ativo && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />}
                    </div>
                  </div>
                </div>
                <button
                  title="Copiar link do dashboard"
                  onClick={() => handleCopyLink(cliente.slug)}
                  className="h-7 w-7 flex items-center justify-center rounded-[7px] text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-border) opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {topClientesRecentes.length === 0 && (
              <div className="text-center text-[13px] text-(--text-tertiary) py-10">
                Nenhum cliente cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Orçamentos Pendentes */}
        <div className="bg-(--card-bg) border border-(--card-border) rounded-[14px] overflow-hidden">
          <div className="px-6 py-4 border-b border-(--card-border) flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-wider">
              Orçamentos Pendentes
            </h3>
            <span className="text-[11px] text-(--text-tertiary)">
              {topOrcamentosPendentes.length} item{topOrcamentosPendentes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {topOrcamentosPendentes.length === 0 ? (
            <div className="text-center text-[13px] text-(--text-tertiary) py-16">
              Sem pendências financeiras
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {topOrcamentosPendentes.map((orc) => (
                <div
                  key={orc.$id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-(--card-hover) transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-(--text-primary) truncate leading-none mb-1">
                      {orc.cliente_nome}
                    </p>
                    <p className="text-[11px] text-(--text-tertiary)">
                      {fmtDataString(orc.$createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className="text-[13px] font-semibold text-(--text-primary)"
                      style={{ letterSpacing: '-0.2px' }}
                    >
                      {fmtBRL(orc.valor_total)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] font-semibold uppercase tracking-tight bg-[rgba(251,176,59,0.1)] text-[#bc842c]">
                      Pendente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
