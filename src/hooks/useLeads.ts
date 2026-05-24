import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Lead = {
  id: string;
  page_id: string;
  cliente_id: string | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  utm_audience: string | null;
  referral_source: string | null;
  event_id: string | null;
  pais: string | null;
  cidade: string | null;
  estado: string | null;
  ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  campos_extras: Record<string, any>;
  criado_em: string;
};

export function useLeads(pageId: string | undefined, period?: string) {
  return useQuery({
    queryKey: ["leads", pageId, period],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .eq("page_id", pageId!)
        .order("criado_em", { ascending: false });

      if (period && period !== "all") {
        const now = new Date();
        let from = new Date();
        if (period === "7d") from.setDate(now.getDate() - 7);
        if (period === "30d") from.setDate(now.getDate() - 30);
        if (period === "90d") from.setDate(now.getDate() - 90);
        query = query.gte("criado_em", from.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!pageId,
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
