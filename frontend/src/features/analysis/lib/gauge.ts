// 270° 원형 게이지 기하. 종합점수를 호 채움 비율로 표현한다(재계산 아님, 표시용).
const CENTER = 120;
const R = 96;
const START = 135; // 좌하단 시작
const SWEEP = 270; // 시계방향 270°, 하단 90° 열림

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

function polar(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CENTER + R * Math.cos(rad), y: CENTER + R * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number): string {
  const s = polar(startDeg);
  const e = polar(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

export type GaugeGeom = { trackPath: string; fillPath: string };

export function buildGauge(overallScore: number): GaugeGeom {
  const frac = clamp(overallScore, 0, 100) / 100;
  return {
    trackPath: arc(START, START + SWEEP),
    fillPath: frac <= 0 ? '' : arc(START, START + SWEEP * frac),
  };
}

export type Band = { token: 'success' | 'primary' | 'accent-amber'; labelKo: string };

// 밴드 컷오프는 mascot.ts(scoreToMascot)의 85/70/55와 일치 — 표정과 색이 어긋나지 않게.
export function scoreToBand(score: number): Band {
  if (score >= 85) return { token: 'success', labelKo: '최상위권' };
  if (score >= 70) return { token: 'primary', labelKo: '우수' };
  if (score >= 55) return { token: 'primary', labelKo: '양호' };
  return { token: 'accent-amber', labelKo: '보완 필요' };
}
