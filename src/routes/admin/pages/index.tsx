import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, FileText, Globe, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { usePages, useCreatePage, useDeletePage, generateSlug, type Page } from "../../../hooks/usePages";
import { cn } from "../../../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagesIndex() {
  const navigate = useNavigate();
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newPageNome, setNewPageNome] = React.useState("");
  const [newPageSlug, setNewPageSlug] = React.useState("");
  const [slugManual, setSlugManual] = React.useState(false);

  const { data: clientes = [] } = useQuery({
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

  const { data: pages = [], isLoading } = usePages(selectedClienteId);
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
      navigate(`/admin/pages/${page.id}/editor`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar página");
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Excluir "${page.nome}"?`)) return;
    try {
      await deletePage.mutateAsync({ id: page.id, clienteId: page.cliente_id });
      toast.success("Página excluída");
    } catch (e: any) {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Páginas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie e gerencie landing pages dos seus clientes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedClienteId}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova página
        </Button>
      </div>

      <Select value={selectedClienteId || ""} onValueChange={setSelectedClienteId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecionar cliente..." />
        </SelectTrigger>
        <SelectContent>
          {clientes.map((c: any) => (
            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedClienteId ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <FileText className="w-12 h-12 opacity-20" />
          <p>Selecione um cliente para ver suas páginas</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Globe className="w-12 h-12 opacity-20" />
          <p>Nenhuma página criada ainda</p>
          <Button variant="outline" onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Criar primeira página
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div key={page.id} className="border border-border rounded-xl p-5 bg-card hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{page.nome}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">/{page.slug}</p>
                </div>
                <Badge variant={page.status === "published" ? "default" : "secondary"} className="shrink-0">
                  {page.status === "published" ? "Publicada" : "Rascunho"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Atualizada {formatDistanceToNow(new Date(page.atualizado_em), { locale: ptBR, addSuffix: true })}
              </p>
              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => navigate(`/admin/pages/${page.id}/editor`)}>
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                {page.status === "published" && (
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(page)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
            <Button onClick={handleCreate} disabled={!newPageNome.trim() || createPage.isPending}>
              {createPage.isPending ? "Criando..." : "Criar e abrir editor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
