# 결과 화면 점수 시각화 개편 — 설계 (Design Spec)

- **날짜**: 2026-06-24
- **대상**: `frontend/src/pages/ResultPage.tsx` 종합 리포트 섹션
- **목표**: 종합점수가 **가중 합산**(`content×0.6 + delivery×0.2 + stability×0.2`)이라는 사실을 직관적으로, 그리고 발표(교수 평가)용으로 시각적 임팩트 있게 보여준다.
- **제약**: 새 의존성 0 · 새 이미지/SVG 에셋 0 · 기존 차트 하우스 패턴(`buildSparkline` 순수함수 + 인라인 `<svg>` + tailwind 토큰) 준수 · UI 카피 한국어 · 정직한 스케일링(축 트릭 금지) · 접근성(색각이상·`prefers-reduced-motion`).

---

## 1. 배경 / 현재 상태

- 종합점수는 백엔드(`backend/app/services/analysis_pipeline.py`)에서 계산:
  - `WEIGHTS = {content:0.6, delivery:0.2, stability:0.2}`, `overall = round(content*0.6 + delivery*0.2 + stability*0.2)`
  - **축별 상한 비대칭**: `content` 0..100, `delivery`/`stability`는 `BASE 88`에서 감점이라 실질 **0..88**. 이론상 종합 최고점 ≈ **95.2**.
- 현재 `ScorePanel.tsx`는 세 축을 **동일 0-100 스케일 막대**로만 보여줘 가중치 기여도가 드러나지 않는다.
- 프론트는 가중치를 모르고 백엔드가 계산한 `overall`만 받는다 → 기여도 시각화를 위해 프론트에 가중치 상수를 미러해야 한다(재계산용 아님).
- 차트 하우스 패턴(확인됨): 기하 계산은 `src/features/analysis/lib/`의 순수함수(`sparkline.ts`), 렌더는 인라인 `<svg viewBox>` + `className="stroke-primary"` 토큰(`SpeedGraph.tsx`), CSS 배치 막대 + 마커(`TimelineTrack.tsx`). 색은 항상 tailwind 토큰, 동적 기하만 `style`.

---

## 2. 결정 사항 (확정)

1. **가중치 표현 분담**: 게이지는 **종합점수 헤드라인**만, 원장 막대가 **가중치 산식**을 담당. (둘 다 산식을 그리면 중복 + 게이지 호 재계산 시 세션 레벨 불일치 버그가 생김 → 분리로 원천 제거)
2. **답변별 탭(line 60 `ScorePanel`)은 v1에서 그대로 유지**. 종합 섹션만 교체. (데이터 shape 동일 → 추후 게이지만 끼워넣기 가능)
3. **카드 순서**: 게이지 → 원장 → 삼각형.
4. **새 섹션 헤딩 추가 안 함**(각 카드 h2가 자기 라벨, page h1이 섹션 프레이밍 — YAGNI).

---

## 3. 신규 파일

```
src/features/analysis/lib/weights.ts        # 백엔드 가중치/상한/라벨 미러 (순수 상수)
src/features/analysis/lib/gauge.ts          # buildGauge + scoreToBand (순수)
src/features/analysis/lib/weightedBar.ts    # buildWeightedBar (순수)
src/features/analysis/lib/radar.ts          # buildRadar (순수)
src/lib/useRevealOnMount.ts                 # reduced-motion 안전 마운트 플래그 훅 (3 컴포넌트 공유)
src/components/result/WeightedScoreGauge.tsx
src/components/result/WeightedScoreLedger.tsx
src/components/result/BalanceTriangle.tsx
```

데이터 패칭·타입(`types.ts`)·스토어 변경 **없음**.

---

## 4. `weights.ts` — 가중치 단일 출처(프론트 미러)

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
// 정직한 레이더 정규화와 "88점 만점" 캡션에 쓴다.
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

축↔색 매핑(컴포넌트에서 `Record<ScoreAxis,string>` + `cn()`, `TimelineTrack`의 `SEG_CLASS` 패턴):
`content → primary(coral)`, `delivery → accent-teal`, `stability → accent-amber`. 세 토큰 모두 `styles.css @theme`에 존재.

---

## 5. 공용 훅 `useRevealOnMount.ts`

```ts
// reduced-motion 안전 1회 등장 플래그. 세 시각화 컴포넌트가 공유.
// reduced-motion 사용자는 처음부터 true(최종 상태)로 시작 → 어떤 클래스 오타에도
// 빈→채움 깜빡임 없음. 전이는 컴포넌트에서 motion-safe: 로만 건다.
export function useRevealOnMount(): boolean { /* matchMedia 초기화 + useEffect(true) */ }
```

