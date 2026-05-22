import * as React from "react";
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Play,
  Zap,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
} from "lucide-react";
import { subDays } from "date-fns";
import { cn } from "../../../lib/utils";
import { DateRangePicker } from "../../../components/shared/DateRangePicker";
import { type DateRange } from "react-day-picker";
import {
  useAdsManagerOverview,
  useAdsManagerCampaigns,
  useAdsManagerAdsets,
  useAdsManagerAds,
  useAdsManagerBoostedPosts,
  useClientesComInstagram,
} from "../../../hooks/useAdsManager";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}
function formatNum(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return String(Math.round(v));
}
function statusColor(s: string) {
  const u = s?.toUpperCase();
  if (u === "ACTIVE" || u === "ativo")
    return "bg-green-500/15 text-green-600 border-green-500/30";
  if (u === "PAUSED" || u === "pausado")
    return "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
  return "bg-muted text-muted-foreground";
}
function statusLabel(s: string) {
  const u = s?.toUpperCase();
  if (u === "ACTIVE" || u === "ATIVO") return "Ativo";
  if (u === "PAUSED" || u === "PAUSADO") return "Pausado";
  if (u === "ARCHIVED") return "Arquivado";
  if (u === "FINALIZADO") return "Finalizado";
  return s || "-";
}

