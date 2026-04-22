import * as React from 'react';
import { useParams, useSearchParams } from 'react-router';
import { startOfDay, subDays, endOfDay, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { AlertCircle } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

import { useDashboard } from '../../hooks/useDashboard';
import { DateRangePicker } from '../../components/shared/DateRangePicker';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
// Componentes de Dashboard
import { MetricCards } from '../../components/dashboard/MetricCards';
import { FunnelWhatsApp } from '../../components/dashboard/FunnelWhatsApp';
import { FunnelLeads } from '../../components/dashboard/FunnelLeads';
import { InvestimentoChart } from '../../components/dashboard/InvestimentoChart';
import { LeadsQualificadosChart } from '../../components/dashboard/LeadsQualificadosChart';
import { ClassificacaoTrafico } from '../../components/dashboard/ClassificacaoTrafico';
import { GruposWhatsApp } from '../../components/dashboard/GruposWhatsApp';
import { VisaoFinanceiraLeads } from '../../components/dashboard/VisaoFinanceiraLeads';
import { CampanhasTable } from '../../components/dashboard/CampanhasTable';
import { CreativosGrid } from '../../components/dashboard/CreativosGrid';
import { RankingTable } from '../../components/dashboard/RankingTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// === MEMOIZED VIEWS ===
// React.memo previne re-renderizações indesejadas (zero flickering) ao migrar o estado das Tabs.

const WhatsAppDashboardView = React.memo(({ metricas, serieHistorica, relatorioCampanhas, rankingCriativos, rankingPublicos, setVendasLocais }: any) => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* REGRA ABSOLUTA: Funil Azul exclusivo do WhatsApp */}
      <FunnelWhatsApp 
         metricas={metricas} 
         onVendasChange={(v) => setVendasLocais((prev: any) => ({...prev, whatsapp: v}))}
      />
      <InvestimentoChart dados={serieHistorica} tipo="whatsapp" />
    </div>

    <CampanhasTable campanhasComMetricas={relatorioCampanhas} tipo="whatsapp" />
    <CreativosGrid criativos={rankingCriativos} tipo="whatsapp" />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RankingTable 
        titulo="Desempenho por Público (Conjuntos)"
        items={rankingPublicos}
        tipo="publicos"
        campanhaTipo="whatsapp"
      />
      <RankingTable 
        titulo="Desempenho por Criativo"
        items={rankingCriativos}
        tipo="criativos"
        campanhaTipo="whatsapp"
      />
    </div>
  </div>
));

const LeadsDashboardView = React.memo(({ metricas, serieHistorica, relatorioCampanhas, rankingCriativos, rankingPublicos, investimentoLeads, setInvestimentoLeads, gruposWhatsApp, setGruposWhatsApp }: any) => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <VisaoFinanceiraLeads 
      investimentoManual={investimentoLeads} 
      onInvestimentoChange={setInvestimentoLeads} 
      valorUsadoCampanhas={metricas.investimento}
      isLoading={false}
    />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <FunnelLeads 
         dados={serieHistorica}
         metricas={metricas} 
      />
      <LeadsQualificadosChart dados={serieHistorica} isLoading={false} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ClassificacaoTrafico
        leadsEnsino={{
          superior: metricas.leads_superior || 0,
          medio: metricas.leads_medio || 0
        }}
        isLoading={false}
      />
      <GruposWhatsApp 
        value={gruposWhatsApp}
        onChange={setGruposWhatsApp}
      />
    </div>

    <CampanhasTable campanhasComMetricas={relatorioCampanhas} tipo="leads" />
    <CreativosGrid criativos={rankingCriativos} tipo="leads" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RankingTable 
        titulo="Desempenho por Público (Conjuntos)"
        items={rankingPublicos}
        tipo="publicos"
        campanhaTipo="leads"
      />
      <RankingTable 
        titulo="Desempenho por Criativo"
        items={rankingCriativos}
        tipo="criativos"
        campanhaTipo="leads"
      />
    </div>
  </div>
));

