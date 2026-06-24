# 발화 분석 결과 화면(단일 답변 리포트) — 설계

- 날짜: 2026-06-24
- 이슈: #7 (`.issues/20260624_기능추가_발화분석_결과화면_리포트.md`)
- 진실 기준: `PRD.md` (특히 §6.7 결과 화면, §9 분석 파이프라인, §10 점수, §11 결과 리포트 예시)
- 디자인 기준: `frontend/.claude/rules/DESIGN.md`

## Context

현재 프론트(React 19 + Vite + TS + Tailwind v4)에는 결과 화면이 없다. `/`는 분석 ID를 입력하면 원시 JSON을 덤프하는 폴링 stub(`AnalysisPage`)이고, `AnalysisResult` 타입도 `id/status/transcript?/summary?` 수준이다. 이 작업은 **PRD §11 리포트(단일 답변 1개)를 보여주는 결과 페이지**를 신설한다. 백엔드는 외부 레포라, 이 슬라이스는 **임시(mock) 데이터로 백엔드 없이 단독 완성·시연**을 목표로 한다.

> 주의: `docs/*.md`(영상 감정분석·의도분석 블루프린트)는 PRD v2가 거부한 pre-pivot 방향이라 참조하지 않는다(이미 삭제됨). 결과 화면의 유일한 데이터 계약은 PRD §11이다.

## 확정 결정

| 항목 | 결정 |
|---|---|
| 단위 | 단일 답변 리포트 1개 (PRD §11 JSON). 다중 질문·종합점수 합산은 다음 슬라이스 |
| 데이터 | 백엔드 없이 임시 fixture. 기존 TanStack Query 구조 유지(`queryFn`이 mock 반환) |
| 다시 듣기 | 샘플 오디오 + 구간 단위 동기화 플레이헤드(발화/침묵/필러). 단어 단위 노래방식 X(타임스탬프 없음) |
| 레이아웃 | 상단 스티키 오디오/타임라인 + 단일 스크롤 본문 |
| 말속도 그래프 | 포함. 인라인 SVG 스파크라인(무의존). §11에 없는 `rateSeries`는 제안 확장 |
| 마스코트 | 점수대별 반응 이미지(cheering/clap/default/thinking) |
| 카메라/시선·영상 | 제외(P2, MVP 이후) |

## A. 데이터 계약 — `features/analysis/types.ts`

기존 `AnalysisResult` stub을 §11 전체로 확장한다. PRD 예시는 snake_case + 문자열 값("분당 138단어", "2.8초", "0.84")이지만, 프론트 타입은 **camelCase + 숫자**로 정규화한다. 실제 백엔드 연동 시 원시 §11 → 이 타입으로 매핑하는 얇은 어댑터를 둔다(이번 슬라이스는 mock을 이 타입으로 직접 작성하므로 어댑터 불필요).

```ts
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TimelineSegment =
  | { start: number; end: number; type: 'speech' }
  | { start: number; end: number; type: 'silence' }
  | { start: number; end: number; type: 'filler'; word: string };

export type SpeechMetrics = {
  speakingRate: number;            // wpm (예: 138)
  silenceCount: number;            // 침묵 횟수
  longestSilence: number;          // 초 (예: 2.8)
  speechRatio: number;             // 0..1 (예: 0.84)
  fillerWords: Record<string, number>; // { "음": 3, "어": 4, "약간": 2 }
  rateSeries: { t: number; wpm: number }[]; // ★ §11 확장(말속도 그래프). 백엔드 합의 필요
};

export type ContentFeedbackAxis = { diagnosis: string; example: string };

export type ContentFeedback = {
  logic: ContentFeedbackAxis;      // 논리 구조
  expertise: ContentFeedbackAxis;  // 직무 전문성
  competencyFit: string;           // 평가역량 부합도
};

export type AnalysisReport = {
  id: string;
  status: ReportStatus;
  question: string;
  questionCompetency: string;      // 평가 역량(예: "문제해결력")
  overallScore: number;            // 0..100
  scores: { content: number; delivery: number; stability: number };
  transcript: string;
  audioUrl: string;                // 샘플 오디오 경로
  speechMetrics: SpeechMetrics;
  timeline: TimelineSegment[];
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
  createdAt: string;
  updatedAt: string;
};
```

