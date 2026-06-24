import { buildGauge, scoreToBand, type Band } from '../../features/analysis/lib/gauge';
import { MASCOT_SRC, scoreToMascot } from '../../features/analysis/lib/mascot';
import { cn } from '../../lib/cn';

type Props = { overallScore: number };

const BAND_STROKE: Record<Band['token'], string> = {
  success: 'stroke-success',
  primary: 'stroke-primary',
  'accent-amber': 'stroke-accent-amber',
};

export function WeightedScoreGauge({ overallScore }: Props) {
  const { trackPath, fillPath } = buildGauge(overallScore);
  const band = scoreToBand(overallScore);
  const mascot = scoreToMascot(overallScore);

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">종합 점수</h2>
      <p className="mb-4 text-body-sm text-muted">내용·전달력·안정성을 가중 합산한 결과</p>
      <div className="relative mx-auto w-60">
        <svg viewBox="0 0 240 240" className="w-full" aria-hidden="true">
          <path d={trackPath} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-hairline" />
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              strokeWidth={14}
              strokeLinecap="round"
              pathLength={1}
              className={cn(BAND_STROKE[band.token], 'motion-safe:animate-gauge-fill')}
              style={{ strokeDasharray: 1 }}
            />
          )}
        </svg>
        <img
          src={MASCOT_SRC[mascot]}
          alt=""
          className="pointer-events-none absolute inset-0 m-auto h-20 w-20 object-contain"
        />
      </div>
      <div className="mt-2 flex flex-col items-center">
        <p className="text-display-lg tabular-nums text-ink">{overallScore}</p>
        <span className="text-caption text-muted-soft">{band.labelKo}</span>
      </div>
      <p className="mt-3 text-center text-caption text-muted-soft">전달력·안정성은 88점 만점 기준</p>
      <p className="sr-only">
        종합 점수 {overallScore}점, {band.labelKo}.
      </p>
    </section>
  );
}
