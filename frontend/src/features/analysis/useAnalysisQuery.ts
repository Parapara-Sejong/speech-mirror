import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/apiClient';
import { AnalysisResult } from './types';

async function getAnalysis(analysisId: string) {
  const response = await apiClient.get<AnalysisResult>(`/analyses/${analysisId}`);
  return response.data;
}

export function useAnalysisQuery(analysisId: string) {
  return useQuery({
    enabled: analysisId.length > 0,
    queryKey: ['analysis', analysisId],
    queryFn: () => getAnalysis(analysisId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 2_000 : false;
    },
  });
}
