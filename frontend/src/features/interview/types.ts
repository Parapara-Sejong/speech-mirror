export type InterviewMode = 'practice' | 'real';

export type RecommendedQuestion = {
  id: string;
  question: string;
  competency: string; // 평가 역량 (예: "문제해결력")
};

// PRD §6.2 직종
export const JOBS = [
  '백엔드',
  '프론트엔드',
  '데이터 분석가',
  'AI·ML 엔지니어',
  '서비스 기획자',
  '마케터',
  '디자이너',
] as const;

// PRD §6.2 면접 종류
export const INTERVIEW_TYPES = [
  { id: '인성', label: '인성/태도', desc: '가치관·조직 적합성' },
  { id: '직무', label: '직무/역량', desc: '직무 지식·문제 해결력' },
  { id: 'PT', label: 'PT 면접', desc: '발표력·논리력' },
  { id: '상황', label: '상황/롤플레잉', desc: '업무 상황 대응력' },
  { id: '압박', label: '압박 면접', desc: '스트레스 대응력' },
] as const;

// 인재상 키워드(선택). 회사가 원하는 가치. 추후 질문 추천·평가역량 부합도 피드백 입력으로 사용.
export const IDEAL_TRAITS = [
  '도전정신',
  '협업·소통',
  '고객중심',
  '주도성',
  '성장지향',
  '책임감',
  '창의성',
  '전문성',
] as const;
