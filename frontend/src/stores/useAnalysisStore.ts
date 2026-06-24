import { create } from 'zustand';

type AnalysisState = {
  analysisId: string;
  setAnalysisId: (analysisId: string) => void;
  // 라이브 분석 세션 id(POST /analyses 응답). 결과 폴링에 사용.
  sessionId: string;
  setSessionId: (sessionId: string) => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisId: '',
  setAnalysisId: (analysisId) => set({ analysisId }),
  sessionId: '',
  setSessionId: (sessionId) => set({ sessionId }),
}));