> 기존 stub `AnalysisResult`(및 `useAnalysisQuery`, `/` AnalysisPage)는 건드리지 않고 남겨둔다(개발용 폴링 도구). 결과 화면은 위 `AnalysisReport`를 단일 진실로 한다.

## B. 데이터 배선 — mock fixture + 훅

- `features/analysis/mockReport.ts` — §11 값을 그대로 옮긴 `AnalysisReport` fixture(+ `rateSeries`, `audioUrl`). 이 파일이 calibration 노브(실데이터/문구 교체 지점).
- `features/analysis/useAnalysisReportQuery.ts` — TanStack Query 훅. `queryFn`이 네트워크 대신 mock을 짧은 지연(예: 600ms) 후 반환해 로딩→완료 상태가 정상적으로 흐르게 한다. 실제 axios(`GET /analyses/:id`) 경로는 주석으로 보존 → 나중에 교체.
- CLAUDE.md "서버 상태=TanStack Query, 컴포넌트에서 직접 fetch 금지" 원칙 유지.

## C. 라우팅 — `App.tsx`

- `pages/ResultPage.tsx`(cream 캔버스) 신설, `/result` 라우트 + nav 링크 추가.
- 기존 `/`(폴링 stub), `/showcase`는 그대로 둔다.

## D. 마스코트 — `features/analysis/lib/mascot.ts` + 이미지

- 자산: `frontend/assets/images/{default,clap,cheering,thinking}.png` (말거울 캐릭터). Vite 자산 import로 사용. 외부 `src` 경로가 빌드에서 문제되면 `src/assets/images/`로 복사해 import.
- `scoreToMascot(overallScore)` 순수함수 매핑: `>=85 → cheering`, `70..84 → clap`, `55..69 → default`, `<55 → thinking`.
- 배치: `ScorePanel`(종합 점수 옆)에 반응 이미지 1개 표시. `hello`/`listening`은 이번 범위 밖(온보딩/녹음 슬라이스용).
- 성능 메모(ponytail): 원본 PNG 장당 2.2MB로 무겁다. 프로덕션에선 webp/리사이즈 권장. 이번 슬라이스에선 점수당 1장만 노출하므로 기능엔 지장 없음.

## E. 컴포넌트 트리 — `components/result/` (작은 파일 다수)

```
ResultPage
├─ AudioTimelinePlayer   (sticky 상단, currentTime 로컬 state 보유)
│   └─ TimelineTrack      (발화/침묵/필러 밴드 + 플레이헤드 + 클릭 seek)
└─ (스크롤 본문)
   ├─ ReportHeader        질문 + 평가역량 Badge
   ├─ TranscriptPanel     전사 + 필러 정적 하이라이트
   ├─ ScorePanel          종합 + 세부(내용/전달/안정) + 마스코트 반응
   ├─ SpeedGraph          rateSeries → 인라인 SVG 스파크라인
   ├─ SilenceCard         침묵 횟수/가장 긴 침묵/발화 비율
   ├─ FillerCard          필러 종류·횟수(작은 막대 목록)
   ├─ ContentFeedbackPanel 논리/전문성(진단+개선예시) + 부합도
   └─ ImprovementList     개선 포인트
```

각 단위의 책임/의존:

- `AudioTimelinePlayer` — `{ audioUrl, timeline }`. `<audio>` ref + `currentTime`(timeupdate)·`duration`·재생/일시정지. 재생 컨트롤(재생·시간 표기 `formatTime`)과 `TimelineTrack`을 묶는다. **`currentTime`은 이 컴포넌트 로컬 state로 충분** — 본문 패널은 정적이라 전역 store 불필요(YAGNI).
- `TimelineTrack` — `{ timeline, currentTime, duration, onSeek }`. 구간을 가로 바에 비율 배치(발화/침묵/필러 색 구분), `currentTime` 위치에 플레이헤드, 바 클릭 → `onSeek(t)`. 현재 구간 강조는 `segmentAtTime`.
- `TranscriptPanel` — `{ transcript, fillerWords }`. `highlightFillers`로 필러 토큰만 강조 span. 정적(재생 위치와 무관).
- `ScorePanel` — `{ overallScore, scores }`. CSS 링/바(무의존). 마스코트는 `scoreToMascot(overallScore)`.
- `SpeedGraph` — `{ rateSeries }`. `buildSparklinePath`로 SVG path. 축/평균선은 단순하게.
- `SilenceCard`/`FillerCard`/`ContentFeedbackPanel`/`ImprovementList` — presentational, props로 받은 값 표시.

색은 DESIGN 토큰: 발화=ink/coral, 침묵=muted, 필러=amber, 플레이어 바=surface-dark(제품 chrome 룩), 카드=surface-card(cream). 기존 `Button`/`Badge`/`FeatureCard` 재사용.

## F. 로직 추출 (테스트는 이번 범위 제외)

비자명한 로직은 순수함수로 `features/analysis/lib/`에 분리한다(가독성·재사용). **vitest 테스트 코드는 이번 슬라이스에서 제외(요청).** 함수 목록:

- `format.ts` `formatTime(sec)` → `"M:SS"` (예: 11 → `"0:11"`, 71 → `"1:11"`)
- `timeline.ts` `segmentAtTime(timeline, t)` → t를 포함하는 구간 또는 null
- `transcript.ts` `highlightFillers(transcript, fillerWords)` → `{text, isFiller}[]` (필러 토큰만 표시)
- `sparkline.ts` `buildSparkline(rateSeries, w, h)` → `{ path, points }` (x 단조 증가, y 스케일·반전)
- `mascot.ts` `scoreToMascot(score)` → 4개 밴드 경계(85/70/55)

## G. 필요한 외부 자산

- 샘플 답변 음성 1개: `frontend/public/sample-answer.mp3`(한국어 짧은 답변). 코드로 못 만드는 자산 — 준비 필요. fixture의 `audioUrl`이 이를 가리킨다.
- 파일이 없을 때 대비 fallback(선택): 실제 소리 없이 `requestAnimationFrame` 가상 클럭으로 플레이헤드만 도는 데모 모드. 1차 구현은 실제 오디오 우선, fallback은 필요 시 추가.

## H. DESIGN.md 정합

- cream 캔버스(`bg-canvas`) 본문, `surface-dark` 스티키 플레이어, `surface-card` 패널. 96px 밴드 리듬은 결과 화면 특성상 더 촘촘히 조정 가능.
- 폰트는 기존 Pretendard 통일 토큰 사용. 점수 등 강조 수치는 display 계열 + 음수 트래킹.
- coral은 CTA/핵심 강조에만 scarce하게.

## 의도적으로 뺀 것 (skipped)

- 다중 질문 네비/종합 점수 합산 — 다음 슬라이스
- 단어 단위 전사 하이라이트(노래방식) — 단어 타임스탬프 확보 후
- 카메라/시선 등 영상 비언어 지표, 영상 다시보기 — P2
- 실제 STT/백엔드 연동 — fixture로 대체, queryFn만 교체하면 전환
- 마스코트 hello/listening 상태 — 온보딩/녹음 슬라이스

## 검증 (end-to-end)

1. `npm install` (신규 런타임 의존성 없음 — SVG/오디오/CSS만)
2. `npm run build` — `tsc -b` 타입체크 + 빌드 통과
3. `npm run dev` → `/result` 육안:
   - 상단 플레이어 고정, 재생 시 타임라인 플레이헤드 이동·현재 구간 강조, 바 클릭 시 seek
   - 전사 필러 강조, 종합/세부 점수 + 점수대별 마스코트, 말속도 SVG 그래프, 침묵·필러·내용 피드백·개선 포인트 표시
   - 창 줄여 모바일 1열로 자연스럽게 무너지는지
