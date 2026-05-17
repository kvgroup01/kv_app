import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFunis() {
  return useQuery({
    queryKey: ['funis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useFunil(id: string) {
  return useQuery({
    queryKey: ['funil', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funis')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCriarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('funis')
        .insert({ ...data, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
    },
  });
}

export function useAtualizarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('funis')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      queryClient.invalidateQueries({ queryKey: ['funil', variables.id] });
    },
  });
}

export function useDeletarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funis')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
    },
  });
}
