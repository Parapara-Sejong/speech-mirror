import type { RecommendedQuestion } from '../types';

// 선택 질문 + 미선택 중 랜덤 1개 = 최종 문항 (PRD §6.3 FR-009~011)
export function buildFinalQuestions(
  recommended: RecommendedQuestion[],
  selectedIds: string[],
): RecommendedQuestion[] {
  const selected = recommended.filter((q) => selectedIds.includes(q.id));
  const rest = recommended.filter((q) => !selectedIds.includes(q.id));
  const random = rest.length > 0 ? rest[Math.floor(Math.random() * rest.length)] : undefined;
  return random ? [...selected, random] : selected;
}
