import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, FileText, Globe, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
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
        <div>
          <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-[-0.01em]">
            Páginas
          </h1>
          <p className="text-[13px] text-[#767676] mt-0.5">
            Crie e gerencie landing pages dos seus clientes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedClienteId}
          className="flex items-center gap-1.5 bg-[#1A1A1A] text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-[#484848] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova página
        </button>
      </div>

      <select
        value={selectedClienteId || ''}
        onChange={(e) => setSelectedClienteId(e.target.value || null)}
        className="h-9 w-64 border border-[#e6e6e6] rounded-lg px-3 text-[13px] text-[#1A1A1A] bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FBB03B] focus:border-[#FBB03B] transition-all"
      >
        <option value="">Selecionar cliente...</option>
        {clientes.map((c: any) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      {!selectedClienteId ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 rounded-xl bg-[#f2f2f2] flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-[#a3a3a3]" />
          </div>
          <p className="text-[14px] font-medium text-[#1A1A1A]">
            Selecione um cliente
          </p>
          <p className="text-[13px] text-[#767676] mt-1">
            para ver e gerenciar suas landing pages
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
          <div className="w-12 h-12 rounded-xl bg-[#f2f2f2] flex items-center justify-center mb-4">
            <Globe className="w-5 h-5 text-[#a3a3a3]" />
          </div>
          <p className="text-[14px] font-medium text-[#1A1A1A]">Nenhuma página ainda</p>
          <p className="text-[13px] text-[#767676] mt-1 mb-5">
            Crie sua primeira landing page
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 border border-[#e6e6e6] text-[#1A1A1A] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#f2f2f2] transition-colors bg-white outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Criar primeira página
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div key={page.id} 
              className="bg-white border border-[#e6e6e6] rounded-xl overflow-hidden hover:border-[#d1d1d1] transition-all group flex flex-col"
            >
              {/* Área de thumbnail/preview — fundo neutro com inicial */}
              <div className="h-[100px] bg-[#f2f2f2] flex items-center justify-center border-b border-[#e6e6e6] relative">
                <span className="text-[32px] font-bold text-[#d1d1d1] select-none uppercase">
                  {page.nome.charAt(0)}
                </span>
                {/* Badge status no canto superior direito */}
                <span className={cn(
                  "absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-md",
                  page.status === 'published'
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-[#f2f2f2] text-[#767676] border border-[#e6e6e6]"
                )}>
                  {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                </span>
              </div>

              {/* Info */}
              <div className="px-4 py-3 flex-1">
                <h3 className="text-[14px] font-semibold text-[#1A1A1A] truncate">
                  {page.nome}
                </h3>
                <p className="text-[12px] text-[#a3a3a3] truncate mt-0.5">
                  /{page.slug}
                </p>
                <p className="text-[11px] text-[#a3a3a3] mt-2">
                  Atualizada {formatDistanceToNow(new Date(page.atualizado_em), 
                    { locale: ptBR, addSuffix: true })}
                </p>
              </div>

              {/* Ações */}
              <div className="px-4 py-3 border-t border-[#f2f2f2] flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/pages/${page.id}/editor`)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 border border-[#e6e6e6] rounded-lg text-[12px] font-medium text-[#1A1A1A] hover:bg-[#f2f2f2] transition-colors bg-white outline-none cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {page.status === 'published' && (
                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center border border-[#e6e6e6] rounded-lg text-[#767676] hover:bg-[#f2f2f2] hover:text-[#1A1A1A] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(page)}
                  className="w-8 h-8 flex items-center justify-center border border-[#e6e6e6] rounded-lg text-[#a3a3a3] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors bg-white outline-none cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold text-[#1A1A1A] tracking-[-0.01em]">Nova página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#767676] font-medium">Nome da página</label>
              <Input
                placeholder="Ex: Página de captura SEMSA"
                value={newPageNome}
                onChange={(e) => handleNomeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="h-9 text-[13px] focus:ring-[#FBB03B] focus-visible:ring-[#FBB03B] focus:border-[#FBB03B]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#767676] font-medium">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#a3a3a3] shrink-0">kvpages.com.br/</span>
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
              className="h-9 px-4 rounded-lg border border-[#e6e6e6] text-[#767676] text-[13px] font-medium hover:bg-[#f2f2f2] transition-colors bg-white outline-none cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreate} 
              disabled={!newPageNome.trim() || createPage.isPending}
              className="h-9 px-4 rounded-lg bg-[#1A1A1A] text-white text-[13px] font-semibold hover:bg-[#484848] transition-colors disabled:opacity-40 disabled:cursor-not-allowed outline-none border-none cursor-pointer"
            >
              {createPage.isPending ? "Criando..." : "Criar e abrir editor"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
