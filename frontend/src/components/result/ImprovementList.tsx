type Props = { points: string[] };

export function ImprovementList({ points }: Props) {
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">개선 포인트</h2>
      <ol className="flex flex-col gap-3">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3 text-body-md text-body">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-body-sm text-on-primary">
              {i + 1}
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
