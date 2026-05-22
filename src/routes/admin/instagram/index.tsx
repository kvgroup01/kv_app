import * as React from "react";
import {
  Instagram,
  RefreshCw,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../../lib/utils";
import { DateRangePicker } from "../../../components/shared/DateRangePicker";
import { type DateRange } from "react-day-picker";
import {
  useInstagramProfiles,
  useInstagramProfileInsights,
  useInstagramMedia,
  useInstagramMediaFresh,
} from "../../../hooks/useInstagramData";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatNumber(num?: number) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function formatDateBr(dateString: string) {
  try {
    return format(parseISO(dateString), "dd MMM", { locale: ptBR });
  } catch (e) {
    return dateString;
  }
}

function ProfileDashboard({ profile }: { profile: any }) {
  const [syncing, setSyncing] = React.useState(false);
  const { data: insights, isLoading: loadingInsights } =
    useInstagramProfileInsights(profile.id);

  const { data: mediaFresh = [], isLoading: loadingFresh } =
    useInstagramMediaFresh(profile.id);
  const { data: mediaInsights = [], isLoading: loadingMediaDb } =
    useInstagramMedia(profile.id);

  const loadingMedia = loadingFresh || loadingMediaDb;

  // Combinar: pegar URL fresca + insights do banco
  const mediaCombinada = React.useMemo(() => {
    return mediaFresh.map((fresh: any) => {
      const insight = mediaInsights.find(
        (m: any) => m.instagram_media_id === fresh.id || m.id === fresh.id,
      );
      return {
        ...fresh,
        instagram_media_id: fresh.id,
        instagram_media_insights: (insight as any)?.instagram_media_insights,
      };
    });
  }, [mediaFresh, mediaInsights]);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const insightsFiltrados = React.useMemo(() => {
    if (!insights) return [];
    return insights.filter((d: any) => {
      const data = new Date(d.data);
      return (
        (!dateRange?.from || data >= dateRange.from) &&
        (!dateRange?.to || data <= dateRange.to)
      );
    });
  }, [insights, dateRange]);

  const mediaFiltrada = React.useMemo(() => {
    if (!mediaCombinada) return [];
    return mediaCombinada.filter((post: any) => {
      const data = new Date(post.timestamp);
      return (
        (!dateRange?.from || data >= dateRange.from) &&
        (!dateRange?.to || data <= dateRange.to)
      );
    });
  }, [mediaCombinada, dateRange]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      toast.success("Sincronização iniciada!");
      await fetch("https://sync.kvgroupbr.com.br/instagram/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      toast.success("Sincronização agendada com sucesso!");
    } catch (e) {
      toast.error("Erro ao sincronizar perfil.");
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  const chartData = React.useMemo(() => {
    return insightsFiltrados.map((item: any) => ({
      data: formatDateBr(item.data),
      alcance: item.reach || 0,
      novosSeguidores: item.follower_count || 0,
    }));
  }, [insightsFiltrados]);

  // Total Metrics
  const totalReach = insightsFiltrados.reduce(
    (acc: number, item: any) => acc + (item.reach || 0),
    0,
  );

  const novosSeguidores = insightsFiltrados.reduce(
    (acc: number, item: any) => acc + (item.follower_count || 0),
    0,
  );

  const diasPeriodo =
    dateRange?.from && dateRange?.to
      ? Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 30;

  const isPeriodoLongo = diasPeriodo > 30;

  const seguidoresMetrica = isPeriodoLongo
    ? profile.followers_count
    : novosSeguidores;

  const seguidoresLabel = isPeriodoLongo
    ? "Seguidores Totais"
    : "Novos Seguidores";

  // Media Stats
  const totalViews = React.useMemo(
    () =>
      mediaFiltrada.reduce((acc: number, post: any) => {
        const ins = (post as any).instagram_media_insights;
        return acc + (Number(ins?.views) || 0);
      }, 0),
    [mediaFiltrada],
  );

  const totalInteractions = React.useMemo(
    () =>
      mediaFiltrada.reduce((acc: number, post: any) => {
        const ins = (post as any).instagram_media_insights;
        return acc + (Number(ins?.total_interactions) || 0);
      }, 0),
    [mediaFiltrada],
  );

  const totalPosts = mediaFiltrada.length;
  const totalReels = mediaFiltrada.filter(
    (p: any) => p.media_type === "VIDEO",
  ).length;
  const totalImagens = mediaFiltrada.filter(
    (p: any) => p.media_type === "IMAGE",
  ).length;
  const totalCarrosseis = mediaFiltrada.filter(
    (p: any) => p.media_type === "CAROUSEL_ALBUM",
  ).length;

  const mediaFiltradaSorted = React.useMemo(() => {
    const sorted = [...mediaFiltrada];
    if (dateRange?.from || dateRange?.to) {
      sorted.sort((a, b) => {
        const insA = (a as any).instagram_media_insights;
        const insB = (b as any).instagram_media_insights;
        return (
          (insB?.total_interactions || 0) - (insA?.total_interactions || 0)
        );
      });
    }
    return sorted;
  }, [mediaFiltrada, dateRange]);

  React.useEffect(() => {
    if (mediaCombinada) {
      console.log("tipos:", [
        ...new Set(mediaCombinada.map((p: any) => p.media_type)),
      ]);
    }
  }, [mediaCombinada]);

  const [tipoFiltro, setTipoFiltro] = React.useState<
    "todos" | "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM"
  >("todos");

  const [videoAtivo, setVideoAtivo] = React.useState<string | null>(null);

  const mediaExibida = React.useMemo(() => {
    return tipoFiltro === "todos"
      ? mediaFiltradaSorted
      : mediaFiltradaSorted.filter((p: any) => p.media_type === tipoFiltro);
  }, [mediaFiltradaSorted, tipoFiltro]);

  const POSTS_POR_PAGINA = 12;
  const [pagina, setPagina] = React.useState(1);

  const postsPaginados = React.useMemo(() => {
    return mediaExibida.slice(0, pagina * POSTS_POR_PAGINA);
  }, [mediaExibida, pagina]);

  React.useEffect(() => {
    setPagina(1);
  }, [tipoFiltro, dateRange]);

  return (
    <div className="space-y-6 mb-12">
      {/* Header Profile */}
      <Card className="bg-gradient-to-r from-card to-muted/20 border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 bg-muted flex items-center justify-center">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    className="w-full h-full object-cover"
                    alt={profile.username}
                  />
                ) : (
                  <Instagram className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {profile.name || profile.username}
                </h3>
                <p className="text-muted-foreground">@{profile.username}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-sm">
                    <span className="font-bold text-foreground">
                      {formatNumber(profile.followers_count)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      Seguidores
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-foreground">
                      {formatNumber(profile.media_count)}
                    </span>
                    <span className="text-muted-foreground ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full sm:w-[300px]"
              />
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="gap-2 shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Alcance Total
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalReach)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {seguidoresLabel}
            </p>
            <p className="text-2xl font-bold">
              {formatNumber(seguidoresMetrica)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Total Views
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalViews)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Interações
            </p>
            <p className="text-2xl font-bold">
              {formatNumber(totalInteractions)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Alcance & Crescimento</CardTitle>
          <CardDescription>
            Evolução de impressões e seguidores neste período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="data"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="alcance"
                    name="Alcance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="novosSeguidores"
                    name="Seguidores"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid Posts */}
      {mediaExibida && mediaExibida.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 mb-4">
            <h3 className="text-lg font-bold">Posts Recentes</h3>
            <div className="flex flex-wrap gap-2 border-b">
              {[
                { key: "todos", label: "Todos", count: totalPosts },
                { key: "VIDEO", label: "Reels", count: totalReels },
                { key: "IMAGE", label: "Imagens", count: totalImagens },
                ...(totalCarrosseis > 0
                  ? [
                      {
                        key: "CAROUSEL_ALBUM",
                        label: "Carrosséis",
                        count: totalCarrosseis,
                      },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTipoFiltro(tab.key as any)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[2px]",
                    tipoFiltro === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsPaginados.map((post: any) => {
              const date = new Date(post.timestamp);
              // Fallbacks from post or insights
              const insightData = (post.instagram_media_insights as any) || {};
              const views = insightData.views || post.play_count || 0;
              const saved = insightData.saved || 0;
              const shares = insightData.shares || 0;
              const likes = insightData.likes || post.like_count || 0;
              const comments = insightData.comments || post.comments_count || 0;

              return (
                <Card
                  key={post.id}
                  className="overflow-hidden group flex flex-col bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="relative aspect-square bg-muted">
                    {post.media_type === "VIDEO" && videoAtivo === post.id ? (
                      <video
                        src={post.media_url}
                        controls
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : post.media_url || post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url || post.media_url}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                        alt="Post"
                        onClick={() =>
                          post.media_type === "VIDEO" && setVideoAtivo(post.id)
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-20 mb-2" />
                        <span>Sem imagem</span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                      >
                        {post.media_type === "VIDEO" ? (
                          <Play className="h-3 w-3 mr-1" />
                        ) : (
                          <ImageIcon className="h-3 w-3 mr-1" />
                        )}
                        {post.media_type}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <p className="text-sm text-foreground/90 min-h-[40px]">
                      {post.caption
                        ? post.caption.length > 60
                          ? post.caption.substring(0, 60) + "..."
                          : post.caption
                        : "Sem legenda"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 mb-4">
                      {format(date, "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>

                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1" title="Views">
                        <Eye className="h-3.5 w-3.5" />{" "}
                        <span>{formatNumber(views)}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Likes">
                        <Heart className="h-3.5 w-3.5" />{" "}
                        <span>{formatNumber(likes)}</span>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        title="Comentários"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />{" "}
                        <span>{formatNumber(comments)}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Shares">
                        <Share2 className="h-3.5 w-3.5" />{" "}
                        <span>{formatNumber(shares)}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Salvos">
                        <Bookmark className="h-3.5 w-3.5" />{" "}
                        <span>{formatNumber(saved)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {postsPaginados.length < mediaExibida.length && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setPagina((p) => p + 1)}>
                Ver mais ({mediaExibida.length - postsPaginados.length}{" "}
                restantes)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InstagramAnalytics() {
  const { data: profiles, isLoading } = useInstagramProfiles();

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Instagram className="h-8 w-8 text-[#E1306C]" />
            Instagram Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o engajamento e alcance dos seus perfis
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div>
          {profiles.map((profile) => (
            <ProfileDashboard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-12 bg-transparent mt-8">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Instagram className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nenhum perfil conectado ainda
            </h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Conecte sua conta do Instagram para visualizar métricas,
              crescimento de seguidores e performance de posts.
            </p>
            <Button asChild>
              <a href="/admin/meta-connect">Conectar Conta</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
