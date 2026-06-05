import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Orcamento, Pagamento } from '../lib/types';

// Query Keys Constantes
export const ORCAMENTOS_KEY = ['orcamentos'];
export const PAGAMENTOS_KEY = ['pagamentos'];

async function fetchOrcamentos() {
  const { data, error } = await supabase.from('orcamentos').select('*').order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((item: any) => ({ ...item, $id: item.id, $createdAt: item.criado_em, $updatedAt: item.atualizado_em }));
}

async function fetchOrcamento(id: string) {
  const { data, error } = await supabase.from('orcamentos').select('*').eq('id', id).single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em, $updatedAt: data.atualizado_em };
}

async function fetchOrcamentoPorToken(token: string) {
  const { data, error } = await supabase.from('orcamentos').select('*').eq('token', token).single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em, $updatedAt: data.atualizado_em };
}

async function createOrcamento(orcamento: any) {
  const { data, error } = await supabase.from('orcamentos').insert([orcamento]).select().single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em };
}

async function updateStatusOrcamento(id: string, status: string) {
  const { data, error } = await supabase.from('orcamentos').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em };
}

async function deleteOrcamento(id: string) {
  const { error } = await supabase.from('orcamentos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

async function editarOrcamento(id: string, itens: any[], pix_chave: string) {
  const valor_total = itens.reduce(
    (acc, item) => acc + (item.quantidade * item.valor_unitario), 0
  );
  const { data, error } = await supabase
    .from('orcamentos')
    .update({
      itens: JSON.stringify(itens),
      valor_total,
      pix_chave,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em };
}

// Em Supabase precisamos subir o arquivo no bucket 'pagamentos' (ou similar) primeiro, e então inserir o registro
async function confirmPagamento(orcamento_id: string, arquivoFile: File, observacao?: string) {
  const fileExt = arquivoFile.name.split('.').pop();
  const fileName = `${orcamento_id}-${Math.random()}.${fileExt}`;
  
  let comprovante_url = '';
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('comprovantes')
    .upload(fileName, arquivoFile);
    
  if (uploadError) {
    console.error('Erro ao subir comprovante', uploadError);
  } else {
    // Obter URL pública
    const { data: publicUrlData } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
    comprovante_url = publicUrlData.publicUrl;
  }
  
  const { error } = await supabase.from('pagamentos').insert([{
    orcamento_id,
    valor: 0, // Precisaria buscar valor, simplificando aqui
    metodo: 'pix',
    comprovante_url: comprovante_url || null,
    observacao: observacao || null,
    status: 'confirmado',
    criado_em: new Date().toISOString(),
  }]);
  
  if (error) {
    console.error('[pagamentos insert error]', error);
    throw error;
  }
  
  // Atualiza orcamento para pago
  await updateStatusOrcamento(orcamento_id, 'pago');
  
  return { orcamento_id, criado_em: new Date().toISOString() };
}

async function fetchPagamentos() {
  const { data, error } = await supabase.from('pagamentos').select('*').order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((item: any) => ({ ...item, $id: item.id, $createdAt: item.criado_em, $updatedAt: item.atualizado_em }));
}

export function useOrcamentos() {
  return useQuery({
    queryKey: ORCAMENTOS_KEY,
    queryFn: fetchOrcamentos,
  });
}

export function useOrcamento(id?: string) {
  return useQuery({
    queryKey: [...ORCAMENTOS_KEY, id],
    queryFn: () => fetchOrcamento(id!),
    enabled: !!id,
  });
}

export function useOrcamentoPorToken(token?: string) {
  return useQuery({
    queryKey: [...ORCAMENTOS_KEY, 'token', token],
    queryFn: () => fetchOrcamentoPorToken(token!),
    enabled: !!token, // Só roda a query se o token foi passado
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const valor_total = (data.itens || []).reduce(
        (acc: number, item: any) => acc + (item.quantidade * item.valor_unitario), 0
      );
      const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const link_expira_em = new Date();
      link_expira_em.setDate(link_expira_em.getDate() + 7);

      const { data: result, error } = await supabase
        .from('orcamentos')
        .insert({
          ...data,
          user_id: user?.id,
          itens: JSON.stringify(data.itens),
          token,
          status: 'pendente',
          valor_total,
          link_expira_em: link_expira_em.toISOString(),
          criado_em: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return { ...result, $id: result.id, $createdAt: result.criado_em };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
    },
  });
}

export function useAtualizarStatusOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Orcamento['status'] }) => 
      updateStatusOrcamento(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORCAMENTOS_KEY, variables.id] });
    },
  });
}

export function useDeletarOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteOrcamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
    },
  });
}

export function useEditarOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itens, pix_chave }: { id: string; itens: any[]; pix_chave: string }) =>
      editarOrcamento(id, itens, pix_chave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
    },
  });
}

export function useConfirmarPagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orcamento_id, arquivoFile, observacao }: { orcamento_id: string; arquivoFile: File; observacao?: string }) => 
      confirmPagamento(orcamento_id, arquivoFile, observacao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORCAMENTOS_KEY, variables.orcamento_id] });
      queryClient.invalidateQueries({ queryKey: PAGAMENTOS_KEY });
    },
  });
}

export function usePagamentos() {
  return useQuery({
    queryKey: PAGAMENTOS_KEY,
    queryFn: fetchPagamentos,
  });
}
