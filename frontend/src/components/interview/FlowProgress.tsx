const STEPS = ['이력서', '설정', '질문', '면접'] as const;

type FlowProgressProps = {
  current: number; // 0-based 단계 인덱스
};

export function FlowProgress({ current }: FlowProgressProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-caption">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={
              i <= current
                ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary'
                : 'flex h-6 w-6 items-center justify-center rounded-full bg-surface-card text-muted'
            }
          >
            {i + 1}
          </span>
          <span className={i === current ? 'font-medium text-ink' : 'text-muted'}>{label}</span>
          {i < STEPS.length - 1 ? <span className="text-muted-soft">›</span> : null}
        </li>
      ))}
    </ol>
  );
}
