import * as React from 'react';
import { useParams } from 'react-router';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { useLancamentoPorSlug } from '../../../hooks/useLancamentos';
import { useDashboard } from '../../../hooks/useDashboard';

import { DateRangePicker } from '../../../components/shared/DateRangePicker';
import { DashboardSkeleton } from '../../../components/dashboard/DashboardSkeleton';
import { MetricCards } from '../../../components/dashboard/MetricCards';
import { InvestimentoChart } from '../../../components/dashboard/InvestimentoChart';
import { CampanhasTable } from '../../../components/dashboard/CampanhasTable';
import { CreativosGrid } from '../../../components/dashboard/CreativosGrid';
import { RankingTable } from '../../../components/dashboard/RankingTable';
import { FunnelWhatsApp } from '../../../components/dashboard/FunnelWhatsApp';
import { FunnelLeads } from '../../../components/dashboard/FunnelLeads';
import { LeadsQualificadosChart } from '../../../components/dashboard/LeadsQualificadosChart';
import { ClassificacaoTrafico } from '../../../components/dashboard/ClassificacaoTrafico';
import { VisaoFinanceiraLeads } from '../../../components/dashboard/VisaoFinanceiraLeads';
import { GruposWhatsApp } from '../../../components/dashboard/GruposWhatsApp';

import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardTitle, CardHeader } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { type DateRange } from 'react-day-picker';

type SecaoId = 
  | 'cards_metricas' 
  | 'funil' 
  | 'grafico_investimento' 
  | 'classificacao' 
  | 'tabela_campanhas' 
  | 'grid_criativos' 
  | 'ranking_publicos' 
  | 'ranking_criativos' 
  | 'grupos_whatsapp' 
  | 'visao_financeira';

