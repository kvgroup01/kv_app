import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ExternalLink,
  Save,
  CheckCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import {
  useLancamento,
  useAtualizarLancamento,
  usePublicarLancamento,
} from "../../../../hooks/useLancamentos";

import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../components/ui/alert-dialog";
import { Skeleton } from "../../../../components/ui/skeleton";
import { useClientes } from "../../../../hooks/useClientes";

type SecaoId =
  | "cards_metricas"
  | "funil"
  | "grafico_investimento"
  | "classificacao"
  | "tabela_campanhas"
  | "grid_criativos"
  | "ranking_publicos"
  | "ranking_criativos"
  | "grupos_whatsapp"
  | "visao_financeira";

type SecaoConfig = {
  ativo: boolean;
  titulo: string;
};

type SecoesType = Record<SecaoId, SecaoConfig>;

const defaultSecoes: SecoesType = {
  cards_metricas: { ativo: true, titulo: "Métricas principais" },
  funil: { ativo: true, titulo: "Funil de tráfego" },
  grafico_investimento: { ativo: true, titulo: "Investimento vs Leads" },
  classificacao: { ativo: true, titulo: "Classificação por escolaridade" },
  tabela_campanhas: { ativo: true, titulo: "Campanhas" },
  grid_criativos: { ativo: true, titulo: "Criativos" },
  ranking_publicos: { ativo: true, titulo: "Melhores públicos" },
  ranking_criativos: { ativo: true, titulo: "Melhores criativos" },
  grupos_whatsapp: { ativo: false, titulo: "Grupos de WhatsApp" },
  visao_financeira: { ativo: true, titulo: "Visão financeira" },
};

function PreviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="py-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Graficos (2 side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="h-64 p-6">
            <Skeleton className="w-full h-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="h-64 p-6">
            <Skeleton className="w-full h-full" />
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="h-80 p-6">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: lancamento, isLoading: isLoadingLancamento } = useLancamento(
    id!,
  );
  const { data: clientes } = useClientes();
  const atualizarMutation = useAtualizarLancamento();
  const publicarMutation = usePublicarLancamento();

  const [nome, setNome] = React.useState("");
  const [secoes, setSecoes] = React.useState<SecoesType>(defaultSecoes);
  const [editSecao, setEditSecao] = React.useState<SecaoId | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (lancamento) {
      setNome(lancamento.nome || "");
      if (lancamento.configuracao_secoes) {
        try {
          const parsed = JSON.parse(lancamento.configuracao_secoes);
          setSecoes({ ...defaultSecoes, ...parsed }); // Merge back default keys
        } catch (e) {
          console.error("Failed to parse secoes", e);
        }
      }
    }
  }, [lancamento]);

  const handleSyncMeta = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      const response = await fetch("/api/meta-sync-lancamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lancamentoId: id }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        toast.error(data.error || "Erro ao sincronizar Meta Ads");
      } else {
        toast.success(
          `Sincronização concluída! Campanhas: ${data.summary.campanhas}, Dias: ${data.summary.dias_sincronizados}`,
        );
      }
    } catch (err: any) {
      toast.error("Erro de conexão ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = (key: SecaoId) => {
    setSecoes((prev) => ({
      ...prev,
      [key]: { ...prev[key], ativo: !prev[key].ativo },
    }));
  };

  const handleTitleChange = (key: SecaoId, newTitle: string) => {
    setSecoes((prev) => ({
      ...prev,
      [key]: { ...prev[key], titulo: newTitle },
    }));
  };

  const salvarAlteracoes = async (showToast = true) => {
    if (!id) return;
    try {
      await atualizarMutation.mutateAsync({
        id,
        data: {
          nome,
          configuracao_secoes: JSON.stringify(secoes),
        },
      });
      if (showToast) toast.success("Alterações salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar alterações");
    }
  };

  const publicarDashboard = async () => {
    if (!id) return;
    try {
      await salvarAlteracoes(false);
      await publicarMutation.mutateAsync(id);
      toast.success("Dashboard publicado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao publicar dashboard");
    }
  };

  const getCliente = () => {
    if (!lancamento || !clientes) return null;
    return clientes.find((c) => c.$id === lancamento.cliente_id);
  };

  const clienteLogado = getCliente();
  const publicUrl =
    clienteLogado?.slug && lancamento?.slug
      ? `/dashboard/${clienteLogado.slug}/${lancamento.slug}`
      : "#";

  if (isLoadingLancamento) {
    return (
      <div className="flex px-4 py-8 items-center justify-center h-[calc(100vh-100px)]">
        <Skeleton className="w-full max-w-lg h-3/4 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Lado Esquerdo - Painel de Controle (30%) */}
      <Card className="w-full lg:w-1/3 flex flex-col h-full bg-card/80 backdrop-blur-sm shadow-xl border-border shrink-0">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Editor</CardTitle>
          </div>
          <CardDescription>
            Personalize o dashboard para o seu cliente
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
          <div className="p-6 space-y-8">
            {/* Informações */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Informações
                </h3>
                <Badge
                  variant={
                    lancamento?.status === "ativo" ? "default" : "secondary"
                  }
                  className={
                    lancamento?.status === "ativo"
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : ""
                  }
                >
                  {lancamento?.status === "ativo"
                    ? "Ativo"
                    : lancamento?.status === "encerrado"
                      ? "Encerrado"
                      : "Rascunho"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleSyncMeta}
                  disabled={syncing}
                >
                  {syncing ? "Sincronizando..." : "Sincronizar Meta Ads"}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm">Nome do Lançamento</label>
                <div className="flex gap-2">
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Seções */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Seções do dashboard
                </h3>
              </div>

              <div className="space-y-3">
                {(Object.entries(secoes) as [SecaoId, SecaoConfig][]).map(
                  ([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background group hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 mr-4">
                        {editSecao === key ? (
                          <Input
                            value={config.titulo}
                            onChange={(e) =>
                              handleTitleChange(key, e.target.value)
                            }
                            onBlur={() => setEditSecao(null)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && setEditSecao(null)
                            }
                            className="h-7 px-2 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-sm font-medium cursor-pointer border-b border-dashed border-transparent hover:border-primary/50"
                            onClick={() => setEditSecao(key)}
                            title="Clique para editar o título"
                          >
                            {config.titulo}
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={config.ativo}
                        onCheckedChange={() => handleToggle(key)}
                      />
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 p-4 border-t bg-muted/20">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => salvarAlteracoes()}
            disabled={atualizarMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar rascunho
          </Button>

          {lancamento?.status !== "ativo" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full disabled:opacity-50">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publicar dashboard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publicar Dashboard</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá tornar o dashboard visível para o cliente no link
                    público. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={publicarDashboard}>
                    Sim, publicar agora
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>

      {/* Lado Direito - Preview (70%) */}
      <div className="flex-1 flex flex-col h-full bg-muted/10 rounded-xl overflow-hidden border">
        {/* Preview Header */}
        <div className="h-14 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Preview ao Vivo
            </span>
          </div>
          {lancamento?.status === "ativo" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          )}
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[#0f0f0f]">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Mock do Dashboard */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {nome}
              </h2>
              <p className="text-muted-foreground">
                Preview de como os dados serão exibidos
              </p>
            </div>

            {/* Componentes mockados conforme os toggles */}
            <div className="space-y-6">
              {/* Cards de métricas */}
              {secoes.cards_metricas.ativo && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {secoes.cards_metricas.titulo}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Investimento", val: "R$ 0,00" },
                      { label: "Total Leads", val: "0" },
                      { label: "Custo por Lead", val: "R$ 0,00" },
                      { label: "ROAS Estimado", val: "0.0x" },
                    ].map((c) => (
                      <Card key={c.label} className="bg-card">
                        <CardHeader className="py-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {c.label}
                          </p>
                          <h4 className="text-2xl font-bold">{c.val}</h4>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Funil e Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {secoes.funil.ativo && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      {secoes.funil.titulo}
                    </h3>
                    <Card className="h-64 flex items-center justify-center bg-card">
                      <span className="text-muted-foreground text-sm">
                        Visualização de Funil
                      </span>
                    </Card>
                  </section>
                )}
                {secoes.grafico_investimento.ativo && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      {secoes.grafico_investimento.titulo}
                    </h3>
                    <Card className="h-64 flex items-center justify-center bg-card">
                      <span className="text-muted-foreground text-sm">
                        Gráfico Linha/Barra
                      </span>
                    </Card>
                  </section>
                )}
              </div>

              {/* Outros Componentes Complexos */}
              {secoes.tabela_campanhas.ativo && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {secoes.tabela_campanhas.titulo}
                  </h3>
                  <Card className="h-40 flex items-center justify-center bg-card">
                    <span className="text-muted-foreground text-sm">
                      Tabela de Campanhas
                    </span>
                  </Card>
                </section>
              )}

              {/* Rankings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {secoes.ranking_publicos.ativo && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      {secoes.ranking_publicos.titulo}
                    </h3>
                    <Card className="h-40 flex items-center justify-center bg-card">
                      <span className="text-muted-foreground text-sm">
                        Ranking de Públicos
                      </span>
                    </Card>
                  </section>
                )}
                {secoes.ranking_criativos.ativo && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      {secoes.ranking_criativos.titulo}
                    </h3>
                    <Card className="h-40 flex items-center justify-center bg-card">
                      <span className="text-muted-foreground text-sm">
                        Ranking de Criativos
                      </span>
                    </Card>
                  </section>
                )}
              </div>

              {/* Componentes Opcionais por Configuração */}
              {secoes.grupos_whatsapp.ativo && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {secoes.grupos_whatsapp.titulo}
                  </h3>
                  <Card className="h-32 flex items-center justify-center bg-card border-green-500/20 bg-green-500/5">
                    <span className="text-green-500 font-medium text-sm">
                      Progresso dos Grupos de WhatsApp
                    </span>
                  </Card>
                </section>
              )}

              {secoes.visao_financeira.ativo && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {secoes.visao_financeira.titulo}
                  </h3>
                  <Card className="h-32 flex items-center justify-center bg-card">
                    <span className="text-muted-foreground font-medium text-sm">
                      Métricas Financeiras (Vendas, Ticket Médio)
                    </span>
                  </Card>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
