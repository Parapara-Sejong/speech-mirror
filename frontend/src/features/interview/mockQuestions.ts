import type { RecommendedQuestion } from './types';

// ponytail: 직종 무관 공통 풀. 실연동 시 POST /questions/recommend 응답으로 교체.
const COMMON_POOL: RecommendedQuestion[] = [
  { id: 'q1', question: '자신을 한 문장으로 소개해 주세요.', competency: '자기이해' },
  { id: 'q2', question: '가장 어려웠던 프로젝트와 그때의 역할은 무엇이었나요?', competency: '문제해결력' },
  { id: 'q3', question: '협업 중 갈등을 어떻게 해결했는지 사례를 들어 주세요.', competency: '협업·소통' },
  { id: 'q4', question: '최근에 새롭게 배운 기술이나 개념은 무엇인가요?', competency: '학습민첩성' },
  { id: 'q5', question: '실패했던 경험과 거기서 얻은 교훈을 말해 주세요.', competency: '회복탄력성' },
  { id: 'q6', question: '데이터를 근거로 의사결정을 내린 경험이 있나요?', competency: '데이터 활용' },
  { id: 'q7', question: '우선순위가 충돌할 때 어떻게 결정하나요?', competency: '우선순위 판단' },
  { id: 'q8', question: '이 직무에 지원한 이유와 강점을 연결해 설명해 주세요.', competency: '직무이해도' },
  { id: 'q9', question: '맡은 일의 성과를 어떻게 측정하고 개선했나요?', competency: '성과지향' },
  { id: 'q10', question: '앞으로 1년간 이루고 싶은 성장 목표는 무엇인가요?', competency: '성장지향' },
];

// 직종·면접종류는 현재 미사용(공통 풀 반환). 시그니처는 백엔드 연동 대비 유지.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function recommendQuestions(_job: string, _interviewType: string): RecommendedQuestion[] {
  return COMMON_POOL;
}
