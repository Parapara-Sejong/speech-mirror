import type { ContentFeedback } from '../../features/analysis/types';

type Props = { feedback: ContentFeedback };

const AXES = [
  { key: 'logic', label: '논리 구조' },
  { key: 'expertise', label: '직무 전문성' },
] as const;

export function ContentFeedbackPanel({ feedback }: Props) {
  return (
    <section className="flex flex-col gap-6 rounded-lg bg-surface-card p-8">
      <h2 className="text-title-md text-ink">내용 피드백</h2>
      {AXES.map((axis) => (
        <div key={axis.key} className="flex flex-col gap-1">
          <h3 className="text-title-sm text-ink">{axis.label}</h3>
          <p className="text-body-md text-body">{feedback[axis.key].diagnosis}</p>
          <p className="rounded-md bg-canvas p-3 text-body-sm text-body-strong">
            예시: {feedback[axis.key].example}
          </p>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <h3 className="text-title-sm text-ink">평가역량 부합도</h3>
        <p className="text-body-md text-body">{feedback.competencyFit}</p>
      </div>
    </section>
  );
}
