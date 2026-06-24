import { useQuery } from '@tanstack/react-query';

import { MOCK_REPORT } from './mockReport';
import type { AnalysisReport } from './types';

// 백엔드 없이 로딩→완료 흐름을 시뮬레이션하는 mock 훅.
// 실제 연동 시 queryFn을 axios 호출 + §11 어댑터로 교체한다.
export function useAnalysisReportQuery(id: string) {
  return useQuery<AnalysisReport>({
    queryKey: ['analysisReport', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_REPORT;
      // 실제: const { data } = await apiClient.get(`/analyses/${id}`); return adaptReport(data);
    },
  });
}
