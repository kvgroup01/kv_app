import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Page {
  id: string;
  cliente_id: string;
  nome: string;
  slug: string;
  html?: string;
  css?: string;
  gjs_data?: any;
  status: "draft" | "published";
  criado_em: string;
  atualizado_em: string;
  publicado_em?: string;
}

export function generateSlug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export function usePages(clienteId?: string | null) {
  return useQuery({
    queryKey: ["pages", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("atualizado_em", { ascending: false });
      if (error) throw error;
      return data as Page[];
    },
    enabled: !!clienteId,
  });
}

export function usePage(id: string | null) {
  return useQuery({
    queryKey: ["page", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Page;
    },
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPage: Partial<Page>) => {
      const { data, error } = await supabase
        .from("pages")
        .insert([newPage])
        .select()
        .single();
      if (error) throw error;
      return data as Page;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages", data.cliente_id] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pageData: Partial<Page> & { id: string }) => {
      const { id, ...updates } = pageData;
      const { data, error } = await supabase
        .from("pages")
        .update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Page;
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
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages", variables.clienteId] });
    },
  });
}
