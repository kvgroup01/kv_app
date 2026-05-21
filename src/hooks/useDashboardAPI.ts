import { useQuery } from "@tanstack/react-query";

export function useDashboardAPI(
  lancamentoId: string | undefined,
  dateRange: { from?: Date; to?: Date } | undefined,
) {
  const fromStr = dateRange?.from
    ? dateRange.from.toISOString().split("T")[0]
    : "";
  const toStr = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";

  console.log("[API] queryKey:", lancamentoId, fromStr, toStr);

  return useQuery({
    queryKey: ["dashboard-api", lancamentoId, fromStr, toStr],
    queryFn: async () => {
      if (!lancamentoId || !fromStr || !toStr) return null;
      const res = await fetch(
        `https://sync.kvgroupbr.com.br/dashboard?lancamentoId=${lancamentoId}&from=${fromStr}&to=${toStr}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Erro ao buscar dashboard");
      const raw = await res.json();
      const metricas = {
        ...raw.metricasGerais,
        vendas: 0,
        taxa_conversao: 0,
        pct_qualificados:
          raw.metricasGerais.leads_total > 0
            ? (raw.metricasGerais.leads_qualificados /
                raw.metricasGerais.leads_total) *
              100
            : 0,
        pct_desqualificados:
          raw.metricasGerais.leads_total > 0
            ? (raw.metricasGerais.leads_desqualificados /
                raw.metricasGerais.leads_total) *
              100
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
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
