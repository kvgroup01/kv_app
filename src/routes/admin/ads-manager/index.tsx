import * as React from "react";
import { subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  LayoutDashboard, ChevronDown, Play, Image as ImageIcon,
  Search, RefreshCw, TrendingUp, Zap
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { DateRangePicker } from "../../../components/shared/DateRangePicker";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { toast } from "sonner";
import {
  useAdsManagerOverview,
  useAdsManagerCampaigns,
  useAdsManagerAdsetsByMultipleCampaigns,
  useAdsManagerAdsByMultipleAdsets,
  useAdsManagerBoostedPosts,
  useClientesComInstagram,
  toggleEntityStatus,
  type AdsCampaign,
} from "../../../hooks/useAdsManager";
import { useQueryClient } from "@tanstack/react-query";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

function formatNum(v: number) {
  if (!v) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return String(Math.round(v));
}

function StatusDot({ status, onClick, loading }: { status: string; onClick: () => void; loading?: boolean }) {
  const isActive = status?.toUpperCase() === "ACTIVE" || status?.toUpperCase() === "ATIVO";
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-3.5 w-3.5 rounded-full cursor-pointer transition-all",
        isActive ? "bg-blue-500" : "border-2 border-muted-foreground bg-transparent",
        loading && "animate-pulse opacity-50"
      )}
    />
  );
}

