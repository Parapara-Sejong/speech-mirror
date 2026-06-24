import { create } from 'zustand';

import type { InterviewMode, RecommendedQuestion, SourceDoc } from './types';

const MAX_SELECT = 3;

// 질문 생성 입력 소스 키(이력서/자기소개서/인재상)
export type SourceKey = 'resume' | 'coverLetter' | 'idealProfile';

const emptyDoc = (): SourceDoc => ({ file: null, text: '', fileName: '' });

type InterviewState = {
  resume: SourceDoc;
  coverLetter: SourceDoc;
  idealProfile: SourceDoc;
  idealTraits: string[];
  job: string;
  interviewType: string;
  mode: InterviewMode;
  recommended: RecommendedQuestion[];
  selectedIds: string[];
  finalQuestions: RecommendedQuestion[];
  setSource: (key: SourceKey, patch: Partial<SourceDoc>) => void;
  setJob: (job: string) => void;
  setInterviewType: (type: string) => void;
  setMode: (mode: InterviewMode) => void;
  toggleIdealTrait: (trait: string) => void;
  setRecommended: (questions: RecommendedQuestion[]) => void;
  toggleSelected: (id: string) => void;
  setFinalQuestions: (questions: RecommendedQuestion[]) => void;
  reset: () => void;
};

const initialState = {
  resume: emptyDoc(),
  coverLetter: emptyDoc(),
  idealProfile: emptyDoc(),
  idealTraits: [] as string[],
  job: '',
  interviewType: '',
  mode: 'practice' as InterviewMode,
  recommended: [] as RecommendedQuestion[],
  selectedIds: [] as string[],
  finalQuestions: [] as RecommendedQuestion[],
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  // 입력 소스(이력서/자기소개서/인재상) 부분 업데이트
  setSource: (key, patch) =>
    set((state) => ({ [key]: { ...state[key], ...patch } }) as Partial<InterviewState>),
  setJob: (job) => set({ job }),
  setInterviewType: (interviewType) => set({ interviewType }),
  setMode: (mode) => set({ mode }),
  // 인재상 키워드 토글(선택). ponytail: 지금은 store 보관만, 추후 질문추천·부합도 피드백 입력으로 사용.
  toggleIdealTrait: (trait) =>
    set((state) => ({
      idealTraits: state.idealTraits.includes(trait)
        ? state.idealTraits.filter((t) => t !== trait)
        : [...state.idealTraits, trait],
    })),
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
