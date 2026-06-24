import { buildRadar } from '../../features/analysis/lib/radar';
import type { ScoreAxis } from '../../features/analysis/lib/weights';
import { cn } from '../../lib/cn';

type Props = { scores: Record<ScoreAxis, number> };

const SWATCH_BG: Record<ScoreAxis, string> = {
  content: 'bg-primary',
  delivery: 'bg-accent-teal',
  stability: 'bg-accent-amber',
};
// 모양으로도 축 구분(색각 안전): content=원, delivery=마름모, stability=삼각형
const SWATCH_SHAPE: Record<ScoreAxis, string> = {
  content: 'rounded-full',
  delivery: 'rotate-45',
  stability: '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
};

function Marker({ axis, x, y }: { axis: ScoreAxis; x: number; y: number }) {
  if (axis === 'content') return <circle cx={x} cy={y} r={5} className="fill-primary" />;
  if (axis === 'delivery')
    return (
      <rect
        x={x - 4.5}
        y={y - 4.5}
        width={9}
        height={9}
        transform={`rotate(45 ${x} ${y})`}
        className="fill-accent-teal"
      />
    );
  return <polygon points={`${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}`} className="fill-accent-amber" />;
}

export function BalanceTriangle({ scores }: Props) {
  const { shape, rings, spokes, axes } = buildRadar(scores);

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">균형 분석</h2>
      <p className="mb-4 text-body-sm text-muted">세 축의 점수 균형 (전달력·안정성은 88점 만점 기준)</p>
      <svg viewBox="0 0 240 240" className="mx-auto h-60 w-full max-w-[260px]" aria-hidden="true">
        <polygon points={rings[0]} fill="none" strokeWidth={1} className="stroke-hairline" />
        <polygon points={rings[1]} fill="none" strokeWidth={1} className="stroke-hairline-soft" />
        {spokes.map((s, i) => (
          <line key={i} x1={120} y1={120} x2={s.x} y2={s.y} strokeWidth={1} className="stroke-hairline-soft" />
        ))}
        <g className="motion-safe:animate-pop-in" style={{ transformOrigin: '120px 120px' }}>
          <polygon points={shape} className="fill-primary/15" />
          <polygon points={shape} fill="none" strokeWidth={2} className="stroke-primary" />
          {axes.map((a) => (
            <Marker key={a.key} axis={a.key} x={a.point.x} y={a.point.y} />
          ))}
        </g>
        {axes.map((a) => (
          <text key={a.key} x={a.rim.x} y={a.rim.y} fontSize={10} textAnchor="middle" className="fill-muted-soft">
            {a.max}
          </text>
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap justify-center gap-3">
        {axes.map((a) => (
          <li key={a.key} className="flex items-center gap-2 text-body-sm">
            <span className={cn('h-3 w-3 flex-none', SWATCH_BG[a.key], SWATCH_SHAPE[a.key])} />
            <span className="text-ink">
              {a.label} <span className="tabular-nums">{a.score}</span>
              <span className="text-muted-soft"> · {a.max}점 만점</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
