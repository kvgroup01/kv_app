import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "../lib/supabase";
import { queryClient } from "../lib/queryClient";
import {
  fetchCampanhas,
  fetchConjuntos,
  fetchCriativos,
  fetchMetricasDiarias,
  fetchLeadsGrupos,
} from "../lib/sheets";
import {
  calcularMetricas,
  agruparPorDia,
  calcularPerformance,
} from "../lib/utils";
import type {
  Cliente,
  Campanha,
  ConjuntoComMetricas,
  CriativoComMetricas,
  MetricaDiaria,
  LeadGrupo,
} from "../lib/types";

interface DashboardResult {
  cliente: Cliente;
  campanhas: Campanha[];
  conjuntos: ConjuntoComMetricas[];
  criativos: CriativoComMetricas[];
  metricasAgregadas: ReturnType<typeof calcularMetricas> & {
    leads_superior: number;
    leads_medio: number;
  };
  dadosAgrupadosPorDia: ReturnType<typeof agruparPorDia>;
  leadsGrupos: LeadGrupo[];
  // Novos campos para compatibilidade com a view
  metricas: ReturnType<typeof calcularMetricas> & {
    leads_superior: number;
    leads_medio: number;
  };
  serieHistorica: ReturnType<typeof agruparPorDia>;
  rankingCriativos: CriativoComMetricas[];
  rankingPublicos: ConjuntoComMetricas[];
  relatorioCampanhas: any[];
  totalLeads: number;
  leadsSuperiores: any[];
  leadsMedio: any[];
}

