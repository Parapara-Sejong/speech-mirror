import { create } from 'zustand';

import type { InterviewMode, RecommendedQuestion } from './types';

const MAX_SELECT = 3;

type InterviewState = {
  resumeText: string;
  job: string;
  interviewType: string;
  mode: InterviewMode;
  recommended: RecommendedQuestion[];
  selectedIds: string[];
  finalQuestions: RecommendedQuestion[];
  setResumeText: (text: string) => void;
  setJob: (job: string) => void;
  setInterviewType: (type: string) => void;
  setMode: (mode: InterviewMode) => void;
  setRecommended: (questions: RecommendedQuestion[]) => void;
  toggleSelected: (id: string) => void;
  setFinalQuestions: (questions: RecommendedQuestion[]) => void;
  reset: () => void;
};

const initialState = {
  resumeText: '',
  job: '',
  interviewType: '',
  mode: 'practice' as InterviewMode,
  recommended: [] as RecommendedQuestion[],
  selectedIds: [] as string[],
  finalQuestions: [] as RecommendedQuestion[],
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  setResumeText: (resumeText) => set({ resumeText }),
  setJob: (job) => set({ job }),
  setInterviewType: (interviewType) => set({ interviewType }),
  setMode: (mode) => set({ mode }),
  // 추천 새로 받으면 선택 초기화
  setRecommended: (recommended) => set({ recommended, selectedIds: [] }),
  toggleSelected: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return { selectedIds: state.selectedIds.filter((x) => x !== id) };
      }
      // 3개 초과 선택 막기
      if (state.selectedIds.length >= MAX_SELECT) return state;
      return { selectedIds: [...state.selectedIds, id] };
    }),
  setFinalQuestions: (finalQuestions) => set({ finalQuestions }),
  reset: () => set(initialState),
}));