검증 권고 반영: 세 컴포넌트가 **동일 패턴** 사용. 애니메이션 전이는 항상 `motion-safe:` 변형으로만, JS 애니메이션 루프·`@keyframes` 강제 금지.

---

## 6. 컴포넌트 ① WeightedScoreGauge — 종합점수 원형 게이지 (히어로)

- **Props**: `{ overallScore: number }` (백엔드 값, 재계산 금지). 세 축 점수는 받지 않는다(원장 담당).
- **기하** (`gauge.ts`, `sparkline.ts` 패턴: React/DOM 없음, `.toFixed(1)`, 0/NaN 가드):
  - `viewBox="0 0 240 240"`, 중심 `(120,120)`, `R=96`, `strokeWidth=14`, `strokeLinecap="round"`. `preserveAspectRatio="none"` **생략**(원형은 비율 보존이 맞음 — SpeedGraph를 그대로 베끼지 않는 유일 지점).
  - 270° 다이얼, `START=135°`, 시계방향 sweep.
  - `buildGauge(overallScore)` → `{ trackPath, fillPath }`:
    - `trackPath`: 빈 270° 호(`large-arc-flag=1`, `sweep=1`).
    - `frac = clamp(overallScore,0,100)/100`; `fillPath`: `START`에서 `frac*270°`까지. `large-arc-flag = frac*270 > 180 ? 1 : 0`(하드코딩 금지). `frac=0`이면 `fillPath=''`(렌더 스킵).
  - `scoreToBand(score)` (mascot.ts 컷오프 85/70/55 **그대로 미러**, 리터럴 중복 금지):
    `>=85 {token:'success', labelKo:'최상위권'}` · `>=70 {token:'primary', labelKo:'우수'}` · `>=55 {token:'primary', labelKo:'양호'}` · `else {token:'accent-amber', labelKo:'보완 필요'}`.
    게이지는 단일 호라 호 전체를 밴드색으로 칠해도 색 충돌 없음(과거 segmented안의 success/teal 충돌 문제 소멸).
- **렌더**:
  - 셸 `<section className="rounded-lg bg-surface-card p-8">` + `<h2 className="mb-1 text-title-md text-ink">종합 점수</h2>` + `<p className="mb-4 text-body-sm text-muted">내용·전달력·안정성을 가중 합산한 결과</p>`.
  - `<div className="relative mx-auto w-60">` 안에 `<svg viewBox="0 0 240 240" className="w-full" aria-hidden="true">`: ① `<path d={trackPath} fill="none" strokeWidth={14} className="stroke-hairline">` ② `fillPath` 있으면 `<path d={fillPath} fill="none" strokeWidth={14} strokeLinecap="round" pathLength={1} className={cn(BAND_STROKE[band.token], reveal)}>`.
  - 중앙 마스코트(기존 패턴): `<img src={MASCOT_SRC[scoreToMascot(overallScore)]} alt="" className="pointer-events-none absolute inset-0 m-auto h-20 w-20 object-contain">`(h-32→h-20 축소, 모바일 충돌 회피).
  - **숫자는 다이얼 밖 아래 행**(모바일 충돌 회피 — 검증 MEDIUM): `<p className="text-display-lg tabular-nums text-ink">{overallScore}</p>` + 밴드 라벨 `<span className="text-caption text-muted-soft">{band.labelKo}</span>`.
  - 정직성 캡션: `<p className="text-caption text-muted-soft">전달력·안정성은 88점 만점 기준</p>`.
  - SR 전용: `<p className="sr-only">종합 점수 {overallScore}점, {band.labelKo}.</p>`.
- **애니메이션**: `fillPath`에 `pathLength={1}`, `reveal` = `motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out`; `useRevealOnMount()`로 `stroke-dashoffset` 1→0. 단일 호라 segment 깜빡임 없음.
- **접근성**: svg `aria-hidden`(시각 중복) + 보이는 숫자/밴드 텍스트 + sr-only 한 줄. `<title>` 안 씀. focusable 요소 없음 → focus ring 없음.

---

## 7. 컴포넌트 ② WeightedScoreLedger — 가중 점수 구성 막대 (가중치 스토리)

- **Props**: `{ overallScore: number; scores: { content:number; delivery:number; stability:number } }`. `overallScore`는 마커 위치·합계 라벨의 진실값(재계산 금지).
- **기하** (`weightedBar.ts`):
  - `ORDER = ['content','delivery','stability']`(가중치 큰 순 고정 → content가 항상 먼저 쌓여 시각 지배 보장).
  - `buildWeightedBar(scores)` → `{ segments, filled, remainder }`:
    - 각 `seg`: `{ axis, label(AXIS_LABEL), raw, max(SCORE_MAX), weight(SCORE_WEIGHTS), contrib = round(raw*weight,1), width = contrib, offset = 앞 contrib 누적 }`. (0..100 트랙이라 `contrib` 값이 곧 % 폭)
    - `filled = Σcontrib`, `remainder = max(0, 100 - filled)`. 빈/0 입력 → width 0, remainder 100.
