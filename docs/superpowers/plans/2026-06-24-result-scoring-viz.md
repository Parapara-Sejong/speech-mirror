# 결과 화면 점수 시각화 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 종합점수가 가중 합산임을 직관적·시각적으로 보여주는 3개 결과 컴포넌트(원형 게이지·가중 구성 막대·균형 삼각형)를 추가하고 `ResultPage` 종합 섹션의 `ScorePanel`을 교체한다.

**Architecture:** 기하 계산은 `src/features/analysis/lib/`의 순수함수(`sparkline.ts` 패턴)로, 렌더는 인라인 `<svg>`/CSS 막대 + tailwind 토큰(`SpeedGraph.tsx`/`TimelineTrack.tsx` 패턴)으로 분리. 가중치는 백엔드를 미러한 프론트 상수로 시각화에만 사용(재계산 금지). 애니메이션은 `prefers-reduced-motion` 안전 훅 + `motion-safe:` 전이로만.

**Tech Stack:** React 19 · TypeScript · Vite · Tailwind v4. 테스트는 Vitest(신규 dev 의존성, 순수함수만). 런타임/번들 신규 의존성·신규 에셋 없음.

**Spec:** `docs/superpowers/specs/2026-06-24-result-scoring-viz-design.md`

## Global Constraints

- **런타임/번들 신규 의존성 0, 신규 이미지/SVG 에셋 0.** (Vitest는 dev 전용)
- **색은 항상 tailwind 토큰 클래스**(`stroke-primary`, `bg-accent-teal` 등), 인라인 hex·`style`의 color 금지. `style`은 동적 기하(left/width%, transform, dashoffset)에만.
- **축↔색**: `content→primary`, `delivery→accent-teal`, `stability→accent-amber`. 모두 `src/styles.css @theme`에 존재.
- **UI 카피는 한국어**, 주석도 한국어(WHY 중심).
- **백엔드 `overallScore`는 절대 재계산하지 않는다** — 표시만.
- **축별 상한**: `content` 0..100, `delivery`/`stability` 0..88. 정직한 스케일링 필수.
- **카드 셸 통일**: `<section className="rounded-lg bg-surface-card p-8">` + `<h2 className="mb-1 text-title-md text-ink">` + `<p className="mb-4 text-body-sm text-muted">`.
- **커밋/푸시는 사용자 승인 후**(CLAUDE.md). 커밋 메시지 형식 `<type> : <설명> #<이슈번호>` — 이슈번호는 사용자가 부여. 아래 커밋 단계는 형식 예시이며 이슈번호를 붙여 실행한다.

---

### Task 1: 테스트 인프라 + 가중치 상수 (`weights.ts`)

**Files:**
- Modify: `frontend/package.json` (devDependencies + `test` script)
- Create: `frontend/src/features/analysis/lib/weights.ts`

**Interfaces:**
- Produces: `SCORE_WEIGHTS` (`{content:0.6,delivery:0.2,stability:0.2}` as const), `type ScoreAxis = 'content'|'delivery'|'stability'`, `SCORE_MAX: Record<ScoreAxis,number>` (100/88/88), `AXIS_LABEL: Record<ScoreAxis,string>` (내용/전달력/안정성).

- [ ] **Step 1: Vitest 설치**

Run (in `frontend/`): `npm install -D vitest`
Expected: `vitest`가 devDependencies에 추가됨.

- [ ] **Step 2: `test` 스크립트 추가**

`frontend/package.json`의 `"scripts"`에 추가:

```json
"test": "vitest run"
```

- [ ] **Step 3: 테스트 러너 동작 확인**

Run: `npm run test`
Expected: "No test files found" (또는 0 passed) — 러너가 정상 기동.

- [ ] **Step 4: `weights.ts` 작성**

`frontend/src/features/analysis/lib/weights.ts`:

