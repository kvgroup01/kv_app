import { useQuery } from "@tanstack/react-query";
import type { CriativoComMetricas, ConjuntoComMetricas } from "../lib/types";

const SYNC_URL = "https://sync.kvgroupbr.com.br";

export function useDashboardAPI(
  lancamentoId: string | undefined,
  dateRange: { from?: Date; to?: Date } | undefined,
) {
  const fromStr = dateRange?.from?.toISOString().split("T")[0] || "";
  const toStr = dateRange?.to?.toISOString().split("T")[0] || "";

  return useQuery({
    queryKey: ["dashboard-api", lancamentoId, fromStr, toStr],
    queryFn: async () => {
      if (!lancamentoId || !fromStr || !toStr) return null;

      const res = await fetch(
        `${SYNC_URL}/dashboard?lancamentoId=${lancamentoId}&from=${fromStr}&to=${toStr}`,
      );
      if (!res.ok) throw new Error("Erro ao buscar dashboard");
      const raw = await res.json();

      const metricas = {
        ...raw.metricasGerais,
        vendas: 0,
        taxa_conversao: 0,
        pct_qualificados: raw.metricasGerais.leads_total > 0
          ? (raw.metricasGerais.leads_qualificados / raw.metricasGerais.leads_total) * 100
          : 0,
        pct_desqualificados: raw.metricasGerais.leads_total > 0
          ? (raw.metricasGerais.leads_desqualificados / raw.metricasGerais.leads_total) * 100
          : 0,
        grupos_formados: 0,
      };

      return {
        cliente: raw.cliente,
        campanhas: raw.campanhas,
        conjuntos: raw.conjuntos,
        criativos: raw.criativos,
        metricas,
        metricasAgregadas: metricas,
        serieHistorica: raw.serieHistorica,
        dadosAgrupadosPorDia: raw.serieHistorica,
        rankingCriativos: raw.rankingCriativos,
        rankingPublicos: raw.rankingPublicos,
        relatorioCampanhas: raw.relatorioCampanhas,
        leadsGrupos: raw.leadsGrupos || [],
        totalLeads: metricas.leads_total,
        leadsSuperiores: [],
        leadsMedio: [],
      };
    },
    enabled: !!lancamentoId && !!fromStr && !!toStr,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}
