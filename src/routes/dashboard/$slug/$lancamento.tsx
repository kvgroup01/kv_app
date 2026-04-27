import * as React from "react";
import { useParams } from "react-router";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useLancamentoPorSlug } from "../../../hooks/useLancamentos";
import { useDashboard } from "../../../hooks/useDashboard";

import { DateRangePicker } from "../../../components/shared/DateRangePicker";
import { DashboardSkeleton } from "../../../components/dashboard/DashboardSkeleton";
import { MetricCards } from "../../../components/dashboard/MetricCards";
import { InvestimentoChart } from "../../../components/dashboard/InvestimentoChart";
import { CampanhasTable } from "../../../components/dashboard/CampanhasTable";
import { CreativosGrid } from "../../../components/dashboard/CreativosGrid";
import { RankingTable } from "../../../components/dashboard/RankingTable";
import { FunnelWhatsApp } from "../../../components/dashboard/FunnelWhatsApp";
import { FunnelLeads } from "../../../components/dashboard/FunnelLeads";
import { LeadsQualificadosChart } from "../../../components/dashboard/LeadsQualificadosChart";
import { ClassificacaoTrafico } from "../../../components/dashboard/ClassificacaoTrafico";
import { VisaoFinanceiraLeads } from "../../../components/dashboard/VisaoFinanceiraLeads";
import { GruposWhatsApp } from "../../../components/dashboard/GruposWhatsApp";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { type DateRange } from "react-day-picker";

type SecaoId =
  | "cards_metricas"
  | "funil"
  | "grafico_investimento"
  | "classificacao"
  | "tabela_campanhas"
  | "grid_criativos"
  | "ranking_publicos"
  | "ranking_criativos"
  | "grupos_whatsapp"
  | "visao_financeira";

