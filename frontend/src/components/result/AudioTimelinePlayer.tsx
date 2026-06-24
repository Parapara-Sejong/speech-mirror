import { useRef, useState } from 'react';

import { formatTime } from '../../features/analysis/lib/format';
import { segmentAtTime } from '../../features/analysis/lib/timeline';
import type { TimelineSegment } from '../../features/analysis/types';
import { TimelineTrack } from './TimelineTrack';

type Props = { audioUrl: string; timeline: TimelineSegment[] };

const LABEL: Record<TimelineSegment['type'], string> = {
  speech: '발화',
  silence: '침묵',
  filler: '필러',
};

export function AudioTimelinePlayer({ audioUrl, timeline }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = segmentAtTime(timeline, currentTime);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }

  function seek(t: number) {
    const a = audioRef.current;
    if (a) a.currentTime = t;
    setCurrentTime(t);
  }

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-3 bg-surface-dark px-6 py-4 text-on-dark">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? '일시정지' : '재생'}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary"
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <span className="font-mono text-body-sm tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="text-body-sm text-on-dark-soft">
          {current
            ? current.type === 'filler'
              ? `필러 "${current.word}"`
              : LABEL[current.type]
            : '—'}
        </span>
      </div>
      <TimelineTrack
        timeline={timeline}
        duration={duration}
        currentTime={currentTime}
        onSeek={seek}
      />
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
