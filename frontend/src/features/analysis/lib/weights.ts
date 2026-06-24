// 종합 점수 가중치. 백엔드 단일 진실의 거울(mirror)이다.
// 동기화: backend/app/services/analysis_pipeline.py -> WEIGHTS
//   값이 바뀌면 양쪽을 함께 수정할 것. 프론트는 백엔드가 계산한 overallScore를
//   재계산하지 않고, 오직 "기여도 시각화"에만 이 상수를 쓴다.
export const SCORE_WEIGHTS = {
  content: 0.6,
  delivery: 0.2,
  stability: 0.2,
} as const;

export type ScoreAxis = keyof typeof SCORE_WEIGHTS;

// 축별 실제 점수 상한. content만 0..100, delivery/stability는 88에서 시작해
// 만점을 자제하므로 0..88이다 (analysis_pipeline.py: DELIVERY_BASE/STABILITY_BASE=88).
export const SCORE_MAX: Record<ScoreAxis, number> = {
  content: 100,
  delivery: 88,
  stability: 88,
};

// 한국어 축 라벨 — 세 차트가 공유한다(하드코딩 금지).
export const AXIS_LABEL: Record<ScoreAxis, string> = {
  content: '내용',
  delivery: '전달력',
  stability: '안정성',
};
