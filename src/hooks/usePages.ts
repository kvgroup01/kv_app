import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PageData } from '../lib/blocks/types'

export interface Page {
  id: string
  cliente_id: string
  nome: string
  slug: string
  status: 'draft' | 'published'
  page_data: PageData
  html: string | null
  thumbnail_url: string | null
  meta_titulo: string | null
  meta_descricao: string | null
  meta_imagem_url: string | null
  publicado_em: string | null
  criado_em: string
  atualizado_em: string
}

export function usePages(clienteId: string | null) {
  return useQuery({
    queryKey: ['pages', clienteId],
    queryFn: async () => {
      if (!clienteId) return []
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data as Page[]
    },
    enabled: !!clienteId,
  })
}

export function usePage(id: string | undefined) {
  return useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Page
    },
    enabled: !!id,
  })
}

export function useCreatePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { cliente_id: string; nome: string; slug: string }) => {
      const { data, error } = await supabase
        .from('pages')
        .insert({ ...payload, page_data: { blocks: [] }, status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Page
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pages', data.cliente_id] })
    },
  })
}

export function useUpdatePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Page> & { id: string }) => {
      const { data, error } = await supabase
        .from('pages')
        .update({ ...payload, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Page
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['page', data.id] })
      qc.invalidateQueries({ queryKey: ['pages', data.cliente_id] })
    },
  })
}

export function useDeletePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase.from('pages').delete().eq('id', id)
      if (error) throw error
      return { id, clienteId }
    },
    onSuccess: ({ clienteId }) => {
      qc.invalidateQueries({ queryKey: ['pages', clienteId] })
    },
  })
}

export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
