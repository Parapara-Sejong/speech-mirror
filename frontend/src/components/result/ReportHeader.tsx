import { Badge } from '../ui/Badge';

type Props = { question: string; competency: string };

export function ReportHeader({ question, competency }: Props) {
  return (
    <header className="flex flex-col gap-3">
      <Badge variant="coral">{competency}</Badge>
      <h1 className="text-display-sm text-ink">{question}</h1>
    </header>
  );
}
