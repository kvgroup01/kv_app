import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Globe, Pencil, Copy, ExternalLink, Download,
  MoreHorizontal, Trash2, BarChart2, FileText, Users,
  MapPin, Link2, Tag, ChevronDown, Eye, EyeOff, Puzzle, Code, Plus, X
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
import { Switch } from "../../../components/ui/switch";
import { Input } from "../../../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePage, useUpdatePage, type PageIntegrations } from "../../../hooks/usePages";
import { useLeads, useDeleteLead, type Lead } from "../../../hooks/useLeads";

type TabType = "resumo" | "relatorio" | "leads" | "integracoes";

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

  const [integrations, setIntegrations] = React.useState<PageIntegrations>(page?.integrations || {})
  const [savingIntegrations, setSavingIntegrations] = React.useState(false)

  const [showCodeModal, setShowCodeModal] = React.useState(false)
  const [editingCode, setEditingCode] = React.useState<NonNullable<PageIntegrations['customCodes']>[0] | null>(null)
  const [codeForm, setCodeForm] = React.useState({
    name: '',
    type: 'funcionamento' as 'funcionamento' | 'estatisticas' | 'marketing',
    code: '',
  })
  
  const openAddCode = () => {
    setEditingCode(null)
    setCodeForm({ name: '', type: 'funcionamento', code: '' })
    setShowCodeModal(true)
  }
  
  const openEditCode = (item: NonNullable<PageIntegrations['customCodes']>[0]) => {
    setEditingCode(item)
    setCodeForm({ name: item.name, type: item.type, code: item.code })
    setShowCodeModal(true)
  }
  
  const saveCode = () => {
    if (!codeForm.name.trim() || !codeForm.code.trim()) return
    const codes = integrations.customCodes || []
    if (editingCode) {
      const updated = codes.map(c => c.id === editingCode.id ? { ...c, ...codeForm } : c)
      setIntegrations(prev => ({ ...prev, customCodes: updated }))
    } else {
      const newCode = { id: crypto.randomUUID(), enabled: true, ...codeForm }
      setIntegrations(prev => ({ ...prev, customCodes: [...(prev.customCodes || []), newCode] }))
    }
    setShowCodeModal(false)
  }
  
  const deleteCode = (id: string) => {
    setIntegrations(prev => ({ ...prev, customCodes: (prev.customCodes || []).filter(c => c.id !== id) }))
  }
  
  const toggleCode = (id: string) => {
    setIntegrations(prev => ({
      ...prev,
      customCodes: (prev.customCodes || []).map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
    }))
  }
  
  const TYPE_META = {
    funcionamento: { 
      label: 'Funcionamento', 
      color: '#8b5cf6',   // roxo
      desc: 'Animações e estilos personalizados' 
    },
    estatisticas: { 
      label: 'Estatísticas',  
      color: '#3b82f6',   // azul
      desc: 'Hotjar, SmartLook, Analytics' 
    },
    marketing: { 
      label: 'Marketing',     
      color: '#FBB03B',   // amarelo KV
      desc: 'Pixel, eventos de conversão' 
    },
  }

  // Sincronizar quando página carregar
  React.useEffect(() => {
    if (page?.integrations) setIntegrations(page.integrations)
  }, [page?.integrations])

  const handleSaveIntegrations = async () => {
    setSavingIntegrations(true)
    await updatePage.mutateAsync({ id: id!, integrations })
    setSavingIntegrations(false)
    toast.success('Integrações salvas!')
  }

  // Helper para atualizar campos aninhados
  const updateIntegration = (platform: keyof PageIntegrations, field: string, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [field]: value }
    }))
  }

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
    { key: "integracoes", label: "Integrações", icon: <Puzzle className="w-4 h-4" /> },
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

      {/* Tab: Integrações */}
      {activeTab === 'integracoes' && (
        <div className="max-w-2xl space-y-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Análise de campanha</h2>
            <p className="text-sm text-gray-500 mt-1">Monitore o desempenho dessa página com suas ferramentas de análise e acompanhamento</p>
          </div>

          {/* ── FACEBOOK API ── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Integração com Facebook API</h3>
                <p className="text-sm text-gray-500 mt-0.5">Integrar a página com o Facebook API para análise de campanha</p>
              </div>
              <Switch
                checked={integrations.facebook?.enabled || false}
                onCheckedChange={v => updateIntegration('facebook', 'enabled', v)}
              />
            </div>

            {integrations.facebook?.enabled && (
              <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    ID do Pixel do Facebook <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={integrations.facebook?.pixelId || ''}
                    onChange={e => updateIntegration('facebook', 'pixelId', e.target.value)}
                    placeholder="Ex: 676230996775512"
                    className="bg-white border-gray-200"
                  />
                  <p className="text-xs text-gray-400 mt-1">ID do pixel usado para rastrear eventos do site no Facebook Ads.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Token de acesso da API do Facebook</label>
                  <Input
                    value={integrations.facebook?.accessToken || ''}
                    onChange={e => updateIntegration('facebook', 'accessToken', e.target.value)}
                    placeholder="EAADv7..."
                    type="password"
                    className="bg-white border-gray-200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Evento de rastreamento</label>
                  <Select
                    value={integrations.facebook?.trackingEvent || 'PageView'}
                    onValueChange={v => updateIntegration('facebook', 'trackingEvent', v)}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['PageView','ViewContent','Lead','CompleteRegistration','Purchase','InitiateCheckout','AddToCart','Search','Personalizado'].map(ev => (
                        <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {integrations.facebook?.trackingEvent === 'Personalizado' && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Nome do evento personalizado <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={integrations.facebook?.customTrackingEvent || ''}
                      onChange={e => updateIntegration('facebook', 'customTrackingEvent', e.target.value)}
                      placeholder="Ex: MeuEventoPersonalizado"
                      className="bg-white border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Use exatamente o mesmo nome configurado no Gerenciador de Eventos do Facebook.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Código de evento de teste <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <Input
                    value={integrations.facebook?.testEventCode || ''}
                    onChange={e => updateIntegration('facebook', 'testEventCode', e.target.value)}
                    placeholder="Ex: TEST12345"
                    className="bg-white border-gray-200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Evento de conversão de formulário</label>
                  <Select
                    value={integrations.facebook?.formConversionEvent || 'CompleteRegistration'}
                    onValueChange={v => updateIntegration('facebook', 'formConversionEvent', v)}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['CompleteRegistration','Lead','Purchase','Subscribe','Contact'].map(ev => (
                        <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* ── GOOGLE ANALYTICS ── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Integração com Google Analytics</h3>
                <p className="text-sm text-gray-500 mt-0.5">Integrar a página com o Google Analytics para análise de campanha</p>
              </div>
              <Switch
                checked={integrations.googleAnalytics?.enabled || false}
                onCheckedChange={v => updateIntegration('googleAnalytics', 'enabled', v)}
              />
            </div>
            {integrations.googleAnalytics?.enabled && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ID de medição <span className="text-red-500">*</span>
                </label>
                <Input
                  value={integrations.googleAnalytics?.measurementId || ''}
                  onChange={e => updateIntegration('googleAnalytics', 'measurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="bg-white border-gray-200"
                />
              </div>
            )}
          </div>

          {/* ── GOOGLE TAG MANAGER ── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Integração com Google Tag Manager</h3>
                <p className="text-sm text-gray-500 mt-0.5">Integrar a página com o Google Tag Manager para análise de campanha</p>
              </div>
              <Switch
                checked={integrations.googleTagManager?.enabled || false}
                onCheckedChange={v => updateIntegration('googleTagManager', 'enabled', v)}
              />
            </div>
            {integrations.googleTagManager?.enabled && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ID do container do Google Tag Manager <span className="text-red-500">*</span>
                </label>
                <Input
                  value={integrations.googleTagManager?.containerId || ''}
                  onChange={e => updateIntegration('googleTagManager', 'containerId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className="bg-white border-gray-200"
                />
              </div>
            )}
          </div>

          {/* ── JAVASCRIPT E CSS ── */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Javascript e CSS</h3>
                <p className="text-sm text-gray-500 mt-0.5">Adicione scripts e estilos personalizados à sua página</p>
              </div>
              <button
                onClick={openAddCode}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#FBB03B', color: '#1A1A1A',
                  fontSize: 13, fontWeight: 700,
                  padding: '8px 16px', borderRadius: 8,
                  border: 'none', cursor: 'pointer'
                }}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Adicionar código
              </button>
            </div>

            {(integrations.customCodes || []).length === 0 ? (
              <div className="border-2 border-dashed border-gray-100 rounded-xl py-8 flex flex-col items-center justify-center text-center bg-gray-50">
                <Code className="w-6 h-6 text-gray-300 mb-2" />
                <p className="text-[13px] font-medium text-gray-400">Nenhum código adicionado</p>
                <p className="text-[12px] text-gray-300 mt-0.5">Clique em "Adicionar código" para começar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(integrations.customCodes || []).map(item => {
                  const meta = TYPE_META[item.type]
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <div className="w-1.5 h-7 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: meta.color }}>{meta.label}</p>
                      </div>
                      <Switch checked={item.enabled} onCheckedChange={() => toggleCode(item.id)} />
                      <button onClick={() => openEditCode(item)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCode(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── MODAL DE CÓDIGO ── */}
          {showCodeModal && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.4)' }}
            >
              <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {editingCode ? 'Editar código' : 'Adicionar código'}
                    </h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Configure um script ou estilo personalizado</p>
                  </div>
                  <button onClick={() => setShowCodeModal(false)}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#64748b' }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Nome */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                      Nome do código <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Input
                      autoFocus
                      value={codeForm.name}
                      onChange={e => setCodeForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Google Tag Manager, Hotjar..."
                      className="bg-white border-gray-200 focus-visible:ring-[#FBB03B] focus-visible:ring-offset-0 text-gray-900"
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                      Categoria
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {(Object.entries(TYPE_META) as [string, typeof TYPE_META.funcionamento][]).map(([value, meta]) => {
                        const active = codeForm.type === value
                        return (
                          <button key={value} onClick={() => setCodeForm(p => ({ ...p, type: value as any }))}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                              padding: '12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                              border: `2px solid ${active ? meta.color : '#e2e8f0'}`,
                              background: active ? `${meta.color}12` : '#f8fafc',
                              transition: 'all 0.15s',
                            }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${active ? meta.color : '#cbd5e1'}`, background: active ? meta.color : 'transparent', transition: 'all 0.15s' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: active ? meta.color : '#475569' }}>{meta.label}</span>
                            <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>{meta.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Código */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                      Código <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1e1e2e', borderBottom: '1px solid #2d2d3d' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                        <span style={{ fontSize: 11, color: '#6272a4', fontFamily: 'monospace', marginLeft: 8 }}>script.html</span>
                      </div>
                      <textarea
                        value={codeForm.code}
                        onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))}
                        placeholder={'<script>\n  // Seu código aqui\n</script>'}
                        rows={9}
                        spellCheck={false}
                        style={{ width: '100%', background: '#282a36', color: '#f8f8f2', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, padding: 16, resize: 'none', outline: 'none', border: 'none', boxSizing: 'border-box', display: 'block' }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Inclua as tags &lt;script&gt; ou &lt;style&gt; conforme necessário.</p>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => setShowCodeModal(false)}
                    style={{ flex: 1, height: 42, border: '1.5px solid #e2e8f0', background: '#ffffff', color: '#64748b', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={saveCode}
                    disabled={!codeForm.name.trim() || !codeForm.code.trim()}
                    style={{ flex: 1, height: 42, background: !codeForm.name.trim() || !codeForm.code.trim() ? '#fde68a' : '#FBB03B', color: '#1A1A1A', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: !codeForm.name.trim() || !codeForm.code.trim() ? 'not-allowed' : 'pointer' }}>
                    {editingCode ? 'Salvar alterações' : 'Adicionar código'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botão salvar */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveIntegrations}
              disabled={savingIntegrations}
              className="bg-[#FBB03B] hover:bg-[#f0a824] text-[#1A1A1A] font-semibold px-6"
            >
              {savingIntegrations ? 'Salvando...' : 'Salvar integrações'}
            </Button>
          </div>
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
