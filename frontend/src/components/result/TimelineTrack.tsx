import type { MouseEvent } from 'react';

import type { TimelineSegment } from '../../features/analysis/types';
import { cn } from '../../lib/cn';

const SEG_CLASS: Record<TimelineSegment['type'], string> = {
  speech: 'bg-primary/70',
  silence: 'bg-muted/40',
  filler: 'bg-accent-amber',
};

type Props = {
  timeline: TimelineSegment[];
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
};

export function TimelineTrack({ timeline, duration, currentTime, onSeek }: Props) {
  const safeDur = duration || 1;

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * safeDur);
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="재생 위치"
      aria-valuemin={0}
      aria-valuemax={Math.round(safeDur)}
      aria-valuenow={Math.round(currentTime)}
      className="relative h-8 w-full cursor-pointer overflow-hidden rounded-md bg-surface-dark-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={handleClick}
      onKeyDown={(e) => {
        // 키보드 탐색: ←/→ 로 5초 단위 seek (WCAG 2.1.1)
        if (e.key === 'ArrowRight') onSeek(Math.min(currentTime + 5, safeDur));
        if (e.key === 'ArrowLeft') onSeek(Math.max(currentTime - 5, 0));
      }}
    >
      {timeline.map((seg, i) => (
        <div
          key={i}
          className={cn('absolute top-0 h-full', SEG_CLASS[seg.type])}
          style={{
            left: `${(seg.start / safeDur) * 100}%`,
            width: `${((seg.end - seg.start) / safeDur) * 100}%`,
          }}
          title={seg.type === 'filler' ? `필러: ${seg.word}` : seg.type}
        />
      ))}
      <div
        className="absolute top-0 h-full w-0.5 bg-on-dark"
        style={{ left: `${(currentTime / safeDur) * 100}%` }}
      />
    </div>
  );
}
