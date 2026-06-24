type Props = { fillerWords: Record<string, number> };

export function FillerCard({ fillerWords }: Props) {
  const entries = Object.entries(fillerWords).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">필러 단어</h2>
      <ul className="flex flex-col gap-3">
        {entries.map(([word, count]) => (
          <li key={word} className="flex items-center gap-3">
            <span className="w-12 text-body-md text-ink">{word}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-accent-amber"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-body-sm tabular-nums text-body">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
