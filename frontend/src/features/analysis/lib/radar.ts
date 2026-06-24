import { AXIS_LABEL, SCORE_MAX, type ScoreAxis } from './weights';

// 3축 균형 레이더. 각 축을 자기 상한으로 정규화(88 천장 왜곡 제거). content를 상단에.
const CX = 120;
const CY = 120;
const R = 80;
const ANGLE: Record<ScoreAxis, number> = { content: -90, delivery: 30, stability: 150 };
const ORDER: ScoreAxis[] = ['content', 'delivery', 'stability'];

const clamp01 = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function at(deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function ring(r: number): string {
  return ORDER.map((axis) => {
    const p = at(ANGLE[axis], r);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
}

export type RadarPoint = { x: number; y: number };
export type RadarAxis = {
  key: ScoreAxis;
  label: string;
  score: number;
  max: number;
  ratio: number;
  point: RadarPoint;
  labelPos: RadarPoint;
  rim: RadarPoint;
};
export type RadarGeom = { shape: string; rings: string[]; spokes: RadarPoint[]; axes: RadarAxis[] };

export function buildRadar(scores: Record<ScoreAxis, number>): RadarGeom {
  const axes: RadarAxis[] = ORDER.map((key) => {
    const score = Number.isFinite(scores[key]) ? scores[key] : 0;
    const ratio = clamp01(score / SCORE_MAX[key]);
    return {
      key,
      label: AXIS_LABEL[key],
      score,
      max: SCORE_MAX[key],
      ratio,
      point: at(ANGLE[key], ratio * R),
      labelPos: at(ANGLE[key], R + 20),
      rim: at(ANGLE[key], R),
    };
  });
  const shape = axes.map((a) => `${a.point.x.toFixed(1)},${a.point.y.toFixed(1)}`).join(' ');
  return { shape, rings: [ring(R), ring(R * 0.5)], spokes: axes.map((a) => a.rim), axes };
}