```ts
// 종합 점수 가중치. 백엔드 단일 진실의 거울(mirror)이다.
// 동기화: backend/app/services/analysis_pipeline.py -> WEIGHTS
//   값이 바뀌면 양쪽을 함께 수정할 것. 프론트는 백엔드가 계산한 overallScore를
//   재계산하지 않고, 오직 "기여도 시각화"에만 이 상수를 쓴다.
export const SCORE_WEIGHTS = {
  content: 0.6,
  delivery: 0.2,
  stability: 0.2,
} as const;

export type ScoreAxis = keyof typeof SCORE_WEIGHTS;

// 축별 실제 점수 상한. content만 0..100, delivery/stability는 88에서 시작해
// 만점을 자제하므로 0..88이다 (analysis_pipeline.py: DELIVERY_BASE/STABILITY_BASE=88).
export const SCORE_MAX: Record<ScoreAxis, number> = {
  content: 100,
  delivery: 88,
  stability: 88,
};

// 한국어 축 라벨 — 세 차트가 공유한다(하드코딩 금지).
export const AXIS_LABEL: Record<ScoreAxis, string> = {
  content: '내용',
  delivery: '전달력',
  stability: '안정성',
};
```

- [ ] **Step 5: 타입체크**

Run: `npm run build`
Expected: PASS (타입 에러 없음).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/features/analysis/lib/weights.ts
git commit -m "chore : Vitest 도입 및 점수 가중치 상수 추가"
```

---

### Task 2: 게이지 기하 헬퍼 (`gauge.ts`)

**Files:**
- Create: `frontend/src/features/analysis/lib/gauge.ts`
- Test: `frontend/src/features/analysis/lib/gauge.test.ts`

**Interfaces:**
- Produces: `buildGauge(overallScore:number): { trackPath:string; fillPath:string }`, `scoreToBand(score:number): { token:'success'|'primary'|'accent-amber'; labelKo:string }`, `type Band`.

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/features/analysis/lib/gauge.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/analysis/lib/gauge.test.ts`
Expected: FAIL ("Failed to resolve import './gauge'" 또는 함수 미정의).

- [ ] **Step 3: 구현**

`frontend/src/features/analysis/lib/gauge.ts`:

```ts
// 270° 원형 게이지 기하. 종합점수를 호 채움 비율로 표현한다(재계산 아님, 표시용).
const CENTER = 120;
const R = 96;
const START = 135; // 좌하단 시작
const SWEEP = 270; // 시계방향 270°, 하단 90° 열림

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

function polar(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CENTER + R * Math.cos(rad), y: CENTER + R * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number): string {
  const s = polar(startDeg);
  const e = polar(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

export type GaugeGeom = { trackPath: string; fillPath: string };

export function buildGauge(overallScore: number): GaugeGeom {
  const frac = clamp(overallScore, 0, 100) / 100;
  return {
    trackPath: arc(START, START + SWEEP),
    fillPath: frac <= 0 ? '' : arc(START, START + SWEEP * frac),
  };
}

export type Band = { token: 'success' | 'primary' | 'accent-amber'; labelKo: string };

// 밴드 컷오프는 mascot.ts(scoreToMascot)의 85/70/55와 일치 — 표정과 색이 어긋나지 않게.
export function scoreToBand(score: number): Band {
  if (score >= 85) return { token: 'success', labelKo: '최상위권' };
  if (score >= 70) return { token: 'primary', labelKo: '우수' };
  if (score >= 55) return { token: 'primary', labelKo: '양호' };
  return { token: 'accent-amber', labelKo: '보완 필요' };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/analysis/lib/gauge.test.ts`
Expected: PASS (전체).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/analysis/lib/gauge.ts frontend/src/features/analysis/lib/gauge.test.ts
git commit -m "feat : 게이지 호·밴드 기하 헬퍼 추가"
```

---

### Task 3: 가중 구성 막대 헬퍼 (`weightedBar.ts`)

**Files:**
- Create: `frontend/src/features/analysis/lib/weightedBar.ts`
- Test: `frontend/src/features/analysis/lib/weightedBar.test.ts`

**Interfaces:**
- Consumes: `SCORE_WEIGHTS`, `SCORE_MAX`, `AXIS_LABEL`, `ScoreAxis` (Task 1).
- Produces: `buildWeightedBar(scores: Record<ScoreAxis,number>): { segments: ContribSeg[]; filled:number; remainder:number }`; `type ContribSeg = { axis:ScoreAxis; label:string; raw:number; max:number; weight:number; contrib:number; width:number; offset:number }`.

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/features/analysis/lib/weightedBar.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/analysis/lib/weightedBar.test.ts`
Expected: FAIL (import 해결 실패).