- **렌더** (`ScorePanel`+`TimelineTrack` CSS 막대 패턴, SVG 아님):
  - 셸 + `<h2>가중 점수 구성</h2>` + `<p>내용 60% · 전달력 20% · 안정성 20% 가중 합산</p>`.
  - 트랙 `<div className="relative h-8 w-full overflow-hidden rounded-full bg-hairline">`(빈 부분 = 못 얻은 점수).
  - 세그 3개: `<div className={cn('absolute top-0 h-full border-l border-hairline-soft first:border-l-0', SEG_BG[axis])} style={{ left:`${offset}%`, width:`${width}%` }} aria-hidden>`. `content` 세그엔 안쪽 라벨 `<span className="absolute left-2 top-1/2 -translate-y-1/2 text-caption text-on-primary">내용</span>`. (1px 경계선 = 흑백 분리)
  - 종합 마커(TimelineTrack cursor 패턴): `<div className="absolute top-0 h-full w-0.5 bg-ink" style={{ left:`${Math.min(overallScore,100)}%` }} aria-hidden>` + 마커 라벨 `종합 {overallScore}`(검증 HIGH 반영 — 마커 지점에 숫자 명시).
  - 하단 원장 3행: `[색칩] 내용 · 82 × 0.6 = 49.2`(`text-body-sm tabular-nums`), 가중치는 `text-muted`. 전달력·안정성 행엔 `(88점 만점)` 캡션(`seg.max`). 합계행: `가중 합산 {filled} · 종합 {overallScore} (반올림 오차 ±1)`.
- **접근성**: 막대/세그/마커 `aria-hidden`, **원장 3행이 실제 텍스트**(축명+원점수+가중치+기여)라 스크린리더·색각이상 모두 충족(WCAG 1.4.1). 비색상 채널 = 크기 지배 + 고정 순서 + 텍스트 라벨. (색칩은 보조; 텍스트 라벨이 본 채널이므로 별도 모양칩 불필요 — 검증 HIGH는 게이지 범례용이었고 그 범례는 제거됨.)
- **애니메이션**: `useRevealOnMount()`로 width 0→실제, `motion-safe:transition-[left,width] motion-safe:duration-700 motion-safe:ease-out`. 세그별 `motion-safe:delay-0/150/300`로 순차 누적 연출. 마커도 `motion-safe:transition-[left]`.
- **정직성**: 세션 레벨에서 `filled`(축별 독립 평균의 가중합)과 `overallScore`(답변별 종합의 평균)가 ±1~2 다를 수 있음 → 두 숫자(`가중 합산`·`종합`)를 **나란히 명시**하고 `반올림 오차 ±1` 캡션. 세그를 거짓으로 늘려 맞추지 않음.

---

## 8. 컴포넌트 ③ BalanceTriangle — 균형 삼각형 (레이더)

- **Props**: `{ scores: { content:number; delivery:number; stability:number } }`. `overallScore`·가중치 안 받음(균형만).
- **기하** (`radar.ts`, `sparkline.ts` 패턴):
  - `viewBox="0 0 240 240"`, 중심 `(120,120)`, `R=80`(라벨 여백). `preserveAspectRatio` 기본 유지.
  - 축 각도(content 꼭대기): `content -90°`, `delivery 30°`, `stability 150°`.
  - **축별 자기 상한 정규화**(핵심 정직성): `ratio = clamp(score / SCORE_MAX[axis], 0, 1)`, `r_data = ratio * R`. 완벽한 답변(100/88/88)이 정삼각형으로 림에 닿음 → 88 천장 때문에 늘 "찌그러져" 보이는 거짓 왜곡 제거.
  - `buildRadar(scores)` → `{ shape, rings(외곽 R + 0.5R), spokes, axes(각 축 point·labelPos·rim) }`. 0/NaN → 중심 점으로 degenerate(안전).
