import { cn } from '../../lib/cn';
import type { RecommendedQuestion } from '../../features/interview/types';
import { Badge } from '../ui/Badge';

type QuestionCardProps = {
  question: RecommendedQuestion;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function QuestionCard({ question, selected, disabled, onToggle }: QuestionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-lg border p-5 text-left',
        selected ? 'border-primary bg-surface-card' : 'border-hairline bg-canvas',
        disabled && !selected ? 'opacity-50' : '',
      )}
    >
      <Badge>{question.competency}</Badge>
      <p className="text-body-md text-ink">{question.question}</p>
    </button>
  );
}
