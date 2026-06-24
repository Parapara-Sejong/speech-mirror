import type { MicStatus as MicStatusValue } from '../../features/interview/useRecorder';

// FR-018: 정상 초록 / 문제 빨강 (녹음 중은 빨강 점)
const LABELS: Record<MicStatusValue, { text: string; color: string }> = {
  idle: { text: '마이크 권한 필요', color: 'bg-muted' },
  ready: { text: '마이크 정상', color: 'bg-success' },
  recording: { text: '녹음 중', color: 'bg-error' },
  denied: { text: '마이크 권한 거부됨', color: 'bg-error' },
  error: { text: '마이크 오류', color: 'bg-error' },
};

export function MicStatus({ status }: { status: MicStatusValue }) {
  const { text, color } = LABELS[status];
  return (
    <div className="flex items-center gap-2 text-body-sm text-body">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {text}
    </div>
  );
}
