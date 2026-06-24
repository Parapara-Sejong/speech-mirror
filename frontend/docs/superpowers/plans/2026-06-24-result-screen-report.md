# 발화 분석 결과 화면(단일 답변 리포트) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PRD §11 리포트(단일 답변 1개)를 임시 데이터로 보여주는 결과 페이지 `/result`를 만든다 — 상단 고정 오디오/타임라인 + 전사·점수·말속도·침묵·필러·내용 피드백·개선 포인트.

**Architecture:** 백엔드 없이 `mockReport` fixture를 TanStack Query `queryFn`이 반환한다. 화면 상단에 `<audio>` + 타임라인을 sticky로 고정하고, 재생 위치(`currentTime`)는 플레이어 컴포넌트 로컬 state로만 관리한다(본문 패널은 정적). 비자명 로직은 `features/analysis/lib/` 순수함수로 분리한다.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4(디자인 토큰), TanStack Query(기존), react-router-dom(기존). 신규 런타임 의존성 없음.

## Global Constraints

- 커밋 메시지 형식: `<type> : <설명> #7` (콜론 양옆 공백). Co-Authored-By 태그 금지.
- 커밋/푸시는 명시 요청 시에만 — 실행 중 사용자 확인 후 커밋(자동 금지).
- 패키지 매니저 npm. 신규 런타임 의존성 추가 금지(react-router-dom·@tanstack/react-query·axios는 이미 설치됨).
- 서버 상태는 TanStack Query로만. 컴포넌트에서 직접 fetch 금지.
- 스타일은 DESIGN 토큰 유틸 클래스 사용(`bg-canvas`·`text-ink`·`text-display-sm` 등). 인라인 hex 금지.
- UI 문구·주석은 한국어(주석은 WHY 중심).
- vitest 테스트 코드는 이번 슬라이스에서 작성하지 않음(요청). 각 Task는 테스트 대신 `npm run build`(tsc -b 타입체크) + 육안으로 검증한다.
- 빌드 검증 명령: `npm run build`. 개발 서버: `npm run dev`. 모두 `frontend/`에서 실행.

---

### Task 1: 데이터 계약 + mock fixture + 쿼리 훅

**Files:**
- Modify: `frontend/src/features/analysis/types.ts` (보고서 타입 추가)
- Create: `frontend/src/features/analysis/mockReport.ts`
- Create: `frontend/src/features/analysis/useAnalysisReportQuery.ts`

**Interfaces:**
- Produces: `AnalysisReport`, `TimelineSegment`, `SpeechMetrics`, `ContentFeedback`, `ContentFeedbackAxis`, `ReportStatus` 타입 / `MOCK_REPORT: AnalysisReport` / `useAnalysisReportQuery(id: string)` → `{ data?: AnalysisReport; isLoading: boolean; error: unknown }`

- [ ] **Step 1: 보고서 타입 추가 (`types.ts` 끝에 append, 기존 내용 유지)**

```ts
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TimelineSegment =
  | { start: number; end: number; type: 'speech' }
  | { start: number; end: number; type: 'silence' }
  | { start: number; end: number; type: 'filler'; word: string };

export type SpeechMetrics = {
  speakingRate: number;
  silenceCount: number;
  longestSilence: number;
  speechRatio: number;
  fillerWords: Record<string, number>;
  rateSeries: { t: number; wpm: number }[];
};

export type ContentFeedbackAxis = { diagnosis: string; example: string };

export type ContentFeedback = {
  logic: ContentFeedbackAxis;
  expertise: ContentFeedbackAxis;
  competencyFit: string;
};

export type AnalysisReport = {
  id: string;
  status: ReportStatus;
  question: string;
  questionCompetency: string;
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
  transcript: string;
  audioUrl: string;
  speechMetrics: SpeechMetrics;
  timeline: TimelineSegment[];
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: mock fixture 작성 (`mockReport.ts`)**

```ts
import type { AnalysisReport } from './types';

