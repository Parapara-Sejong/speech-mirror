import { buildSparkline } from '../../features/analysis/lib/sparkline';

type Props = { rateSeries: { t: number; wpm: number }[]; averageWpm: number };

export function SpeedGraph({ rateSeries, averageWpm }: Props) {
  const W = 480;
  const H = 120;
  const { path, points } = buildSparkline(rateSeries, W, H);
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">말 속도</h2>
      <p className="mb-4 text-body-sm text-muted">평균 분당 {averageWpm}단어</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-primary" />
        ))}
      </svg>
    </section>
  );
}