export default function PublicDashboardLancamento() {
  const { slug, lancamento } = useParams();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  const { 
    data: dataLancamento, 
    isLoading: isLoadingLancamento,
    isError: isErrorLancamento 
  } = useLancamentoPorSlug(slug!, lancamento!);

  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    error: errorDashboard
  } = useDashboard(
    slug!, 
    { from: dateRange?.from || subDays(new Date(), 29), to: dateRange?.to || new Date() },
    dataLancamento?.$id
  );

  // Parse seções configuradas
  const secoes = React.useMemo(() => {
    if (!dataLancamento?.configuracao_secoes) return null;
    try {
      return JSON.parse(dataLancamento.configuracao_secoes) as Record<SecaoId, { ativo: boolean; titulo: string }>;
    } catch {
      return null; // fallback will be handled
    }
  }, [dataLancamento]);

  if (isLoadingLancamento) {
    return <DashboardSkeleton />;
  }

  if (isErrorLancamento || !dataLancamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Página não encontrada</h2>
          <p className="text-muted-foreground">O dashboard que você está procurando não existe ou o link está incorreto.</p>
        </div>
      </div>
    );
  }

  if (dataLancamento.status !== 'ativo') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Ainda não publicado</h2>
          <p className="text-muted-foreground">Este dashboard está sendo configurado e ainda não foi publicado pela agência.</p>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard) {
    return <DashboardSkeleton />;
  }

  if (isErrorDashboard) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background p-4">
         <div className="max-w-md text-center space-y-4">
           <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
             <AlertCircle className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-bold">Erro ao carregar dados</h2>
           <p className="text-muted-foreground">{errorDashboard?.message || 'Erro desconhecido'}</p>
         </div>
       </div>
    );
  }

  const { cliente, metricas, serieHistorica, relatorioCampanhas, rankingCriativos, rankingPublicos, criativos, leadsGrupos } = dashboardData!;

  // Fallbacks if section logic isn't perfectly mapped
  const secaoAtiva = (key: SecaoId) => secoes?.[key]?.ativo ?? true;
  const secaoTitulo = (key: SecaoId, fallback: string) => secoes?.[key]?.titulo || fallback;

  // Render Seções Functions for LEADS mode
  const renderLeadsSeccions = () => (
    <div className="space-y-6">
      {secaoAtiva('cards_metricas') && (
        <section>
           <h3 className="text-xl font-bold mb-4">{secaoTitulo('cards_metricas', 'Métricas Principais')}</h3>
           <MetricCards 
              metricas={metricas}
              tipo={dataLancamento.tipo} 
           />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {secaoAtiva('funil') && (
           <section>
             <h3 className="text-xl font-bold mb-4">{secaoTitulo('funil', 'Funil de Tráfego')}</h3>
             <FunnelLeads 
               leadsTotal={metricas.leads_superior + metricas.leads_medio}
               cliques={metricas.cliques}
               impressoes={metricas.impressoes}
               vendas={0} // Mocado ou vindo do DB
             />
           </section>
         )}
         {secaoAtiva('grafico_investimento') && (
           <section>
             <h3 className="text-xl font-bold mb-4">{secaoTitulo('grafico_investimento', 'Investimento vs Leads')}</h3>
             <LeadsQualificadosChart serieHistorica={serieHistorica} />
           </section>
         )}
      </div>

      {secaoAtiva('classificacao') && (
        <section>
          <h3 className="text-xl font-bold mb-4">{secaoTitulo('classificacao', 'Classificação por Escolaridade')}</h3>
          <ClassificacaoTrafico 
             leadsSuperior={metricas.leads_superior} 
             leadsMedio={metricas.leads_medio}
             totalLeads={metricas.leads_superior + metricas.leads_medio}
          />
        </section>
      )}

      {secaoAtiva('tabela_campanhas') && (
        <section>
           <h3 className="text-xl font-bold mb-4">{secaoTitulo('tabela_campanhas', 'Campanhas')}</h3>
           <CampanhasTable 
              campanhas={relatorioCampanhas} 
              tipo="leads" 
           />
        </section>
      )}

      {secaoAtiva('grid_criativos') && (
        <section>
           <h3 className="text-xl font-bold mb-4">{secaoTitulo('grid_criativos', 'Criativos')}</h3>
           <CreativosGrid criativos={criativos} tipo="leads" />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {secaoAtiva('ranking_publicos') && (
          <section>
            <h3 className="text-xl font-bold mb-4">{secaoTitulo('ranking_publicos', 'Melhores Públicos')}</h3>
            <RankingTable dados={rankingPublicos} tipo="publicos" />
          </section>
        )}
        {secaoAtiva('ranking_criativos') && (
          <section>
            <h3 className="text-xl font-bold mb-4">{secaoTitulo('ranking_criativos', 'Melhores Criativos')}</h3>
            <RankingTable dados={rankingCriativos} tipo="criativos" />
          </section>
        )}
      </div>

      {secaoAtiva('grupos_whatsapp') && (
        <section>
          <h3 className="text-xl font-bold mb-4">{secaoTitulo('grupos_whatsapp', 'Grupos de WhatsApp')}</h3>
          <GruposWhatsApp 
             leadsGrupos={leadsGrupos} 
             totalEnsinoSuperior={1000} // Target configurável no futuro
             totalEnsinoMedio={1000} 
          />
        </section>
      )}

      {secaoAtiva('visao_financeira') && (
        <section>
          <h3 className="text-xl font-bold mb-4">{secaoTitulo('visao_financeira', 'Visão Financeira')}</h3>
          <VisaoFinanceiraLeads 
             investimento={metricas.valor_gasto} 
             vendas={0} // Mock
          />
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {cliente.logo_url && (
                <img src={cliente.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
             )}
            <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-lg font-bold leading-none">{dataLancamento.nome}</h1>
                 <Badge variant="outline" className="text-[10px] uppercase font-semibold h-4 px-1">{dataLancamento.tipo}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{cliente.nome} • Dados atualizados em tempo real</p>
            </div>
          </div>
          <div className="hidden sm:block w-[300px]">
            <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="sm:hidden mb-6">
           <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
        </div>

        {dataLancamento.tipo === 'ambos' ? (
           <Tabs defaultValue="leads" className="space-y-6">
             <TabsList className="bg-muted p-1">
                <TabsTrigger value="leads" className="w-32">Leads</TabsTrigger>
                <TabsTrigger value="whatsapp" className="w-32">WhatsApp</TabsTrigger>
             </TabsList>
             
             <TabsContent value="leads" className="m-0 focus-visible:outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                   {renderLeadsSeccions()}
                </motion.div>
             </TabsContent>
             
             <TabsContent value="whatsapp" className="m-0 focus-visible:outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <MetricCards metricas={metricas} tipo="whatsapp" />
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <FunnelWhatsApp 
                       leadsTotal={metricas.leads_superior + metricas.leads_medio} 
                       cliques={metricas.cliques} 
                       impressoes={metricas.impressoes} 
                     />
                     <InvestimentoChart serieHistorica={serieHistorica} />
                   </div>
                   <CampanhasTable campanhas={relatorioCampanhas} tipo="whatsapp" />
                   <CreativosGrid criativos={criativos} tipo="whatsapp" />
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <RankingTable dados={rankingPublicos} tipo="publicos" />
                     <RankingTable dados={rankingCriativos} tipo="criativos" />
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
            Relatório gerado por <span className="font-semibold text-foreground">Dashboard KV</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
             {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
          </p>
        </div>
      </footer>
    </div>
  );
}
