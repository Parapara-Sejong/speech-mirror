import { describe, expect, it } from 'vitest';

import { buildRadar } from './radar';

describe('buildRadar', () => {
  it('content 만점(100)은 상단 꼭짓점 (120,40)', () => {
    const { axes } = buildRadar({ content: 100, delivery: 0, stability: 0 });
    const c = axes.find((a) => a.key === 'content')!;
    expect(c.ratio).toBe(1);
    expect(`${c.point.x.toFixed(1)},${c.point.y.toFixed(1)}`).toBe('120.0,40.0');
  });
  it('delivery 만점은 자기 상한 88 기준 ratio 1 → (189.3,160)', () => {
    const { axes } = buildRadar({ content: 0, delivery: 88, stability: 0 });
    const d = axes.find((a) => a.key === 'delivery')!;
    expect(d.ratio).toBe(1);
    expect(`${d.point.x.toFixed(1)},${d.point.y.toFixed(1)}`).toBe('189.3,160.0');
  });
  it('축 순서는 content/delivery/stability', () => {
    const { axes } = buildRadar({ content: 1, delivery: 2, stability: 3 });
    expect(axes.map((a) => a.key)).toEqual(['content', 'delivery', 'stability']);
  });
  it('0점이면 모든 꼭짓점이 중심 (120,120)', () => {
    expect(buildRadar({ content: 0, delivery: 0, stability: 0 }).shape).toBe(
      '120.0,120.0 120.0,120.0 120.0,120.0',
    );
  });
  it('링은 외곽·0.5R 2개', () => {
    expect(buildRadar({ content: 0, delivery: 0, stability: 0 }).rings).toHaveLength(2);
  });
});
