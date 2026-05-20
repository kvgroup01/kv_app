import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { SurveyEntry } from "../lib/types";

export function useSurvey(
  lancamentoId: string | undefined,
  dateRange: { from?: Date; to?: Date } | undefined,
  temSurvey: boolean = true,
) {
  const fromStr = dateRange?.from
    ? dateRange.from.toISOString().split("T")[0]
    : "";
  const toStr = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";

  return useQuery<SurveyEntry[]>({
    queryKey: ["survey", lancamentoId, fromStr, toStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_entries")
        .select("*")
        .eq("lancamento_id", lancamentoId!)
        .gte("data", fromStr)
        .lte("data", toStr)
        .limit(5000);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        $id: item.id,
        $createdAt: item.criado_em,
      }));
    },
    enabled: !!lancamentoId && !!dateRange && temSurvey,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
}
