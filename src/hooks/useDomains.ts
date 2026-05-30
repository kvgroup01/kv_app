import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Domain {
  id: string
  user_id: string
  domain: string
  ssl_active: boolean
  verified: boolean
  created_at: string
}

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Domain[]
    },
  })
}

export function useCreateDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (domain: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('domains')
        .insert({ domain, user_id: user?.id, ssl_active: true, verified: false })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  })
}

export function useDeleteDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('domains').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }),
  })
}