- [ ] **Step 3: 구현**

`frontend/src/features/analysis/lib/weightedBar.ts`:

```ts
import { AXIS_LABEL, SCORE_MAX, SCORE_WEIGHTS, type ScoreAxis } from './weights';

// 가중 기여도 누적 막대. 폭 = 원점수 × 가중치(= 실제 기여 점수). 시각화 전용.
export type ContribSeg = {
  axis: ScoreAxis;
  label: string;
  raw: number;
  max: number;
  weight: number;
  contrib: number; // raw*weight, 소수1자리
  width: number; // 0..100 트랙상 % (값이 곧 %)
  offset: number; // 누적 시작 %
};
export type WeightedBar = { segments: ContribSeg[]; filled: number; remainder: number };

const ORDER: ScoreAxis[] = ['content', 'delivery', 'stability']; // 가중치 큰 순 고정
const round1 = (n: number): number => Number(n.toFixed(1));

export function buildWeightedBar(scores: Record<ScoreAxis, number>): WeightedBar {
  let acc = 0;
  const segments = ORDER.map((axis) => {
    const raw = Number.isFinite(scores[axis]) ? scores[axis] : 0;
    const weight = SCORE_WEIGHTS[axis];
    const contrib = round1(raw * weight);
    const seg: ContribSeg = {
      axis,
      label: AXIS_LABEL[axis],
      raw,
      max: SCORE_MAX[axis],
      weight,
      contrib,
      width: contrib,
      offset: round1(acc),
    };
    acc += contrib;
    return seg;
  });
  const filled = round1(acc);
  return { segments, filled, remainder: round1(Math.max(0, 100 - filled)) };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/analysis/lib/weightedBar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/analysis/lib/weightedBar.ts frontend/src/features/analysis/lib/weightedBar.test.ts
git commit -m "feat : 가중 점수 구성 막대 헬퍼 추가"
```

---

### Task 4: 레이더 기하 헬퍼 (`radar.ts`)

**Files:**
- Create: `frontend/src/features/analysis/lib/radar.ts`
- Test: `frontend/src/features/analysis/lib/radar.test.ts`

