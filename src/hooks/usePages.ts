import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Page {
  id: string;
  cliente_id: string;
  nome: string;
  slug: string;
  status: "draft" | "published";
  html?: string;
  css?: string;
  gjs_data?: any;
  meta_titulo?: string;
  meta_descricao?: string;
  meta_imagem_url?: string;
  dominio_customizado?: string;
  publicado_em?: string;
  criado_em: string;
  atualizado_em: string;
}

export function usePages(clienteId: string | null) {
  return useQuery({
    queryKey: ["pages", clienteId],
    queryFn: async (): Promise<Page[]> => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("atualizado_em", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePage(id: string | null) {
  return useQuery({
    queryKey: ["page", id],
    queryFn: async (): Promise<Page | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (page: Omit<Page, "id" | "criado_em" | "atualizado_em">) => {
      const { data, error } = await supabase
        .from("pages")
        .insert(page)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages", data.cliente_id] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Page> & { id: string }) => {
      const { data, error } = await supabase
        .from("pages")
        .update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages", data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ["page", data.id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
      return { id, clienteId };
    },
    onSuccess: ({ clienteId }) => {
      queryClient.invalidateQueries({ queryKey: ["pages", clienteId] });
    },
  });
}

export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