// PRD §11 예시값 기반 임시 데이터. 실제 문구/수치는 이 파일만 수정(calibration 노브).
export const MOCK_REPORT: AnalysisReport = {
  id: 'demo-1',
  status: 'completed',
  question: '링커리어에서 진행한 콘텐츠 프로젝트 중 가장 어려웠던 점은?',
  questionCompetency: '문제해결력',
  overallScore: 81,
  scores: { content: 84, delivery: 76, stability: 82 },
  transcript:
    '저는 팀 프로젝트에서 음 백엔드 API 개발을 맡았습니다 어 처음에는 약간 막막했지만 차근차근 문제를 나눠서 접근했습니다',
  audioUrl: '/sample-answer.mp3',
  speechMetrics: {
    speakingRate: 138,
    silenceCount: 5,
    longestSilence: 2.8,
    speechRatio: 0.84,
    fillerWords: { 음: 3, 어: 4, 약간: 2 },
    rateSeries: [
      { t: 0, wpm: 120 },
      { t: 8, wpm: 145 },
      { t: 16, wpm: 132 },
      { t: 24, wpm: 150 },
      { t: 32, wpm: 128 },
      { t: 40, wpm: 138 },
    ],
  },
  timeline: [
    { start: 0.0, end: 8.2, type: 'speech' },
    { start: 8.2, end: 10.5, type: 'silence' },
    { start: 11.0, end: 11.4, type: 'filler', word: '음' },
    { start: 11.4, end: 20.0, type: 'speech' },
    { start: 20.0, end: 22.0, type: 'silence' },
    { start: 22.0, end: 22.4, type: 'filler', word: '어' },
    { start: 22.4, end: 34.0, type: 'speech' },
    { start: 34.0, end: 34.5, type: 'filler', word: '약간' },
    { start: 34.5, end: 42.0, type: 'speech' },
  ],
  contentFeedback: {
    logic: {
      diagnosis: '결론이 답변 끝에 묻혀 약합니다.',
      example: '‘제가 맡은 핵심은 API 안정화였습니다’로 먼저 결론을 제시하세요.',
    },
    expertise: {
      diagnosis: '사례는 있으나 수치가 없습니다.',
      example: '‘응답 지연을 40% 줄였습니다’처럼 성과를 수치로 보강하세요.',
    },
    competencyFit: '문제해결력 질문에 대해 과정 설명은 충분하나 결과 임팩트가 부족함',
  },
  improvementPoints: [
    '답변 마지막에 핵심 역량을 한 문장으로 정리하세요.',
    '필러 단어를 줄이기 위해 문장 시작 전 1초 정도 생각하세요.',
  ],
  createdAt: '2026-06-24T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
};
```

- [ ] **Step 3: 쿼리 훅 작성 (`useAnalysisReportQuery.ts`)**

```ts
import { useQuery } from '@tanstack/react-query';

import { MOCK_REPORT } from './mockReport';
import type { AnalysisReport } from './types';

// 백엔드 없이 로딩→완료 흐름을 시뮬레이션하는 mock 훅.
// 실제 연동 시 queryFn을 axios 호출 + §11 어댑터로 교체한다.
export function useAnalysisReportQuery(id: string) {
  return useQuery<AnalysisReport>({
    queryKey: ['analysisReport', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_REPORT;
      // 실제: const { data } = await apiClient.get(`/analyses/${id}`); return adaptReport(data);
    },
  });
}
```

- [ ] **Step 4: 타입체크 통과 확인**

Run: `cd frontend && npm run build`
Expected: PASS (타입 에러 없이 빌드 완료)

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/analysis/types.ts frontend/src/features/analysis/mockReport.ts frontend/src/features/analysis/useAnalysisReportQuery.ts
git commit -m "feat : 결과 리포트 데이터 계약·mock·쿼리 훅 추가 #7"
```

---

### Task 2: 순수 로직 + 마스코트 라이브러리

**Files:**
- Create: `frontend/src/features/analysis/lib/format.ts`
- Create: `frontend/src/features/analysis/lib/timeline.ts`
- Create: `frontend/src/features/analysis/lib/transcript.ts`
- Create: `frontend/src/features/analysis/lib/sparkline.ts`
- Create: `frontend/src/features/analysis/lib/mascot.ts`

**Interfaces:**
- Consumes: `TimelineSegment` (Task 1)
- Produces:
  - `formatTime(totalSeconds: number): string`
  - `segmentAtTime(timeline: TimelineSegment[], t: number): TimelineSegment | null`
  - `highlightFillers(transcript: string, fillerWords: Record<string, number>): { text: string; isFiller: boolean }[]`
  - `buildSparkline(series: { t: number; wpm: number }[], width: number, height: number): { path: string; points: { x: number; y: number }[] }`
  - `MascotKey` 타입, `MASCOT_SRC: Record<MascotKey, string>`, `scoreToMascot(score: number): MascotKey`