**Interfaces:**
- Consumes: `SCORE_MAX`, `AXIS_LABEL`, `ScoreAxis` (Task 1).
- Produces: `buildRadar(scores: Record<ScoreAxis,number>): { shape:string; rings:string[]; spokes:RadarPoint[]; axes:RadarAxis[] }`; `type RadarPoint = {x:number;y:number}`; `type RadarAxis = { key:ScoreAxis; label:string; score:number; max:number; ratio:number; point:RadarPoint; labelPos:RadarPoint; rim:RadarPoint }`.

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/src/features/analysis/lib/radar.test.ts`:

```ts
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
    expect(buildRadar({ content: 0, delivery: 0, stability: 0 }).shape).toBe('120.0,120.0 120.0,120.0 120.0,120.0');
  });
  it('링은 외곽·0.5R 2개', () => {
    expect(buildRadar({ content: 0, delivery: 0, stability: 0 }).rings).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/analysis/lib/radar.test.ts`
Expected: FAIL (import 해결 실패).

- [ ] **Step 3: 구현**

`frontend/src/features/analysis/lib/radar.ts`:

```ts
import { AXIS_LABEL, SCORE_MAX, type ScoreAxis } from './weights';

// 3축 균형 레이더. 각 축을 자기 상한으로 정규화(88 천장 왜곡 제거). content를 상단에.
const CX = 120;
const CY = 120;
const R = 80;
const ANGLE: Record<ScoreAxis, number> = { content: -90, delivery: 30, stability: 150 };
const ORDER: ScoreAxis[] = ['content', 'delivery', 'stability'];

const clamp01 = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function at(deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function ring(r: number): string {
  return ORDER.map((axis) => {
    const p = at(ANGLE[axis], r);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
}

export type RadarPoint = { x: number; y: number };
export type RadarAxis = {
  key: ScoreAxis;
  label: string;
  score: number;
  max: number;
  ratio: number;
  point: RadarPoint;
  labelPos: RadarPoint;
  rim: RadarPoint;
};
export type RadarGeom = { shape: string; rings: string[]; spokes: RadarPoint[]; axes: RadarAxis[] };

export function buildRadar(scores: Record<ScoreAxis, number>): RadarGeom {
  const axes: RadarAxis[] = ORDER.map((key) => {
    const score = Number.isFinite(scores[key]) ? scores[key] : 0;
    const ratio = clamp01(score / SCORE_MAX[key]);
    return {
      key,
      label: AXIS_LABEL[key],
      score,
      max: SCORE_MAX[key],
      ratio,
      point: at(ANGLE[key], ratio * R),
      labelPos: at(ANGLE[key], R + 20),
      rim: at(ANGLE[key], R),
    };
  });
  const shape = axes.map((a) => `${a.point.x.toFixed(1)},${a.point.y.toFixed(1)}`).join(' ');
  return { shape, rings: [ring(R), ring(R * 0.5)], spokes: axes.map((a) => a.rim), axes };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/analysis/lib/radar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/analysis/lib/radar.ts frontend/src/features/analysis/lib/radar.test.ts
git commit -m "feat : 균형 레이더 기하 헬퍼 추가"
```

---

### Task 5: reduced-motion 안전 등장 훅 (`useRevealOnMount.ts`)

**Files:**
- Create: `frontend/src/lib/useRevealOnMount.ts`

**Interfaces:**
- Produces: `useRevealOnMount(): boolean` — 마운트 후 `true`. `prefers-reduced-motion: reduce`면 처음부터 `true`(최종 상태 즉시).

> 표준 5줄 패턴이라 단위 테스트는 생략(`jsdom`+`matchMedia` 목 비용 대비 이득 낮음). 빌드 통과 + Task 6~8의 실사용으로 검증. — ponytail

- [ ] **Step 1: 구현**

`frontend/src/lib/useRevealOnMount.ts`:

```ts
import { useEffect, useState } from 'react';

// reduced-motion 안전 1회 등장 플래그. reduced-motion이면 처음부터 true(최종 상태)라
// 빈→채움 깜빡임이 없다. 전이는 컴포넌트에서 motion-safe: 로만 건다.
function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export function useRevealOnMount(): boolean {
  const [revealed, setRevealed] = useState(prefersReduced);
  useEffect(() => {
    setRevealed(true);
  }, []);
  return revealed;
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/useRevealOnMount.ts
git commit -m "feat : reduced-motion 안전 등장 훅 추가"
```

---

### Task 6: 종합점수 게이지 컴포넌트 (`WeightedScoreGauge.tsx`)

**Files:**
- Create: `frontend/src/components/result/WeightedScoreGauge.tsx`

**Interfaces:**
- Consumes: `buildGauge`, `scoreToBand`, `Band` (Task 2); `useRevealOnMount` (Task 5); `MASCOT_SRC`, `scoreToMascot` (기존 `mascot.ts`); `cn` (기존 `lib/cn.ts`).
- Produces: `<WeightedScoreGauge overallScore={number} />`.

- [ ] **Step 1: 구현**

`frontend/src/components/result/WeightedScoreGauge.tsx`:

```tsx
import { buildGauge, scoreToBand, type Band } from '../../features/analysis/lib/gauge';
import { MASCOT_SRC, scoreToMascot } from '../../features/analysis/lib/mascot';
import { cn } from '../../lib/cn';
import { useRevealOnMount } from '../../lib/useRevealOnMount';

type Props = { overallScore: number };

const BAND_STROKE: Record<Band['token'], string> = {
  success: 'stroke-success',
  primary: 'stroke-primary',
  'accent-amber': 'stroke-accent-amber',
};

export function WeightedScoreGauge({ overallScore }: Props) {
  const { trackPath, fillPath } = buildGauge(overallScore);
  const band = scoreToBand(overallScore);
  const mascot = scoreToMascot(overallScore);
  const revealed = useRevealOnMount();

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">종합 점수</h2>
      <p className="mb-4 text-body-sm text-muted">내용·전달력·안정성을 가중 합산한 결과</p>
      <div className="relative mx-auto w-60">
        <svg viewBox="0 0 240 240" className="w-full" aria-hidden="true">
          <path d={trackPath} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-hairline" />
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              strokeWidth={14}
              strokeLinecap="round"
              pathLength={1}
              className={cn(
                BAND_STROKE[band.token],
                'motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out',
              )}
              style={{ strokeDasharray: 1, strokeDashoffset: revealed ? 0 : 1 }}
            />
          )}
        </svg>
        <img
          src={MASCOT_SRC[mascot]}
          alt=""
          className="pointer-events-none absolute inset-0 m-auto h-20 w-20 object-contain"
        />
      </div>
      <div className="mt-2 flex flex-col items-center">
        <p className="text-display-lg tabular-nums text-ink">{overallScore}</p>
        <span className="text-caption text-muted-soft">{band.labelKo}</span>
      </div>
      <p className="mt-3 text-center text-caption text-muted-soft">전달력·안정성은 88점 만점 기준</p>
      <p className="sr-only">
        종합 점수 {overallScore}점, {band.labelKo}.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 3: 수동 확인**

`npm run dev` 후 결과 화면에서 임시로 렌더(또는 Task 9 통합 후 확인): 호가 0→점수로 차오르고 가운데 마스코트·아래 숫자가 보이는지, `prefers-reduced-motion`(OS 설정 또는 DevTools Rendering > Emulate CSS prefers-reduced-motion)에서 애니메이션 없이 즉시 최종 상태인지.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/result/WeightedScoreGauge.tsx
git commit -m "feat : 종합점수 원형 게이지 컴포넌트 추가"
```

---

### Task 7: 가중 점수 구성 막대 컴포넌트 (`WeightedScoreLedger.tsx`)

**Files:**
- Create: `frontend/src/components/result/WeightedScoreLedger.tsx`

**Interfaces:**
- Consumes: `buildWeightedBar` (Task 3); `ScoreAxis` (Task 1); `useRevealOnMount` (Task 5); `cn` (기존).
- Produces: `<WeightedScoreLedger overallScore={number} scores={Record<ScoreAxis,number>} />`.

- [ ] **Step 1: 구현**

`frontend/src/components/result/WeightedScoreLedger.tsx`:

```tsx
import { buildWeightedBar } from '../../features/analysis/lib/weightedBar';
import type { ScoreAxis } from '../../features/analysis/lib/weights';
import { cn } from '../../lib/cn';
import { useRevealOnMount } from '../../lib/useRevealOnMount';

type Props = { overallScore: number; scores: Record<ScoreAxis, number> };

const SEG_BG: Record<ScoreAxis, string> = {
  content: 'bg-primary',
  delivery: 'bg-accent-teal',
  stability: 'bg-accent-amber',
};
const DELAY = ['', 'motion-safe:delay-150', 'motion-safe:delay-300'];

export function WeightedScoreLedger({ overallScore, scores }: Props) {
  const { segments, filled } = buildWeightedBar(scores);
  const revealed = useRevealOnMount();

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">가중 점수 구성</h2>
      <p className="mb-4 text-body-sm text-muted">내용 60% · 전달력 20% · 안정성 20% 가중 합산</p>

      <div className="relative h-8 w-full overflow-hidden rounded-full bg-hairline" aria-hidden="true">
        {segments.map((seg, i) => (
          <div
            key={seg.axis}
            className={cn(
              'absolute top-0 h-full border-l border-hairline-soft first:border-l-0',
              SEG_BG[seg.axis],
              'motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out',
              DELAY[i],
            )}
            style={{ left: `${seg.offset}%`, width: revealed ? `${seg.width}%` : '0%' }}
          >
            {seg.axis === 'content' && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-caption text-on-primary">
                {seg.label}
              </span>
            )}
          </div>
        ))}
        <div
          className="absolute top-0 h-full w-0.5 bg-ink"
          style={{ left: `${Math.min(overallScore, 100)}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {segments.map((seg) => (
          <li key={seg.axis} className="flex items-center gap-3 text-body-sm">
            <span className={cn('h-3 w-3 flex-none rounded-full', SEG_BG[seg.axis])} />
            <span className="text-muted">
              {seg.label}
              {seg.max < 100 && <span className="text-muted-soft"> (88점 만점)</span>}
            </span>
            <span className="ml-auto tabular-nums text-body">
              {seg.raw} <span className="text-muted">× {seg.weight}</span> = {seg.contrib}
            </span>
          </li>
        ))}
        <li className="mt-1 flex items-center gap-3 border-t border-hairline-soft pt-2 text-body-sm">
          <span className="text-muted">가중 합산</span>
          <span className="ml-auto tabular-nums text-ink">
            {filled} <span className="text-muted-soft">· 종합 {overallScore} (반올림 오차 ±1)</span>
          </span>
        </li>
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 3: 수동 확인**

`npm run dev` 후: content 세그먼트가 폭으로 압도하고, 원장 3행에 `82 × 0.6 = 49.2` 식 산식이 보이며, 종합 마커가 `overallScore` 위치에 서는지. reduced-motion에서 즉시 최종 폭.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/result/WeightedScoreLedger.tsx
git commit -m "feat : 가중 점수 구성 막대 컴포넌트 추가"
```

---

### Task 8: 균형 삼각형 컴포넌트 (`BalanceTriangle.tsx`)

**Files:**
- Create: `frontend/src/components/result/BalanceTriangle.tsx`

**Interfaces:**
- Consumes: `buildRadar` (Task 4); `ScoreAxis` (Task 1); `useRevealOnMount` (Task 5); `cn` (기존).
- Produces: `<BalanceTriangle scores={Record<ScoreAxis,number>} />`.

- [ ] **Step 1: 구현**

`frontend/src/components/result/BalanceTriangle.tsx`:

```tsx
import { buildRadar } from '../../features/analysis/lib/radar';
import type { ScoreAxis } from '../../features/analysis/lib/weights';
import { cn } from '../../lib/cn';
import { useRevealOnMount } from '../../lib/useRevealOnMount';

type Props = { scores: Record<ScoreAxis, number> };

const SWATCH_BG: Record<ScoreAxis, string> = {
  content: 'bg-primary',
  delivery: 'bg-accent-teal',
  stability: 'bg-accent-amber',
};
// 모양으로도 축 구분(색각 안전): content=원, delivery=마름모, stability=삼각형
const SWATCH_SHAPE: Record<ScoreAxis, string> = {
  content: 'rounded-full',
  delivery: 'rotate-45',
  stability: '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
};

function Marker({ axis, x, y }: { axis: ScoreAxis; x: number; y: number }) {
  if (axis === 'content') return <circle cx={x} cy={y} r={5} className="fill-primary" />;
  if (axis === 'delivery')
    return (
      <rect
        x={x - 4.5}
        y={y - 4.5}
        width={9}
        height={9}
        transform={`rotate(45 ${x} ${y})`}
        className="fill-accent-teal"
      />
    );
  return <polygon points={`${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}`} className="fill-accent-amber" />;
}

export function BalanceTriangle({ scores }: Props) {
  const { shape, rings, spokes, axes } = buildRadar(scores);
  const revealed = useRevealOnMount();

  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">균형 분석</h2>
      <p className="mb-4 text-body-sm text-muted">세 축의 점수 균형 (전달력·안정성은 88점 만점 기준)</p>
      <svg viewBox="0 0 240 240" className="mx-auto h-60 w-full max-w-[260px]" aria-hidden="true">
        <polygon points={rings[0]} fill="none" strokeWidth={1} className="stroke-hairline" />
        <polygon points={rings[1]} fill="none" strokeWidth={1} className="stroke-hairline-soft" />
        {spokes.map((s, i) => (
          <line key={i} x1={120} y1={120} x2={s.x} y2={s.y} strokeWidth={1} className="stroke-hairline-soft" />
        ))}
        <g
          className="motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out"
          style={{ transformOrigin: '120px 120px', transform: revealed ? 'scale(1)' : 'scale(0)' }}
        >
          <polygon points={shape} className="fill-primary/15" />
          <polygon points={shape} fill="none" strokeWidth={2} className="stroke-primary" />
          {axes.map((a) => (
            <Marker key={a.key} axis={a.key} x={a.point.x} y={a.point.y} />
          ))}
        </g>
        {axes.map((a) => (
          <text key={a.key} x={a.rim.x} y={a.rim.y} fontSize={10} textAnchor="middle" className="fill-muted-soft">
            {a.max}
          </text>
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap justify-center gap-3">
        {axes.map((a) => (
          <li key={a.key} className="flex items-center gap-2 text-body-sm">
            <span className={cn('h-3 w-3 flex-none', SWATCH_BG[a.key], SWATCH_SHAPE[a.key])} />
            <span className="text-ink">
              {a.label} <span className="tabular-nums">{a.score}</span>
              <span className="text-muted-soft"> · {a.max}점 만점</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 3: `fill-primary/15` 렌더 확인 (검증 MEDIUM 대응)**

`npm run dev` 후 삼각형 내부에 옅은 코랄 면색이 보이는지 확인. **만약 면색이 렌더되지 않으면** `<polygon points={shape} className="fill-primary/15" />` 줄을 삭제하고 외곽선(stroke)만 유지(스펙 명시 대안). 꼭짓점 마커가 원/마름모/삼각형으로 구분되는지, 범례 모양이 일치하는지 확인.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/result/BalanceTriangle.tsx
git commit -m "feat : 균형 삼각형(레이더) 컴포넌트 추가"
```

---

### Task 9: ResultPage 통합

**Files:**
- Modify: `frontend/src/pages/ResultPage.tsx`

**Interfaces:**
- Consumes: `WeightedScoreGauge` (Task 6), `WeightedScoreLedger` (Task 7), `BalanceTriangle` (Task 8).

- [ ] **Step 1: import 3개 추가**

`frontend/src/pages/ResultPage.tsx` 상단 import 블록(기존 `result/*` import들 옆)에 추가:

```tsx
import { BalanceTriangle } from '../components/result/BalanceTriangle';
import { WeightedScoreGauge } from '../components/result/WeightedScoreGauge';
import { WeightedScoreLedger } from '../components/result/WeightedScoreLedger';
```

(기존 `ScorePanel` import는 그대로 둔다 — 답변별 섹션 line 60에서 계속 사용.)

- [ ] **Step 2: 종합 섹션의 ScorePanel 교체**

종합 섹션(`{/* 면접 전체 종합 */}`)에서 아래 한 줄을

```tsx
<ScorePanel overallScore={session.overall.score} scores={session.overall.scores} />
```

다음 3줄로 교체:

```tsx
<WeightedScoreGauge overallScore={session.overall.score} />
<WeightedScoreLedger overallScore={session.overall.score} scores={session.overall.scores} />
<BalanceTriangle scores={session.overall.scores} />
```

(답변별 상세 섹션의 `<ScorePanel overallScore={answer.overallScore} scores={answer.scores} />`는 **변경하지 않는다**.)

- [ ] **Step 3: 타입체크 + 린트 + 테스트**

Run: `npm run build && npm run lint && npm run test`
Expected: 모두 PASS.

- [ ] **Step 4: 전체 흐름 수동 확인**

`npm run dev`로 결과 화면 진입(목/실데이터): 종합 섹션에 게이지→원장→삼각형이 순서대로 스택되고, 답변별 탭은 기존 `ScorePanel` 그대로인지. 모바일 폭(DevTools 360px)에서 게이지 숫자/마스코트 충돌 없는지. reduced-motion에서 세 컴포넌트 모두 즉시 최종 상태인지.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ResultPage.tsx
git commit -m "feat : 결과 종합 섹션 점수 시각화 3종으로 교체"
```

---

## 비고 (Notes)

- **컴포넌트 단위 테스트 생략 이유**: 게이지/막대/레이더의 *수학*은 순수 헬퍼(Task 2~4)에서 단위 테스트로 고정했다. React 컴포넌트는 시각 산출물이라 빌드+린트+수동 확인으로 게이트한다(프레임워크/`jsdom` 도입 비용 대비 이득 낮음 — ponytail). 추후 회귀가 잦으면 `@testing-library/react` 추가 검토.
- **세션 레벨 ±1 오차**: 백엔드 세션 종합은 답변별 종합의 평균(축은 독립 평균)이라 `filled`(가중 합산)과 `overallScore`(종합)가 ±1~2 다를 수 있음. 두 수치를 원장에 병기하고 캡션으로 공개한다(거짓 정렬 안 함).