export default function AdsManagerPage() {
  const queryClient = useQueryClient();
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [selectedLancamentoId, setSelectedLancamentoId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"campanhas" | "conjuntos" | "anuncios">("campanhas");
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);
  const [filterCampaignIds, setFilterCampaignIds] = React.useState<string[]>([]);
  const [filterAdsetIds, setFilterAdsetIds] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date()
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"TODOS" | "ACTIVE" | "PAUSED">("TODOS");
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const { data: overviewData } = useAdsManagerOverview();
  const contas = overviewData?.accounts || [];
  const { data: campData, isLoading: loadingCamps } = useAdsManagerCampaigns(selectedAccountId, dateRange?.from, dateRange?.to);
  const { data: adsetsData, isLoading: loadingAdsets } = useAdsManagerAdsetsByMultipleCampaigns(filterCampaignIds, dateRange?.from, dateRange?.to);
  const { data: adsData, isLoading: loadingAds } = useAdsManagerAdsByMultipleAdsets(filterAdsetIds, dateRange?.from, dateRange?.to);

  const campaigns = campData?.campaigns || [];
  const adsets = adsetsData?.adsets || [];
  const ads = adsData?.ads || [];

  const currentItems = activeTab === "campanhas" ? campaigns : activeTab === "conjuntos" ? adsets : ads;

  const filteredItems = currentItems.filter((item: any) => {
    if (searchQuery && !item.nome?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "TODOS") {
      const s = item.status?.toUpperCase();
      if (statusFilter === "ACTIVE" && s !== "ACTIVE" && s !== "ATIVO") return false;
      if (statusFilter === "PAUSED" && s !== "PAUSED" && s !== "PAUSADO") return false;
    }
    return true;
  });

  React.useEffect(() => {
    if (selectedClienteId) {
      const conta = contas.find((c: any) => c.meta_account_id === selectedClienteId);
      if (conta) {
        setSelectedAccountId(conta.meta_account_id);
        // pegar lancamento_id do primeiro lancamento da conta para uso no toggle
        const primeiroLanc = conta.lancamentos?.[0];
        if (primeiroLanc) setSelectedLancamentoId(primeiroLanc.id);
      }
      setCheckedIds([]);
      setFilterCampaignIds([]);
      setFilterAdsetIds([]);
      setActiveTab("campanhas");
    } else {
      setSelectedAccountId(null);
      setSelectedLancamentoId(null);
    }
  }, [selectedClienteId, contas]);

  const handleToggle = async (item: any) => {
    const newStatus = (item.status?.toUpperCase() === "ACTIVE" || item.status?.toUpperCase() === "ATIVO") ? "PAUSED" : "ACTIVE";
    const metaId = activeTab === "anuncios"
      ? item.meta_ad_id
      : activeTab === "campanhas"
      ? (item.meta_campaign_id || item.id)
      : (item.meta_adset_id || item.id);
    const lancId = item.lancamento_id || selectedLancamentoId;
    if (!lancId) { toast.error("Lançamento não encontrado para obter token"); return; }
    setTogglingId(item.id);
    try {
      await toggleEntityStatus(metaId, activeTab === "campanhas" ? "campaign" : activeTab === "conjuntos" ? "adset" : "ad", newStatus, lancId);
      toast.success(`${newStatus === "ACTIVE" ? "Ativado" : "Pausado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["ads-manager-campaigns"] });
      if (activeTab === "conjuntos" || filterCampaignIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-adsets-filtered"] });
      if (activeTab === "anuncios" || filterAdsetIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-ads-filtered"] });
    } catch(e: any) {
      toast.error(e.message || "Erro ao alterar status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleAtivar = async () => {
    const itemsToToggle = currentItems.filter((i: any) => checkedIds.includes(i.id));
    await Promise.allSettled(itemsToToggle.map((item: any) => {
      const metaId = activeTab === "anuncios"
        ? item.meta_ad_id
        : activeTab === "campanhas"
        ? (item.meta_campaign_id || item.id)
        : (item.meta_adset_id || item.id);
      const lancId = item.lancamento_id || selectedLancamentoId;
      return toggleEntityStatus(metaId, activeTab === "campanhas" ? "campaign" : activeTab === "conjuntos" ? "adset" : "ad", "ACTIVE", lancId!);
    }));
    setCheckedIds([]);
    queryClient.invalidateQueries({ queryKey: ["ads-manager-campaigns"] });
    if (activeTab === "conjuntos" || filterCampaignIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-adsets-filtered"] });
    if (activeTab === "anuncios" || filterAdsetIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-ads-filtered"] });
  };

  const handlePausar = async () => {
    const itemsToToggle = currentItems.filter((i: any) => checkedIds.includes(i.id));
    await Promise.allSettled(itemsToToggle.map((item: any) => {
      const metaId = activeTab === "anuncios"
        ? item.meta_ad_id
        : activeTab === "campanhas"
        ? (item.meta_campaign_id || item.id)
        : (item.meta_adset_id || item.id);
      const lancId = item.lancamento_id || selectedLancamentoId;
      return toggleEntityStatus(metaId, activeTab === "campanhas" ? "campaign" : activeTab === "conjuntos" ? "adset" : "ad", "PAUSED", lancId!);
    }));
    setCheckedIds([]);
    queryClient.invalidateQueries({ queryKey: ["ads-manager-campaigns"] });
    if (activeTab === "conjuntos" || filterCampaignIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-adsets-filtered"] });
    if (activeTab === "anuncios" || filterAdsetIds.length > 0) queryClient.invalidateQueries({ queryKey: ["ads-manager-ads-filtered"] });
  };

  const isLoadingTab = activeTab === "campanhas" ? loadingCamps : activeTab === "conjuntos" ? loadingAdsets : loadingAds;

  const totalResultados = filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.resultados || 0), 0);
  const totalAlcance = filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.alcance || 0), 0);
  const totalImpressoes = filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.impressoes || 0), 0);
  const totalCliques = filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.cliques || 0), 0);
  const totalInvestimento = filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.investimento || 0), 0);
  const avgCtr = filteredItems.length > 0 ? (filteredItems.reduce((acc: number, cur: any) => acc + (cur.metricas?.ctr || 0), 0) / filteredItems.length) : 0;

  return (
    <div className="space-y-0 animate-in fade-in-50 duration-500 container mx-auto p-4 md:p-8">
      <div className="py-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-[#FBB03B]" />
          Gerenciador de Anúncios
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie campanhas no estilo Meta Ads
        </p>
      </div>

      <div className="border rounded-t-lg bg-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={selectedClienteId || ""} onValueChange={setSelectedClienteId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Selecionar conta Meta Ads..." />
          </SelectTrigger>
          <SelectContent>
            {contas.map((c: any) => (
              <SelectItem key={c.meta_account_id} value={c.meta_account_id}>
                {c.nome || c.meta_account_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAccountId && (
          <Badge variant="outline" className="text-xs">Conta: {selectedAccountId}</Badge>
        )}

        <div className="flex-1" />

        <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full sm:w-[280px]" />
      </div>

      {checkedIds.length > 0 && (
        <div className="bg-[#FBB03B]/10 border border-[#FBB03B]/30 p-3 flex items-center gap-3">
          <span className="text-sm font-medium">{checkedIds.length} selecionado(s)</span>
          <Button variant="outline" size="sm" onClick={handleAtivar}>Ativar</Button>
          <Button variant="outline" size="sm" onClick={handlePausar}>Pausar</Button>
          <Button variant="ghost" size="sm" onClick={() => setCheckedIds([])}>Limpar seleção</Button>
        </div>
      )}

      <div className="border-x border-b border-border bg-card">
        <div className="flex flex-wrap border-b border-border">
          <button
            onClick={() => {
              setCheckedIds([]);
              setActiveTab("campanhas");
            }}
            className={cn(
              "px-4 py-3 text-sm transition-colors",
              activeTab === "campanhas" ? "border-b-2 border-[#FBB03B] text-foreground font-semibold -mb-[2px]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Campanhas ({campaigns.length})
          </button>
          <button
            onClick={() => {
              if (activeTab === "campanhas" && checkedIds.length > 0) {
                setFilterCampaignIds([...checkedIds]);
              }
              setCheckedIds([]);
              setActiveTab("conjuntos");
            }}
            className={cn(
              "px-4 py-3 text-sm transition-colors",
              activeTab === "conjuntos" ? "border-b-2 border-[#FBB03B] text-foreground font-semibold -mb-[2px]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Conjuntos de anúncios ({adsets.length})
          </button>
          <button
            onClick={() => {
              if (activeTab === "conjuntos" && checkedIds.length > 0) {
                setFilterAdsetIds([...checkedIds]);
              }
              setCheckedIds([]);
              setActiveTab("anuncios");
            }}
            className={cn(
              "px-4 py-3 text-sm transition-colors",
              activeTab === "anuncios" ? "border-b-2 border-[#FBB03B] text-foreground font-semibold -mb-[2px]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anúncios ({ads.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
          <Input 
            placeholder="Pesquisar por nome..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full sm:w-64 border-[#FBB03B]/30 focus-visible:ring-[#FBB03B]"
          />
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "TODOS" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("TODOS")}
              className={statusFilter === "TODOS" ? "bg-[#FBB03B] text-black hover:bg-[#FBB03B]/80" : ""}
            >Todos</Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ACTIVE")}
              className={statusFilter === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : ""}
            >Ativos</Button>
            <Button
              variant={statusFilter === "PAUSED" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("PAUSED")}
              className={statusFilter === "PAUSED" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
            >Pausados</Button>
          </div>

          {filterCampaignIds.length > 0 && activeTab === "conjuntos" && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="secondary" className="font-normal text-xs bg-[#FBB03B]/15 text-[#FBB03B] border-[#FBB03B]/30">
                Filtrado por {filterCampaignIds.length} campanha(s)
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setFilterCampaignIds([])} className="h-6 px-2 text-xs">
                ✕ Limpar
              </Button>
            </div>
          )}

          {filterAdsetIds.length > 0 && activeTab === "anuncios" && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="secondary" className="font-normal text-xs bg-[#FBB03B]/15 text-[#FBB03B] border-[#FBB03B]/30">
                Filtrado por {filterAdsetIds.length} conjunto(s)
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setFilterAdsetIds([])} className="h-6 px-2 text-xs">
                ✕ Limpar
              </Button>
            </div>
          )}
        </div>

        <div className="p-0">
          {!selectedAccountId ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-card rounded-b-lg">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione um cliente para começar</p>
            </div>
          ) : isLoadingTab ? (
            <table className="w-full text-sm">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4" colSpan={9}><Skeleton className="h-10 w-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum item encontrado para os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-b-lg">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/50 text-xs text-muted-foreground border-b uppercase">
                  <tr>
                    <th className="p-3 font-medium w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-muted-foreground accent-[#FBB03B]"
                        checked={filteredItems.length > 0 && checkedIds.length === filteredItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckedIds(filteredItems.map((i: any) => i.id));
                          } else {
                            setCheckedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3 font-medium w-8"></th>
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium text-right">Resultados</th>
                    <th className="p-3 font-medium text-right">Alcance</th>
                    <th className="p-3 font-medium text-right">Impressões</th>
                    <th className="p-3 font-medium text-right">Cliques</th>
                    <th className="p-3 font-medium text-right">CTR</th>
                    <th className="p-3 font-medium text-right">Investimento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox"
                          className="rounded border-muted-foreground accent-[#FBB03B]"
                          checked={checkedIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCheckedIds(p => [...p, item.id]);
                            } else {
                              setCheckedIds(p => p.filter(x => x !== item.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <StatusDot
                          status={item.status || "PAUSED"}
                          loading={togglingId === item.id}
                          onClick={() => handleToggle(item)}
                        />
                      </td>
                      <td className="p-3 max-w-[300px]">
                        <div className="flex items-center gap-2">
                          {activeTab === "anuncios" && item.thumbnail_url && (
                             <img src={item.thumbnail_url} className="h-8 w-8 rounded object-cover inline" />
                          )}
                          <div className="overflow-hidden">
                            <span className="font-medium truncate block">{item.nome}</span>
                            {activeTab !== "campanhas" && item.campaign_nome && (
                              <span className="text-xs text-muted-foreground truncate block">{item.campaign_nome}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">{formatNum(item.metricas?.resultados)}</td>
                      <td className="p-3 text-right">{formatNum(item.metricas?.alcance)}</td>
                      <td className="p-3 text-right">{formatNum(item.metricas?.impressoes)}</td>
                      <td className="p-3 text-right">{formatNum(item.metricas?.cliques)}</td>
                      <td className="p-3 text-right">{(item.metricas?.ctr || 0) === 0 ? "—" : `${item.metricas?.ctr?.toFixed(2)}%`}</td>
                      <td className="p-3 text-right font-semibold">{formatBRL(item.metricas?.investimento)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-semibold border-t">
                  <tr>
                    <td className="p-3 text-center">—</td>
                    <td className="p-3">—</td>
                    <td className="p-3">Total ({filteredItems.length} itens)</td>
                    <td className="p-3 text-right">{formatNum(totalResultados)}</td>
                    <td className="p-3 text-right">{formatNum(totalAlcance)}</td>
                    <td className="p-3 text-right">{formatNum(totalImpressoes)}</td>
                    <td className="p-3 text-right">{formatNum(totalCliques)}</td>
                    <td className="p-3 text-right">{avgCtr === 0 ? "—" : `${avgCtr.toFixed(2)}%`}</td>
                    <td className="p-3 text-right">{formatBRL(totalInvestimento)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
