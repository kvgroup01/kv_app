import { useQuery } from "@tanstack/react-query";
import {
  calcularMetricas,
  agruparPorDia,
  calcularPerformance,
} from "../lib/utils";
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

      // Toda a lógica de cálculo aqui (igual ao useDashboard atual)
      const {
        cliente,
        campanhas: campanhasRaw,
        conjuntos: conjuntosRaw,
        criativos: criativosRaw,
        metricas: metricasDiarias,
      } = raw;

      const metricasVazias = {
        investimento: 0,
        impressoes: 0,
        alcance: 0,
        cliques: 0,
        conversas: 0,
        leads_qualificados: 0,
        leads_desqualificados: 0,
        leads_total: 0,
        vendas: 0,
        ctr: 0,
        cpm: 0,
        custo_conversa: 0,
        cpl: 0,
        taxa_conversao: 0,
        pct_qualificados: 0,
        pct_desqualificados: 0,
        grupos_formados: 0,
        leads_superior: 0,
        leads_medio: 0,
      };

      // Mapear $id
      const campanhas = campanhasRaw.map((c: any) => ({ ...c, $id: c.id }));
      const conjuntos = conjuntosRaw.map((c: any) => ({ ...c, $id: c.id }));
      const criativos = criativosRaw.map((a: any) => ({ ...a, $id: a.id }));
      const metricas = metricasDiarias.map((m: any) => ({ ...m, $id: m.id }));

      // Filtrar por lancamentoId
      let campanhasF = campanhas;
      let conjuntosF = conjuntos;
      let criativosF = criativos;

      if (lancamentoId && criativosF.length > 0) {
        const conjuntosComCriativos = new Set(
          criativosF.map((c: any) => c.conjunto_id),
        );
        conjuntosF = conjuntosF.filter((c: any) =>
          conjuntosComCriativos.has(c.$id),
        );
        const campanhasComConjuntos = new Set(
          conjuntosF.map((c: any) => c.campanha_id),
        );
        campanhasF = campanhasF.filter((c: any) =>
          campanhasComConjuntos.has(c.$id),
        );
      }

      // Calcular métricas por criativo
      let criativosComMetricas: CriativoComMetricas[] = criativosF.map(
        (criativo: any) => {
          const metricasCriativo = metricas.filter(
            (m: any) => m.criativo_id === criativo.$id,
          );
          const calc = calcularMetricas(metricasCriativo) ?? metricasVazias;
          return { ...criativo, ...calc, performance: "medio" as const };
        },
      );

      // Calcular métricas por conjunto
      let conjuntosComMetricas: ConjuntoComMetricas[] = conjuntosF.map(
        (conjunto: any) => {
          const criativosDoConjunto = criativosComMetricas.filter(
            (c) => c.conjunto_id === conjunto.$id,
          );
          const inv = criativosDoConjunto.reduce(
            (a, c) => a + (c.investimento || 0),
            0,
          );
          const conv = criativosDoConjunto.reduce(
            (a, c) => a + (c.conversas || 0),
            0,
          );
          const lq = criativosDoConjunto.reduce(
            (a, c) => a + (c.leads_qualificados || 0),
            0,
          );
          const ld = criativosDoConjunto.reduce(
            (a, c) => a + (c.leads_desqualificados || 0),
            0,
          );
          const cl = criativosDoConjunto.reduce(
            (a, c) => a + (c.cliques || 0),
            0,
          );
          const al = criativosDoConjunto.reduce(
            (a, c) => a + (c.alcance || 0),
            0,
          );
          return {
            ...conjunto,
            investimento: inv,
            conversas: conv,
            leads_qualificados: lq,
            leads_desqualificados: ld,
            leads_total: lq + ld,
            cliques: cl,
            alcance: al,
            custo_conversa: conv > 0 ? inv / conv : 0,
            cpl: lq + ld > 0 ? inv / (lq + ld) : 0,
            performance: "medio" as const,
            criativos: criativosDoConjunto,
          };
        },
      );

      // Calcular métricas por campanha
      const campanhasComMetricas = campanhasF.map((campanha: any) => {
        const conjuntosDaCampanha = conjuntosComMetricas.filter(
          (c) => c.campanha_id === campanha.$id,
        );
        const inv = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.investimento || 0),
          0,
        );
        const conv = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.conversas || 0),
          0,
        );
        const lq = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.leads_qualificados || 0),
          0,
        );
        const ld = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.leads_desqualificados || 0),
          0,
        );
        const cl = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.cliques || 0),
          0,
        );
        const al = conjuntosDaCampanha.reduce(
          (a, c) => a + (c.alcance || 0),
          0,
        );
        return {
          ...campanha,
          investimento: inv,
          conversas: conv,
          leads_qualificados: lq,
          leads_desqualificados: ld,
          leads_total: lq + ld,
          cliques: cl,
          alcance: al,
          custo_conversa: conv > 0 ? inv / conv : 0,
          cpl: lq + ld > 0 ? inv / (lq + ld) : 0,
          conjuntos: conjuntosDaCampanha,
        };
      });

      // Performance
      const criativosOrdenados = [...criativosComMetricas].sort(
        (a, b) => (b.ctr || 0) - (a.ctr || 0),
      );
      criativosComMetricas = criativosComMetricas.map((c) => ({
        ...c,
        performance: calcularPerformance(
          criativosOrdenados,
          criativosOrdenados.findIndex((o) => o.$id === c.$id),
        ),
      }));

      const conjuntosOrdenados = [...conjuntosComMetricas].sort((a, b) => {
        if (!a.custo_conversa && b.custo_conversa) return 1;
        if (a.custo_conversa && !b.custo_conversa) return -1;
        return (a.custo_conversa || 0) - (b.custo_conversa || 0);
      });
      conjuntosComMetricas = conjuntosComMetricas.map((c) => ({
        ...c,
        performance: calcularPerformance(
          conjuntosOrdenados,
          conjuntosOrdenados.findIndex((o) => o.$id === c.$id),
        ),
      }));

      const metricasGerais = calcularMetricas(metricas) ?? metricasVazias;
      const finalSerieHistorica = agruparPorDia(metricas) ?? [];

      const finalMetricas = {
        ...metricasGerais,
        leads_superior: 0,
        leads_medio: 0,
        leads_total: metricasGerais.leads_total || 0,
      };

      return {
        cliente: { ...cliente, $id: cliente.id },
        campanhas: campanhasComMetricas,
        conjuntos: conjuntosComMetricas,
        criativos: criativosComMetricas,
        metricas: finalMetricas,
        metricasAgregadas: finalMetricas,
        serieHistorica: finalSerieHistorica,
        dadosAgrupadosPorDia: finalSerieHistorica,
        rankingCriativos: criativosComMetricas,
        rankingPublicos: conjuntosComMetricas.slice(0, 10),
        relatorioCampanhas: campanhasComMetricas,
        leadsGrupos: [],
        totalLeads: finalMetricas.leads_total,
        leadsSuperiores: [],
        leadsMedio: [],
      };
    },
    enabled: !!lancamentoId && !!fromStr && !!toStr,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}