function AdsetRow({ adset, from, to }: { adset: any; from?: Date; to?: Date }) {
  const [expanded, setExpanded] = React.useState(false);
  const { data: adsData, isLoading } = useAdsManagerAds(
    expanded ? adset.id : null,
    from,
    to,
  );

  return (
    <React.Fragment>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-muted/30 cursor-pointer border-b transition-colors"
      >
        <td className="p-4 pl-12 flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-medium">{adset.nome}</div>
          </div>
        </td>
        <td className="p-4 text-xs text-muted-foreground"></td>
        <td className="p-4 text-xs text-muted-foreground">
          {adset.total_ads} ads
        </td>
        <td className="p-4 font-semibold">
          {formatBRL(adset.metricas.investimento)}
        </td>
        <td className="p-4">{formatNum(adset.metricas.impressoes)}</td>
        <td className="p-4">{formatNum(adset.metricas.cliques)}</td>
        <td className="p-4">-</td>
        <td className="p-4">{adset.metricas.resultados}</td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={8} className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2 pl-16">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="p-6 pl-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {adsData?.ads?.map((ad: any) => (
                  <div
                    key={ad.id}
                    className="flex gap-3 bg-card p-3 rounded-lg border"
                  >
                    {ad.thumbnail_url ? (
                      <img
                        src={ad.thumbnail_url}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : ad.isVideo ? (
                      <Play className="w-12 h-12 p-3 bg-muted rounded" />
                    ) : (
                      <ImageIcon className="w-12 h-12 p-3 bg-muted rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        title={ad.nome}
                      >
                        {ad.nome}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{formatBRL(ad.metricas.investimento)}</span>
                        <span>•</span>
                        <span>CTR {ad.metricas.ctr.toFixed(2)}%</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {ad.isVideo && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0"
                          >
                            Vídeo
                          </Badge>
                        )}
                        {ad.instagramShortcode && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 bg-[#FBB03B]/15 text-[#FBB03B] border-[#FBB03B]/30"
                          >
                            Instagram
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function CampaignRow({
  campaign,
  from,
  to,
}: {
  campaign: any;
  from?: Date;
  to?: Date;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { data: adsetsData, isLoading } = useAdsManagerAdsets(
    expanded ? campaign.id : null,
    from,
    to,
  );

  return (
    <React.Fragment>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-muted/30 cursor-pointer border-b transition-colors"
      >
        <td className="p-4 flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div>
            <div className="font-medium text-sm">{campaign.nome}</div>
            {campaign.lancamento_nome && (
              <div className="text-xs text-muted-foreground">
                {campaign.lancamento_nome}
              </div>
            )}
          </div>
        </td>
        <td className="p-4">
          <Badge variant="outline" className={statusColor(campaign.status)}>
            {statusLabel(campaign.status)}
          </Badge>
        </td>
        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
          {campaign.total_adsets} conj · {campaign.total_ads} ads
        </td>
        <td className="p-4 font-semibold">
          {formatBRL(campaign.metricas.investimento)}
        </td>
        <td className="p-4">{formatNum(campaign.metricas.impressoes)}</td>
        <td className="p-4">{formatNum(campaign.metricas.cliques)}</td>
        <td className="p-4">{campaign.metricas.ctr.toFixed(2)}%</td>
        <td className="p-4">{campaign.metricas.resultados}</td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/5">
          <td colSpan={8} className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {adsetsData?.adsets?.map((adset: any) => (
                    <AdsetRow
                      key={adset.id}
                      adset={adset}
                      from={from}
                      to={to}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function TabContasCampanhas() {
  const [selectedAccountId, setSelectedAccountId] = React.useState<
    string | null
  >(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data: overview, isLoading } = useAdsManagerOverview();
  const { data: campData, isLoading: loadingCamps } = useAdsManagerCampaigns(
    selectedAccountId,
    dateRange?.from,
    dateRange?.to,
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : !overview?.accounts || overview.accounts.length === 0 ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center p-6 text-center shadow-none">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-4">
            Nenhuma conta Meta Ads conectada
          </p>
          <Button variant="outline" asChild>
            <a href="/admin/meta-connect">Conectar Conta</a>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.accounts.map((acc: any) => (
            <button
              key={acc.id}
              onClick={() =>
                setSelectedAccountId((prev) =>
                  prev === acc.meta_account_id ? null : acc.meta_account_id,
                )
              }
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all bg-card",
                selectedAccountId === acc.meta_account_id
                  ? "border-[#FBB03B] shadow-md ring-1 ring-[#FBB03B]/20"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="font-semibold text-sm truncate flex-1 pr-2">
                  {acc.nome}
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {acc.moeda}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                ID: {acc.meta_account_id}
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Invest. 30d
                  </div>
                  <div className="font-medium">
                    {formatBRL(acc.metricas.investimento)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Campanhas</div>
                  <div className="font-medium">{acc.metricas.campanhas}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Lançamentos
                  </div>
                  <div className="font-medium">{acc.lancamentos.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Anúncios</div>
                  <div className="font-medium">{acc.metricas.ads}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedAccountId !== null && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">
                Campanhas —{" "}
                {overview?.accounts.find(
                  (a: any) => a.meta_account_id === selectedAccountId,
                )?.nome || "Conta"}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Clique em uma campanha para ver conjuntos e anúncios
              </div>
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-[280px]"
            />
          </CardHeader>
          <CardContent className="p-0">
            {loadingCamps ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !campData?.campaigns || campData.campaigns.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Nenhuma campanha encontrada para este período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Campanha</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Estrutura</th>
                      <th className="p-4 font-medium">Investimento</th>
                      <th className="p-4 font-medium">Impressões</th>
                      <th className="p-4 font-medium">Cliques</th>
                      <th className="p-4 font-medium">CTR</th>
                      <th className="p-4 font-medium">Resultados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campData.campaigns.map((camp: any) => (
                      <CampaignRow
                        key={camp.id}
                        campaign={camp}
                        from={dateRange?.from}
                        to={dateRange?.to}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabPostsImpulsionados() {
  const [clienteId, setClienteId] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [filtro, setFiltro] = React.useState<
    "todos" | "impulsionados" | "organicos"
  >("todos");

  const { data: clientes = [], isLoading: loadingClientes } =
    useClientesComInstagram();
  const { data: boostedData, isLoading } = useAdsManagerBoostedPosts(
    clienteId,
    dateRange?.from,
    dateRange?.to,
  );

  const investimentoTotal = React.useMemo(() => {
    if (!boostedData?.posts) return 0;
    return boostedData.posts.reduce((acc: number, curr: any) => {
      return acc + (curr.impulsionado?.metricas?.investimento || 0);
    }, 0);
  }, [boostedData]);

  const postsFiltrados = React.useMemo(() => {
    if (!boostedData?.posts) return [];
    if (filtro === "impulsionados")
      return boostedData.posts.filter((p: any) => p.impulsionado !== null);
    if (filtro === "organicos")
      return boostedData.posts.filter((p: any) => p.impulsionado === null);
    return boostedData.posts;
  }, [boostedData, filtro]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {loadingClientes ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          <Select
            value={clienteId || ""}
            onValueChange={(v) => setClienteId(v || null)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-[280px]"
        />
      </div>

      {clienteId === null ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center p-6 text-center shadow-none">
          <Zap className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Selecione um cliente para ver os posts impulsionados.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : boostedData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Posts
                </div>
                <div className="text-2xl font-bold">{boostedData.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Impulsionados
                </div>
                <div className="text-2xl font-bold text-[#FBB03B]">
                  {boostedData.impulsionados}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Investimento Pago
                </div>
                <div className="text-2xl font-bold">
                  {formatBRL(investimentoTotal)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setFiltro("todos")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px]",
                filtro === "todos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Todos ({boostedData.total})
            </button>
            <button
              onClick={() => setFiltro("impulsionados")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px]",
                filtro === "impulsionados"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Impulsionados ({boostedData.impulsionados})
            </button>
            <button
              onClick={() => setFiltro("organicos")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px]",
                filtro === "organicos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Orgânicos ({boostedData.total - boostedData.impulsionados})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {postsFiltrados.map((post: any) => (
              <Card
                key={post.id}
                className="overflow-hidden flex flex-col bg-card"
              >
                <div className="relative aspect-square bg-muted">
                  {post.impulsionado && (
                    <Badge className="absolute top-2 left-2 z-10 bg-[#FBB03B] text-black font-bold border-none">
                      IMPULSIONADO
                    </Badge>
                  )}
                  <Badge className="absolute top-2 right-2 z-10 bg-black/60 text-white border-none">
                    {post.media_type === "VIDEO"
                      ? "Reel"
                      : post.media_type === "CAROUSEL_ALBUM"
                        ? "Carrossel"
                        : "Imagem"}
                  </Badge>
                  {post.thumbnail_url || post.media_url ? (
                    <img
                      src={post.thumbnail_url || post.media_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <p className="text-sm line-clamp-2" title={post.caption}>
                    {post.caption || "Sem legenda"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{post.username}
                  </p>

                  <div className="bg-muted/30 p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground font-medium mb-2">
                      ORGÂNICO
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span
                        className="flex items-center gap-1"
                        title="Visualizações/Alcance"
                      >
                        <Eye className="w-3 h-3 text-blue-400" />{" "}
                        {formatNum(
                          Math.max(
                            post.organico.reach || 0,
                            post.organico.views || 0,
                          ),
                        )}
                      </span>
                      <span
                        className="flex items-center gap-1"
                        title="Curtidas"
                      >
                        <Heart className="w-3 h-3 text-red-400" />{" "}
                        {formatNum(post.organico.likes || 0)}
                      </span>
                      <span
                        className="flex items-center gap-1"
                        title="Comentários"
                      >
                        <MessageCircle className="w-3 h-3 text-green-400" />{" "}
                        {formatNum(post.organico.comments || 0)}
                      </span>
                      <span
                        className="flex items-center gap-1"
                        title="Compartilhamentos"
                      >
                        <Share2 className="w-3 h-3 text-purple-400" />{" "}
                        {formatNum(post.organico.shares || 0)}
                      </span>
                      <span className="flex items-center gap-1" title="Salvos">
                        <Bookmark className="w-3 h-3 text-yellow-400" />{" "}
                        {formatNum(post.organico.saved || 0)}
                      </span>
                    </div>
                  </div>

                  {post.impulsionado && (
                    <div className="bg-[#FBB03B]/5 border-t border-[#FBB03B]/30 pt-3 mt-auto flex-1">
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          📢 PERFORMANCE PAGA
                        </span>
                        <a
                          href="https://www.facebook.com/adsmanager"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] flex items-center gap-1 text-primary hover:underline"
                        >
                          Ver no Meta <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {post.impulsionado.metricas ? (
                        <div className="grid grid-cols-2 gap-2 px-2 text-sm">
                          <div>
                            <div className="text-[10px] text-muted-foreground">
                              Investimento
                            </div>
                            <div className="font-semibold text-[#FBB03B]">
                              {formatBRL(
                                post.impulsionado.metricas.investimento,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">
                              Alcance Pago
                            </div>
                            <div className="font-medium">
                              {formatNum(post.impulsionado.metricas.alcance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">
                              Impressões
                            </div>
                            <div className="font-medium">
                              {formatNum(post.impulsionado.metricas.impressoes)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">
                              Cliques
                            </div>
                            <div className="font-medium">
                              {formatNum(post.impulsionado.metricas.cliques)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground px-2 pt-2 pb-1">
                          Sem dados de métricas no período.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdsManagerPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-[#FBB03B]" />
          Gerenciador de Anúncios
        </h1>
        <p className="text-muted-foreground">
          Gerencie contas, campanhas e posts impulsionados.
        </p>
      </div>

      <Tabs defaultValue="contas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Contas & Campanhas
          </TabsTrigger>
          <TabsTrigger
            value="impulsionados"
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Posts Impulsionados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contas">
          <TabContasCampanhas />
        </TabsContent>
        <TabsContent value="impulsionados">
          <TabPostsImpulsionados />
        </TabsContent>
      </Tabs>
    </div>
  );
}
