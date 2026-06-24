import type { RecommendedQuestion } from '../types';

// 선택한 질문(3개)이 곧 최종 문항. 실제 녹음도 이 개수만큼 진행한다.
export function buildFinalQuestions(
  recommended: RecommendedQuestion[],
  selectedIds: string[],
): RecommendedQuestion[] {
  return recommended.filter((q) => selectedIds.includes(q.id));
}
