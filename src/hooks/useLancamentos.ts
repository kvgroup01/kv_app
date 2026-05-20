import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryClient as globalQueryClient } from '../lib/queryClient';

export function useLancamentos(clienteId?: string) {
  return useQuery({
    queryKey: ['lancamentos', clienteId],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos')
        .select('*')
        .order('criado_em', { ascending: false });
      if (clienteId) query = query.eq('cliente_id', clienteId);
      const { data, error } = await query;
      if (error) throw error;
      return data.map((l: any) => ({ ...l, $id: l.id, $createdAt: l.criado_em }));
    },
  });
}

export function useLancamento(id: string) {
  return useQuery({
    queryKey: ['lancamento', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { ...data, $id: data.id, $createdAt: data.criado_em };
    },
    enabled: !!id,
  });
}

export function useLancamentoPorSlug(clienteSlug: string, lancamentoSlug: string) {
  return useQuery({
    queryKey: ['lancamento-slug', clienteSlug, lancamentoSlug],
    queryFn: async () => {
      const cliente = await globalQueryClient.fetchQuery({
        queryKey: ['cliente-por-slug', clienteSlug],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('slug', clienteSlug)
            .single();
          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 60 * 10
      });

      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .eq('slug', lancamentoSlug)
        .single();
      if (error) throw error;
      globalQueryClient.setQueryData(['lancamento', data.id], data);
      return { ...data, $id: data.id, $createdAt: data.criado_em };
    },
    enabled: !!clienteSlug && !!lancamentoSlug,
  });
}

export function useCriarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const sanitized = {
        ...data,
      };
      if (data.cliente_id !== undefined) {
        sanitized.cliente_id = data.cliente_id && data.cliente_id !== '' ? data.cliente_id : null;
      }
      const { data: result, error } = await supabase
        .from('lancamentos')
        .insert({ 
          ...sanitized, 
          user_id: user?.id,
          criado_em: new Date().toISOString() 
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });
}

export function useAtualizarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const sanitized = {
        ...data,
      };
      if (data.cliente_id !== undefined) {
        sanitized.cliente_id = data.cliente_id && data.cliente_id !== '' ? data.cliente_id : null;
      }
      const { data: result, error } = await supabase
        .from('lancamentos')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamento', variables.id] });
    },
  });
}

export function usePublicarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('lancamentos')
        .update({
          status: 'ativo',
          publicado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamento', id] });
    },
  });
}

export function useEncerrarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('lancamentos')
        .update({
          status: 'encerrado',
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamento', id] });
    },
  });
}

export function useMetaAccounts() {
  return useQuery({
    queryKey: ['meta_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_accounts')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCriarMetaAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('meta_accounts')
        .insert({ 
          ...data, 
          user_id: user?.id,
          criado_em: new Date().toISOString() 
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta_accounts'] });
    },
  });
}

export function useDeletarMetaAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meta_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta_accounts'] });
    },
  });
}

export function useValidarMetaToken() {
  return useMutation({
    mutationFn: async ({ accountId, token }: { accountId: string; token: string }) => {
      const response = await fetch('/api/meta-validar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, token })
      });
      const data = await response.json();
      if (!response.ok || !data.valido) return { valido: false, nome_conta: undefined };
      return { valido: data.valido, account_id: data.account_id, nome_conta: data.nome_conta };
    },
  });
}

export function useTestarFiltroCampanhas() {
  return useMutation({
    mutationFn: async ({ accountId, token, palavraChave }: { accountId: string; token: string; palavraChave: string }) => {
      const response = await fetch('/api/meta-testar-filtro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, token, palavraChave })
      });
      const data = await response.json();
      if (!response.ok || data.erro) throw new Error(data.erro || 'Erro ao testar filtro');
      return data.data || [];
    },
  });
}

export function useDeletarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });
}
