import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ExternalLink,
  Save,
  CheckCircle,
  Eye,
  Copy,
  Code,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import { useClientes } from "../../../../hooks/useClientes";
import { SheetsImporter } from "../../../../components/admin/SheetsImporter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../../../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import { cn } from "../../../../lib/utils";

const SYNC_URL = "https://sync.kvgroupbr.com.br";

const ESCOLARIDADES_OPCOES = [
  "Ensino Fundamental Completo",
  "Ensino Médio Completo",
  "Tecnólogo",
  "Cursando Ensino Superior",
  "Ensino Superior Completo",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
];

const RENDAS_OPCOES = [
  "Abaixo de um salário mínimo",
  "De 1.518,00 a 1.903,98",
  "De 1.903,99 até 2.826,65",
  "De 2.826,66 até 3.751,05",
  "De 3.751,06 até 4.664,68",
  "Acima de 4.664,68",
];

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

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
  const [metaEventType, setMetaEventType] = React.useState("");
  const [showSheetsImporter, setShowSheetsImporter] = React.useState(false);
  const [reclassifying, setReclassifying] = React.useState(false);
  const [criterioQualificacao, setCriterioQualificacao] = React.useState<
    "escolaridade" | "renda" | "ambos_e" | "ambos_ou"
  >("escolaridade");
  const [escolaridadesQualificadas, setEscolaridadesQualificadas] =
    React.useState<string[]>([]);
  const [rendasQualificadas, setRendasQualificadas] = React.useState<string[]>(
    [],
  );
  const [investimentoContratado, setInvestimentoContratado] = React.useState<
    number | string
  >("");
  const [dataInicioSync, setDataInicioSync] = React.useState("");
  const [secoes, setSecoes] = React.useState<SecoesType>(defaultSecoes);
  const [editSecao, setEditSecao] = React.useState<SecaoId | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [syncJob, setSyncJob] = React.useState<{
    jobId: string;
    progresso: number;
    status: string;
  } | null>(null);
  const [syncToken, setSyncToken] = React.useState<string | null>(null);
  const [listening, setListening] = React.useState(false);
  const [listenTimeout, setListenTimeout] = React.useState<any>(null);
  const [lastLead, setLastLead] = React.useState<any>(null);
  const [listenSeconds, setListenSeconds] = React.useState(0);
  const [status, setStatus] = React.useState("rascunho");

  const [capiAtivo, setCapiAtivo] = React.useState(false);
  const [capiPixelId, setCapiPixelId] = React.useState("");
  const [capiAccessToken, setCapiAccessToken] = React.useState("");
  const [capiApenasQualificados, setCapiApenasQualificados] =
    React.useState(true);

  const handleStartListening = async () => {
    if (!id) return;
    setListening(true);
    setLastLead(null);
    setListenSeconds(0);

    // Conta o total de leads ANTES de começar a escutar
    const snapshot = await fetch(`/api/webhook-listen?lancamentoId=${id}`)
      .then((r) => r.json())
      .catch(() => ({ total: 0 }));

    const totalAntes = snapshot.total || 0;
    let segundos = 0;

    const timer = setInterval(() => {
      segundos++;
      setListenSeconds(segundos);
    }, 1000);

    const polling = setInterval(async () => {
      try {
        const res = await fetch(`/api/webhook-listen?lancamentoId=${id}`);
        const data = await res.json();
        if (data.total > totalAntes && data.latest) {
          setLastLead(data.latest);
          setListening(false);
          clearInterval(polling);
          clearInterval(timer);
          toast.success("Lead capturado com sucesso!");
        }
      } catch (e) {}
    }, 2000);

    // Timeout de 3 minutos
    const timeout = setTimeout(
      () => {
        setListening(false);
        clearInterval(polling);
        clearInterval(timer);
        toast.error("Tempo esgotado. Nenhum lead recebido em 3 minutos.");
      },
      3 * 60 * 1000,
    );

    setListenTimeout({ polling, timer, timeout });
  };

  const handleStopListening = () => {
    if (listenTimeout) {
      clearInterval(listenTimeout.polling);
      clearInterval(listenTimeout.timer);
      clearTimeout(listenTimeout.timeout);
    }
    setListening(false);
    toast.info("Escuta cancelada.");
  };

  React.useEffect(() => {
    if (lancamento) {
      setNome(lancamento.nome || "");
      setMetaEventType(lancamento.meta_event_type || "");
      setInvestimentoContratado(lancamento.investimento_total_contratado ?? "");
      setDataInicioSync(lancamento.data_inicio_sync || "");
      if (lancamento.configuracao_secoes) {
        try {
          const parsed = JSON.parse(lancamento.configuracao_secoes);
          setSecoes({ ...defaultSecoes, ...parsed }); // Merge back default keys
        } catch (e) {
          console.error("Failed to parse secoes", e);
        }
      }
      if (lancamento.regras_qualificacao) {
        try {
          const regras = JSON.parse(lancamento.regras_qualificacao);
          setCriterioQualificacao(regras.criterio || "escolaridade");
          setEscolaridadesQualificadas(regras.escolaridades || []);
          setRendasQualificadas(regras.rendas || []);
        } catch (e) {}
      }

      setCapiAtivo(lancamento.capi_ativo === true);
      setCapiPixelId(lancamento.capi_pixel_id || "");
      setCapiAccessToken(lancamento.capi_access_token || "");
      setCapiApenasQualificados(lancamento.capi_apenas_qualificados !== false);
      setStatus(lancamento.status || "rascunho");
    }
  }, [lancamento]);

  React.useEffect(() => {
    let interval: any;
    if (syncJob && syncJob.status !== "done" && syncJob.status !== "error") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${SYNC_URL}/status/${syncJob.jobId}`);
          const data = await res.json();
          if (res.ok && !data.error) {
            setSyncJob((prev) =>
              prev
                ? {
                    ...prev,
                    progresso: data.progresso,
                    status: data.done ? "done" : data.status,
                  }
                : null,
            );
            if (data.done) {
              clearInterval(interval);
              setSyncing(false);
              toast.success("Sincronização concluída com sucesso!");
            }
            if (data.status === "error") {
              clearInterval(interval);
              setSyncJob((prev) =>
                prev ? { ...prev, status: "error" } : null,
              );
              toast.error(data.erro || "Erro ao sincronizar");
              setSyncing(false);
            }
          } else {
            clearInterval(interval);
            setSyncJob((prev) => (prev ? { ...prev, status: "error" } : null));
            toast.error("Erro ao verificar status");
            setSyncing(false);
          }
        } catch (e) {
          clearInterval(interval);
          setSyncJob((prev) => (prev ? { ...prev, status: "error" } : null));
          toast.error("Erro de conexão ao atualizar dados");
          setSyncing(false);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncJob]);

  const handleSyncMeta = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      // Primeiro cria o job via meta-sync-start (continua na Vercel)
      const response = await fetch("/api/meta-sync-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lancamentoId: id }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        toast.error(data.error || "Erro ao iniciar sincronização");
        setSyncing(false);
        return;
      }

      const jobId = data.jobId;
      const newToken = data.syncToken || null;
      setSyncJob({ jobId, progresso: 0, status: "running" });
      setSyncToken(newToken);

      // Dispara o sync na VPS (não aguarda — roda em background)
      fetch(`${SYNC_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, syncToken: newToken }),
      }).catch(console.error);
    } catch (err: any) {
      toast.error("Erro de conexão ao iniciar sincronização");
      setSyncing(false);
    }
  };

  const handleReclassify = async () => {
    if (!id) return;
    setReclassifying(true);
    try {
      const res = await fetch("/api/sheets?action=reclassify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lancamentoId: id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erro ao reclassificar leads");
        return;
      }
      toast.success(
        `Reclassificação concluída: ${data.updated} leads atualizados` +
          (data.errors > 0 ? `, ${data.errors} erros` : ""),
      );
    } catch (e: any) {
      toast.error("Erro de conexão ao reclassificar");
    } finally {
      setReclassifying(false);
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
          investimento_total_contratado:
            investimentoContratado === ""
              ? null
              : Number(investimentoContratado),
          meta_event_type: metaEventType || null,
          data_inicio_sync: dataInicioSync,
          configuracao_secoes: JSON.stringify(secoes),
          regras_qualificacao: JSON.stringify({
            criterio: criterioQualificacao,
            escolaridades: escolaridadesQualificadas,
            rendas: rendasQualificadas,
          }),
          capi_ativo: capiAtivo,
          capi_pixel_id: capiPixelId || null,
          capi_access_token: capiAccessToken || null,
          capi_apenas_qualificados: capiApenasQualificados,
          status,
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
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-auto h-8 bg-background border-input text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleSyncMeta}
                  disabled={syncing}
                >
                  {syncing
                    ? syncJob
                      ? `Sincronizando... ${syncJob.progresso}%`
                      : "Sincronizando..."
                    : "Sincronizar Meta Ads"}
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
              <div className="space-y-2">
                <label className="text-sm">
                  Investimento Total Contratado (R$)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2000.00"
                    value={investimentoContratado}
                    onChange={(e) => setInvestimentoContratado(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Evento Meta (action_type)</label>
                <p className="text-xs text-muted-foreground">
                  Ex: offsite_conversion.fb_pixel_complete_registration
                </p>
                <Input
                  value={metaEventType}
                  onChange={(e) => setMetaEventType(e.target.value)}
                  placeholder="offsite_conversion.fb_pixel_complete_registration"
                  className="bg-background text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">
                  Data de início da sincronização
                </label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          "bg-(--card-bg) border-(--card-border) text-(--text-primary)",
                          !dataInicioSync && "text-(--text-tertiary)",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-(--text-tertiary)" />
                        {dataInicioSync
                          ? format(
                              parseLocalDate(dataInicioSync),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            )
                          : "Selecionar data..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-(--card-bg) border-(--card-border)"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          dataInicioSync
                            ? parseLocalDate(dataInicioSync)
                            : undefined
                        }
                        onSelect={(date) =>
                          setDataInicioSync(
                            date ? format(date, "yyyy-MM-dd") : "",
                          )
                        }
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

            <hr className="border-border" />

            {/* Configuração do Webhook */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Configuração do Webhook
                </h3>
              </div>

              <div className="space-y-4">
                {/* URL */}
                <div className="space-y-2">
                  <label className="text-sm">URL do Webhook</label>
                  <p className="text-xs text-muted-foreground">
                    Cole esta URL no GreatPages ou qualquer formulário
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={`https://kvision.kvgroupbr.com.br/api/webhook-lead?lancamentoId=${id}`}
                      readOnly
                      className="bg-muted text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://kvision.kvgroupbr.com.br/api/webhook-lead?lancamentoId=${id}`,
                        );
                        toast.success("URL copiada!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Listener */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Escutar webhook ao vivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aguarda um lead real chegar pelo formulário
                      </p>
                    </div>
                    {listening ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStopListening}
                      >
                        Parar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartListening}
                      >
                        Escutar
                      </Button>
                    )}
                  </div>

                  {listening && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Aguardando lead... {listenSeconds}s
                      <span className="text-muted-foreground/50">
                        (timeout em {Math.max(0, 180 - listenSeconds)}s)
                      </span>
                    </div>
                  )}

                  {lastLead && !listening && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">
                        ✅ Lead capturado
                      </p>
                      <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                        {Object.entries(lastLead)
                          .filter(
                            ([k]) => !k.startsWith("$") && !k.startsWith("_"),
                          )
                          .map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-muted-foreground min-w-[120px]">
                                {k}:
                              </span>
                              <span className="text-foreground">
                                {String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <hr className="border-border" />

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Regras de Qualificação
              </h3>
              <p className="text-xs text-muted-foreground">
                Define o que classifica um lead como qualificado
              </p>

              {/* Critério */}
              <div className="space-y-2">
                <label className="text-sm">Critério</label>
                <select
                  value={criterioQualificacao}
                  onChange={(e) =>
                    setCriterioQualificacao(e.target.value as any)
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="escolaridade">Somente Escolaridade</option>
                  <option value="renda">Somente Renda</option>
                  <option value="ambos_e">Escolaridade E Renda</option>
                  <option value="ambos_ou">Escolaridade OU Renda</option>
                </select>
              </div>

              {/* Escolaridades qualificadas */}
              {(criterioQualificacao === "escolaridade" ||
                criterioQualificacao === "ambos_e" ||
                criterioQualificacao === "ambos_ou") && (
                <div className="space-y-2">
                  <label className="text-sm">Escolaridades qualificadas</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {ESCOLARIDADES_OPCOES.map((esc) => (
                      <label
                        key={esc}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={escolaridadesQualificadas.includes(esc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEscolaridadesQualificadas((prev) => [
                                ...prev,
                                esc,
                              ]);
                            } else {
                              setEscolaridadesQualificadas((prev) =>
                                prev.filter((x) => x !== esc),
                              );
                            }
                          }}
                          className="rounded"
                        />
                        {esc}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rendas qualificadas */}
              {(criterioQualificacao === "renda" ||
                criterioQualificacao === "ambos_e" ||
                criterioQualificacao === "ambos_ou") && (
                <div className="space-y-2">
                  <label className="text-sm">
                    Faixas de renda qualificadas
                  </label>
                  <div className="space-y-1 p-2 border rounded-lg">
                    {RENDAS_OPCOES.map((renda) => (
                      <label
                        key={renda}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={rendasQualificadas.includes(renda)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRendasQualificadas((prev) => [...prev, renda]);
                            } else {
                              setRendasQualificadas((prev) =>
                                prev.filter((x) => x !== renda),
                              );
                            }
                          }}
                          className="rounded"
                        />
                        {renda}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <hr className="border-border" />

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Importar Dados
              </h3>
              <p className="text-xs text-muted-foreground">
                Importe leads e pesquisas de uma planilha Google Sheets pública
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSheetsImporter(true)}
              >
                Importar do Google Sheets
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleReclassify}
                disabled={reclassifying}
              >
                {reclassifying ? "Reclassificando..." : "Reclassificar Leads"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recalcula qualificados/desqualificados com base nas regras acima
                e nos dados da pesquisa importada.
              </p>
            </section>

            <hr className="border-border" />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  API de Conversões (CAPI)
                </h3>
                <Switch checked={capiAtivo} onCheckedChange={setCapiAtivo} />
              </div>
              <p className="text-xs text-muted-foreground">
                Envia eventos de lead diretamente para a API de Conversões do
                Meta ao receber um webhook.
              </p>

              {capiAtivo && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm">Pixel ID</label>
                    <Input
                      value={capiPixelId}
                      onChange={(e) => setCapiPixelId(e.target.value)}
                      placeholder="Ex: 676230996775512"
                      className="bg-background font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Access Token (CAPI)</label>
                    <Input
                      value={capiAccessToken}
                      onChange={(e) => setCapiAccessToken(e.target.value)}
                      placeholder="EAADv7..."
                      className="bg-background font-mono text-xs"
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Token da API de Conversões (diferente do token de
                      anúncios). Gere em: Meta Business → Gerenciador de Eventos
                      → Configurações → API de Conversões.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={capiApenasQualificados}
                      onChange={(e) =>
                        setCapiApenasQualificados(e.target.checked)
                      }
                      className="rounded"
                    />
                    Enviar apenas leads qualificados
                  </label>
                </div>
              )}
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

          {status !== "ativo" && (
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
          {status === "ativo" && (
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
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Mock do Dashboard */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

      <Dialog open={showSheetsImporter} onOpenChange={setShowSheetsImporter}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>Importar do Google Sheets</DialogTitle>
          </DialogHeader>
          <SheetsImporter
            lancamentoId={id!}
            onClose={() => setShowSheetsImporter(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
