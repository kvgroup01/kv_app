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
          <FileText className="w-6 h-6 text-[#1A1A1A]" />
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-[-0.01em]">
              Páginas
            </h1>
            <p className="text-sm text-[#767676] mt-0.5">
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
        <SelectTrigger className="w-[280px] bg-white border-[#e5e5e5]">
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
          <FileText className="w-10 h-10 text-[#d0d0d0] mb-4" />
          <p className="text-sm text-[#a3a3a3]">
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
          <Globe className="w-10 h-10 text-[#d0d0d0] mb-4" />
          <p className="text-sm text-[#a3a3a3] mb-3">Nenhuma página ainda. Crie sua primeira landing page</p>
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
              className="bg-[#FFFFFF] border border-[#e5e5e5] rounded-[12px] p-[20px] transition-colors hover:border-[#d0d0d0] flex flex-col"
            >
              {/* Header card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-[15px] text-[#1A1A1A] truncate">
                    {page.nome}
                  </h3>
                  <p className="text-xs text-[#a3a3a3] truncate mt-1">
                    /{page.slug}
                  </p>
                </div>
                <div className="shrink-0">
                  {page.status === 'published' ? (
                    <span style={{ background: '#FBB03B20', color: '#b07800', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                      Publicada
                    </span>
                  ) : (
                    <span style={{ background: '#f0f0f0', color: '#767676', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                      Rascunho
                    </span>
                  )}
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-auto pt-4 border-t border-[#f0f0f0] flex items-center justify-between">
                <p className="text-xs text-[#a3a3a3]">
                  Atualizada {formatDistanceToNow(new Date(page.atualizado_em), 
                    { locale: ptBR, addSuffix: true })}
                </p>
              </div>

              {/* Ações */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/pages/${page.id}/editor`)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '13px', fontWeight: 500, color: '#1A1A1A', background: '#fff', cursor: 'pointer' }}
                  className="hover:bg-[#f2f2f2] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {page.status === 'published' && (
                  <button
                    onClick={() => window.open(`/${page.slug}`, '_blank', 'noopener,noreferrer')}
                    style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', color: '#484848' }}
                    className="hover:bg-[#f2f2f2] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(page)}
                  className="p-2 rounded-lg hover:bg-red-50 text-[#c4c4c4] hover:text-red-500 transition-colors"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
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

