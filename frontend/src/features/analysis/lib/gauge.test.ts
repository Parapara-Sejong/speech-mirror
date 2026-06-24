import { describe, expect, it } from 'vitest';

import { buildGauge, scoreToBand } from './gauge';

describe('buildGauge', () => {
  it('0점이면 fillPath가 빈 문자열', () => {
    expect(buildGauge(0).fillPath).toBe('');
  });
  it('트랙은 항상 270° 호(large-arc-flag=1)', () => {
    expect(buildGauge(50).trackPath).toContain('A 96 96 0 1 1');
  });
  it('50점이면 채움 호는 135°(large-arc-flag=0)', () => {
    expect(buildGauge(50).fillPath).toContain('A 96 96 0 0 1');
  });
  it('100점이면 채움 호는 270°(large-arc-flag=1)', () => {
    expect(buildGauge(100).fillPath).toContain('A 96 96 0 1 1');
  });
  it('NaN은 0점으로 클램프', () => {
    expect(buildGauge(NaN).fillPath).toBe('');
  });
});

describe('scoreToBand', () => {
  it('85 이상은 최상위권', () => {
    expect(scoreToBand(85)).toEqual({ token: 'success', labelKo: '최상위권' });
  });
  it('70은 우수', () => {
    expect(scoreToBand(70).labelKo).toBe('우수');
  });
  it('55는 양호', () => {
    expect(scoreToBand(55).labelKo).toBe('양호');
  });
  it('54는 보완 필요(accent-amber)', () => {
    expect(scoreToBand(54)).toEqual({ token: 'accent-amber', labelKo: '보완 필요' });
  });
});
