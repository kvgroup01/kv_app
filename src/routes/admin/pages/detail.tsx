import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Globe, Pencil, Copy, ExternalLink, Download,
  MoreHorizontal, Trash2, BarChart2, FileText, Users,
  MapPin, Link2, Tag, ChevronDown, Eye, EyeOff, Puzzle, Code, Plus, X,
  ShieldCheck, Search, Sparkles, AlertCircle, CheckCircle2, Info
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
import { Textarea } from "../../../components/ui/textarea";
import { Separator } from "../../../components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePage, useUpdatePage, type PageIntegrations } from "../../../hooks/usePages";
import { useLeads, useDeleteLead, type Lead } from "../../../hooks/useLeads";
import { useDomains, useCreateDomain, useDeleteDomain, type Domain } from "../../../hooks/useDomains";
import { supabase } from "../../../lib/supabase";
import { cn } from "../../../lib/utils";

type TabType = "resumo" | "relatorio" | "leads" | "integracoes" | "dominio";

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

  const { data: domains = [] } = useDomains()
  const createDomain = useCreateDomain()
  const deleteDomain = useDeleteDomain()

  // Domínio
  const [selectedDomainId, setSelectedDomainId] = React.useState<string>(page?.domain_id || '')
  const [pageSlug, setPageSlug] = React.useState<string>(page?.page_slug || '')
  const [domainSearch, setDomainSearch] = React.useState('')
  const [showDomainDropdown, setShowDomainDropdown] = React.useState(false)
  const [showAddDomain, setShowAddDomain] = React.useState(false)
  const [newDomain, setNewDomain] = React.useState('')
  const [savingDomain, setSavingDomain] = React.useState(false)

  // Favicon states
  const [showFaviconModal, setShowFaviconModal] = React.useState(false)
  const [faviconUrl, setFaviconUrl] = React.useState('')
  const [faviconTab, setFaviconTab] = React.useState<'url' | 'upload'>('url')
  const [uploadingFavicon, setUploadingFavicon] = React.useState(false)

  // SEO
  const [seo, setSeo] = React.useState({
    enable_indexing: page?.seo?.enable_indexing ?? true,
    title: page?.seo?.title || '',
    description: page?.seo?.description || '',
    keywords: page?.seo?.keywords || '',
    favicon_url: page?.seo?.favicon_url || '',
  })

  React.useEffect(() => {
    if (page?.domain_id) setSelectedDomainId(page.domain_id)
    if (page?.page_slug) setPageSlug(page.page_slug)
    if (page?.seo) setSeo({ enable_indexing: true, title: '', description: '', keywords: '', favicon_url: '', ...page.seo })
  }, [page?.domain_id, page?.page_slug, page?.seo])

  const selectedDomain = domains.find(d => d.id === selectedDomainId)

  const handleSaveDomain = async () => {
    setSavingDomain(true)
    await updatePage.mutateAsync({ id: id!, domain_id: selectedDomainId || null, page_slug: pageSlug })
    setSavingDomain(false)
    toast.success('Domínio salvo!')
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return
    await createDomain.mutateAsync(newDomain.trim())
    setNewDomain('')
    setShowAddDomain(false)
    toast.success('Domínio adicionado!')
  }

  const getPublicUrl = () => {
    if (!selectedDomain) return null
    const slug = pageSlug.replace(/^\//, '')
    return `https://${selectedDomain.domain}${slug ? '/' + slug : ''}`
  }

  const hasSeo = !!(seo.title && seo.description)

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
      color: '#FBB03B',
      desc: 'Animações e estilos personalizados' 
    },
    estatisticas: { 
      label: 'Estatísticas',  
      color: '#FBB03B',
      desc: 'Hotjar, SmartLook, Analytics' 
    },
    marketing: { 
      label: 'Marketing',     
      color: '#FBB03B',
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
    { key: "dominio", label: "Domínio", icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/pages")}
          className="h-8 w-8 flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--card-hover) rounded-[8px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-[22px] font-semibold text-(--text-primary) flex-1 truncate" style={{ letterSpacing: '-0.374px' }}>{page.nome}</h2>

        {/* Status badge */}
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-[4px] ${
          page.status === "published"
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-(--card-hover) text-(--text-tertiary)"
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
          className="btn-brand h-9 px-4 text-[13px] rounded-full flex items-center gap-2"
        >
          <Pencil className="w-3.5 h-3.5 mr-1" /> Abrir Editor
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
        <div className="flex gap-1 overflow-x-auto pb-[-2px] bg-(--card-hover) p-1 rounded-[12px] border border-(--card-border) w-fit mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[8px] transition-colors ${
                activeTab === tab.key
                  ? "bg-(--card-bg) text-(--text-primary) shadow-sm"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-bg)/50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

      {/* Tab: Resumo */}
      {activeTab === "resumo" && (
        <div className="space-y-4">
          <div className="bg-(--card-bg) border border-(--card-border) rounded-[14px] p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">URL da página</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[13px] bg-(--card-hover) text-(--text-secondary) px-3 py-2 rounded-[10px] truncate">
                  {window.location.origin}/p/{page.slug}
                </code>
                <button onClick={handleCopyLink} className="p-2 hover:bg-(--card-hover) text-(--text-tertiary) hover:text-(--text-primary) rounded-[10px] transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                {page.status === "published" && (
                  <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-(--card-hover) text-(--text-tertiary) hover:text-(--text-primary) rounded-[10px] transition-colors border border-transparent hover:border-(--card-border)">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-(--card-border)">
              <div>
                <p className="text-[12px] font-semibold text-(--text-tertiary) uppercase tracking-wider mb-1">Status</p>
                <p className="text-[13px] font-medium text-(--text-primary)">
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
        <div className="space-y-4">
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
                className="data-[state=checked]:bg-[#FBB03B]"
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
                className="data-[state=checked]:bg-[#FBB03B]"
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
                className="data-[state=checked]:bg-[#FBB03B]"
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
                      <Switch checked={item.enabled} onCheckedChange={() => toggleCode(item.id)} className="data-[state=checked]:bg-[#FBB03B]" />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginLeft: 8 }}>script.html</span>
                      </div>
                      <textarea
                        value={codeForm.code}
                        onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))}
                        placeholder={'<script>\n  // Seu código aqui\n</script>'}
                        rows={9}
                        spellCheck={false}
                        style={{ 
                          width: '100%', 
                          background: '#1e293b', 
                          color: '#e2e8f0', 
                          fontFamily: 'monospace', 
                          fontSize: 12, 
                          lineHeight: 1.6, 
                          padding: 16, 
                          resize: 'none', 
                          outline: 'none', 
                          border: 'none', 
                          boxSizing: 'border-box', 
                          display: 'block' 
                        }}
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

      {/* Tab: Domínio */}
      {activeTab === 'dominio' && (
        <div className="py-6 space-y-6">

          {/* ── DOMÍNIO ── */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Domínio personalizado</h2>
            <p className="text-sm text-gray-500 mb-5">Aponte esta página para um domínio conectado à sua conta</p>

            {/* Seletor de domínio */}
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-2">Domínio</label>
                <div className="relative">
                  <button
                    onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white text-[13px] text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    {selectedDomain ? (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">{selectedDomain.domain}</span>
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">SSL Ativo</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Selecione o domínio</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showDomainDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input
                            autoFocus
                            value={domainSearch}
                            onChange={e => setDomainSearch(e.target.value)}
                            placeholder="Buscar domínio..."
                            className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {/* Opção: sem domínio */}
                        <button
                          onClick={() => { setSelectedDomainId(''); setShowDomainDropdown(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-[13px] text-gray-500"
                        >
                          Nenhum domínio
                        </button>
                        {domains
                          .filter(d => d.domain.toLowerCase().includes(domainSearch.toLowerCase()))
                          .map(d => (
                            <button key={d.id}
                              onClick={() => { setSelectedDomainId(d.id); setShowDomainDropdown(false); setDomainSearch('') }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span className="text-[13px] font-medium text-gray-900">{d.domain}</span>
                              </div>
                              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">SSL Ativo</span>
                            </button>
                          ))}
                        {domains.length === 0 && (
                          <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                            Nenhum domínio conectado ainda
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-2">
                  Link da página <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#FBB03B] transition-colors">
                  <span className="px-3 text-[13px] text-gray-400 border-r border-gray-200 py-3 bg-gray-50">/</span>
                  <input
                    value={pageSlug}
                    onChange={e => setPageSlug(e.target.value.replace(/[^a-z0-9-]/g, '-').toLowerCase())}
                    placeholder="nome-da-pagina"
                    className="flex-1 px-3 py-3 text-[13px] outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Ex: home, contato, obrigado</p>
              </div>

              {/* URL gerada */}
              {selectedDomain && (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[13px] font-mono text-gray-700 truncate flex-1">{getPublicUrl()}</span>
                  <a href={getPublicUrl()!} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Adicionar domínio */}
              {!showAddDomain ? (
                <div className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-700">Conecte um domínio personalizado</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">Aponte seu domínio para exibir suas páginas</p>
                  </div>
                  <button onClick={() => setShowAddDomain(true)}
                    className="shrink-0 text-[13px] font-semibold text-[#1A1A1A] bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Conectar
                  </button>
                </div>
              ) : (
                <div className="p-4 border border-[#FBB03B]/30 rounded-xl bg-[#FBB03B]/5">
                  <label className="text-[12px] font-semibold text-gray-600 block mb-2">Novo domínio</label>
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      placeholder="Ex: www.meusite.com.br"
                      className="flex-1 bg-white border-gray-200 focus-visible:ring-[#FBB03B]"
                    />
                    <Button onClick={handleAddDomain} disabled={createDomain.isPending || !newDomain.trim()}
                      className="bg-[#FBB03B] hover:bg-[#f0a824] text-[#1A1A1A] font-semibold shrink-0">
                      {createDomain.isPending ? '...' : 'Adicionar'}
                    </Button>
                    <button onClick={() => setShowAddDomain(false)}
                      className="px-3 py-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg bg-white text-[13px] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Domínios conectados (lista gerenciável) */}
              {domains.length > 0 && (
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-2">Domínios conectados</label>
                  <div className="space-y-2">
                    {domains.map(d => (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[13px] font-medium text-gray-900 flex-1">{d.domain}</span>
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">SSL Ativo</span>
                        <button onClick={() => deleteDomain.mutate(d.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          {/* ── SEO ── */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Informações e SEO</h2>
            <p className="text-sm text-gray-500 mb-5">Configure como sua página aparece nos mecanismos de busca</p>

            <div className="space-y-4">

              {/* Habilitar buscadores */}
              <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Habilitar buscadores</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                    Habilitar que a página apareça nos resultados do Google, Bing, Yahoo! e etc?
                  </p>
                </div>
                <Switch
                  checked={seo.enable_indexing}
                  onCheckedChange={v => setSeo(p => ({ ...p, enable_indexing: v }))}
                  className="data-[state=checked]:bg-[#FBB03B] shrink-0 mt-0.5"
                />
              </div>

              {/* Favicon */}
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-2">Favicon</label>
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {seo.favicon_url
                      ? <img src={seo.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" />
                      : <Globe className="w-7 h-7 text-gray-300" />}
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-2">Tamanho recomendado: 64×64px — .PNG ou .JPEG</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setFaviconUrl(seo.favicon_url || ''); setShowFaviconModal(true) }}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Alterar favicon
                      </button>
                      {seo.favicon_url && (
                        <button onClick={() => setSeo(p => ({ ...p, favicon_url: '' }))}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">
                  Título da página <span className="text-red-500">*</span>
                </label>
                <Input
                  value={seo.title}
                  onChange={e => setSeo(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Transformamos ideias em soluções digitais"
                  maxLength={60}
                  className="bg-white border-gray-200 focus-visible:ring-[#FBB03B]"
                />
                <p className="text-[11px] text-gray-400 mt-1">{seo.title.length}/60</p>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Descrição da página</label>
                <Textarea
                  value={seo.description}
                  onChange={e => setSeo(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva brevemente o conteúdo da página..."
                  maxLength={320}
                  rows={3}
                  className="bg-white border-gray-200 focus-visible:ring-[#FBB03B] resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">{seo.description.length}/320</p>
              </div>

              {/* Palavras-chave */}
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Palavras-chave</label>
                <Input
                  value={seo.keywords}
                  onChange={e => setSeo(p => ({ ...p, keywords: e.target.value }))}
                  placeholder="Ex: marketing digital, tráfego pago, resultados"
                  className="bg-white border-gray-200 focus-visible:ring-[#FBB03B]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Separe as palavras por vírgula</p>
              </div>

              {/* Preview Google */}
              {(seo.title || seo.description) && (
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-2">Pré-visualização do Google</label>
                  <div className="p-4 border border-gray-200 rounded-xl bg-white">
                    <p className="text-[12px] text-gray-400 mb-1">{selectedDomain?.domain || 'seudominio.com.br'}</p>
                    <p className="text-[15px] text-blue-600 font-medium mb-1 truncate">{seo.title || 'Título da página'}</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">{seo.description || ''}</p>
                  </div>
                </div>
              )}

              {/* Salvar SEO */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={async () => {
                    setSavingDomain(true)
                    await updatePage.mutateAsync({ id: id!, seo, domain_id: selectedDomainId || null, page_slug: pageSlug })
                    setSavingDomain(false)
                    toast.success('Domínio e SEO salvos!')
                  }}
                  disabled={savingDomain}
                  className="bg-[#FBB03B] hover:bg-[#f0a824] text-[#1A1A1A] font-semibold px-6"
                >
                  {savingDomain ? 'Salvando...' : 'Salvar domínio e SEO'}
                </Button>
              </div>
            </div>
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

      {/* Favicon Modal */}
      {showFaviconModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Alterar Favicon</h3>
              <button onClick={() => setShowFaviconModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => setFaviconTab('url')}
                className={`pb-3 pt-3 mr-6 text-[13px] font-semibold border-b-2 transition-all ${faviconTab === 'url' ? 'border-[#FBB03B] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Inserir URL
              </button>
              <button
                onClick={() => setFaviconTab('upload')}
                className={`pb-3 pt-3 text-[13px] font-semibold border-b-2 transition-all ${faviconTab === 'upload' ? 'border-[#FBB03B] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Fazer upload
              </button>
            </div>

            <div className="p-6">
              {faviconTab === 'url' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 block mb-2">URL da imagem</label>
                    <Input
                      autoFocus
                      value={faviconUrl}
                      onChange={e => setFaviconUrl(e.target.value)}
                      placeholder="https://seusite.com/favicon.png"
                      className="bg-white border-gray-200 focus-visible:ring-[#FBB03B]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">Cole o link direto para uma imagem PNG ou JPEG (64×64px recomendado)</p>
                  </div>

                  {/* Preview */}
                  {faviconUrl && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <img
                        src={faviconUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-contain border border-gray-200 bg-white"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div>
                        <p className="text-[12px] font-semibold text-gray-700">Preview do favicon</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{faviconUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#FBB03B] hover:bg-[#FBB03B]/5 transition-all"
                  onClick={() => document.getElementById('favicon-upload-input')?.click()}
                >
                  <input
                    id="favicon-upload-input"
                    type="file"
                    accept="image/png,image/jpeg,image/ico,image/svg+xml"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingFavicon(true)
                      try {
                        // Upload para o Supabase Storage
                        const ext = file.name.split('.').pop()
                        const fileName = `favicon-${Date.now()}.${ext}`
                        const { data, error } = await supabase.storage
                          .from('page-assets')
                          .upload(fileName, file, { upsert: true })
                        if (error) throw error
                        const { data: { publicUrl } } = supabase.storage
                          .from('page-assets')
                          .getPublicUrl(fileName)
                        setFaviconUrl(publicUrl)
                        setFaviconTab('url') // Mostra preview na aba URL
                      } catch (err) {
                        toast.error('Erro ao fazer upload. Tente usar uma URL.')
                      } finally {
                        setUploadingFavicon(false)
                      }
                    }}
                  />
                  {uploadingFavicon ? (
                    <>
                      <div className="w-10 h-10 border-2 border-[#FBB03B] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-[13px] font-semibold text-gray-600">Enviando...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[13px] font-semibold text-gray-700">Clique para selecionar</p>
                      <p className="text-[12px] text-gray-400 mt-1">PNG, JPEG ou ICO — máx. 1MB</p>
                      <p className="text-[11px] text-gray-300 mt-1">64×64px recomendado</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowFaviconModal(false)}
                className="flex-1 h-10 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-[13px] font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (faviconUrl.trim()) {
                    setSeo(p => ({ ...p, favicon_url: faviconUrl.trim() }))
                    setShowFaviconModal(false)
                  }
                }}
                disabled={!faviconUrl.trim() || uploadingFavicon}
                className="flex-1 h-10 bg-[#FBB03B] hover:bg-[#f0a824] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A] rounded-xl text-[13px] font-bold transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
