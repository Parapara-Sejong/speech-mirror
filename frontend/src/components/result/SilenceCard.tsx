type Props = { silenceCount: number; longestSilence: number; speechRatio: number };

export function SilenceCard({ silenceCount, longestSilence, speechRatio }: Props) {
  const rows = [
    { label: '침묵 횟수', value: `${silenceCount}회` },
    { label: '가장 긴 침묵', value: `${longestSilence.toFixed(1)}초` },
    { label: '발화 비율', value: `${Math.round(speechRatio * 100)}%` },
  ];
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">침묵 분석</h2>
      <dl className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-body-md">
            <dt className="text-muted">{r.label}</dt>
            <dd className="tabular-nums text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