export default function PublicDashboardLancamento() {
  const { slug, lancamento } = useParams();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const [gruposWA, setGruposWA] = React.useState({
    ensino_superior: 0,
    ensino_medio: 0,
  });
  const [investimentoManual, setInvestimentoManual] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);
  const queryClient = useQueryClient();

  const metricasVazias = {
    investimento: 0,
    impressoes: 0,
    alcance: 0,
    cliques: 0,
    conversas: 0,
    leads_qualificados: 0,
    leads_desqualificados: 0,
    leads_total: 0,
    leads_superior: 0,
    leads_medio: 0,
    vendas: 0,
    ctr: 0,
    cpm: 0,
    custo_conversa: 0,
    cpl: 0,
    taxa_conversao: 0,
    pct_qualificados: 0,
    pct_desqualificados: 0,
    grupos_formados: 0,
  };

  const {
    data: dataLancamento,
    isLoading: isLoadingLancamento,
    isError: isErrorLancamento,
  } = useLancamentoPorSlug(slug!, lancamento!);

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isFetching,
    isError: isErrorDashboard,
    error: errorDashboard,
  } = useDashboard(
    slug!,
    {
      from: dateRange?.from || subDays(new Date(), 29),
      to: dateRange?.to || new Date(),
    },
    dataLancamento?.$id,
  );

  const [syncJob, setSyncJob] = React.useState<{
    jobId: string;
    progresso: number;
    status: string;
  } | null>(null);

  const startBackgroundSync = async () => {
    if (!dataLancamento?.$id) return;
    try {
      const response = await fetch("/api/meta-sync-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lancamentoId: dataLancamento.$id }),
      });
      const data = await response.json();
      if (response.ok && data.jobId) {
        setSyncJob({ jobId: data.jobId, progresso: 0, status: data.status });
      }
    } catch (err) {
      console.error("Background sync fetch erro:", err);
    }
  };

  React.useEffect(() => {
    if (!dataLancamento?.$id) return;

    const cacheKey = `meta_sync_${dataLancamento.$id}`;
    const lastSync = localStorage.getItem(cacheKey);
    const now = Date.now();
    const thirtyMinutesValid = 30 * 60 * 1000;

    if (!lastSync || now - Number(lastSync) > thirtyMinutesValid) {
      startBackgroundSync();
    }
  }, [dataLancamento?.$id]);

  React.useEffect(() => {
    let interval: any;
    if (syncJob && syncJob.status !== "done" && syncJob.status !== "error") {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/meta-sync-worker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: syncJob.jobId }),
          });
          const data = await res.json();
          if (res.ok && !data.error) {
            setSyncJob((prev) =>
              prev
                ? {
                    ...prev,
                    progresso: data.progresso,
                    status: data.done ? "done" : "running",
                  }
                : null,
            );
            if (data.done) {
              clearInterval(interval);
              const now = Date.now();
              setSyncing(false);
              localStorage.setItem(
                `meta_sync_${dataLancamento?.$id}`,
                now.toString(),
              );
              queryClient.invalidateQueries();
              // Only show toast if it was a manual sync, we're currently syncing but background sync should be silent
              if (syncing) {
                toast.success("Dados atualizados!");
              }
            }
          } else {
            clearInterval(interval);
            setSyncJob((prev) => (prev ? { ...prev, status: "error" } : null));
            if (syncing) toast.error(data.error || "Erro ao sicronizar");
            setSyncing(false);
          }
        } catch (e) {
          clearInterval(interval);
          setSyncJob((prev) => (prev ? { ...prev, status: "error" } : null));
          if (syncing) toast.error("Erro de conexão ao atualizar dados");
          setSyncing(false);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncJob, queryClient, dataLancamento?.$id, syncing]);

  const handleManualSync = async () => {
    if (!dataLancamento?.$id) return;
    setSyncing(true);
    try {
      const response = await fetch("/api/meta-sync-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lancamentoId: dataLancamento.$id }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        toast.error(data.error || "Erro ao iniciar atualização");
        setSyncing(false);
      } else {
        setSyncJob({ jobId: data.jobId, progresso: 0, status: data.status });
      }
    } catch (err: any) {
      toast.error("Erro de conexão ao iniciar atualização");
      setSyncing(false);
    }
  };

  console.log("dashboardData:", dashboardData);
  console.log("leadsGrupos:", dashboardData?.leadsGrupos);
  console.log("metricas:", dashboardData?.metricas);

  // Parse seções configuradas
  const secoes = React.useMemo(() => {
    if (!dataLancamento?.configuracao_secoes) return null;
    try {
      return JSON.parse(dataLancamento.configuracao_secoes) as Record<
        SecaoId,
        { ativo: boolean; titulo: string }
      >;
    } catch {
      return null; // fallback will be handled
    }
  }, [dataLancamento]);

  if (isLoadingLancamento) {
    return <DashboardSkeleton tipo="ambos" />;
  }

  if (isErrorLancamento || !dataLancamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Página não encontrada</h2>
          <p className="text-muted-foreground">
            O dashboard que você está procurando não existe ou o link está
            incorreto.
          </p>
        </div>
      </div>
    );
  }

  if (dataLancamento.status !== "ativo") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Ainda não publicado
          </h2>
          <p className="text-muted-foreground">
            Este dashboard está sendo configurado e ainda não foi publicado pela
            agência.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard && !dashboardData) {
    return <DashboardSkeleton tipo={dataLancamento.tipo as unknown as "whatsapp" | "leads" | "ambos"} />;
  }

  if (errorDashboard && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-muted-foreground">Erro ao carregar dados.</p>
        </div>
      </div>
    );
  }

  const metricas = dashboardData.metricas ?? metricasVazias;
  const serieHistorica = dashboardData.serieHistorica ?? [];
  const campanhas = dashboardData.relatorioCampanhas ?? [];
  const criativos = dashboardData.rankingCriativos ?? [];
  const publicos = dashboardData.rankingPublicos ?? [];
  const leadsGrupos = dashboardData.leadsGrupos ?? [];
  const cliente = dashboardData.cliente;

  const todasDatas = Array.from(new Set([
    ...leadsGrupos.map((l: any) => l.data),
    ...serieHistorica.map((s: any) => s.data)
  ])).sort();

  const dadosCruzados = todasDatas.map(data => ({
    data,
    qualificados: leadsGrupos.find((l: any) => l.data === data)
      ?.leads_ensino_superior || 0,
    desqualificados: leadsGrupos.find((l: any) => l.data === data)
      ?.leads_ensino_medio || 0,
    investimento: serieHistorica.find((s: any) => s.data === data)
      ?.investimento || 0,
  }));

  // Fallbacks if section logic isn't perfectly mapped
  const secaoAtiva = (key: SecaoId) => secoes?.[key]?.ativo ?? true;
  const secaoTitulo = (key: SecaoId, fallback: string) =>
    secoes?.[key]?.titulo || fallback;

  // Render Seções Functions for LEADS mode
  const renderLeadsSeccions = () => (
    <div className="space-y-6">
      {secaoAtiva("cards_metricas") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("cards_metricas", "Métricas Principais")}
          </h3>
          <MetricCards
            metricas={metricas}
            tipo={
              dataLancamento.tipo as unknown as "whatsapp" | "leads" | "ambos"
            }
            isLoading={isLoadingDashboard}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {secaoAtiva("funil") && (
          <section>
            <h3 className="text-xl font-bold mb-4">
              {secaoTitulo("funil", "Funil de Tráfego")}
            </h3>
            <FunnelLeads dados={dadosCruzados} metricas={metricas} />
          </section>
        )}
        {secaoAtiva("grafico_investimento") && (
          <section>
            <h3 className="text-xl font-bold mb-4">
              {secaoTitulo("grafico_investimento", "Investimento vs Leads")}
            </h3>
            <LeadsQualificadosChart dados={serieHistorica} />
          </section>
        )}
      </div>

      {secaoAtiva("classificacao") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("classificacao", "Classificação por Escolaridade")}
          </h3>
          <ClassificacaoTrafico
            leadsEnsino={{
              superior: metricas.leads_superior ?? 0,
              medio: metricas.leads_medio ?? 0,
            }}
            isLoading={isLoadingDashboard}
          />
        </section>
      )}

      {secaoAtiva("tabela_campanhas") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("tabela_campanhas", "Campanhas")}
          </h3>
          <CampanhasTable campanhasComMetricas={campanhas} tipo="leads" />
        </section>
      )}

      {secaoAtiva("grid_criativos") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("grid_criativos", "Criativos")}
          </h3>
          <CreativosGrid criativos={criativos} tipo="leads" />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {secaoAtiva("ranking_publicos") && (
          <section>
            <h3 className="text-xl font-bold mb-4">
              {secaoTitulo("ranking_publicos", "Melhores Públicos")}
            </h3>
            <RankingTable
              titulo="Melhores Públicos"
              items={publicos}
              tipo="publicos"
              campanhaTipo="leads"
            />
          </section>
        )}
        {secaoAtiva("ranking_criativos") && (
          <section>
            <h3 className="text-xl font-bold mb-4">
              {secaoTitulo("ranking_criativos", "Melhores Criativos")}
            </h3>
            <RankingTable
              titulo="Melhores Criativos"
              items={criativos}
              tipo="criativos"
              campanhaTipo="leads"
            />
          </section>
        )}
      </div>

      {secaoAtiva("grupos_whatsapp") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("grupos_whatsapp", "Grupos de WhatsApp")}
          </h3>
          <GruposWhatsApp value={gruposWA} onChange={setGruposWA} />
        </section>
      )}

      {secaoAtiva("visao_financeira") && (
        <section>
          <h3 className="text-xl font-bold mb-4">
            {secaoTitulo("visao_financeira", "Visão Financeira")}
          </h3>
          <VisaoFinanceiraLeads
            investimentoContratado={dataLancamento?.investimento_total_contratado ?? 0}
            valorUsadoCampanhas={metricas.investimento ?? 0}
            isLoading={false}
          />
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-0 lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            {cliente.logo_url && (
              <img
                src={cliente.logo_url}
                alt="Logo"
                className="h-6 w-6 lg:h-8 lg:w-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-bold leading-none truncate max-w-[200px] lg:max-w-none">
                  {dataLancamento.nome}
                </h1>
                <Badge
                  variant="outline"
                  className="text-[9px] lg:text-[10px] uppercase font-semibold h-4 px-1"
                >
                  {dataLancamento.tipo}
                </Badge>
              </div>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                {cliente.nome} • Dados em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 w-full lg:w-auto">
            {isFetching && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Atualizando...
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncing}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 h-9 text-xs"
                title="Atualizar dados do Meta Ads"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                <span>
                  {syncing ? "Atualizando..." : "Atualizar dados"}
                </span>
              </Button>
            </div>

            <div className="w-full lg:w-[300px]">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {dataLancamento.tipo === "ambos" ? (
          <Tabs defaultValue="leads" className="space-y-6">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="leads" className="w-32">
                Leads
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="w-32">
                WhatsApp
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="leads"
              className="m-0 focus-visible:outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {renderLeadsSeccions()}
              </motion.div>
            </TabsContent>

            <TabsContent
              value="whatsapp"
              className="m-0 focus-visible:outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <MetricCards
                  metricas={metricas}
                  tipo="whatsapp"
                  isLoading={isLoadingDashboard}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FunnelWhatsApp
                    metricas={metricas}
                    onVendasChange={(v) => console.log(v)}
                  />
                  <InvestimentoChart dados={serieHistorica} tipo="whatsapp" />
                </div>
                <CampanhasTable
                  campanhasComMetricas={campanhas}
                  tipo="whatsapp"
                />
                <CreativosGrid criativos={criativos} tipo="whatsapp" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RankingTable
                    titulo="Melhores Públicos"
                    items={publicos}
                    tipo="publicos"
                    campanhaTipo="whatsapp"
                  />
                  <RankingTable
                    titulo="Melhores Criativos"
                    items={criativos}
                    tipo="criativos"
                    campanhaTipo="whatsapp"
                  />
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        ) : (
          renderLeadsSeccions()
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Relatório gerado por{" "}
            <span className="font-semibold text-foreground">Dashboard KV</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}
