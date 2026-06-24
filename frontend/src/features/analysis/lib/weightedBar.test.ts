import { describe, expect, it } from 'vitest';

import { buildWeightedBar } from './weightedBar';

describe('buildWeightedBar', () => {
  it('기여도 = 원점수 × 가중치, 누적 offset', () => {
    const { segments, filled, remainder } = buildWeightedBar({ content: 80, delivery: 70, stability: 60 });
    expect(segments.map((s) => s.contrib)).toEqual([48, 14, 12]);
    expect(segments.map((s) => s.offset)).toEqual([0, 48, 62]);
    expect(filled).toBe(74);
    expect(remainder).toBe(26);
  });
  it('content가 첫 세그먼트이고 라벨은 한국어', () => {
    const { segments } = buildWeightedBar({ content: 50, delivery: 50, stability: 50 });
    expect(segments[0].axis).toBe('content');
    expect(segments[0].label).toBe('내용');
  });
  it('delivery/stability의 max는 88', () => {
    const { segments } = buildWeightedBar({ content: 0, delivery: 0, stability: 0 });
    expect(segments[1].max).toBe(88);
    expect(segments[2].max).toBe(88);
  });
  it('0점이면 filled 0, remainder 100', () => {
    const { filled, remainder } = buildWeightedBar({ content: 0, delivery: 0, stability: 0 });
    expect(filled).toBe(0);
    expect(remainder).toBe(100);
  });
});
