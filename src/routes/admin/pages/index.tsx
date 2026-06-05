import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, FileText, Globe, Trash2, Pencil, ExternalLink, ChevronRight, Users } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { usePages, useCreatePage, useDeletePage, generateSlug, type Page } from "../../../hooks/usePages";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagesIndex() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedClienteId, setSelectedClienteId] = React.useState<string>("");
  const [newPageNome, setNewPageNome] = React.useState("");
  const [newPageSlug, setNewPageSlug] = React.useState("");
  const [slugManual, setSlugManual] = React.useState(false);

  const { data: clientes = [], isLoading: clientesLoading } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar páginas de TODOS os clientes de uma vez
  const { data: todasPaginas = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["all-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("atualizado_em", { ascending: false });
      if (error) throw error;
      return data as Page[];
    },
  });

  const createPage = useCreatePage();
  const deletePage = useDeletePage();

  const handleNomeChange = (v: string) => {
    setNewPageNome(v);
    if (!slugManual) setNewPageSlug(generateSlug(v));
  };

  const handleCreate = async () => {
    if (!newPageNome.trim() || !selectedClienteId) return;
    try {
      const page = await createPage.mutateAsync({
        cliente_id: selectedClienteId,
        nome: newPageNome.trim(),
        slug: newPageSlug || generateSlug(newPageNome),
      });
      toast.success("Página criada!");
      setShowCreateModal(false);
      setNewPageNome("");
      setNewPageSlug("");
      setSlugManual(false);
      navigate(`/admin/pages/${page.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar página");
    }
  };

  const handleDelete = async (page: Page) => {
    if (!window.confirm(`Excluir "${page.nome}"?`)) return;
    try {
      await deletePage.mutateAsync({ id: page.id, clienteId: page.cliente_id });
      toast.success("Página excluída");
    } catch (e: any) {
      toast.error("Erro ao excluir");
    }
  };

  const isLoading = clientesLoading || pagesLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-(--text-tertiary)" />
            <h2 className="text-[22px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.374px' }}>Páginas</h2>
          </div>
          <p className="text-[13px] text-(--text-secondary) mt-1">
            Gerencie as landing pages dos seus clientes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-brand h-9 px-4 text-[13px] rounded-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova página
        </Button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(2)].map((_, j) => <Skeleton key={j} className="h-36 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : todasPaginas.length === 0 ? (
        // Estado vazio geral
        <div className="flex flex-col items-center justify-center py-24 text-center border-dashed bg-(--card-bg) border border-(--card-border) rounded-[14px]">
          <div className="h-14 w-14 rounded-full bg-(--card-hover) border border-(--card-border) flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-(--text-tertiary)" />
          </div>
          <h3 className="text-[15px] font-semibold text-(--text-primary) mb-1">Nenhuma página criada ainda</h3>
          <p className="text-[13px] text-(--text-tertiary) mb-6 max-w-sm">Crie a primeira landing page de um cliente.</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-brand h-9 px-4 text-[13px] rounded-full"
          >
            Criar primeira página
          </Button>
        </div>
      ) : (
        // Seções por cliente
        <div className="space-y-10">
          {clientes
            .filter((c: any) => todasPaginas.some(p => p.cliente_id === c.id))
            .map((cliente: any) => {
              const paginas = todasPaginas.filter(p => p.cliente_id === cliente.id);
              return (
                <div key={cliente.id}>
                  {/* Cabeçalho do cliente */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#FBB03B]/15 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#FBB03B]" />
                    </div>
                    <h2 className="font-semibold text-[15px] text-foreground">{cliente.nome}</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {paginas.length} {paginas.length === 1 ? "página" : "páginas"}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Grid de cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginas.map(page => (
                      <div
                        key={page.id}
                        className="bg-(--card-bg) border border-(--card-border) rounded-[14px] p-5 hover:border-[#FBB03B]/30 hover:bg-[#FBB03B]/5 transition-colors flex flex-col gap-3 cursor-pointer group"
                        onClick={() => navigate(`/admin/pages/${page.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[15px] text-(--text-primary) mb-1" style={{ letterSpacing: '-0.2px' }}>{page.nome}</h3>
                            <p className="text-[13px] text-(--text-tertiary) truncate">/{page.slug}</p>
                          </div>
                          {page.status === "published" ? (
                            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-500">
                              Publicada
                            </span>
                          ) : (
                            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-(--card-hover) text-(--text-tertiary)">
                              Rascunho
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-(--text-tertiary)">
                          Atualizada {formatDistanceToNow(new Date(page.atualizado_em), { locale: ptBR, addSuffix: true })}
                        </p>

                        <div className="flex gap-2 mt-auto pt-4 border-t border-(--card-border)" onClick={e => e.stopPropagation()}>
                          <button
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-(--card-border) text-[13px] font-medium text-(--text-secondary) bg-transparent hover:bg-(--card-hover) hover:text-(--text-primary) transition-colors cursor-pointer"
                            onClick={() => navigate(`/admin/pages/${page.id}`)}
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          {page.status === "published" && (
                            <a
                              href={`/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center px-2.5 rounded-[10px] border border-(--card-border) text-(--text-secondary) hover:bg-(--card-hover) hover:text-(--text-primary) transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            className="flex items-center justify-center px-2.5 rounded-[10px] text-(--text-tertiary) hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            onClick={() => handleDelete(page)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Card "Nova página" para este cliente */}
                    <button
                      onClick={() => { setSelectedClienteId(cliente.id); setShowCreateModal(true); }}
                      className="border border-dashed border-(--card-border) bg-(--card-bg) rounded-[14px] p-5 flex flex-col items-center justify-center gap-2 text-(--text-tertiary) hover:bg-[#FBB03B]/5 hover:border-[#FBB03B]/30 hover:text-[#FBB03B] transition-colors min-h-[120px] group cursor-pointer"
                    >
                      <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-[13px] font-medium">Nova página</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal criar página */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome da página</Label>
              <Input
                placeholder="Ex: Página de captura SEMSA"
                value={newPageNome}
                onChange={(e) => handleNomeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm shrink-0">kvpages.com.br/</span>
                <Input
                  value={newPageSlug}
                  onChange={(e) => { setSlugManual(true); setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }}
                  placeholder="minha-pagina"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!newPageNome.trim() || !selectedClienteId || createPage.isPending}
              style={{ backgroundColor: '#FBB03B', color: '#1A1A1A' }}
              className="font-semibold hover:opacity-90"
            >
              {createPage.isPending ? "Criando..." : "Criar e abrir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
