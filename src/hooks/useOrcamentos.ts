import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarOrcamentos,
  buscarOrcamento,
  buscarOrcamentoPorToken,
  criarOrcamento,
  atualizarStatusOrcamento,
  confirmarPagamento,
  listarPagamentos
} from '../lib/appwrite';
import type { Orcamento, Pagamento } from '../lib/types';

// Query Keys Constantes
export const ORCAMENTOS_KEY = ['orcamentos'];
export const PAGAMENTOS_KEY = ['pagamentos'];

export function useOrcamentos() {
  return useQuery({
    queryKey: ORCAMENTOS_KEY,
    queryFn: listarOrcamentos,
  });
}

export function useOrcamento(id?: string) {
  return useQuery({
    queryKey: [...ORCAMENTOS_KEY, id],
    queryFn: () => buscarOrcamento(id!),
    enabled: !!id,
  });
}

export function useOrcamentoPorToken(token?: string) {
  return useQuery({
    queryKey: [...ORCAMENTOS_KEY, 'token', token],
    queryFn: () => buscarOrcamentoPorToken(token!),
    enabled: !!token, // Só roda a query se o token foi passado
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Orcamento, '$id' | '$createdAt' | 'token' | 'status' | 'link_expira_em' | 'pix_qrcode' | 'valor_total'>) => 
      criarOrcamento(data), // O AppWrite.ts já constrói o token formata tudo certinho!
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
    },
  });
}

export function useAtualizarStatusOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Orcamento['status'] }) => 
      atualizarStatusOrcamento(id, status),
    onSuccess: (_, variables) => {
      // Invalida a lista geral e a query isolada daquele orçamento
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORCAMENTOS_KEY, variables.id] });
    },
  });
}

export function useConfirmarPagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    // Recebe o File nativo pra gerenciar upload e afins
    mutationFn: ({ orcamento_id, arquivoFile, observacao }: { orcamento_id: string; arquivoFile: File; observacao?: string }) => 
      confirmarPagamento(orcamento_id, arquivoFile, observacao),
    onSuccess: (_, variables) => {
      // Quando confirmado o pagamento, orçamentos mudam status, logo devem ser invalidados.
      queryClient.invalidateQueries({ queryKey: ORCAMENTOS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORCAMENTOS_KEY, variables.orcamento_id] });
      // E a tabela de pagamentos recarrega
      queryClient.invalidateQueries({ queryKey: PAGAMENTOS_KEY });
    },
  });
}

export function usePagamentos() {
  return useQuery({
    queryKey: PAGAMENTOS_KEY,
    queryFn: listarPagamentos,
  });
}
