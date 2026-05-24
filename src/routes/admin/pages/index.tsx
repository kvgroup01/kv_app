import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, FileText, Globe, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#1A1A1A] dark:text-[#FBB03B]" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-[#1A1A1A] dark:text-white tracking-[-0.01em]">
              Páginas
            </h1>
            <p className="text-[#767676] dark:text-[#a3a3a3] text-sm mt-1">
              Crie e gerencie landing pages dos seus clientes
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedClienteId}
          className="flex items-center gap-1.5 font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
          style={{ backgroundColor: '#FBB03B', color: '#1A1A1A' }}
        >
          <Plus className="w-4 h-4" /> Nova página
        </button>
      </div>

      <Select value={selectedClienteId || ""} onValueChange={(val) => setSelectedClienteId(val || null)}>
        <SelectTrigger className="w-[280px] bg-white dark:bg-[#1c1c1e] border-[#e5e5e5] dark:border-[#2a2a2a]">
          <SelectValue placeholder="Selecionar cliente..." />
        </SelectTrigger>
        <SelectContent>
          {clientes.map((c: any) => (
            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedClienteId ? (
        <div className="flex flex-col items-center justify-center py-32">
          <FileText className="w-10 h-10 text-[#d0d0d0] dark:text-[#3a3a3a] mb-4" />
          <p className="text-sm text-[#a3a3a3] dark:text-[#767676]">
            Selecione um cliente para ver e gerenciar suas landing pages
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[160px] rounded-xl bg-[#f2f2f2] animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Globe className="w-10 h-10 text-[#d0d0d0] dark:text-[#3a3a3a] mb-4" />
          <p className="text-sm text-[#a3a3a3] dark:text-[#767676] mb-3">Nenhuma página ainda. Crie sua primeira landing page</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '13px', fontWeight: 500, color: '#1A1A1A', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus className="w-4 h-4" /> Criar primeira página
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div key={page.id} 
              className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-5 bg-white dark:bg-[#1f1f1f] hover:border-[#d0d0d0] dark:hover:border-[#3a3a3a] transition-colors flex flex-col gap-3"
            >
              {/* Header card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-[15px] text-[#1A1A1A] dark:text-white truncate">
                    {page.nome}
                  </h3>
                  <p className="text-xs text-[#a3a3a3] truncate mt-0.5">
                    /{page.slug}
                  </p>
                </div>
                <div className="shrink-0">
                  {page.status === 'published' ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FBB03B20] text-[#b07800] dark:bg-[#FBB03B15] dark:text-[#FBB03B]">
                      Publicada
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#767676] dark:bg-[#2a2a2a] dark:text-[#a3a3a3]">
                      Rascunho
                    </span>
                  )}
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-auto pt-4 border-t border-[#f0f0f0] dark:border-[#2a2a2a] flex items-center justify-between">
                <p className="text-xs text-[#a3a3a3] dark:text-[#767676]">
                  Atualizada {formatDistanceToNow(new Date(page.atualizado_em), 
                    { locale: ptBR, addSuffix: true })}
                </p>
              </div>

              {/* Ações */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/pages/${page.id}/editor`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-medium text-[#1A1A1A] dark:text-white bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {page.status === 'published' && (
                  <button
                    onClick={() => window.open(`/${page.slug}`, '_blank', 'noopener,noreferrer')}
                    className="p-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] text-[#484848] dark:text-[#a3a3a3] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(page)}
                  className="p-1.5 rounded-lg text-[#c4c4c4] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold text-[#1A1A1A] dark:text-white tracking-[-0.01em]">Nova página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium">Nome da página</label>
              <Input
                placeholder="Ex: Página de captura SEMSA"
                value={newPageNome}
                onChange={(e) => handleNomeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="h-9 text-[13px] focus:ring-[#FBB03B] focus-visible:ring-[#FBB03B] focus:border-[#FBB03B]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#767676] dark:text-[#a3a3a3] font-medium">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#a3a3a3] dark:text-[#767676] shrink-0">kvpages.com.br/</span>
                <Input
                  value={newPageSlug}
                  onChange={(e) => { setSlugManual(true); setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }}
                  placeholder="minha-pagina"
                  className="h-9 text-[13px] focus:ring-[#FBB03B] focus-visible:ring-[#FBB03B] focus:border-[#FBB03B]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="h-9 px-4 rounded-lg border border-[#e6e6e6] text-[#767676] dark:text-[#a3a3a3] text-[13px] font-medium hover:bg-[#f2f2f2] transition-colors bg-white dark:bg-[#1c1c1e] outline-none cursor-pointer"
            >
              Cancelar
            </button>
            <Button 
              onClick={handleCreate} 
              disabled={!newPageNome.trim() || createPage.isPending}
              style={{ backgroundColor: '#FBB03B', color: '#1A1A1A', fontWeight: 600 }}
              className="h-9 transition-colors disabled:opacity-40"
            >
              {createPage.isPending ? "Criando..." : "Criar e abrir editor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

