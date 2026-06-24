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
      className="relative h-8 w-full cursor-pointer overflow-hidden rounded-md bg-surface-dark-soft"
      onClick={handleClick}
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
