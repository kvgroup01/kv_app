import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Globe, Pencil, Copy, ExternalLink, Download,
  MoreHorizontal, Trash2, BarChart2, FileText, Users,
  MapPin, Link2, Tag, ChevronDown, Eye, EyeOff
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "../../../components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "../../../components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "../../../components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePage, useUpdatePage } from "../../../hooks/usePages";
import { useLeads, useDeleteLead, type Lead } from "../../../hooks/useLeads";

type TabType = "resumo" | "relatorio" | "leads";

export default function PageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePage(id);
  const updatePage = useUpdatePage();
  const [activeTab, setActiveTab] = React.useState<TabType>("leads");
  const [period, setPeriod] = React.useState("all");
  const { data: leads = [], isLoading: leadsLoading } = useLeads(id, period);
  const deleteLead = useDeleteLead();
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [deleteLeadId, setDeleteLeadId] = React.useState<string | null>(null);

  const handleTogglePublish = async () => {
    if (!page) return;
    const newStatus = page.status === "published" ? "draft" : "published";
    try {
      await updatePage.mutateAsync({ id: page.id, status: newStatus });
      toast.success(newStatus === "published" ? "Página publicada!" : "Página despublicada");
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleCopyLink = () => {
    if (!page) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`);
    toast.success("Link copiado!");
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ["Nome", "Email", "Telefone", "UTM Source", "UTM Campaign", "UTM Medium", "UTM Term", "UTM Content", "Cidade", "Estado", "País", "Data"];
    const rows = leads.map(l => [
      l.nome || "", l.email || "", l.telefone || "",
      l.utm_source || "", l.utm_campaign || "", l.utm_medium || "",
      l.utm_term || "", l.utm_content || "",
      l.cidade || "", l.estado || "", l.pais || "",
      format(new Date(l.criado_em), "dd/MM/yyyy HH:mm")
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${page?.slug || id}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <FileText className="w-12 h-12 opacity-20" />
        <p>Página não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/admin/pages")}>Voltar</Button>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "resumo", label: "Resumo", icon: <FileText className="w-4 h-4" /> },
    { key: "relatorio", label: "Relatório", icon: <BarChart2 className="w-4 h-4" /> },
    { key: "leads", label: "Leads", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-0 -mt-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/pages")}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">{page.nome}</h1>

        {/* Status badge */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          page.status === "published"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}>
          {page.status === "published" ? "Publicada" : "Rascunho"}
        </span>

        {/* Despublicar/Publicar */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePublish}
          disabled={updatePage.isPending}
          className="gap-2 text-sm"
        >
          {page.status === "published"
            ? <><EyeOff className="w-4 h-4" /> Despublicar</>
            : <><Globe className="w-4 h-4" /> Publicar</>
          }
        </Button>

        {/* Abrir Editor */}
        <button
          onClick={() => navigate(`/admin/pages/${page.id}/editor`)}
          style={{ backgroundColor: "#FBB03B", color: "#1A1A1A" }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Pencil className="w-4 h-4" /> Abrir Editor
        </button>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copiar link
            </DropdownMenuItem>
            {page.status === "published" && (
              <DropdownMenuItem asChild>
                <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Ver página
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#FBB03B] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Resumo */}
      {activeTab === "resumo" && (
        <div className="space-y-4 max-w-2xl">
          <div className="border border-border rounded-xl p-5 bg-card space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">URL da página</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg truncate text-foreground">
                  {window.location.origin}/p/{page.slug}
                </code>
                <button onClick={handleCopyLink} className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
                {page.status === "published" && (
                  <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <p className="text-sm font-medium text-foreground">
                  {page.status === "published" ? "Publicada" : "Rascunho"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total de leads</p>
                <p className="text-sm font-medium text-foreground">{leads.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Criada em</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(page.criado_em || page.atualizado_em), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Última atualização</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(page.atualizado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Relatório */}
      {activeTab === "relatorio" && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <BarChart2 className="w-12 h-12 opacity-20" />
          <p className="text-sm">Relatório em breve</p>
        </div>
      )}

      {/* Tab: Leads */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          {/* Barra de ações */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground">
              Total de <span style={{ color: "#FBB03B" }}>{leads.length}</span> leads
            </p>
            <div className="flex items-center gap-2">
              {/* Filtro de período */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {period === "all" ? "Todo período" : period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : "90 dias"}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPeriod("all")}>Todo período</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod("7d")}>Últimos 7 dias</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod("30d")}>Últimos 30 dias</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod("90d")}>Últimos 90 dias</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Exportar */}
              <Button
                size="sm"
                onClick={handleExportCSV}
                disabled={!leads.length}
                style={{ backgroundColor: "#1A1A1A", color: "#fff" }}
                className="gap-2 dark:bg-white dark:text-[#1A1A1A]"
              >
                <Download className="w-4 h-4" /> Exportar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          {leadsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhum lead capturado ainda</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              {/* Header da tabela */}
              <div className="grid grid-cols-[160px_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversão em</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Localidade</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"></span>
              </div>

              {/* Linhas */}
              <div className="divide-y divide-border">
                {leads.map(lead => (
                  <div key={lead.id} className="grid grid-cols-[160px_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-accent/30 transition-colors">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.criado_em), "dd/MM HH:mm")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.nome || "—"}</p>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {[lead.cidade, lead.estado, lead.pais].filter(Boolean).join(", ") || "—"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => setSelectedLead(lead)}
                      >
                        Detalhes
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => setDeleteLeadId(lead.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sheet de Detalhes do Lead */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent className="w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Lead</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-6">
              {/* Dados pessoais */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dados pessoais</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {[
                    { label: "Nome", value: selectedLead.nome },
                    { label: "Email", value: selectedLead.email },
                    { label: "Telefone", value: selectedLead.telefone },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground text-right max-w-[220px] break-all">{value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Página de origem */}
              {selectedLead.referrer && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" /> Página de origem
                  </p>
                  <div className="border border-border rounded-lg px-4 py-3 flex items-center gap-2">
                    <p className="text-sm text-foreground flex-1 truncate">{selectedLead.referrer}</p>
                    <a href={selectedLead.referrer} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </div>
              )}

              {/* Localização */}
              {(selectedLead.pais || selectedLead.cidade || selectedLead.estado) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Localização
                  </p>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {[
                      { label: "País", value: selectedLead.pais },
                      { label: "Estado", value: selectedLead.estado },
                      { label: "Cidade", value: selectedLead.cidade },
                    ].map(({ label, value }) => value ? (
                      <div key={label} className="flex justify-between px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium text-foreground">{value}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* UTMs */}
              {(selectedLead.utm_source || selectedLead.utm_campaign) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> UTMs
                  </p>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {[
                      { label: "UTM Source", value: selectedLead.utm_source },
                      { label: "UTM Campaign", value: selectedLead.utm_campaign },
                      { label: "UTM Medium", value: selectedLead.utm_medium },
                      { label: "UTM Term", value: selectedLead.utm_term },
                      { label: "UTM Content", value: selectedLead.utm_content },
                      { label: "UTM Audience", value: selectedLead.utm_audience },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium text-foreground text-right max-w-[200px] break-all">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* AlertDialog excluir lead */}
      <AlertDialog open={!!deleteLeadId} onOpenChange={(o) => !o && setDeleteLeadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                if (deleteLeadId) {
                  await deleteLead.mutateAsync(deleteLeadId);
                  setDeleteLeadId(null);
                  toast.success("Lead excluído");
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
