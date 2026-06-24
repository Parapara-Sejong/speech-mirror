import { highlightFillers } from '../../features/analysis/lib/transcript';

type Props = { transcript: string; fillerWords: Record<string, number> };

export function TranscriptPanel({ transcript, fillerWords }: Props) {
  const tokens = highlightFillers(transcript, fillerWords);
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">전사</h2>
      <p className="text-body-md leading-relaxed text-body">
        {tokens.map((tok, i) =>
          tok.isFiller ? (
            <mark key={i} className="rounded bg-accent-amber/30 px-0.5 text-ink">
              {tok.text}
            </mark>
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </p>
    </section>
  );
}
