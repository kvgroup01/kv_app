import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listarFunis, buscarFunil, criarFunil, atualizarFunil, deletarFunil } from '../lib/appwrite';

export function useFunis() {
  return useQuery({
    queryKey: ['funis'],
    queryFn: listarFunis,
  });
}

export function useFunil(id: string) {
  return useQuery({
    queryKey: ['funil', id],
    queryFn: () => buscarFunil(id),
    enabled: !!id,
  });
}

export function useCriarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarFunil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
    },
  });
}

export function useAtualizarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof atualizarFunil>[1] }) =>
      atualizarFunil(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
      queryClient.invalidateQueries({ queryKey: ['funil', variables.id] });
    },
  });
}

export function useDeletarFunil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletarFunil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] });
    },
  });
}
