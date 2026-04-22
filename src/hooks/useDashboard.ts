import { useQuery } from '@tanstack/react-query';
import { buscarClientePorSlug } from '../lib/appwrite';
import { 
  fetchCampanhas, 
  fetchConjuntos, 
  fetchCriativos, 
  fetchMetricasDiarias, 
  fetchLeadsGrupos 
} from '../lib/sheets';
import { 
  calcularMetricas, 
  agruparPorDia, 
  calcularPerformance 
} from '../lib/utils';
import type { 
  Cliente, 
  Campanha, 
  ConjuntoComMetricas, 
  CriativoComMetricas, 
  MetricaDiaria,
  LeadGrupo
} from '../lib/types';

interface DashboardResult {
  cliente: Cliente;
  campanhas: Campanha[];
  conjuntos: ConjuntoComMetricas[];
  criativos: CriativoComMetricas[];
  metricasAgregadas: ReturnType<typeof calcularMetricas>;
  dadosAgrupadosPorDia: ReturnType<typeof agruparPorDia>;
  leadsGrupos: LeadGrupo[];
}

export function useDashboard(slug: string, dateRange: { from: Date; to: Date }) {
  return useQuery<DashboardResult, Error>({
    queryKey: ['dashboard', slug, dateRange.from, dateRange.to],
    queryFn: async () => {
      // 1. Busca cliente no AppWrite pelo slug
      const cliente = await buscarClientePorSlug(slug);

      if (!cliente.spreadsheet_id) {
        throw new Error('Cliente não possui uma planilha configurada.');
      }

      // 2. Busca todos os dados do Google Sheets em paralelo
      const [campanhasRaw, conjuntosRaw, criativosRaw, metricasDiarias] = await Promise.all([
        fetchCampanhas(cliente.spreadsheet_id),
        fetchConjuntos(cliente.spreadsheet_id),
        fetchCriativos(cliente.spreadsheet_id),
        fetchMetricasDiarias(cliente.spreadsheet_id, dateRange.from, dateRange.to),
      ]);

      // Busca dados de grupos condicionalmente, dependendo do tipo da campanha do cliente
      let leadsGrupos: LeadGrupo[] = [];
      if (cliente.tipo_campanha === 'leads' || cliente.tipo_campanha === 'ambos') {
        leadsGrupos = await fetchLeadsGrupos(cliente.spreadsheet_id, dateRange.from, dateRange.to);
      }

      // 3 & 4. Calcula métricas agregadas por Criativo
      let criativosComMetricas: CriativoComMetricas[] = criativosRaw.map(criativo => {
        const metricasCriativo = metricasDiarias.filter(m => m.criativo_id === criativo.id);
        const calc = calcularMetricas(metricasCriativo);
        return {
          ...criativo,
          ...calc,
          performance: 'medio' // será calculado depois
        };
      });

      // 3 & 4. Calcula métricas agregadas por Conjunto e aninha criativos
      let conjuntosComMetricas: ConjuntoComMetricas[] = conjuntosRaw.map(conjunto => {
        const criativosDoConjunto = criativosComMetricas.filter(c => c.conjunto_id === conjunto.id);
        
        const investimento = criativosDoConjunto.reduce((acc, c) => acc + c.investimento, 0);
        const conversas = criativosDoConjunto.reduce((acc, c) => acc + c.conversas, 0);
        const leads_qualificados = criativosDoConjunto.reduce((acc, c) => acc + c.leads_qualificados, 0);
        const leads_desqualificados = criativosDoConjunto.reduce((acc, c) => acc + c.leads_desqualificados, 0);
        const leads_total = leads_qualificados + leads_desqualificados;
        const cliques = criativosDoConjunto.reduce((acc, c) => acc + c.cliques, 0);
        const alcance = criativosDoConjunto.reduce((acc, c) => acc + c.alcance, 0);

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
          performance: 'medio' as const,
          criativos: criativosDoConjunto
        };
      });

      // Calcula métricas agregadas por Campanha e aninha os conjuntos
      const campanhasComMetricas = campanhasRaw.map(campanha => {
        const conjuntosDaCampanha = conjuntosComMetricas.filter(c => c.campanha_id === campanha.id);
        
        const investimento = conjuntosDaCampanha.reduce((acc, c) => acc + c.investimento, 0);
        const conversas = conjuntosDaCampanha.reduce((acc, c) => acc + c.conversas, 0);
        const leads_qualificados = conjuntosDaCampanha.reduce((acc, c) => acc + c.leads_qualificados, 0);
        const leads_desqualificados = conjuntosDaCampanha.reduce((acc, c) => acc + c.leads_desqualificados, 0);
        const leads_total = leads_qualificados + leads_desqualificados;
        const cliques = conjuntosDaCampanha.reduce((acc, c) => acc + c.cliques, 0);
        const alcance = conjuntosDaCampanha.reduce((acc, c) => acc + c.alcance, 0);

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
      // Ordena usando o principal KPI dependendo do tipo da campanha (CTR ou Custo/Leading)
      // Aqui usamos CTR como padrão para ordenação de performance
      const criativosOrdenados = [...criativosComMetricas].sort((a, b) => b.ctr - a.ctr);
      criativosComMetricas = criativosComMetricas.map(c => {
         const index = criativosOrdenados.findIndex(o => o.id === c.id);
         return {
           ...c,
           performance: calcularPerformance(criativosOrdenados, index)
         }
      })

      // 5. Calcula Performance para os Conjuntos (Públicos)
      // Usa Custo por Conversa ou CPL para ordernar, menor é melhor
      const conjuntosOrdenados = [...conjuntosComMetricas].sort((a, b) => {
         // Para evitar divisão por zero que gera Infinity e bagunça o sort,
         // lidamos com 0 jogando para o final.
         if(a.custo_conversa === 0 && b.custo_conversa !== 0) return 1;
         if(a.custo_conversa !== 0 && b.custo_conversa === 0) return -1;
         return a.custo_conversa - b.custo_conversa;
      });
      conjuntosComMetricas = conjuntosComMetricas.map(c => {
         const index = conjuntosOrdenados.findIndex(o => o.id === c.id);
         return {
           ...c,
           performance: calcularPerformance(conjuntosOrdenados, index)
         }
      })

      return {
        cliente,
        campanhas: campanhasComMetricas,
        conjuntos: conjuntosComMetricas,
        criativos: criativosComMetricas,
        metricasAgregadas: calcularMetricas(metricasDiarias),
        dadosAgrupadosPorDia: agruparPorDia(metricasDiarias),
        leadsGrupos,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache (limite da API do sheets)
    enabled: !!slug && !!dateRange.from && !!dateRange.to,
  });
}
