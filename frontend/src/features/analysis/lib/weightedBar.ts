import { AXIS_LABEL, SCORE_MAX, SCORE_WEIGHTS, type ScoreAxis } from './weights';

// 가중 기여도 누적 막대. 폭 = 원점수 × 가중치(= 실제 기여 점수). 시각화 전용.
export type ContribSeg = {
  axis: ScoreAxis;
  label: string;
  raw: number;
  max: number;
  weight: number;
  contrib: number; // raw*weight, 소수1자리
  width: number; // 0..100 트랙상 % (값이 곧 %)
  offset: number; // 누적 시작 %
};
export type WeightedBar = { segments: ContribSeg[]; filled: number; remainder: number };

const ORDER: ScoreAxis[] = ['content', 'delivery', 'stability']; // 가중치 큰 순 고정
const round1 = (n: number): number => Number(n.toFixed(1));

export function buildWeightedBar(scores: Record<ScoreAxis, number>): WeightedBar {
  let acc = 0;
  const segments = ORDER.map((axis) => {
    const raw = Number.isFinite(scores[axis]) ? scores[axis] : 0;
    const weight = SCORE_WEIGHTS[axis];
    const contrib = round1(raw * weight);
    const seg: ContribSeg = {
      axis,
      label: AXIS_LABEL[axis],
      raw,
      max: SCORE_MAX[axis],
      weight,
      contrib,
      width: contrib,
      offset: round1(acc),
    };
    acc += contrib;
    return seg;
  });
  const filled = round1(acc);
  return { segments, filled, remainder: round1(Math.max(0, 100 - filled)) };
}
