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

function StatusToggle({ status, onClick, loading }: { status: string; onClick: () => void; loading?: boolean }) {
  const isActive = status?.toUpperCase() === "ACTIVE" || status?.toUpperCase() === "ATIVO";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={loading}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          isActive ? "translate-x-4" : "translate-x-0",
          loading && "animate-pulse"
        )}
      />
    </button>
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
  const { data: adsetsData, isLoading: loadingAdsets } = useAdsManagerAdsetsByMultipleCampaigns(filterCampaignIds, dateRange?.from, dateRange?.to, selectedAccountId);
  const { data: adsData, isLoading: loadingAds } = useAdsManagerAdsByMultipleAdsets(filterAdsetIds, dateRange?.from, dateRange?.to, selectedAccountId);

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
    const metaId = item.meta_ad_id || item.meta_campaign_id || item.id;
    if (!selectedAccountId) { toast.error("Conta não selecionada"); return; }
    setTogglingId(item.id);
    try {
      await toggleEntityStatus(metaId, activeTab === "campanhas" ? "campaign" : activeTab === "conjuntos" ? "adset" : "ad", newStatus, selectedAccountId);
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>
          Gerenciador de Anúncios
        </h2>
        <p className="text-[13px] text-(--text-secondary) mt-1">
          Visualize e gerencie campanhas no estilo Meta Ads
        </p>
      </div>

      <div className="bg-(--card-bg) border border-(--card-border) rounded-[12px] p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedClienteId || ""} onValueChange={setSelectedClienteId}>
          <SelectTrigger className="w-full sm:w-64 border-(--card-border) bg-(--card-hover) text-(--text-primary) rounded-[8px] text-[13px]">
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
          <Badge variant="outline" className="text-[11px] border-(--card-border) text-(--text-tertiary)">Conta: {selectedAccountId}</Badge>
        )}

        <div className="flex-1" />

        <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full sm:w-[280px]" />
      </div>

      {checkedIds.length > 0 && (
        <div className="bg-[#FBB03B]/8 border border-[#FBB03B]/20 rounded-[10px] p-3 flex items-center gap-3">
          <span className="text-[13px] font-medium text-(--text-primary)">{checkedIds.length} selecionado(s)</span>
          <Button variant="outline" size="sm" className="h-7 text-[12px] border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover) rounded-[7px]" onClick={handleAtivar}>Ativar</Button>
          <Button variant="outline" size="sm" className="h-7 text-[12px] border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover) rounded-[7px]" onClick={handlePausar}>Pausar</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[12px] text-(--text-tertiary) hover:text-(--text-primary) rounded-[7px]" onClick={() => setCheckedIds([])}>Limpar</Button>
        </div>
      )}

      <div className="bg-(--card-bg) border border-(--card-border) rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap border-b border-(--card-border)">
          <button
            onClick={() => {
              setCheckedIds([]);
              setActiveTab("campanhas");
            }}
            className={cn(
              "px-4 py-3 text-sm transition-colors",
              activeTab === "campanhas" ? "border-b-2 border-[#FBB03B] text-(--text-primary) font-semibold -mb-[2px] text-[13px]" : "text-(--text-tertiary) hover:text-(--text-primary) text-[13px]"
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
              activeTab === "conjuntos" ? "border-b-2 border-[#FBB03B] text-(--text-primary) font-semibold -mb-[2px] text-[13px]" : "text-(--text-tertiary) hover:text-(--text-primary) text-[13px]"
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
              activeTab === "anuncios" ? "border-b-2 border-[#FBB03B] text-(--text-primary) font-semibold -mb-[2px] text-[13px]" : "text-(--text-tertiary) hover:text-(--text-primary) text-[13px]"
            )}
          >
            Anúncios ({ads.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center p-3 border-b border-(--card-border)">
          <Input 
            placeholder="Pesquisar por nome..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full sm:w-64 h-8 text-[13px] border-(--card-border) bg-(--card-hover) focus-visible:ring-[#FBB03B] rounded-[8px]"
          />
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "TODOS" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("TODOS")}
              className={statusFilter === "TODOS" ? "h-7 text-[12px] rounded-[7px] bg-[#FBB03B] text-black hover:bg-[#f5a623]" : "h-7 text-[12px] rounded-[7px] border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover)"}
            >Todos</Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ACTIVE")}
              className={statusFilter === "ACTIVE" ? "h-7 text-[12px] rounded-[7px] bg-green-600 hover:bg-green-700 text-white" : "h-7 text-[12px] rounded-[7px] border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover)"}
            >Ativos</Button>
            <Button
              variant={statusFilter === "PAUSED" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("PAUSED")}
              className={statusFilter === "PAUSED" ? "h-7 text-[12px] rounded-[7px] bg-amber-500 hover:bg-amber-600 text-black" : "h-7 text-[12px] rounded-[7px] border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover)"}
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
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <LayoutDashboard className="w-10 h-10 text-(--text-tertiary) opacity-30 mb-3" />
              <p className="text-[13px] text-(--text-tertiary)">Selecione uma conta para começar</p>
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
                <thead className="bg-(--card-hover) text-[10px] text-(--text-tertiary) border-b border-(--card-border) uppercase tracking-wider">
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
                    <tr key={item.id} className="border-t border-(--card-border) hover:bg-(--card-hover) transition-colors">
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
                        <StatusToggle
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
                              <span className="text-[11px] text-(--text-tertiary) truncate block">{item.campaign_nome}</span>
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
                <tfoot className="bg-(--card-hover) font-semibold border-t border-(--card-border) text-[13px] text-(--text-primary)">
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
