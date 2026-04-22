import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarClientes,
  buscarCliente,
  buscarClientePorSlug,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  listarPastas,
  criarPasta,
  deletarPasta
} from '../lib/appwrite';
import type { Cliente, Pasta } from '../lib/types';

// Query Keys Constantes
export const CLIENTES_KEY = ['clientes'];
export const PASTAS_KEY = ['pastas'];

// --- Hooks de Clientes ---

export function useClientes() {
  return useQuery({
    queryKey: CLIENTES_KEY,
    queryFn: listarClientes,
  });
}

export function useCliente(id?: string) {
  return useQuery({
    queryKey: [...CLIENTES_KEY, id],
    queryFn: () => buscarCliente(id!),
    enabled: !!id,
  });
}

export function useClientePorSlug(slug?: string) {
  return useQuery({
    queryKey: [...CLIENTES_KEY, 'slug', slug],
    queryFn: () => buscarClientePorSlug(slug!),
    enabled: !!slug,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Cliente, '$id' | '$createdAt'>) => criarCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cliente> }) => atualizarCliente(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
      queryClient.invalidateQueries({ queryKey: [...CLIENTES_KEY, variables.id] });
    },
  });
}

export function useDeletarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
}

// --- Hooks de Pastas ---

export function usePastas() {
  return useQuery({
    queryKey: PASTAS_KEY,
    queryFn: listarPastas,
  });
}

export function useCriarPasta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nome, cor }: { nome: string; cor: string }) => criarPasta(nome, cor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PASTAS_KEY });
    },
  });
}

export function useDeletarPasta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletarPasta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PASTAS_KEY });
    },
  });
}
