import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/apiClient';
import { mockDelay, USE_MOCK } from '../../lib/config';
import { MOCK_SESSION } from './mockReport';
import type { AnalysisSession } from './types';

// 면접 세션 분석 조회(답변 N개 + 종합). mock 모드면 임시 세션, 실서버 모드면 GET /analyses/:id.
// 실서버는 status가 processing이면 2초 간격 폴링, completed/failed면 중단.
export function useAnalysisReportQuery(id: string) {
  return useQuery<AnalysisSession>({
    enabled: USE_MOCK || id.length > 0,
    queryKey: ['analysisSession', id],
    queryFn: async () => {
      if (USE_MOCK) {
        // 분석 처리 중처럼 보이게 지연(결과 화면 "분석 결과 불러오는 중…")
        await mockDelay();
        return MOCK_SESSION;
      }
      const { data } = await apiClient.get<AnalysisSession>(`/analyses/${id}`);
      return data;
    },
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 2_000 : false),
  });
}