export default function DashboardPublico() {
  const { slug } = useParams();
  
  // URL e Search Params para persistência de aba compartilhada
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'whatsapp';

  const handleTabChange = React.useCallback((value: string) => {
    setSearchParams(prev => {
      prev.set('tab', value);
      return prev;
    }, { replace: true });
  }, [setSearchParams]);
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });

  const [vendasLocais, setVendasLocais] = React.useState<{ [key: string]: number }>({});
  const [gruposWhatsApp, setGruposWhatsApp] = React.useState({ ensino_superior: 0, ensino_medio: 0 });
  const [investimentoLeads, setInvestimentoLeads] = React.useState(0);

  const { data, isLoading, error } = useDashboard(
    slug || '', 
    { 
      from: dateRange?.from || startOfDay(subDays(new Date(), 30)), 
      to: dateRange?.to || endOfDay(new Date()) 
    }
  );

  if (error) {
    return (
      <div className="min-h-screen bg-(--content-bg) flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-(--text-primary)">Dashboard indisponível</h1>
            <p className="text-(--text-secondary) text-[14px]">O cliente não foi encontrado ou ocorreu um problema durante a extração de dados do Google Sheets. Verifique o link e a integração.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-(--content-bg) p-4 md:p-10 space-y-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-(--card-bg) p-8 rounded-[12px] border border-(--card-border) shadow-premium animate-pulse">
           <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-white/5 rounded-full" />
             <div className="space-y-3">
                <div className="h-6 w-48 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded" />
             </div>
           </div>
           <div className="w-[300px] h-10 bg-white/5 rounded" />
        </div>
        <DashboardSkeleton tipo="ambos" />
      </div>
    );
  }

  const { cliente, metricas } = data;
  const tipo = cliente.tipo_campanha;

  return (
    <div className="min-h-screen bg-(--content-bg) pb-20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-10">
        
        {/* Header Responsivo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-(--sidebar-bg) p-8 rounded-[12px] border border-(--card-border) shadow-premium">
           <div className="flex items-center gap-6">
             {cliente.logo_url ? (
               <div className="w-16 h-16 rounded-[14px] border border-(--card-border) bg-black p-0.5 overflow-hidden shadow-sm">
                  <img src={cliente.logo_url} alt={cliente.nome} className="w-full h-full object-contain" />
               </div>
             ) : (
               <div className="w-16 h-16 bg-white text-black font-bold text-xl flex items-center justify-center rounded-[14px] uppercase">
                 {cliente.nome.substring(0,2)}
               </div>
             )}
             <div>
               <h1 className="text-2xl font-bold text-(--text-primary) tracking-tight">{cliente.nome}</h1>
               <div className="flex items-center gap-3 mt-2">
                 {tipo === 'whatsapp' && <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">WhatsApp Performance</span>}
                 {tipo === 'leads' && <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-blue-500/10 text-blue-500 border border-blue-500/20">Leads Generation</span>}
                 {tipo === 'ambos' && <span className="text-[11px] px-2 py-0.5 rounded-[4px] font-medium uppercase tracking-tight bg-purple-500/10 text-purple-500 border border-purple-500/20">Híbrido</span>}
                 <span className="text-[11px] text-(--text-tertiary) uppercase tracking-wide hidden sm:inline-block">Tempo real: ON</span>
               </div>
             </div>
           </div>
           
           <DateRangePicker 
             value={dateRange} 
             onChange={setDateRange} 
             className="w-full md:w-auto bg-[#1a1a1a] border-(--card-border) h-11 px-4 text-(--text-primary)"
           />
        </div>

        {/* Visão Unificada / Métrica Global Fixa Acima de Tudo */}
        <MetricCards isLoading={false} metricas={metricas} tipo={tipo} />

        {/* Renderização Condicional baseada na Flag da Campanha do Cliente */}
        {tipo === 'whatsapp' && <WhatsAppDashboardView {...data} setVendasLocais={setVendasLocais} />}
        
        {tipo === 'leads' && (
          <LeadsDashboardView 
             {...data} 
             investimentoLeads={investimentoLeads} 
             setInvestimentoLeads={setInvestimentoLeads} 
             gruposWhatsApp={gruposWhatsApp} 
             setGruposWhatsApp={setGruposWhatsApp} 
          />
        )}

        {tipo === 'ambos' && (
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full border-none shadow-none bg-transparent animate-in fade-in duration-700">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-[#141414] border border-(--card-border) p-1 rounded-xl h-11 mx-auto lg:mx-0">
              <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-[13px] font-medium transition-all">WhatsApp View</TabsTrigger>
              <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-[13px] font-medium transition-all">Leads View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="whatsapp" className="mt-0 focus-visible:outline-none">
              <WhatsAppDashboardView {...data} setVendasLocais={setVendasLocais} />
            </TabsContent>
            
            <TabsContent value="leads" className="mt-0 focus-visible:outline-none">
              <LeadsDashboardView 
                {...data} 
                investimentoLeads={investimentoLeads} 
                setInvestimentoLeads={setInvestimentoLeads} 
                gruposWhatsApp={gruposWhatsApp} 
                setGruposWhatsApp={setGruposWhatsApp} 
              />
            </TabsContent>
          </Tabs>
        )}

      </div>

      {/* Footer Público */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 mt-12 pt-10 border-t border-(--card-border)">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-(--text-tertiary) uppercase tracking-wider font-medium">
          <p>
            Extração: <span className="text-(--text-secondary)">{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </p>
          <div className="flex items-center gap-6">
             <p className="hidden sm:block">Análise Transparente</p>
             <div className="h-3 w-px bg-(--card-border) hidden sm:block" />
             <p className="text-(--text-primary) font-semibold tracking-widest">Powered by DASHBOARD KV</p>
          </div>
        </div>
      </div>
    </div>
  );
}