- [ ] **Step 1: `format.ts`**

```ts
// 초 → "M:SS" (예: 11 → "0:11", 71 → "1:11")
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 2: `timeline.ts`**

```ts
import type { TimelineSegment } from '../types';

// t를 [start, end) 로 포함하는 구간. 없으면 null(구간 사이 공백 포함).
export function segmentAtTime(
  timeline: TimelineSegment[],
  t: number,
): TimelineSegment | null {
  return timeline.find((seg) => t >= seg.start && t < seg.end) ?? null;
}
```

- [ ] **Step 3: `transcript.ts`**

```ts
export type TranscriptToken = { text: string; isFiller: boolean };

// 공백을 보존하며 토큰화하고, 필러 단어와 정확히 일치하는 토큰만 표시.
// 단어 단위 타임스탬프가 없어 재생 위치와 무관한 정적 하이라이트.
export function highlightFillers(
  transcript: string,
  fillerWords: Record<string, number>,
): TranscriptToken[] {
  const fillers = new Set(Object.keys(fillerWords));
  return transcript.split(/(\s+)/).map((part) => {
    const word = part.trim();
    return { text: part, isFiller: word.length > 0 && fillers.has(word) };
  });
}
```

- [ ] **Step 4: `sparkline.ts`**

```ts
export type SparkPoint = { x: number; y: number };

// 말속도 시계열 → SVG path + 점 좌표. y는 반전(위가 빠름).
export function buildSparkline(
  series: { t: number; wpm: number }[],
  width: number,
  height: number,
  pad = 6,
): { path: string; points: SparkPoint[] } {
  if (series.length === 0) return { path: '', points: [] };
  const ts = series.map((p) => p.t);
  const wpms = series.map((p) => p.wpm);
  const minT = Math.min(...ts);
  const spanT = Math.max(...ts) - minT || 1;
  const minW = Math.min(...wpms);
  const spanW = Math.max(...wpms) - minW || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = series.map((p) => ({
    x: pad + ((p.t - minT) / spanT) * innerW,
    y: pad + (1 - (p.wpm - minW) / spanW) * innerH,
  }));
  const path = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  return { path, points };
}
```

- [ ] **Step 5: `mascot.ts` (이미지 import + 점수 매핑)**

```ts
// 말거울 마스코트 표정. 경로는 frontend/assets/images/ (Vite root=frontend 내부라 import 가능).
import cheeringImg from '../../../../assets/images/cheering.png';
import clapImg from '../../../../assets/images/clap.png';
import defaultImg from '../../../../assets/images/default.png';
import thinkingImg from '../../../../assets/images/thinking.png';

export type MascotKey = 'cheering' | 'clap' | 'default' | 'thinking';

export const MASCOT_SRC: Record<MascotKey, string> = {
  cheering: cheeringImg,
  clap: clapImg,
  default: defaultImg,
  thinking: thinkingImg,
};

