import { buildWeightedBar } from '../../features/analysis/lib/weightedBar';
import type { ScoreAxis } from '../../features/analysis/lib/weights';
import { cn } from '../../lib/cn';

type Props = { overallScore: number; scores: Record<ScoreAxis, number> };

const SEG_BG: Record<ScoreAxis, string> = {
  content: 'bg-primary',
  delivery: 'bg-accent-teal',
  stability: 'bg-accent-amber',
};

export function WeightedScoreLedger({ overallScore, scores }: Props) {
  const { segments, filled } = buildWeightedBar(scores);

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">가중 점수 구성</h2>
      <p className="mb-4 text-body-sm text-muted">내용 60% · 전달력 20% · 안정성 20% 가중 합산</p>

      <div className="relative h-8 w-full overflow-hidden rounded-full bg-hairline" aria-hidden="true">
        {segments.map((seg) => (
          <div
            key={seg.axis}
            className={cn(
              'absolute top-0 h-full origin-left border-l border-hairline-soft first:border-l-0',
              SEG_BG[seg.axis],
              'motion-safe:animate-bar-grow',
            )}
            style={{ left: `${seg.offset}%`, width: `${seg.width}%` }}
          >
            {seg.axis === 'content' && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-caption text-on-primary">
                {seg.label}
              </span>
            )}
          </div>
        ))}
        <div
          className="absolute top-0 h-full w-0.5 bg-ink"
          style={{ left: `${Math.min(overallScore, 100)}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {segments.map((seg) => (
          <li key={seg.axis} className="flex items-center gap-3 text-body-sm">
            <span className={cn('h-3 w-3 flex-none rounded-full', SEG_BG[seg.axis])} />
            <span className="text-muted">
              {seg.label}
              {seg.max < 100 && <span className="text-muted-soft"> (88점 만점)</span>}
            </span>
            <span className="ml-auto tabular-nums text-body">
              {seg.raw} <span className="text-muted">× {seg.weight}</span> = {seg.contrib}
            </span>
          </li>
        ))}
        <li className="mt-1 flex items-center gap-3 border-t border-hairline-soft pt-2 text-body-sm">
          <span className="text-muted">가중 합산</span>
          <span className="ml-auto tabular-nums text-ink">
            {filled} <span className="text-muted-soft">· 종합 {overallScore} (반올림 오차 ±1)</span>
          </span>
        </li>
      </ul>
    </section>
  );
}
