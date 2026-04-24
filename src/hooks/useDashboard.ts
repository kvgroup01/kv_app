import { useQuery } from '@tanstack/react-query';
import { 
  buscarClientePorSlug,
  fetchCampanhasAppwrite,
  fetchConjuntosAppwrite,
  fetchCriativosAppwrite,
  fetchMetricasAppwrite,
  fetchManualInputsAppwrite,
  fetchLeadEntriesAppwrite
} from '../lib/appwrite';
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
  metricasAgregadas: ReturnType<typeof calcularMetricas> & { leads_superior: number; leads_medio: number };
  dadosAgrupadosPorDia: ReturnType<typeof agruparPorDia>;
  leadsGrupos: LeadGrupo[];
  // Novos campos para compatibilidade com a view
  metricas: ReturnType<typeof calcularMetricas> & { leads_superior: number; leads_medio: number };
  serieHistorica: ReturnType<typeof agruparPorDia>;
  rankingCriativos: CriativoComMetricas[];
  rankingPublicos: ConjuntoComMetricas[];
  relatorioCampanhas: any[];
}

export function useDashboard(slug: string, dateRange: { from: Date; to: Date }, lancamentoId?: string) {
  return useQuery<DashboardResult, Error>({
    queryKey: ['dashboard', slug, dateRange.from, dateRange.to, lancamentoId],
    queryFn: async () => {
      // 1. Busca cliente no AppWrite pelo slug
      const cliente = await buscarClientePorSlug(slug);

      if (!cliente.spreadsheet_id && !cliente.$id) {
        throw new Error('Cliente inválido ou não configurado corretamente.');
      }

      let campanhasRaw: any[] = [];
      let conjuntosRaw: any[] = [];
      let criativosRaw: any[] = [];
      let metricasDiarias: MetricaDiaria[] = [];
      let leadsGrupos: LeadGrupo[] = [];

      // A lógica principal agora obedece rigorosamente a fonte_dados configurada no cliente.
      const fonte = cliente.fonte_dados || 'appwrite';

      if (fonte === 'appwrite') {
        campanhasRaw = await fetchCampanhasAppwrite(cliente.$id);
        conjuntosRaw = await fetchConjuntosAppwrite(cliente.$id);
        criativosRaw = await fetchCriativosAppwrite(cliente.$id);
        
        let appwriteMetricas = await fetchMetricasAppwrite(cliente.$id, dateRange.from, dateRange.to);
        
        // Se houver lancamentoId, filtra as campanhas e métricas correspondentes àquele lançamento
        // Opcional: filtragem baseada em alguma lógica. Por ora, vamos assumir que as métricas podem 
        // vir amarradas ou simplesmente listamos. A prompt diz "filtrado pelo lancamento_id".
        // O webhook_url (não tem lancamento_id na metrica, mas para "leads" vai usar a palavra-chave).
        // Vamos apenas ignorar até ter a Graph API, mas para inputs manuais, vamos filtrar também se houver
        if (lancamentoId) {
          appwriteMetricas = appwriteMetricas.filter((m: any) => m.lancamento_id === lancamentoId);
        }

        metricasDiarias = (appwriteMetricas || []) as unknown as MetricaDiaria[];
        
        if (cliente.tipo_campanha === 'leads' || cliente.tipo_campanha === 'ambos') {
          let manualInputs = await fetchManualInputsAppwrite(cliente.$id, dateRange.from, dateRange.to);
          if (lancamentoId) {
             manualInputs = manualInputs.filter((m: any) => m.lancamento_id === lancamentoId);
          }

          let importedLeads: any[] = [];
          if (lancamentoId) {
             importedLeads = await fetchLeadEntriesAppwrite(lancamentoId, dateRange.from, dateRange.to);
          }
          
          function classificarEscolaridade(escolaridade: string): 'superior' | 'medio' {
            const medio = ['ensino médio completo', 'ensino medio completo'];
            const valor = escolaridade?.toLowerCase().trim() ?? '';
            return medio.includes(valor) ? 'medio' : 'superior';
          }

          if (importedLeads.length > 0) {
            // Conta agrupada por data
            const contagemPorData: Record<string, { superior: number, medio: number }> = {};
            importedLeads.forEach(lead => {
               const d = lead.data || 'N/A';
               if (!contagemPorData[d]) contagemPorData[d] = { superior: 0, medio: 0 };
               
               const classificacao = classificarEscolaridade(lead.escolaridade);
               if (classificacao === 'superior') {
                 contagemPorData[d].superior++;
               } else {
                 contagemPorData[d].medio++;
               }
            });
            
            leadsGrupos = Object.keys(contagemPorData).map(d => ({
               data: d,
               leads_ensino_superior: contagemPorData[d].superior,
               leads_ensino_medio: contagemPorData[d].medio
            }));
          } else {
            leadsGrupos = manualInputs.map((m: any) => ({
              data: m.data,
              leads_ensino_superior: m.leads_no_grupo_superior,
              leads_ensino_medio: m.leads_no_grupo_medio
            }));
          }
        }
      } else if (fonte === 'sheets') {
        if (!cliente.spreadsheet_id) {
           throw new Error('Fonte de dados configurada como Google Sheets, mas o ID da planilha não foi informado no cadastro.');
        }
        [campanhasRaw, conjuntosRaw, criativosRaw, metricasDiarias] = await Promise.all([
          fetchCampanhas(cliente.spreadsheet_id),
          fetchConjuntos(cliente.spreadsheet_id),
          fetchCriativos(cliente.spreadsheet_id),
          fetchMetricasDiarias(cliente.spreadsheet_id, dateRange.from, dateRange.to),
        ]);

        if (cliente.tipo_campanha === 'leads' || cliente.tipo_campanha === 'ambos') {
          leadsGrupos = await fetchLeadsGrupos(cliente.spreadsheet_id, dateRange.from, dateRange.to);
        }
      } else if (fonte === 'meta_api') {
        if (!cliente.meta_ad_account_id || !cliente.meta_access_token) {
           throw new Error('Atenção: A fonte de dados foi configurada para Meta Ads API, mas as credenciais (Token e Account ID) não foram preenchidas no painel do cliente.');
        }
        
        // TODO: Substituir pelas integrações reais da Graph API (Dashboard Direto)
        // A regra 4 e 5 são aplicáveis ao painel. O frontend do dashboard reflete um catch contendo a mensagem exigida.
        throw new Error('O motor Meta Ads Graph API está em manutenção temporária. Por favor repassar credenciais e use o webhook/Appwrite no momento.');
      } else {
        throw new Error('Fonte de dados desconhecida ou corrompida.');
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
      const criativosOrdenados = [...criativosComMetricas].sort((a, b) => b.ctr - a.ctr);
      criativosComMetricas = criativosComMetricas.map(c => {
         const index = criativosOrdenados.findIndex(o => o.id === c.id);
         return {
           ...c,
           performance: calcularPerformance(criativosOrdenados, index)
         }
      })

      // 5. Calcula Performance para os Conjuntos (Públicos)
      const conjuntosOrdenados = [...conjuntosComMetricas].sort((a, b) => {
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

      // Calcula métricas gerais
      const metricasGerais = calcularMetricas(metricasDiarias);
      
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
        leads_medio: 0
      };
      
      // Adiciona métricas de escolaridade vindas da aba LEADS_GRUPOS (ou manual_inputs)
      const totalSuperior = leadsGrupos.reduce((acc, g) => acc + g.leads_ensino_superior, 0);
      const totalMedio = leadsGrupos.reduce((acc, g) => acc + g.leads_ensino_medio, 0);

      const metricasExtended = {
        ...metricasGerais,
        leads_superior: totalSuperior,
        leads_medio: totalMedio
      };

      const finalMetricas = metricasExtended.investimento > 0 || metricasExtended.impressoes > 0 ? metricasExtended : metricasVazias;
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
        rankingPublicos: conjuntosComMetricas ?? [],
        relatorioCampanhas: campanhasComMetricas ?? [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache (limite da API do sheets)
    enabled: !!slug && !!dateRange.from && !!dateRange.to,
  });
}
