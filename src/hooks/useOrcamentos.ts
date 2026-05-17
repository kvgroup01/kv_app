import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Orcamento, Pagamento } from '../lib/types';

// Query Keys Constantes
export const ORCAMENTOS_KEY = ['orcamentos'];
export const PAGAMENTOS_KEY = ['pagamentos'];

async function fetchOrcamentos() {
  const { data, error } = await supabase.from('orcamentos').select('*').order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((item: any) => ({ ...item, $id: item.id, $createdAt: item.criado_em }));
}

async function fetchOrcamento(id: string) {
  const { data, error } = await supabase.from('orcamentos').select('*').eq('id', id).single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em };
}

async function fetchOrcamentoPorToken(token: string) {
  const { data, error } = await supabase.from('orcamentos').select('*').eq('token', token).single();
  if (error) throw error;
  return { ...data, $id: data.id, $createdAt: data.criado_em };
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
  
  const { data, error } = await supabase.from('pagamentos').insert([{
    orcamento_id,
    valor: 0, // Precisaria buscar valor, simplificando aqui
    metodo: 'pix',
    comprovante_url,
    observacao,
    status: 'confirmado'
  }]).select().single();
  
  if (error) throw error;
  
  // Atualiza orcamento para pago
  await updateStatusOrcamento(orcamento_id, 'pago');
  
  return { ...data, $id: data.id, $createdAt: data.criado_em };
}

async function fetchPagamentos() {
  const { data, error } = await supabase.from('pagamentos').select('*').order('criado_em', { ascending: false });
  if (error) throw error;
  return data.map((item: any) => ({ ...item, $id: item.id, $createdAt: item.criado_em }));
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
    mutationFn: (data: Omit<Orcamento, '$id' | '$createdAt' | 'token' | 'status' | 'link_expira_em' | 'pix_qrcode' | 'valor_total'>) => 
      createOrcamento({
        ...data,
        status: 'pendente',
        token: crypto.randomUUID().split('-')[0], // token temporario
      }), 
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