export function useDashboardEstrutura(
  clienteId: string | undefined,
  clienteFonteDados: string | undefined,
  clienteSpreadsheetId: string | undefined,
  lancamentoId: string | undefined,
) {
  return useQuery({
    queryKey: ["dashboard-estrutura-v2", clienteId, lancamentoId],
    queryFn: async () => {
      if (!clienteId) throw new Error("clienteId required");

      const fonte = clienteFonteDados || "appwrite";

      let campanhas: any[] = [];
      let conjuntos: any[] = [];
      let criativos: any[] = [];

      if (fonte === "appwrite") {
        const { data: campData } = await supabase
          .from("campaigns")
          .select("id, nome, status, objective, lancamento_id")
          .eq("cliente_id", clienteId)
          .limit(500);

        campanhas = (campData || []).map((c: any) => ({ ...c, $id: c.id }));
        const campIds = campanhas.map((c: any) => c.$id);

        if (campIds.length > 0) {
          const { data } = await supabase
            .from("adsets")
            .select("id, nome, campaign_id, lancamento_id")
            .in("campaign_id", campIds)
            .limit(500);
          conjuntos = (data || []).map((c) => ({
            ...c,
            $id: c.id,
            campanha_id: c.campaign_id,
          }));
        }

        const conjIds = conjuntos.map((c: any) => c.$id);

        if (conjIds.length > 0) {
          const { data } = await supabase
            .from("ads")
            .select(
              "id, nome, adset_id, thumbnail_url, link_anuncio, meta_ad_id, lancamento_id",
            )
            .in("adset_id", conjIds)
            .limit(1000);
          criativos = (data || []).map((a) => ({
            ...a,
            $id: a.id,
            conjunto_id: a.adset_id,
          }));
        }
      } else if (fonte === "sheets") {
        if (!clienteSpreadsheetId) {
          throw new Error(
            "Fonte de dados configurada como Google Sheets, mas o ID da planilha não foi informado no cadastro.",
          );
        }
        [campanhas, conjuntos, criativos] = await Promise.all([
          fetchCampanhas(clienteSpreadsheetId),
          fetchConjuntos(clienteSpreadsheetId),
          fetchCriativos(clienteSpreadsheetId),
        ]);
      } else if (fonte === "meta_api") {
        throw new Error(
          "O motor Meta Ads Graph API está em manutenção temporária. Por favor repassar credenciais e use o webhook/Appwrite no momento.",
        );
      }

      return { campanhas, conjuntos, criativos };
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useDashboardMetricas(
  clienteId: string | undefined,
  clienteFonteDados: string | undefined,
  clienteTipoCampanha: string | undefined,
  clienteSpreadsheetId: string | undefined,
  lancamentoId: string | undefined,
  fromStr: string,
  toStr: string,
  dateRangeStr: { from?: Date; to?: Date } | undefined,
) {
  return useQuery({
    queryKey: ["metricas", clienteId, lancamentoId, fromStr, toStr],
    queryFn: async () => {
      if (
        (!lancamentoId && !clienteId) ||
        !fromStr ||
        !toStr ||
        !dateRangeStr?.from ||
        !dateRangeStr?.to
      )
        return null;

      const fonte = clienteFonteDados || "appwrite";
      let metricasDiarias: MetricaDiaria[] = [];
      let leadsGrupos: LeadGrupo[] = [];

      if (fonte === "appwrite") {
        let metQuery = supabase
          .from("daily_metrics")
          .select(
            "id, criativo_id, data, investimento, impressoes, alcance, cliques, conversas, leads_qualificados, leads_desqualificados, ctr, cpm, frequencia, cliques_link, cpc_link, ctr_link, resultados_meta, lancamento_id",
          )
          .gte("data", fromStr)
          .lte("data", toStr)
          .limit(5000);

        if (lancamentoId) {
          metQuery = metQuery.eq("lancamento_id", lancamentoId);
        } else if (clienteId) {
          metQuery = metQuery.eq("cliente_id", clienteId);
        }

        const { data: metData } = await metQuery;
        metricasDiarias = (metData || []).map((r: any) => ({
          ...r,
          $id: r.id,
        })) as unknown as MetricaDiaria[];

        if (
          clienteTipoCampanha === "leads" ||
          clienteTipoCampanha === "ambos"
        ) {
          let importedLeads: any[] = [];
          if (lancamentoId) {
            const { data: leadsData } = await supabase
              .from("lead_entries")
              .select("*")
              .eq("lancamento_id", lancamentoId)
              .gte("data", fromStr)
              .lte("data", toStr)
              .limit(5000);
            importedLeads = (leadsData || []).map((r: any) => ({
              ...r,
              $id: r.id,
            }));
          }

          function classificarEscolaridade(
            escolaridade: string,
          ): "superior" | "medio" {
            const medio = ["ensino médio completo", "ensino medio completo"];
            const valor = escolaridade?.toLowerCase().trim() ?? "";
            return medio.includes(valor) ? "medio" : "superior";
          }

          if ((importedLeads ?? []).length > 0) {
            const contagemPorData: Record<
              string,
              { superior: number; medio: number }
            > = {};
            importedLeads.forEach((lead) => {
              const d = lead.data || "N/A";
              if (!contagemPorData[d])
                contagemPorData[d] = { superior: 0, medio: 0 };
              const classificacao = classificarEscolaridade(lead.escolaridade);
              if (classificacao === "superior") contagemPorData[d].superior++;
              else contagemPorData[d].medio++;
            });

            leadsGrupos = Object.keys(contagemPorData).map((d) => ({
              data: d,
              leads_ensino_superior: contagemPorData[d].superior,
              leads_ensino_medio: contagemPorData[d].medio,
            }));
          }
        }
      } else if (fonte === "sheets") {
        if (!clienteSpreadsheetId) {
          throw new Error(
            "Fonte de dados configurada como Google Sheets, mas o ID da planilha não foi informado no cadastro.",
          );
        }
        metricasDiarias = await fetchMetricasDiarias(
          clienteSpreadsheetId,
          dateRangeStr.from,
          dateRangeStr.to,
        );

        if (
          clienteTipoCampanha === "leads" ||
          clienteTipoCampanha === "ambos"
        ) {
          leadsGrupos = await fetchLeadsGrupos(
            clienteSpreadsheetId,
            dateRangeStr.from,
            dateRangeStr.to,
          );
        }
      }

      return { metricasDiarias, leadsGrupos };
    },
    enabled: !!(lancamentoId || clienteId) && !!fromStr && !!toStr,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });
}

export function useDashboard(
  slug: string,
  dateRange: { from?: Date; to?: Date } | undefined,
  lancamentoId?: string,
) {
  const fromStr = dateRange?.from
    ? dateRange.from.toISOString().split("T")[0]
    : "";
  const toStr = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";

  // 1. Busca cliente
  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ["cliente-por-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw new Error("Cliente não encontrado");
      return { ...data, $id: data.id };
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!slug,
  });

  // 2. Busca lançamento caso haja ID
  const { data: lancamento, isLoading: isLoadingLancamento } = useQuery({
    queryKey: ["lancamento", lancamentoId],
    queryFn: async () => {
      if (!lancamentoId) return null;
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("id", lancamentoId)
        .single();
      if (error) throw error;
      return { ...data, $id: data.id };
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!lancamentoId,
  });

  // 3. Estrutura Estática
  const {
    data: estrutura,
    isLoading: isLoadingEstrutura,
    isError: isErrEst,
    error: errEst,
  } = useDashboardEstrutura(
    cliente?.$id,
    cliente?.fonte_dados,
    cliente?.spreadsheet_id,
    lancamentoId,
  );

  // 4. Métricas Dinâmicas
  const {
    data: metricasData,
    isLoading: isLoadingMetricas,
    isFetching: isFetchingMetricas,
    isError: isErrMet,
    error: errMet,
  } = useDashboardMetricas(
    cliente?.$id,
    cliente?.fonte_dados,
    cliente?.tipo_campanha,
    cliente?.spreadsheet_id,
    lancamentoId,
    fromStr,
    toStr,
    dateRange,
  );

  const dashboardComputado = useMemo((): DashboardResult | undefined => {
    if (isErrEst) throw errEst;
    if (isErrMet) throw errMet;

    if (!cliente || !estrutura || !metricasData) {
      return undefined;
    }

    let {
      campanhas: campanhasRaw,
      conjuntos: conjuntosRaw,
      criativos: criativosRaw,
    } = estrutura;
    const { metricasDiarias, leadsGrupos } = metricasData;

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

    // Filtrar conjuntos e campanhas apenas com criativos que têm métricas neste lançamento
    if (
      lancamentoId &&
      criativosRaw.length > 0 &&
      cliente.fonte_dados === "appwrite"
    ) {
      const conjuntosComCriativos = new Set(
        criativosRaw.map((c: any) => c.conjunto_id),
      );
      conjuntosRaw = conjuntosRaw.filter((c: any) =>
        conjuntosComCriativos.has(c.$id),
      );

      const campanhsComConjuntos = new Set(
        conjuntosRaw.map((c: any) => c.campanha_id),
      );
      campanhasRaw = campanhasRaw.filter((c: any) =>
        campanhsComConjuntos.has(c.$id),
      );
    }

    // 3 & 4. Calcula métricas agregadas por Criativo
    let criativosComMetricas: CriativoComMetricas[] = criativosRaw.map(
      (criativo) => {
        const metricasCriativo = metricasDiarias.filter(
          (m) => m.criativo_id === criativo.$id,
        );
        const calc = calcularMetricas(metricasCriativo) ?? metricasVazias;
        return {
          ...criativo,
          ...calc,
          performance: "medio",
        };
      },
    );

    // 3 & 4. Calcula métricas agregadas por Conjunto e aninha criativos
    let conjuntosComMetricas: ConjuntoComMetricas[] = conjuntosRaw.map(
      (conjunto) => {
        const criativosDoConjunto = criativosComMetricas.filter(
          (c) => c.conjunto_id === conjunto.$id,
        );

        const investimento = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.investimento || 0),
          0,
        );
        const conversas = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.conversas || 0),
          0,
        );
        const leads_qualificados = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.leads_qualificados || 0),
          0,
        );
        const leads_desqualificados = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.leads_desqualificados || 0),
          0,
        );
        const leads_total = leads_qualificados + leads_desqualificados;
        const cliques = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.cliques || 0),
          0,
        );
        const alcance = criativosDoConjunto.reduce(
          (acc, c) => acc + (c.alcance || 0),
          0,
        );

        return {
          ...conjunto,
          investimento,
          conversas,
          leads_qualificados,
          leads_desqualificados,
          leads_total,
          cliques,
          alcance,
          custo_conversa: conversas > 0 ? investimento / conversas : 0,
          cpl: leads_total > 0 ? investimento / leads_total : 0,
          performance: "medio" as const,
          criativos: criativosDoConjunto,
        };
      },
    );

    // Calcula métricas agregadas por Campanha e aninha os conjuntos
    const campanhasComMetricas = campanhasRaw.map((campanha) => {
      const conjuntosDaCampanha = conjuntosComMetricas.filter(
        (c) => c.campanha_id === campanha.$id,
      );

      const investimento = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.investimento || 0),
        0,
      );
      const conversas = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.conversas || 0),
        0,
      );
      const leads_qualificados = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.leads_qualificados || 0),
        0,
      );
      const leads_desqualificados = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.leads_desqualificados || 0),
        0,
      );
      const leads_total = leads_qualificados + leads_desqualificados;
      const cliques = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.cliques || 0),
        0,
      );
      const alcance = conjuntosDaCampanha.reduce(
        (acc, c) => acc + (c.alcance || 0),
        0,
      );

      return {
        ...campanha,
        investimento,
        conversas,
        leads_qualificados,
        leads_desqualificados,
        leads_total,
        cliques,
        alcance,
        custo_conversa: conversas > 0 ? investimento / conversas : 0,
        cpl: leads_total > 0 ? investimento / leads_total : 0,
        conjuntos: conjuntosDaCampanha,
      };
    });

    // 5. Calcula Performance para os Criativos
    const criativosOrdenados = [...criativosComMetricas].sort(
      (a, b) => (b.ctr || 0) - (a.ctr || 0),
    );
    criativosComMetricas = criativosComMetricas.map((c) => {
      const index = criativosOrdenados.findIndex((o) => o.$id === c.$id);
      return {
        ...c,
        performance: calcularPerformance(criativosOrdenados, index),
      };
    });

    // 5. Calcula Performance para os Conjuntos (Públicos)
    const conjuntosOrdenados = [...conjuntosComMetricas].sort((a, b) => {
      if (a.custo_conversa === 0 && b.custo_conversa !== 0) return 1;
      if (a.custo_conversa !== 0 && b.custo_conversa === 0) return -1;
      return (a.custo_conversa || 0) - (b.custo_conversa || 0);
    });
    conjuntosComMetricas = conjuntosComMetricas.map((c) => {
      const index = conjuntosOrdenados.findIndex((o) => o.$id === c.$id);
      return {
        ...c,
        performance: calcularPerformance(conjuntosOrdenados, index),
      };
    });

    // Calcula métricas gerais
    const metricasGerais = calcularMetricas(metricasDiarias) ?? metricasVazias;

    // Adiciona métricas de escolaridade
    const totalSuperior = leadsGrupos.reduce(
      (acc, g) => acc + (g.leads_ensino_superior || 0),
      0,
    );
    const totalMedio = leadsGrupos.reduce(
      (acc, g) => acc + (g.leads_ensino_medio || 0),
      0,
    );

    const metricasExtended = {
      ...metricasGerais,
      leads_superior: totalSuperior,
      leads_medio: totalMedio,
    };

    const totalLeads = totalSuperior + totalMedio;

    const finalMetricas = {
      ...metricasExtended,
      leads_superior: totalSuperior,
      leads_medio: totalMedio,
      leads_total: totalLeads,
      leads_qualificados: totalSuperior,
      leads_desqualificados: totalMedio,
      cpl:
        metricasExtended.investimento > 0 && totalSuperior > 0
          ? metricasExtended.investimento / totalSuperior
          : 0,
    };

    const finalSerieHistorica = agruparPorDia(metricasDiarias) ?? [];

    return {
      cliente,
      campanhas: campanhasComMetricas ?? [],
      conjuntos: conjuntosComMetricas ?? [],
      criativos: criativosComMetricas ?? [],
      metricasAgregadas: finalMetricas,
      dadosAgrupadosPorDia: finalSerieHistorica,
      leadsGrupos: leadsGrupos ?? [],
      metricas: finalMetricas,
      serieHistorica: finalSerieHistorica,
      rankingCriativos: criativosComMetricas ?? [],
      rankingPublicos: (conjuntosComMetricas ?? []).slice(0, 10),
      relatorioCampanhas: campanhasComMetricas ?? [],
      totalLeads: finalMetricas.leads_total ?? 0,
      leadsSuperiores: [],
      leadsMedio: [],
    };
  }, [
    cliente,
    estrutura,
    metricasData,
    lancamentoId,
    isErrEst,
    errEst,
    isErrMet,
    errMet,
  ]);

  const isLoading =
    isLoadingCliente ||
    (lancamentoId ? isLoadingLancamento : false) ||
    isLoadingEstrutura ||
    isLoadingMetricas;
  const isFetching = isFetchingMetricas;

  return {
    data: dashboardComputado,
    isLoading: !!(isLoading && !dashboardComputado),
    isFetching,
    isError: false,
    error: null,
  };
}
