export type SparkPoint = { x: number; y: number };

// 말속도 시계열 → SVG path + 점 좌표. y는 반전(위가 빠름).
export function buildSparkline(
  series: { t: number; wpm: number }[],
  width: number,
  height: number,
  pad = 6,
): { path: string; points: SparkPoint[] } {
  if (series.length === 0) return { path: '', points: [] };
  const ts = series.map((p) => p.t);
  const wpms = series.map((p) => p.wpm);
  const minT = Math.min(...ts);
  const spanT = Math.max(...ts) - minT || 1;
  const minW = Math.min(...wpms);
  const spanW = Math.max(...wpms) - minW || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = series.map((p) => ({
    x: pad + ((p.t - minT) / spanT) * innerW,
    y: pad + (1 - (p.wpm - minW) / spanW) * innerH,
  }));
  const path = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  return { path, points };
}
