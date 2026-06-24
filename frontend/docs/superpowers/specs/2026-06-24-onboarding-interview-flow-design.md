# 홈·온보딩·질문선택·면접 화면 흐름 — 설계

- 날짜: 2026-06-24
- 이슈: `.issues/20260624_기능추가_홈_온보딩_면접_화면구성.md`
- 진실 기준: `PRD.md` (특히 §5 사용자 시나리오, §6.1~6.5 기능 요구사항)
- 디자인 기준: `frontend/.claude/rules/DESIGN.md`
- 선행 작업: 결과 화면(`/result`) 완료 — `.report/20260624_#7_발화분석_결과화면_리포트.md`

## Context

결과 화면(`/result`)은 PRD §11 단일 답변 리포트를 mock으로 보여주며 완성됐다. 하지만 그 **앞단(진입~면접)이 비어 있어** 사용자가 처음부터 끝까지 흐름을 탈 수 없다. 이 작업은 PRD §5.1 연습 모드 시나리오에 맞춰 남은 화면(홈·이력서 업로드·직종/면접종류/모드 선택·질문 추천/선택·면접 진행)을 구성하고, 백엔드 없이 mock·라우팅·상태전환으로 **진입부터 결과까지 한 흐름**을 시연 가능하게 한다.

디자인 시스템(cream/coral/dark 토큰)과 UI 프리미티브(`Button`/`Badge`/`TextInput`/`CategoryTab`/`FeatureCard`)·섹션 컴포넌트(`HeroBand`/`CtaBand`/`Footer`)는 이미 존재하므로 재사용한다.

## 확정 결정

| 항목 | 결정 |
|---|---|
| 녹음 | **실제 마이크 녹음(MediaRecorder)**. 마이크 상태(초록/빨강)·녹음·로컬 재생 진짜 동작. 단 분석 결과는 여전히 mock 고정 |
| 모드 범위 | **연습 모드만**(PRD §5.1 전체 흐름). 실전 모드는 선택지로 노출하되 "준비 중"(비활성), 흐름은 후속 슬라이스 |
| 홈/라우팅 | **`/`를 홈으로**. 기존 폴링 stub(`AnalysisPage`)은 `/dev`로 이동, 메인 nav에서 숨김 |
| 이력서 추출 | **TXT만 실제 추출**(FileReader) + PDF/DOCX·실패 시 "직접 입력" 폴백. 새 의존성 0 |
| 결과 오디오 | **고정 샘플 유지**(`sample-answer.mp3`). 녹음본은 면접 화면에서만 재생 확인. mock 데이터와 정합 |
| 상태 관리 | 기존 패턴대로 Zustand 흐름 스토어 + 화면당 라우트 |
| 테스트 | 이번 슬라이스 **테스트 코드 없음**(사용자 요청) |

## A. 라우팅 — `App.tsx`

```
/           HomePage        랜딩 (기존 HeroBand/CtaBand/Footer 재사용)
/upload     UploadPage      이력서 업로드 (TXT 추출 / 실패 시 직접 입력)
/setup      SetupPage       직종·면접종류·모드 선택
/questions  QuestionsPage   추천 10개 → 3개 선택 + 랜덤 1개 = 4문항
/interview  InterviewPage   면접 진행(실제 녹음) → "분석하기"
/result     ResultPage      결과 (기존, 변경 없음)
/dev        AnalysisPage    기존 폴링 stub — 메인 nav에서 숨김(개발용)
/showcase   ShowcasePage    기존 유지
```

- 진입 `/` → 끝 `/result`까지 한 흐름으로 연결.
- 딥링크로 선행 데이터 없이 들어와도 mock 기본값으로 폴백해 화면이 단독 렌더되게 한다(데모·개발 robust). 하드 가드(리다이렉트)는 두지 않는다 — YAGNI.
- 메인 nav는 흐름 진입(`/`)과 개발 링크(`/result`, `/showcase`) 정도만. `/dev`는 nav에서 제외.

## B. 상태 — `features/interview/store.ts` (Zustand)

```ts
type InterviewMode = 'practice' | 'real';

type InterviewState = {
  resumeText: string;
  job: string;                 // 직종
  interviewType: string;       // 면접 종류
  mode: InterviewMode;
  recommended: RecommendedQuestion[];   // 직종 선택 시 mock에서 채움(10개)
  selectedIds: string[];                // 사용자가 고른 3개
  finalQuestions: RecommendedQuestion[];// 3 + 랜덤 1 = 4
  // setters
  setResumeText, setJob, setInterviewType, setMode,
  setRecommended, toggleSelected, setFinalQuestions, reset;
};
```

- **녹음 blob은 스토어에 담지 않는다.** 결과 화면이 고정 샘플을 쓰므로(결정), 녹음본은 `InterviewPage` 로컬 state로만 보유한다 → 스토어가 단순해지고 비직렬화 객체를 전역에 두지 않는다.
- CLAUDE.md "UI/선택 상태는 Zustand, 서버 데이터 복제 금지" 원칙 유지. 여기 상태는 전부 클라 선택 상태다.

## C. 새 모듈 — `features/interview/`

