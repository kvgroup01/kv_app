import { useQuery } from '@tanstack/react-query';
import { fetchSurveyEntriesAppwrite } from '../lib/appwrite';
import type { SurveyEntry } from '../lib/types';

export function useSurvey(
  lancamentoId: string | undefined,
  dateRange: { from: Date; to: Date }
) {
  return useQuery<SurveyEntry[]>({
    queryKey: ['survey', lancamentoId, dateRange.from, dateRange.to],
    queryFn: () =>
      fetchSurveyEntriesAppwrite(lancamentoId!, dateRange.from, dateRange.to),
    enabled: !!lancamentoId,
    staleTime: 1000 * 60 * 10,
  });
}
