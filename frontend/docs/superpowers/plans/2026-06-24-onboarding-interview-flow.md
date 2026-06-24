# 홈·온보딩·질문선택·면접 화면 흐름 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결과 화면 앞단(홈→이력서 업로드→설정→질문선택→면접 진행)을 mock·라우팅·상태전환으로 구성해 진입부터 `/result`까지 한 흐름으로 시연 가능하게 한다.

**Architecture:** 화면당 라우트 + 단일 Zustand 흐름 스토어(`useInterviewStore`). 각 페이지는 작은 presentational 컴포넌트를 조립하고, 비자명 로직(이력서 추출·최종질문 구성·녹음)은 `features/interview/`에 분리한다. 디자인 시스템(cream/coral/dark) 토큰과 기존 UI 프리미티브를 재사용한다.

**Tech Stack:** React 19 · Vite · TypeScript · Tailwind v4 · react-router-dom v7 · Zustand · 브라우저 내장 MediaRecorder/FileReader

## Global Constraints

- 답변·주석은 한국어. 코드/식별자는 영어.
- 커밋 메시지 형식: `<type> : <설명> #10` (이 작업 이슈 번호 #10). Co-Authored-By 태그 금지.
- 신규 런타임 의존성 추가 금지 — MediaRecorder/FileReader는 브라우저 내장.
- 컴포넌트에서 직접 fetch 금지(서버 상태는 TanStack Query). 이번 작업은 mock·로컬 상태만 다룬다.
- 테스트 코드 작성 금지(사용자 요청). 검증은 `npm run build`(tsc) + `npm run lint` + 브라우저 육안.
- 디자인 토큰만 사용(인라인 hex 금지). 기존 `Button`/`Badge`/`TextInput`/`CategoryTab`/`FeatureCard`/`HeroBand`/`CtaBand`/`Footer` 재사용.
- 색 토큰: 성공=`bg-success`(초록), 오류/녹음중=`bg-error`(빨강), 캔버스=`bg-canvas`, 카드=`bg-surface-card`, 강조 CTA만 coral(`Button` primary).
- 결과 화면(`/result`, `ResultPage`)·결과 mock·`useAnalysisQuery` stub은 **건드리지 않는다**.

---

### Task 1: 라우팅 재편 + 홈 화면

기존 `/`(개발용 폴링 stub)을 `/dev`로 옮기고 `/`를 랜딩(`HomePage`)으로 만든다. 홈은 기존 섹션 컴포넌트 조립이 대부분이다.

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: 기존 `HeroBand`(`{eyebrow?,title,subtitle?,actions?,aside?}`), `CtaBand`(`{variant?,title,subtitle?,action?}`), `Footer`(`{columns?}`), `FeatureCard`(`{icon?,title,children?}`), `Button`(`{variant?, ...button}`)
- Produces: 라우트 `/`(HomePage), `/dev`(AnalysisPage). 이후 태스크가 App.tsx에 라우트를 추가한다.

- [ ] **Step 1: `HomePage.tsx` 생성**

```tsx
import { useNavigate } from 'react-router-dom';

import { CtaBand } from '../components/sections/CtaBand';
import { Footer } from '../components/sections/Footer';
import { HeroBand } from '../components/sections/HeroBand';
import { Button } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/FeatureCard';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-canvas text-body">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-section px-6 py-12">
        <HeroBand
          eyebrow="AI 발화 코칭"
          title="당신의 면접을 비추는 거울"
          subtitle="한국어 발화를 분석해 말 속도·침묵·필러 단어까지 교정합니다."
          actions={<Button onClick={() => navigate('/upload')}>시작하기</Button>}
        />
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard title="말 속도 분석">
            분당 단어 수로 너무 빠르거나 느린 구간을 짚어줍니다.
          </FeatureCard>
          <FeatureCard title="침묵·머뭇거림">
            긴 침묵과 횟수를 타임라인으로 보여줍니다.
          </FeatureCard>
          <FeatureCard title="한국어 필러 단어">
            “음·어·그·약간”의 사용 빈도와 위치를 분석합니다.
          </FeatureCard>
        </section>
        <CtaBand
          title="지금 바로 연습을 시작하세요"
          subtitle="이력서만 있으면 맞춤 질문으로 모의면접을 진행할 수 있어요."
          action={
            <Button variant="secondary" onClick={() => navigate('/upload')}>
              모의면접 시작
            </Button>
          }
        />
        <Footer />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: `App.tsx` 수정 — `/`=HomePage, AnalysisPage→`/dev`, nav 갱신**

전체 파일을 아래로 교체한다(이후 태스크가 라우트를 점진적으로 추가).

```tsx
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from './pages/AnalysisPage';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { ShowcasePage } from './pages/ShowcasePage';

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-hairline bg-canvas px-6 py-3 text-nav-link">
        <Link to="/" className="text-ink">
          Home
        </Link>
        <Link to="/result" className="text-ink">
          Result
        </Link>
        <Link to="/showcase" className="text-ink">
          Showcase
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/dev" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 3: 빌드·lint 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 타입체크·빌드·lint 모두 통과(에러 0).

- [ ] **Step 4: 브라우저 확인**

Run: `cd frontend && npm run dev`
확인: `/`에서 cream 랜딩(히어로 "당신의 면접을 비추는 거울" + 3개 FeatureCard + coral CTA + footer). "시작하기"는 `/upload`로 이동(아직 라우트 없어 빈 화면 — Task 3에서 추가). `/dev`에서 기존 폴링 stub가 보임.

- [ ] **Step 5: 커밋**

```bash
cd frontend && git add src/App.tsx src/pages/HomePage.tsx
git commit -m "feat : 홈 화면 추가 및 라우팅 재편(/=홈, /dev=폴링 stub) #10"
```

---

### Task 2: 흐름 스토어 + 타입 + mock 질문 (foundation)

이후 모든 화면이 공유하는 상태·타입·mock 질문 데이터를 만든다. UI는 없고 빌드 통과가 산출물.

**Files:**
- Create: `frontend/src/features/interview/types.ts`
- Create: `frontend/src/features/interview/store.ts`
- Create: `frontend/src/features/interview/mockQuestions.ts`

**Interfaces:**
- Produces:
  - `type InterviewMode = 'practice' | 'real'`
  - `type RecommendedQuestion = { id: string; question: string; competency: string }`
  - `JOBS: readonly string[]`, `INTERVIEW_TYPES: readonly { id: string; label: string; desc: string }[]`
  - `useInterviewStore` — 상태 `{ resumeText, job, interviewType, mode, recommended, selectedIds, finalQuestions }` + setters `{ setResumeText, setJob, setInterviewType, setMode, setRecommended, toggleSelected(최대3), setFinalQuestions, reset }`
  - `recommendQuestions(job: string, interviewType: string): RecommendedQuestion[]` (현재 공통 10개 풀 반환)

- [ ] **Step 1: `types.ts` 생성**

```ts
export type InterviewMode = 'practice' | 'real';

export type RecommendedQuestion = {
  id: string;
  question: string;
  competency: string; // 평가 역량 (예: "문제해결력")
};

// PRD §6.2 직종
export const JOBS = [
  '백엔드',
  '프론트엔드',
  '데이터 분석가',
  'AI·ML 엔지니어',
  '서비스 기획자',
  '마케터',
  '디자이너',
] as const;

// PRD §6.2 면접 종류
export const INTERVIEW_TYPES = [
  { id: '인성', label: '인성/태도', desc: '가치관·조직 적합성' },
  { id: '직무', label: '직무/역량', desc: '직무 지식·문제 해결력' },
  { id: 'PT', label: 'PT 면접', desc: '발표력·논리력' },
  { id: '상황', label: '상황/롤플레잉', desc: '업무 상황 대응력' },
  { id: '압박', label: '압박 면접', desc: '스트레스 대응력' },
] as const;
```

- [ ] **Step 2: `store.ts` 생성**

```ts
import { create } from 'zustand';

import type { InterviewMode, RecommendedQuestion } from './types';

const MAX_SELECT = 3;

type InterviewState = {
  resumeText: string;
  job: string;
  interviewType: string;
  mode: InterviewMode;
  recommended: RecommendedQuestion[];
  selectedIds: string[];
  finalQuestions: RecommendedQuestion[];
  setResumeText: (text: string) => void;
  setJob: (job: string) => void;
  setInterviewType: (type: string) => void;
  setMode: (mode: InterviewMode) => void;
  setRecommended: (questions: RecommendedQuestion[]) => void;
  toggleSelected: (id: string) => void;
  setFinalQuestions: (questions: RecommendedQuestion[]) => void;
  reset: () => void;
};

const initialState = {
  resumeText: '',
  job: '',
  interviewType: '',
  mode: 'practice' as InterviewMode,
  recommended: [] as RecommendedQuestion[],
  selectedIds: [] as string[],
  finalQuestions: [] as RecommendedQuestion[],
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  setResumeText: (resumeText) => set({ resumeText }),
  setJob: (job) => set({ job }),
  setInterviewType: (interviewType) => set({ interviewType }),
  setMode: (mode) => set({ mode }),
  // 추천 새로 받으면 선택 초기화
  setRecommended: (recommended) => set({ recommended, selectedIds: [] }),
  toggleSelected: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return { selectedIds: state.selectedIds.filter((x) => x !== id) };
      }
      // 3개 초과 선택 막기
      if (state.selectedIds.length >= MAX_SELECT) return state;
      return { selectedIds: [...state.selectedIds, id] };
    }),
  setFinalQuestions: (finalQuestions) => set({ finalQuestions }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 3: `mockQuestions.ts` 생성**

```ts
import type { RecommendedQuestion } from './types';

// ponytail: 직종 무관 공통 풀. 실연동 시 POST /questions/recommend 응답으로 교체.
const COMMON_POOL: RecommendedQuestion[] = [
  { id: 'q1', question: '자신을 한 문장으로 소개해 주세요.', competency: '자기이해' },
  { id: 'q2', question: '가장 어려웠던 프로젝트와 그때의 역할은 무엇이었나요?', competency: '문제해결력' },
  { id: 'q3', question: '협업 중 갈등을 어떻게 해결했는지 사례를 들어 주세요.', competency: '협업·소통' },
  { id: 'q4', question: '최근에 새롭게 배운 기술이나 개념은 무엇인가요?', competency: '학습민첩성' },
  { id: 'q5', question: '실패했던 경험과 거기서 얻은 교훈을 말해 주세요.', competency: '회복탄력성' },
  { id: 'q6', question: '데이터를 근거로 의사결정을 내린 경험이 있나요?', competency: '데이터 활용' },
  { id: 'q7', question: '우선순위가 충돌할 때 어떻게 결정하나요?', competency: '우선순위 판단' },
  { id: 'q8', question: '이 직무에 지원한 이유와 강점을 연결해 설명해 주세요.', competency: '직무이해도' },
  { id: 'q9', question: '맡은 일의 성과를 어떻게 측정하고 개선했나요?', competency: '성과지향' },
  { id: 'q10', question: '앞으로 1년간 이루고 싶은 성장 목표는 무엇인가요?', competency: '성장지향' },
];

// 직종·면접종류는 현재 미사용(공통 풀 반환). 시그니처는 백엔드 연동 대비 유지.
export function recommendQuestions(_job: string, _interviewType: string): RecommendedQuestion[] {
  return COMMON_POOL;
}
```

- [ ] **Step 4: 빌드 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 통과(미사용 export 경고 없음 — 다음 태스크가 소비).

- [ ] **Step 5: 커밋**

```bash
cd frontend && git add src/features/interview/types.ts src/features/interview/store.ts src/features/interview/mockQuestions.ts
git commit -m "feat : 면접 흐름 스토어·타입·mock 질문 추가 #10"
```

---

### Task 3: 이력서 업로드 화면

TXT 자동 추출 + PDF/DOCX·실패 시 직접 입력 폴백. 흐름 진행바(`FlowProgress`)를 여기서 만들어 이후 화면에서 재사용한다.

**Files:**
- Create: `frontend/src/features/interview/lib/extractResume.ts`
- Create: `frontend/src/components/interview/FlowProgress.tsx`
- Create: `frontend/src/pages/UploadPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useInterviewStore`(`resumeText`,`setResumeText`), `Button`
- Produces:
  - `extractResume(file: File): Promise<string | null>` (TXT만 추출, 그 외 null)
  - `FlowProgress` — props `{ current: number }` (0-based: 0=이력서,1=설정,2=질문,3=면접)
  - 라우트 `/upload`

- [ ] **Step 1: `lib/extractResume.ts` 생성**

```ts
// TXT만 실제 추출. 그 외 형식·실패 시 null → UI가 직접 입력 폴백을 노출한다.
export async function extractResume(file: File): Promise<string | null> {
  const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
  if (!isTxt) return null;
  try {
    const text = await file.text();
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: `components/interview/FlowProgress.tsx` 생성**

```tsx
const STEPS = ['이력서', '설정', '질문', '면접'] as const;

type FlowProgressProps = {
  current: number; // 0-based 단계 인덱스
};

export function FlowProgress({ current }: FlowProgressProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-caption">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={
              i <= current
                ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary'
                : 'flex h-6 w-6 items-center justify-center rounded-full bg-surface-card text-muted'
            }
          >
            {i + 1}
          </span>
          <span className={i === current ? 'font-medium text-ink' : 'text-muted'}>{label}</span>
          {i < STEPS.length - 1 ? <span className="text-muted-soft">›</span> : null}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: `pages/UploadPage.tsx` 생성**

```tsx
import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { extractResume } from '../features/interview/lib/extractResume';
import { useInterviewStore } from '../features/interview/store';

export function UploadPage() {
  const navigate = useNavigate();
  const resumeText = useInterviewStore((s) => s.resumeText);
  const setResumeText = useInterviewStore((s) => s.setResumeText);
  const [notice, setNotice] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractResume(file);
    if (text) {
      setResumeText(text);
      setNotice('이력서 텍스트를 추출했어요. 필요하면 수정하세요.');
    } else {
      setNotice('이 형식은 자동 추출이 안 돼요. 내용을 직접 붙여넣어 주세요.');
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={0} />
        <h1 className="text-display-sm font-semibold text-ink">이력서 업로드</h1>
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={onFile}
          className="text-body-sm text-body"
        />
        {notice ? <p className="text-body-sm text-muted">{notice}</p> : null}
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="이력서 내용을 직접 입력하거나 파일에서 추출하세요."
          className="min-h-48 rounded-md border border-hairline bg-canvas p-4 text-body-md text-ink outline-none focus:border-primary"
        />
        <div className="flex justify-end">
          <Button onClick={() => navigate('/setup')} disabled={resumeText.trim().length === 0}>
            다음
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: `App.tsx`에 `/upload` 라우트 추가**

import 블록에 추가:
```tsx
import { UploadPage } from './pages/UploadPage';
```
`<Routes>` 안 `/` 라우트 바로 아래에 추가:
```tsx
        <Route path="/upload" element={<UploadPage />} />
```

- [ ] **Step 5: 빌드·lint 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 통과.

- [ ] **Step 6: 브라우저 확인**

Run: `cd frontend && npm run dev`
확인: `/upload`에서 진행바(이력서 단계 강조). `.txt` 파일 선택 시 textarea에 내용 채워지고 "추출했어요" 안내. `.pdf`/`.docx` 선택 시 "직접 입력" 안내. 직접 입력해도 "다음" 활성화 → 클릭 시 `/setup`(아직 빈 화면, Task 4에서 추가).

- [ ] **Step 7: 커밋**

```bash
cd frontend && git add src/App.tsx src/pages/UploadPage.tsx src/components/interview/FlowProgress.tsx src/features/interview/lib/extractResume.ts
git commit -m "feat : 이력서 업로드 화면(TXT 추출·직접 입력 폴백) #10"
```

---

### Task 4: 설정 화면 (직종·면접종류·모드)

직종/면접종류 칩 선택 + 모드 선택(실전은 비활성). "질문 추천 받기"로 mock 추천을 스토어에 채우고 `/questions`로 이동.

**Files:**
- Create: `frontend/src/pages/SetupPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useInterviewStore`(`job,interviewType,mode,setJob,setInterviewType,setMode,setRecommended`), `recommendQuestions`, `JOBS`, `INTERVIEW_TYPES`, `CategoryTab`, `Button`, `FlowProgress`
- Produces: 라우트 `/setup`

- [ ] **Step 1: `pages/SetupPage.tsx` 생성**

```tsx
import { useNavigate } from 'react-router-dom';

import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { CategoryTab } from '../components/ui/CategoryTab';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { INTERVIEW_TYPES, JOBS } from '../features/interview/types';

export function SetupPage() {
  const navigate = useNavigate();
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const mode = useInterviewStore((s) => s.mode);
  const setJob = useInterviewStore((s) => s.setJob);
  const setInterviewType = useInterviewStore((s) => s.setInterviewType);
  const setMode = useInterviewStore((s) => s.setMode);
  const setRecommended = useInterviewStore((s) => s.setRecommended);

  const ready = job !== '' && interviewType !== '';

  function onProceed() {
    setRecommended(recommendQuestions(job, interviewType));
    navigate('/questions');
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <FlowProgress current={1} />

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">직종</h2>
          <div className="flex flex-wrap gap-2">
            {JOBS.map((j) => (
              <CategoryTab key={j} active={job === j} onClick={() => setJob(j)}>
                {j}
              </CategoryTab>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">면접 종류</h2>
          <div className="flex flex-wrap gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <CategoryTab
                key={t.id}
                active={interviewType === t.id}
                onClick={() => setInterviewType(t.id)}
              >
                {t.label}
              </CategoryTab>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">모드</h2>
          <div className="flex gap-2">
            <CategoryTab active={mode === 'practice'} onClick={() => setMode('practice')}>
              연습 모드
            </CategoryTab>
            <CategoryTab active={false} disabled className="cursor-not-allowed opacity-50">
              실전 모드 (준비 중)
            </CategoryTab>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={onProceed} disabled={!ready}>
            질문 추천 받기
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: `App.tsx`에 `/setup` 라우트 추가**

import 추가:
```tsx
import { SetupPage } from './pages/SetupPage';
```
`/upload` 라우트 아래에 추가:
```tsx
        <Route path="/setup" element={<SetupPage />} />
```

- [ ] **Step 3: 빌드·lint 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 통과.

- [ ] **Step 4: 브라우저 확인**

Run: `cd frontend && npm run dev`
확인: `/setup`에서 진행바(설정 단계). 직종·면접종류 칩 선택 시 강조(`bg-surface-card`). 실전 모드는 비활성. 직종+종류 둘 다 고르면 "질문 추천 받기" 활성 → 클릭 시 `/questions`(아직 빈 화면, Task 5).

- [ ] **Step 5: 커밋**

```bash
cd frontend && git add src/App.tsx src/pages/SetupPage.tsx
git commit -m "feat : 직종·면접종류·모드 설정 화면 #10"
```

---

### Task 5: 질문 추천·선택 화면

추천 10개를 평가역량 태그와 함께 표시, 3개 선택(초과 막기), "면접 시작" 시 미선택 중 랜덤 1개를 더해 4문항을 구성하고 `/interview`로 이동.

**Files:**
- Create: `frontend/src/features/interview/lib/buildFinalQuestions.ts`
- Create: `frontend/src/components/interview/QuestionCard.tsx`
- Create: `frontend/src/pages/QuestionsPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useInterviewStore`(`recommended,selectedIds,job,interviewType,toggleSelected,setFinalQuestions`), `recommendQuestions`, `Badge`, `Button`, `cn`, `FlowProgress`
- Produces:
  - `buildFinalQuestions(recommended, selectedIds): RecommendedQuestion[]` (선택 + 랜덤1)
  - `QuestionCard` — props `{ question: RecommendedQuestion; selected: boolean; disabled?: boolean; onToggle: () => void }`
  - 라우트 `/questions`

- [ ] **Step 1: `lib/buildFinalQuestions.ts` 생성**

```ts
import type { RecommendedQuestion } from '../types';

// 선택 질문 + 미선택 중 랜덤 1개 = 최종 문항 (PRD §6.3 FR-009~011)
export function buildFinalQuestions(
  recommended: RecommendedQuestion[],
  selectedIds: string[],
): RecommendedQuestion[] {
  const selected = recommended.filter((q) => selectedIds.includes(q.id));
  const rest = recommended.filter((q) => !selectedIds.includes(q.id));
  const random = rest.length > 0 ? rest[Math.floor(Math.random() * rest.length)] : undefined;
  return random ? [...selected, random] : selected;
}
```

- [ ] **Step 2: `components/interview/QuestionCard.tsx` 생성**

```tsx
import { cn } from '../../lib/cn';
import type { RecommendedQuestion } from '../../features/interview/types';
import { Badge } from '../ui/Badge';

type QuestionCardProps = {
  question: RecommendedQuestion;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function QuestionCard({ question, selected, disabled, onToggle }: QuestionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-lg border p-5 text-left',
        selected ? 'border-primary bg-surface-card' : 'border-hairline bg-canvas',
        disabled && !selected ? 'opacity-50' : '',
      )}
    >
      <Badge>{question.competency}</Badge>
      <p className="text-body-md text-ink">{question.question}</p>
    </button>
  );
}
```

- [ ] **Step 3: `pages/QuestionsPage.tsx` 생성**

딥링크로 추천이 비어 있으면 mock으로 폴백한다(스토어를 렌더 중 변경하지 않고 로컬 `list`로만 사용).

```tsx
import { useNavigate } from 'react-router-dom';

import { FlowProgress } from '../components/interview/FlowProgress';
import { QuestionCard } from '../components/interview/QuestionCard';
import { Button } from '../components/ui/Button';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';

export function QuestionsPage() {
  const navigate = useNavigate();
  const recommended = useInterviewStore((s) => s.recommended);
  const selectedIds = useInterviewStore((s) => s.selectedIds);
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const toggleSelected = useInterviewStore((s) => s.toggleSelected);
  const setFinalQuestions = useInterviewStore((s) => s.setFinalQuestions);

  // 딥링크 폴백: 추천이 비어 있으면 mock 사용(스토어는 건드리지 않음)
  const list = recommended.length > 0 ? recommended : recommendQuestions(job, interviewType);
  const reachedMax = selectedIds.length >= 3;

  function onStart() {
    setFinalQuestions(buildFinalQuestions(list, selectedIds));
    navigate('/interview');
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={2} />
        <div className="flex flex-col gap-1">
          <h1 className="text-display-sm font-semibold text-ink">질문 3개를 골라주세요</h1>
          <p className="text-body-sm text-muted">
            선택 {selectedIds.length}/3 · 미선택 질문 중 1개가 랜덤으로 추가돼 총 4문항으로 진행돼요.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {list.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selected={selectedIds.includes(q.id)}
              disabled={reachedMax}
              onToggle={() => toggleSelected(q.id)}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={onStart} disabled={selectedIds.length !== 3}>
            면접 시작
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: `App.tsx`에 `/questions` 라우트 추가**

import 추가:
```tsx
import { QuestionsPage } from './pages/QuestionsPage';
```
`/setup` 라우트 아래에 추가:
```tsx
        <Route path="/questions" element={<QuestionsPage />} />
```

- [ ] **Step 5: 빌드·lint 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 통과.

- [ ] **Step 6: 브라우저 확인**

Run: `cd frontend && npm run dev`
확인: `/questions`에서 10개 카드(각 평가역량 Badge). 3개 선택되면 나머지 카드 흐려지고 더 선택 안 됨. 카운터 "선택 3/3". "면접 시작" 활성 → 클릭 시 `/interview`(아직 빈 화면, Task 6).

- [ ] **Step 7: 커밋**

```bash
cd frontend && git add src/App.tsx src/pages/QuestionsPage.tsx src/components/interview/QuestionCard.tsx src/features/interview/lib/buildFinalQuestions.ts
git commit -m "feat : 질문 추천·선택 화면(3개 선택+랜덤1) #10"
```

---

### Task 6: 녹음 훅 + 면접 진행 화면

실제 마이크 녹음(MediaRecorder)·마이크 상태 표시·로컬 재생. 현재 질문/4문항 진행, 마지막에 "분석하기"로 `/result` 연결. 진입부터 결과까지 한 흐름 완성.

**Files:**
- Create: `frontend/src/features/interview/useRecorder.ts`
- Create: `frontend/src/components/interview/MicStatus.tsx`
- Create: `frontend/src/components/interview/RecorderControls.tsx`
- Create: `frontend/src/pages/InterviewPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useInterviewStore`(`finalQuestions`), `recommendQuestions`, `buildFinalQuestions`, `Badge`, `Button`, `FlowProgress`
- Produces:
  - `useRecorder()` → `{ micStatus: MicStatus; isRecording: boolean; audioUrl: string | null; requestMic(): Promise<void>; start(): void; stop(): void; reset(): void }`
  - `type MicStatus = 'idle' | 'ready' | 'recording' | 'denied' | 'error'`
  - `MicStatus`(컴포넌트) — props `{ status: MicStatus }`
  - `RecorderControls` — props `{ micStatus, isRecording, audioUrl, onRequestMic, onStart, onStop }`
  - 라우트 `/interview`

- [ ] **Step 1: `features/interview/useRecorder.ts` 생성**

```ts
import { useEffect, useRef, useState } from 'react';

export type MicStatus = 'idle' | 'ready' | 'recording' | 'denied' | 'error';

export function useRecorder() {
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // 마이크 권한 요청 + 스트림 확보
  async function requestMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus('ready');
    } catch {
      setMicStatus('denied');
    }
  }

  function revoke() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function start() {
    const stream = streamRef.current;
    if (!stream) {
      setMicStatus('error');
      return;
    }
    revoke();
    setAudioUrl(null);
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setMicStatus('recording');
  }

  function stop() {
    recorderRef.current?.stop();
    setMicStatus('ready');
  }

  // 다음 질문으로 넘어갈 때 현재 녹음 정리
  function reset() {
    revoke();
    setAudioUrl(null);
  }

  // 언마운트 시 스트림·URL 정리
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      revoke();
    };
  }, []);

  return {
    micStatus,
    isRecording: micStatus === 'recording',
    audioUrl,
    requestMic,
    start,
    stop,
    reset,
  };
}
```

- [ ] **Step 2: `components/interview/MicStatus.tsx` 생성**

```tsx
import type { MicStatus as MicStatusValue } from '../../features/interview/useRecorder';

// FR-018: 정상 초록 / 문제 빨강 (녹음 중은 빨강 점)
const LABELS: Record<MicStatusValue, { text: string; color: string }> = {
  idle: { text: '마이크 권한 필요', color: 'bg-muted' },
  ready: { text: '마이크 정상', color: 'bg-success' },
  recording: { text: '녹음 중', color: 'bg-error' },
  denied: { text: '마이크 권한 거부됨', color: 'bg-error' },
  error: { text: '마이크 오류', color: 'bg-error' },
};

export function MicStatus({ status }: { status: MicStatusValue }) {
  const { text, color } = LABELS[status];
  return (
    <div className="flex items-center gap-2 text-body-sm text-body">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {text}
    </div>
  );
}
```

- [ ] **Step 3: `components/interview/RecorderControls.tsx` 생성**

```tsx
import type { MicStatus } from '../../features/interview/useRecorder';
import { Button } from '../ui/Button';

type RecorderControlsProps = {
  micStatus: MicStatus;
  isRecording: boolean;
  audioUrl: string | null;
  onRequestMic: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function RecorderControls({
  micStatus,
  isRecording,
  audioUrl,
  onRequestMic,
  onStart,
  onStop,
}: RecorderControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      {micStatus === 'idle' ? (
        <Button onClick={onRequestMic}>마이크 켜기</Button>
      ) : isRecording ? (
        <Button onClick={onStop}>녹음 정지</Button>
      ) : (
        <Button onClick={onStart} disabled={micStatus === 'denied' || micStatus === 'error'}>
          {audioUrl ? '다시 녹음' : '녹음 시작'}
        </Button>
      )}
      {audioUrl && !isRecording ? (
        <audio controls src={audioUrl} className="w-full">
          <track kind="captions" />
        </audio>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: `pages/InterviewPage.tsx` 생성**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FlowProgress } from '../components/interview/FlowProgress';
import { MicStatus } from '../components/interview/MicStatus';
import { RecorderControls } from '../components/interview/RecorderControls';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { useRecorder } from '../features/interview/useRecorder';

export function InterviewPage() {
  const navigate = useNavigate();
  const storeFinal = useInterviewStore((s) => s.finalQuestions);

  // 딥링크 폴백: 최종 질문이 없으면 mock 4문항 구성
  const questions =
    storeFinal.length > 0
      ? storeFinal
      : buildFinalQuestions(recommendQuestions('', ''), ['q1', 'q2', 'q3']);

  const [index, setIndex] = useState(0);
  const recorder = useRecorder();
  const current = questions[index];
  const isLast = index === questions.length - 1;

  function onNext() {
    recorder.reset();
    if (isLast) {
      navigate('/result');
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={3} />
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted">
            {index + 1} / {questions.length}
          </span>
          <MicStatus status={recorder.micStatus} />
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-surface-card p-6">
          <Badge>{current.competency}</Badge>
          <p className="text-title-md text-ink">{current.question}</p>
        </div>
        <RecorderControls
          micStatus={recorder.micStatus}
          isRecording={recorder.isRecording}
          audioUrl={recorder.audioUrl}
          onRequestMic={recorder.requestMic}
          onStart={recorder.start}
          onStop={recorder.stop}
        />
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={recorder.isRecording}>
            {isLast ? '분석하기' : '다음 질문'}
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: `App.tsx`에 `/interview` 라우트 추가**

import 추가:
```tsx
import { InterviewPage } from './pages/InterviewPage';
```
`/questions` 라우트 아래에 추가:
```tsx
        <Route path="/interview" element={<InterviewPage />} />
```

- [ ] **Step 6: 빌드·lint 검증**

Run: `cd frontend && npm run build && npm run lint`
Expected: 통과.

- [ ] **Step 7: 브라우저 전체 흐름 확인**

Run: `cd frontend && npm run dev`
확인(진입→결과 한 흐름):
1. `/`에서 "시작하기" → `/upload`
2. 이력서 직접 입력 → "다음" → `/setup`
3. 직종·면접종류 선택, 연습 모드 → "질문 추천 받기" → `/questions`
4. 질문 3개 선택 → "면접 시작" → `/interview`
5. "마이크 켜기" 클릭 → 권한 허용 시 상태 초록("마이크 정상"). "녹음 시작"→빨강("녹음 중")→"녹음 정지" 후 `<audio>`로 다시듣기.
6. "다음 질문" 3회 → 4번째에서 "분석하기" → `/result`(기존 결과 화면)
7. 권한 거부 시 빨강("마이크 권한 거부됨"), 녹음 버튼 비활성.

- [ ] **Step 8: 커밋**

```bash
cd frontend && git add src/App.tsx src/pages/InterviewPage.tsx src/features/interview/useRecorder.ts src/components/interview/MicStatus.tsx src/components/interview/RecorderControls.tsx
git commit -m "feat : 면접 진행 화면·마이크 녹음 훅으로 결과까지 연결 #10"
```

---

## 자가 점검 (스펙 대비)

- **홈/랜딩** → Task 1 ✅
- **이력서 업로드(TXT 추출·직접 입력 폴백, FR-001~004)** → Task 3 ✅
- **직종·면접종류·모드 선택(FR-005~007)** → Task 4 ✅
- **질문 추천·선택(평가역량 태그·3개 선택·랜덤1·4문항, FR-008~011)** → Task 2(mock)+Task 5 ✅
- **면접 진행(현재 질문·마이크 상태·오디오 녹음·분석하기, FR-018~021)** → Task 6 ✅
- **라우팅·진행상태 연결·결과 화면 연결** → Task 1~6(App.tsx 점진 추가, FlowProgress) ✅
- **흐름 상태 관리** → Task 2(스토어) ✅
- **범위 밖(실제 STT/백엔드·실전 모드·PDF/DOCX 파싱·다시 도전·영상·결과 다중답변)** → 미포함(스펙 일치) ✅
- **타입 일관성**: `RecommendedQuestion`/`MicStatus`/스토어 시그니처가 정의 태스크(2,6)와 소비 태스크 전반에서 동일 ✅
- **플레이스홀더**: 없음(모든 스텝에 실제 코드·명령) ✅