- `types.ts` — `RecommendedQuestion { id; question; competency }`, `InterviewMode`. 직종·면접종류 목록 상수(PRD §6.2: 백엔드/프론트엔드/데이터분석가/AI·ML/기획자/마케터/디자이너 · 인성/직무/PT/상황/압박).
- `mockQuestions.ts` — 평가역량 태그가 붙은 추천 질문 풀(10개). 1차는 직종 무관 공통 풀, 직종별 매핑은 확장 여지로 둠. `// ponytail:` 주석으로 실연동 시 `POST /questions/recommend` 교체 지점 명시.
- `useRecorder.ts` — MediaRecorder 훅.
  - 반환: `{ micStatus, isRecording, audioUrl, requestMic, start, stop, reset }`
  - `micStatus: 'idle' | 'ready' | 'recording' | 'denied' | 'error'` — FR-018 마이크 상태(정상 초록 / 문제 빨강) 매핑
  - `getUserMedia` 권한 요청 → MediaRecorder로 녹음 → `Blob` → `URL.createObjectURL`로 로컬 재생. 언마운트/reset 시 URL revoke.
- `lib/extractResume.ts` — `extractResume(file): Promise<string | null>`. `text/plain`/`.txt`는 `FileReader.readAsText`로 추출, 그 외 형식·빈 결과는 `null` 반환(UI가 직접 입력 폴백 노출).
- `lib/buildFinalQuestions.ts` — `buildFinalQuestions(recommended, selectedIds): RecommendedQuestion[]`. 선택 3개 + 미선택 중 랜덤 1개 = 4개(순수함수). **테스트 코드는 작성하지 않음(요청).**

## D. 화면 컴포넌트 — `pages/` + 작은 `components/interview/`

각 페이지는 작은 presentational 컴포넌트를 조립한다(한 파일 1책임, "작은 파일 다수" 원칙).

- **HomePage** (`/`) — 기존 `HeroBand`(제목·서브카피·CTA "시작하기"→`/upload`) + 차별점 `FeatureCard`(말속도·침묵·한국어 필러) + `CtaBand` + `Footer` 조립. 대부분 조립 작업.
- **UploadPage** (`/upload`) — 파일 선택 → TXT 자동 추출 미리보기(편집 가능 textarea). PDF/DOCX·추출 실패 시 "이 형식은 자동 추출이 안 돼요. 내용을 직접 붙여넣어 주세요" + 직접 입력 textarea 노출. 파일 없이 직접 입력만으로도 진행 가능. "다음"→`resumeText` 저장→`/setup`.
- **SetupPage** (`/setup`) — 직종 칩 그리드(`CategoryTab` 재사용) · 면접 종류 선택 · 모드 선택(연습/실전, 실전은 "준비 중" 비활성 + 안내). "질문 추천 받기"→`recommended` 채우고→`/questions`.
- **QuestionsPage** (`/questions`) — 추천 10개를 `QuestionCard`(질문 + `competency` `Badge` + 선택 체크)로 표시. 3개 초과 선택 막기. 3개 선택되면 "면접 시작"(랜덤 1 추가→`finalQuestions` 4개)→`/interview`. 연습 모드 안내 문구.
- **InterviewPage** (`/interview`) — 진행바(현재/4) · 현재 질문 카드(+competency) · `MicStatus` · `RecorderControls`(녹음 시작/정지/다시듣기) · "다음 질문" / 마지막엔 "분석하기"→`/result`. 권한 거부 시 빨강 + 안내. 녹음본은 로컬 state.
- 공통 컴포넌트: `FlowProgress`(업로드→설정→질문→면접 스텝퍼), `QuestionCard`, `MicStatus`(초록/빨강 점 + 라벨), `RecorderControls`.

## E. DESIGN.md 정합

- 전 화면 cream 캔버스(`bg-canvas`) 기반. 카드 `surface-card`, 강조 CTA만 coral scarce하게.
- 면접 화면의 녹음 컨트롤·마이크 상태는 제품 chrome 느낌으로 `surface-dark` 패널 가능.
- 헤드라인은 display 계열(Copernicus/serif 토큰) + 음수 트래킹, 본문 sans.
- 기존 `Button`/`Badge`/`TextInput`/`CategoryTab`/`FeatureCard`/`HeroBand`/`CtaBand`/`Footer` 재사용 — 신규 프리미티브 최소화.

## 의도적으로 뺀 것 (skipped)

- 실제 STT·백엔드 연동 — mock 유지, `useAnalysisReportQuery` queryFn 교체 지점 보존
- 실전 모드 질문 시퀀스(PRD §5.2) — 선택지만 노출, 흐름은 후속
- PDF/DOCX 텍스트 파싱 — TXT만, 그 외는 직접 입력 폴백
- 다시 도전 1회(FR-012) — 후속
- 영상 녹화/다시보기, 카메라·시선(P2)
- 결과 다중답변 종합·종합 점수 합산 — 결과는 기존 단일 리포트 유지
- 테스트 코드 — 사용자 요청으로 제외

## 검증 (end-to-end)

1. `npm install` (신규 런타임 의존성 없음 — MediaRecorder/FileReader는 브라우저 내장)
2. `npm run build` (`tsc -b` 타입체크 + 빌드) 통과, `npm run lint` 이슈 없음
3. `npm run dev` → 브라우저 육안:
   - `/`에서 시작 → 업로드(TXT 추출 또는 직접 입력) → 설정(직종/종류/모드) → 질문(3개 선택 + 랜덤 1) → 면접(마이크 권한·녹음·재생) → "분석하기" → `/result`까지 끊김 없이 연결
   - 마이크 권한 거부 시 빨강 상태·안내 표시
   - 창 줄여 모바일 1열로 자연스럽게 무너지는지