// 종합 점수대별 반응. hello/listening은 온보딩·녹음 슬라이스용이라 제외.
export function scoreToMascot(score: number): MascotKey {
  if (score >= 85) return 'cheering';
  if (score >= 70) return 'clap';
  if (score >= 55) return 'default';
  return 'thinking';
}
```

- [ ] **Step 6: 타입체크 + 자산 import 확인**

Run: `cd frontend && npm run build`
Expected: PASS. 만약 `assets/images/*.png` import에서 "outside of Vite serving allow list" 오류가 나면, 4개 PNG를 `frontend/src/assets/images/`로 복사하고 `mascot.ts` import 경로를 `../../assets/images/<name>.png`로 바꾼 뒤 다시 빌드.

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/features/analysis/lib/
git commit -m "feat : 결과 리포트 순수 로직·마스코트 유틸 추가 #7"
```

---

### Task 3: 상단 스티키 오디오/타임라인 플레이어

**Files:**
- Create: `frontend/src/components/result/TimelineTrack.tsx`
- Create: `frontend/src/components/result/AudioTimelinePlayer.tsx`
- Asset(준비): `frontend/public/sample-answer.mp3`

**Interfaces:**
- Consumes: `TimelineSegment` (Task 1), `formatTime`·`segmentAtTime` (Task 2), `cn` (`frontend/src/lib/cn.ts`)
- Produces: `<AudioTimelinePlayer audioUrl={string} timeline={TimelineSegment[]} />`, `<TimelineTrack timeline duration currentTime onSeek />`

- [ ] **Step 1: 샘플 오디오 배치**

`frontend/public/sample-answer.mp3`에 한국어 짧은 답변 음성(약 40초)을 둔다. 지금 파일이 없으면 임의의 짧은 `.mp3`라도 같은 경로에 두면 플레이헤드가 동작한다. 파일이 없어도 페이지는 렌더되며 재생만 안 된다.

- [ ] **Step 2: `TimelineTrack.tsx`**

```tsx
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
```

- [ ] **Step 3: `AudioTimelinePlayer.tsx`**

```tsx
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
```

- [ ] **Step 4: 타입체크**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/result/TimelineTrack.tsx frontend/src/components/result/AudioTimelinePlayer.tsx
git commit -m "feat : 상단 스티키 오디오·타임라인 플레이어 추가 #7"
```

---

### Task 4: 상단 본문 — 헤더·전사·점수·말속도

**Files:**
- Create: `frontend/src/components/result/ReportHeader.tsx`
- Create: `frontend/src/components/result/TranscriptPanel.tsx`
- Create: `frontend/src/components/result/ScorePanel.tsx`
- Create: `frontend/src/components/result/SpeedGraph.tsx`

**Interfaces:**
- Consumes: `highlightFillers` (Task 2), `buildSparkline` (Task 2), `MASCOT_SRC`·`scoreToMascot` (Task 2), `Badge` (`frontend/src/components/ui/Badge.tsx`, prop `variant: 'pill'|'coral'`)
- Produces: `<ReportHeader question competency />`, `<TranscriptPanel transcript fillerWords />`, `<ScorePanel overallScore scores />`, `<SpeedGraph rateSeries averageWpm />`

- [ ] **Step 1: `ReportHeader.tsx`**

```tsx
import { Badge } from '../ui/Badge';

type Props = { question: string; competency: string };

export function ReportHeader({ question, competency }: Props) {
  return (
    <header className="flex flex-col gap-3">
      <Badge variant="coral">{competency}</Badge>
      <h1 className="text-display-sm text-ink">{question}</h1>
    </header>
  );
}
```

- [ ] **Step 2: `TranscriptPanel.tsx`**

```tsx
import { highlightFillers } from '../../features/analysis/lib/transcript';

type Props = { transcript: string; fillerWords: Record<string, number> };

export function TranscriptPanel({ transcript, fillerWords }: Props) {
  const tokens = highlightFillers(transcript, fillerWords);
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">전사</h2>
      <p className="text-body-md leading-relaxed text-body">
        {tokens.map((tok, i) =>
          tok.isFiller ? (
            <mark key={i} className="rounded bg-accent-amber/30 px-0.5 text-ink">
              {tok.text}
            </mark>
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: `ScorePanel.tsx` (마스코트 포함)**

```tsx
import { MASCOT_SRC, scoreToMascot } from '../../features/analysis/lib/mascot';

type Props = {
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
};

const SUB = [
  { key: 'content', label: '내용' },
  { key: 'delivery', label: '전달력' },
  { key: 'stability', label: '안정성' },
] as const;

export function ScorePanel({ overallScore, scores }: Props) {
  const mascot = scoreToMascot(overallScore);
  return (
    <section className="flex flex-col gap-6 rounded-lg bg-surface-card p-8 sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <img src={MASCOT_SRC[mascot]} alt="" className="h-24 w-24 object-contain" />
        <div>
          <p className="text-body-sm text-muted">종합 점수</p>
          <p className="text-display-lg text-ink">{overallScore}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {SUB.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-14 text-body-sm text-muted">{s.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${scores[s.key]}%` }}
              />
            </div>
            <span className="w-8 text-right text-body-sm tabular-nums text-body">
              {scores[s.key]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `SpeedGraph.tsx`**

```tsx
import { buildSparkline } from '../../features/analysis/lib/sparkline';

type Props = { rateSeries: { t: number; wpm: number }[]; averageWpm: number };

export function SpeedGraph({ rateSeries, averageWpm }: Props) {
  const W = 480;
  const H = 120;
  const { path, points } = buildSparkline(rateSeries, W, H);
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-1 text-title-md text-ink">말 속도</h2>
      <p className="mb-4 text-body-sm text-muted">평균 분당 {averageWpm}단어</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--color-primary)" />
        ))}
      </svg>
    </section>
  );
}
```

- [ ] **Step 5: 타입체크**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/components/result/ReportHeader.tsx frontend/src/components/result/TranscriptPanel.tsx frontend/src/components/result/ScorePanel.tsx frontend/src/components/result/SpeedGraph.tsx
git commit -m "feat : 결과 헤더·전사·점수·말속도 패널 추가 #7"
```

---

### Task 5: 하단 카드 — 침묵·필러·내용 피드백·개선

**Files:**
- Create: `frontend/src/components/result/SilenceCard.tsx`
- Create: `frontend/src/components/result/FillerCard.tsx`
- Create: `frontend/src/components/result/ContentFeedbackPanel.tsx`
- Create: `frontend/src/components/result/ImprovementList.tsx`

**Interfaces:**
- Consumes: `ContentFeedback` (Task 1)
- Produces: `<SilenceCard silenceCount longestSilence speechRatio />`, `<FillerCard fillerWords />`, `<ContentFeedbackPanel feedback />`, `<ImprovementList points />`

- [ ] **Step 1: `SilenceCard.tsx`**

```tsx
type Props = { silenceCount: number; longestSilence: number; speechRatio: number };

export function SilenceCard({ silenceCount, longestSilence, speechRatio }: Props) {
  const rows = [
    { label: '침묵 횟수', value: `${silenceCount}회` },
    { label: '가장 긴 침묵', value: `${longestSilence}초` },
    { label: '발화 비율', value: `${Math.round(speechRatio * 100)}%` },
  ];
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">침묵 분석</h2>
      <dl className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-body-md">
            <dt className="text-muted">{r.label}</dt>
            <dd className="tabular-nums text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: `FillerCard.tsx`**

```tsx
type Props = { fillerWords: Record<string, number> };

export function FillerCard({ fillerWords }: Props) {
  const entries = Object.entries(fillerWords).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">필러 단어</h2>
      <ul className="flex flex-col gap-3">
        {entries.map(([word, count]) => (
          <li key={word} className="flex items-center gap-3">
            <span className="w-12 text-body-md text-ink">{word}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-accent-amber"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-body-sm tabular-nums text-body">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `ContentFeedbackPanel.tsx`**

```tsx
import type { ContentFeedback } from '../../features/analysis/types';

type Props = { feedback: ContentFeedback };

const AXES = [
  { key: 'logic', label: '논리 구조' },
  { key: 'expertise', label: '직무 전문성' },
] as const;

export function ContentFeedbackPanel({ feedback }: Props) {
  return (
    <section className="flex flex-col gap-6 rounded-lg bg-surface-card p-8">
      <h2 className="text-title-md text-ink">내용 피드백</h2>
      {AXES.map((axis) => (
        <div key={axis.key} className="flex flex-col gap-1">
          <h3 className="text-title-sm text-ink">{axis.label}</h3>
          <p className="text-body-md text-body">{feedback[axis.key].diagnosis}</p>
          <p className="rounded-md bg-canvas p-3 text-body-sm text-body-strong">
            예시: {feedback[axis.key].example}
          </p>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <h3 className="text-title-sm text-ink">평가역량 부합도</h3>
        <p className="text-body-md text-body">{feedback.competencyFit}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `ImprovementList.tsx`**

```tsx
type Props = { points: string[] };

export function ImprovementList({ points }: Props) {
  return (
    <section className="rounded-lg bg-surface-card p-8">
      <h2 className="mb-4 text-title-md text-ink">개선 포인트</h2>
      <ol className="flex flex-col gap-3">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3 text-body-md text-body">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-body-sm text-on-primary">
              {i + 1}
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 5: 타입체크**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/components/result/SilenceCard.tsx frontend/src/components/result/FillerCard.tsx frontend/src/components/result/ContentFeedbackPanel.tsx frontend/src/components/result/ImprovementList.tsx
git commit -m "feat : 침묵·필러·내용 피드백·개선 카드 추가 #7"
```

---

### Task 6: ResultPage 조립 + 라우팅

**Files:**
- Create: `frontend/src/pages/ResultPage.tsx`
- Modify: `frontend/src/App.tsx` (라우트 + nav 링크 추가)

**Interfaces:**
- Consumes: `useAnalysisReportQuery` (Task 1), 모든 result 컴포넌트 (Task 3·4·5)

- [ ] **Step 1: `ResultPage.tsx`**

```tsx
import { AudioTimelinePlayer } from '../components/result/AudioTimelinePlayer';
import { ContentFeedbackPanel } from '../components/result/ContentFeedbackPanel';
import { FillerCard } from '../components/result/FillerCard';
import { ImprovementList } from '../components/result/ImprovementList';
import { ReportHeader } from '../components/result/ReportHeader';
import { ScorePanel } from '../components/result/ScorePanel';
import { SilenceCard } from '../components/result/SilenceCard';
import { SpeedGraph } from '../components/result/SpeedGraph';
import { TranscriptPanel } from '../components/result/TranscriptPanel';
import { useAnalysisReportQuery } from '../features/analysis/useAnalysisReportQuery';

export function ResultPage() {
  const { data: report, isLoading, error } = useAnalysisReportQuery('demo-1');

  if (isLoading) {
    return <main className="bg-canvas p-12 text-center text-muted">분석 결과 불러오는 중…</main>;
  }
  if (error || !report) {
    return <main className="bg-canvas p-12 text-center text-error">결과를 불러오지 못했습니다.</main>;
  }

  const m = report.speechMetrics;

  return (
    <main className="min-h-screen bg-canvas">
      <AudioTimelinePlayer audioUrl={report.audioUrl} timeline={report.timeline} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <ReportHeader question={report.question} competency={report.questionCompetency} />
        <TranscriptPanel transcript={report.transcript} fillerWords={m.fillerWords} />
        <ScorePanel overallScore={report.overallScore} scores={report.scores} />
        <SpeedGraph rateSeries={m.rateSeries} averageWpm={m.speakingRate} />
        <div className="grid gap-6 sm:grid-cols-2">
          <SilenceCard
            silenceCount={m.silenceCount}
            longestSilence={m.longestSilence}
            speechRatio={m.speechRatio}
          />
          <FillerCard fillerWords={m.fillerWords} />
        </div>
        <ContentFeedbackPanel feedback={report.contentFeedback} />
        <ImprovementList points={report.improvementPoints} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: `App.tsx` 수정 — import·route·nav 링크 추가**

기존 `App.tsx`에 `ResultPage` import, `/result` Route, nav Link를 추가한다. 최종 형태:

```tsx
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from './pages/AnalysisPage';
import { ResultPage } from './pages/ResultPage';
import { ShowcasePage } from './pages/ShowcasePage';

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-hairline bg-canvas px-6 py-3 text-nav-link">
        <Link to="/" className="text-ink">
          Analysis
        </Link>
        <Link to="/result" className="text-ink">
          Result
        </Link>
        <Link to="/showcase" className="text-ink">
          Showcase
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<AnalysisPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 3: 빌드 + 육안 검증**

Run: `cd frontend && npm run build`
Expected: PASS

Run: `cd frontend && npm run dev` → 브라우저에서 `/result` 확인:
- 상단 플레이어 고정. 재생 시 플레이헤드 이동·시간 표기 증가·현재 구간 라벨(발화/침묵/필러) 변화. 타임라인 클릭 시 해당 위치로 이동.
- 전사에서 음/어/약간 하이라이트. 종합 81 + 세부 바 + 점수대 마스코트(81 → clap). 말속도 SVG 꺾은선. 침묵·필러 카드, 내용 피드백(논리/전문성/부합도), 개선 포인트.
- 창을 좁히면 점수 패널·카드 그리드가 1열로 무너짐.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/ResultPage.tsx frontend/src/App.tsx
git commit -m "feat : 결과 페이지 조립·/result 라우팅 추가 #7"
```

---

## 완료 기준

- `/result`에서 PRD §11 리포트 전 항목이 보이고, 상단 플레이어로 다시 들으며 타임라인이 동기화된다.
- `npm run build` 타입체크·빌드 통과.
- 신규 런타임 의존성 0. vitest 테스트 없음(요청).
- 범위 제외(다음 슬라이스): 다중 질문·종합점수 합산, 단어 단위 하이라이트, 카메라/시선·영상, 실제 STT/백엔드.
