import { MASCOT_SRC, scoreToMascot } from '../../features/analysis/lib/mascot';

type Props = {
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
};

const SUB = [
  { key: 'content', label: '내용' },
  { key: 'delivery', label: '전달력' },
  { key: 'stability', label: '안정성' },
] as const;

export function ScorePanel({ overallScore, scores }: Props) {
  const mascot = scoreToMascot(overallScore);
  return (
    <section className="flex flex-col gap-6 rounded-lg bg-surface-card p-8 sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <img src={MASCOT_SRC[mascot]} alt="" className="h-24 w-24 object-contain" />
        <div>
          <p className="text-body-sm text-muted">종합 점수</p>
          <p className="text-display-lg text-ink">{overallScore}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {SUB.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-14 text-body-sm text-muted">{s.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${scores[s.key]}%` }}
              />
            </div>
            <span className="w-8 text-right text-body-sm tabular-nums text-body">
              {scores[s.key]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
