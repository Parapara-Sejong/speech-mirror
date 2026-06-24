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

  // 오디오 메타데이터(duration)가 없으면 타임라인 마지막 구간 끝을 길이로 폴백.
  // 샘플 음성이 없어도 발화/침묵/필러 구간·플레이헤드가 올바른 비율로 보이게 한다.
  const timelineEnd = timeline.length > 0 ? timeline[timeline.length - 1].end : 0;
  const totalDuration = duration || timelineEnd;
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
          {formatTime(currentTime)} / {formatTime(totalDuration)}
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
        duration={totalDuration}
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
