import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarLancamentos,
  buscarLancamento,
  criarLancamento,
  atualizarLancamento,
  publicarLancamento,
  encerrarLancamento,
  deletarLancamento,
  listarMetaAccounts,
  criarMetaAccount,
  deletarMetaAccount,
  validarMetaToken,
  testarFiltroCampanhas,
  buscarLancamentoPorSlug
} from "../lib/appwrite";
import { Lancamento, MetaAccount } from "../lib/types";

// --- Lançamentos Queries ---

export function useLancamentos(clienteId?: string) {
  return useQuery({
    queryKey: ["lancamentos", clienteId],
    queryFn: () => listarLancamentos(clienteId),
  });
}

export function useLancamento(id: string) {
  return useQuery({
    queryKey: ["lancamento", id],
    queryFn: () => buscarLancamento(id),
    enabled: !!id,
  });
}

export function useLancamentoPorSlug(clienteSlug: string, lancamentoSlug: string) {
  return useQuery({
    queryKey: ["lancamento", clienteSlug, lancamentoSlug],
    queryFn: () => buscarLancamentoPorSlug(clienteSlug, lancamentoSlug),
    enabled: !!clienteSlug && !!lancamentoSlug,
  });
}

// --- Lançamentos Mutations ---

export function useCriarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Lancamento>) => criarLancamento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}

export function useAtualizarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lancamento> }) =>
      atualizarLancamento(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      queryClient.invalidateQueries({ queryKey: ["lancamento", variables.id] });
    },
  });
}

export function usePublicarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publicarLancamento(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      queryClient.invalidateQueries({ queryKey: ["lancamento", id] });
    },
  });
}

export function useEncerrarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => encerrarLancamento(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      queryClient.invalidateQueries({ queryKey: ["lancamento", id] });
    },
  });
}

export function useDeletarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletarLancamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}

// --- Meta Accounts Queries ---

export function useMetaAccounts() {
  return useQuery({
    queryKey: ["meta_accounts"],
    queryFn: () => listarMetaAccounts(),
  });
}

// --- Meta Accounts Mutations ---

export function useCriarMetaAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MetaAccount, "$id">) => criarMetaAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta_accounts"] });
    },
  });
}

export function useDeletarMetaAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletarMetaAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta_accounts"] });
    },
  });
}

// --- Funções Auxiliares (Wrappers) ---

export function useValidarMetaToken() {
  return useMutation({
    mutationFn: ({ accountId, token }: { accountId: string; token: string }) => validarMetaToken(accountId, token),
  });
}

export function useTestarFiltroCampanhas() {
  return useMutation({
    mutationFn: ({ accountId, token, palavraChave }: { accountId: string; token: string; palavraChave: string }) =>
      testarFiltroCampanhas(accountId, token, palavraChave),
  });
}
