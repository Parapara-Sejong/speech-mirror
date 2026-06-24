import { create } from 'zustand';

type AnalysisState = {
  analysisId: string;
  setAnalysisId: (analysisId: string) => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisId: '',
  setAnalysisId: (analysisId) => set({ analysisId }),
}));
