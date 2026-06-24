import type { TimelineSegment } from '../types';

// t를 [start, end) 로 포함하는 구간. 없으면 null(구간 사이 공백 포함).
export function segmentAtTime(
  timeline: TimelineSegment[],
  t: number,
): TimelineSegment | null {
  return timeline.find((seg) => t >= seg.start && t < seg.end) ?? null;
}
