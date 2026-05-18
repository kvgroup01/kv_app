import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const sanitized = {
        ...data,
        pasta_id: data.pasta_id && data.pasta_id !== '' ? data.pasta_id : null,
        criado_em: new Date().toISOString()
      };
      const { data: result, error } = await supabase
        .from('clientes')
        .insert(sanitized)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const sanitized = {
        ...data,
      };
      if (data.pasta_id !== undefined) {
        sanitized.pasta_id = data.pasta_id && data.pasta_id !== '' ? data.pasta_id : null;
      }
      const { data: result, error } = await supabase
        .from('clientes')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}

export function useDeletarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

// --- Pastas ---

export function usePastas() {
  return useQuery({
    queryKey: ['pastas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pastas').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useCriarPasta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      const { data, error } = await supabase
        .from('pastas')
        .insert({ nome, cor })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
  });
}

export function useDeletarPasta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pastas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
  });
}