- **렌더**: 셸 + `<h2>균형 분석</h2>` + `<p>세 축의 점수 균형 (전달력·안정성은 88점 만점 기준)</p>`. `<svg viewBox="0 0 240 240" className="mx-auto h-60 w-full max-w-[260px]" aria-hidden="true">`:
  - 참조 링 2개(`stroke-hairline`/`stroke-hairline-soft`), 스포크 3개(`stroke-hairline-soft`).
  - 데이터 삼각형: 면 `<polygon points={shape} className="fill-primary/15">`(※ 빌드에서 렌더 확인, 안 되면 외곽선만), 외곽선 `<polygon points={shape} fill="none" className="stroke-primary" strokeWidth={2}>`.
  - **꼭짓점 마커 = 축별 다른 모양**(색각 비색상 채널): content=원(`circle`), delivery=마름모(`rect` 45° 회전), stability=삼각형(`polygon`), 각 카테고리 토큰색.
  - 림 만점 눈금 `<text>`: `100`/`88`/`88`(`fill-muted-soft`).
  - 아래 HTML 범례 `<ul>`: 각 축 = 모양 스와치 + 라벨 + `{score} · {max}점 만점`(`tabular-nums`). **88 천장을 텍스트로 명시**.
- **접근성**: svg `aria-hidden`, 범례 텍스트가 SR 채널(이중낭독 방지). 식별 = 모양(원/마름모/삼각형, 범례와 동일) + 고정 꼭짓점 위치 + 텍스트 숫자. 색은 보조.
- **애니메이션**: 데이터 삼각형 `<g>`만 `transformOrigin:'120px 120px'`로 `scale(0)→1`, `motion-safe:transition-transform motion-safe:duration-700`. `useRevealOnMount()` 사용. (SVG `points`는 CSS 애니 불가 → `<g>` 스케일)

---

## 9. 통합 — `ResultPage.tsx`

종합 섹션의 `ScorePanel`(line 37)만 교체. 답변별(line 60)은 유지.

```tsx
// import 추가 (기존 result/* import 옆)
import { WeightedScoreGauge } from '../components/result/WeightedScoreGauge';
import { WeightedScoreLedger } from '../components/result/WeightedScoreLedger';
import { BalanceTriangle } from '../components/result/BalanceTriangle';
// ScorePanel import 유지 (line 60에서 계속 사용)

// 종합 섹션 내부, 기존 <ScorePanel .../> 자리 (gap-4 컬럼에 자연 스택)
<WeightedScoreGauge overallScore={session.overall.score} />
<WeightedScoreLedger overallScore={session.overall.score} scores={session.overall.scores} />
<BalanceTriangle scores={session.overall.scores} />
```

`session.overall.{score,scores}` shape 그대로 소비. 데이터·타입·스토어 변경 없음.

---

## 10. 검증(적대적 리뷰) 반영 요약

| 등급 | 지적 | 처리 |
|---|---|---|
| CRITICAL | 게이지 호를 가중합으로 재계산 → 세션 레벨에서 호 길이 ≠ 가운데 숫자 | **설계에서 소멸**: 게이지를 단일 호(`overallScore`만)로 단순화, segmented 폐기 |
| HIGH | 게이지 범례 teal/amber 색각 구분 불가 | **소멸**: 게이지 per-axis 범례 자체를 제거(원장이 담당) |
| HIGH | 원장 마커와 세그 합 ±1~2 시각 어긋남 | 마커에 `종합 {n}` 숫자 명시 + 합계행에 `가중 합산`·`종합` 병기 |
| HIGH | aria-hidden SVG 안 `<title>`은 죽은 코드 | `<title>` 제거, HTML 범례/원장이 SR 채널 |
| MEDIUM | 게이지 숫자/마스코트 모바일 충돌 | 숫자 다이얼 밖 아래 행, 마스코트 h-20 축소 |
| MEDIUM | reduced-motion 3컴포넌트 제각각 | `useRevealOnMount()` 훅으로 통일 |
| MEDIUM | `fill-primary/15` SVG fill 미검증 | 빌드에서 렌더 확인, 실패 시 외곽선만 |
| LOW | 레이더 좌표 | 검증 결과 수학 정확 |

---

## 11. 검증 기준 (Done)

- `npm run build`(tsc + vite) 통과, `npm run lint` 통과.
- 게이지: 호가 `overallScore`까지 정확히 차오르고 가운데 숫자와 일치(재계산 없음). 0점·NaN 안전.
- 원장: 세그 폭 = `원점수×가중치`, content가 시각 지배. `82 × 0.6 = 49.2` 산식 노출. 마커=`overallScore`.
- 삼각형: 100/88/88 정규화로 만점 시 정삼각형, 천장 텍스트 공개.
- `prefers-reduced-motion: reduce`에서 세 컴포넌트 모두 애니메이션 없이 최종 상태 즉시 렌더.
- 그레이스케일에서 세 축 구분(크기/모양/텍스트). 모바일(360px) 레이아웃 깨짐 없음.
- 신규 의존성/에셋 0, 기존 토큰만 사용.
