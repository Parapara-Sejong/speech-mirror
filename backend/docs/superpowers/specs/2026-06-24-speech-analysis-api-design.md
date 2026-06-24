# 면접 발화 분석 API 설계 (POST /analyses · GET /analyses/{id})

- **이슈**: `.issues/20260624_기능추가_백엔드_FastAPI_질문생성_분석API.md` (2차 범위 = 발화 분석)
- **날짜**: 2026-06-24
- **선행**: `2026-06-24-question-generation-api-design.md`가 "발화 분석은 다음 사이클"로 보류한 그 사이클.
- **범위**: 발화 분석 API(백엔드) + 풀 스택 프론트 연동까지.

## 1. 목표

면접 답변 녹음(여러 개)을 받아 답변마다 **Whisper와 CLOVA를 병렬 전사**하고,
**Gemini가 두 전사를 검증하고 내용을 채점**하여, 답변별 리포트 N개 + 세션 종합을 반환한다.
발화 지표(말빠르기·필러·침묵)는 STT 타임스탬프에서 결정론적으로 계산한다.
프론트의 mock 분석(`useAnalysisReportQuery` → `MOCK_REPORT`)을 실제 폴링으로 교체한다.

### 역할 분담 (확정)

| 엔진 | 역할 | 근거 |
|------|------|------|
| **CLOVA** | 정본(clean) 텍스트 전사 | 한국어 텍스트 변환 품질이 좋음 |
| **Whisper** | 필러·타임라인 전문 (단어 타임스탬프) | "음/어" 등 필러를 잘 잡음 |
| **Gemini** | 두 전사 검증 + 내용 채점·피드백 | 교차검증 + 역량 기반 평가 |

## 2. 비범위 (YAGNI)

- 인증·다중 사용자 세션·DB 영속화 (상태는 메모리 dict, 프로세스 재시작 시 소멸)
- 오디오 서버 저장/재생 URL (오디오 blob은 클라이언트가 보유, `audioUrl`은 프론트 로컬 blob URL)
- 영상 분석, 실시간 스트리밍 전사
- 분산 작업 큐(Celery/Redis) — 단일 프로세스 BackgroundTask로 충분
- STT 정밀도·점수 공식 정밀 튜닝 (calibration 노브로 분리, 후속 개선)

## 3. 처리 방식 = 비동기 + 폴링

- `POST /analyses` → 메모리 store에 `{id, status:"processing"}` 저장하고 **id 즉시 반환**, FastAPI `BackgroundTasks`로 파이프라인 시작.
- 프론트는 `GET /analyses/{id}`를 2초 간격 폴링(기존 폴링 컨벤션 재사용), `completed`/`failed`면 중단.
- 상태 저장소는 메모리 dict 단일 소스(`analysis_store.py`). DB 없음.

## 4. 전체 흐름

```
[인터뷰] 질문별 녹음(webm) 누적 → 분석하기
   │ multipart 업로드 (files[] + meta JSON)
   ▼
POST /analyses ─ store[id]={status:processing} ─ id 반환 / BackgroundTask 시작
   │
   │ [답변마다]  Whisper ∥ CLOVA  (asyncio.to_thread로 동시)
   │     ├ CLOVA  → 정본 텍스트
   │     └ Whisper→ words[] → speech_metrics(필러·침묵·말빠르기·timeline)
   │     두 전사(+질문·역량·맥락) → Gemini → contentScore·contentFeedback·verifiedTranscript
   │     → 점수 합성 → AnswerReport
   ▼
모든 답변 종합(overall 평균·요약) → store[id]={status:completed, SessionReport}
   ▲
GET /analyses/{id} ◀── 프론트 폴링 (processing → completed → 렌더)
```

## 5. 백엔드 구조 (작은 파일·단일 책임)

```
backend/app/
  routers/analysis.py        # POST /analyses, GET /analyses/{id} (입출력 경계: 검증·위임)
  services/
    clova_speech.py          # (기존 재사용) 정본 전사
    whisper_stt.py           # 오디오 경로 → {text, words[]} (test_faster_whisper 포팅, 모델 싱글톤)
    speech_metrics.py        # words[] → SpeechMetrics + timeline (결정론적). 필러 로직 공유
    gemini_verify.py         # 질문+역량+두 전사 → 내용 채점·피드백·verifiedTranscript (+폴백)
    analysis_pipeline.py     # 답변별 오케스트레이션 + overall 집계 + 점수 합성
    analysis_store.py        # 메모리 dict 잡 store (create/get/complete/fail)
  schemas/analysis.py        # AnswerReport, SessionReport, 응답 모델 (pydantic)
  main.py                    # analysis 라우터 등록 (1줄 추가)
backend/test_analysis.py     # 외부키 없이 통과 (STT·Gemini mock)
```

각 unit은 평문/구조체로만 통신한다.
- `routers/analysis.py`: 무엇을 받고 무엇을 주는지만 안다. STT/Gemini를 모른다.
- `whisper_stt.py` / `clova_speech.py`: 오디오 → 전사. 점수를 모른다.
- `speech_metrics.py`: 단어 타임스탬프 → 지표. 엔진을 모른다.
- `gemini_verify.py`: 텍스트 → 채점. 파일/HTTP를 모른다.
- `analysis_pipeline.py`: 위를 조립. 라우터/store를 모른다(순수 함수 지향).

재사용: 기존 `clova_speech.transcribe_audio`, `filler_words`의 필러 판정 로직(→ `speech_metrics`로 이동·공유), `gemini_questions`의 구조화 출력 패턴. **신규 의존성 없음**(`faster-whisper`·`google-generativeai`·`scipy` 이미 `requirements.txt`).

## 6. API 계약

### 요청 — `POST /analyses` (multipart/form-data)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `files` | file[] | ✅ | 답변 오디오들(webm/opus). 질문 순서대로 |
| `meta` | string(JSON 배열) | ✅ | `[{ "question": "...", "competency": "..." }, ...]` — `files`와 같은 순서·길이 |
| `job` | string | 선택 | 직종 (내용 채점 맥락 보강) |
| `interviewType` | string | 선택 | 면접 종류 id |

- 검증: `files` 비어 있으면 `400`. `meta` JSON 파싱 실패 또는 길이 ≠ `files` 길이면 `400`(한국어 메시지).

### 응답 — `200 OK`

```json
{ "id": "a1b2c3", "status": "processing" }
```

### 조회 — `GET /analyses/{id}`

- `processing` → `{ "id", "status": "processing" }`
- `completed` → `SessionReport`(아래)
- `failed` → `{ "id", "status": "failed", "error": "..." }`
- 없는 id → `404`

### SessionReport

기존 `frontend/.../analysis/types.ts`의 `AnalysisReport`를 **답변 단위로 재사용**하고 세션 래퍼를 추가한다.

```ts
type SessionReport = {
  id: string;
  status: 'completed';
  createdAt: string;
  updatedAt: string;
  overall: {
    overallScore: number;                                  // 답변 overall 평균
    scores: { content: number; delivery: number; stability: number };
    summary: string;                                       // Gemini 한줄 총평(폴백 시 규칙 생성)
    improvementPoints: string[];                           // 세션 전반 개선점
  };
  answers: AnswerReport[];
};

// AnswerReport = 현 AnalysisReport에서 세션 레벨 필드(status/createdAt/updatedAt) 제외, 나머지 동일
type AnswerReport = {
  question: string;
  questionCompetency: string;
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
  transcript: string;            // Gemini verifiedTranscript (폴백 시 CLOVA 텍스트)
  speechMetrics: SpeechMetrics;  // 기존 타입 그대로
  timeline: TimelineSegment[];   // 기존 타입 그대로
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
  degraded?: boolean;            // 일부 엔진 실패 시 true (UI 표시용)
};
```

- `audioUrl`은 서버가 모름 → 응답에서 제외. 프론트가 보유한 로컬 blob URL을 답변 인덱스로 매핑해 재생.

## 7. 발화 지표 계산 (`speech_metrics.py`, 결정론적)

입력: Whisper `words[] = [{word, start, end}, ...]` + 오디오 길이.

- `fillerWords`: `filler_words.py` 판정 로직 공유(앞뒤 한글 경계 검사). 단어 타임스탬프 기반 → `timeline`의 `filler` 세그먼트도 생성.
- `speakingRate`: 총 단어수 / 발화시간 × 60 (wpm).
- `silenceCount`·`longestSilence`: 단어 간 간격이 임계(기본 0.8s) 이상이면 침묵 세그먼트.
- `speechRatio`: 발화시간 / 전체시간.
- `rateSeries`: 윈도우(기본 8s)별 wpm.
- 모든 임계·이상범위 상수는 **파일 상단 한 곳**(calibration 노브, `# ponytail` 주석).

## 8. Gemini 검증·채점 (`gemini_verify.py`)

- SDK·모델: `google-generativeai`, `gemini-2.0-flash` (기존과 동일).
- 입력: 질문, 역량(competency), CLOVA 정본, Whisper 텍스트, (선택) job·interviewType.
- **구조화 출력**(`response_mime_type=application/json` + `response_schema`):
  ```json
  {
    "contentScore": 0-100,
    "verifiedTranscript": "두 전사를 대조해 정리한 최종 전사",
    "contentFeedback": {
      "logic":     { "diagnosis": "...", "example": "..." },
      "expertise": { "diagnosis": "...", "example": "..." },
      "competencyFit": "..."
    },
    "improvementPoints": ["...", "..."]
  }
  ```
- **폴백 트리거**: `GEMINI_API_KEY` 미설정 또는 호출/파싱 실패 → 중립 피드백 + CLOVA 텍스트를 `verifiedTranscript`로, `contentScore`는 기본값(예: 70). 경고 로그만 남기고 흐름 유지(데모 안정).

## 9. 점수 합성 (`analysis_pipeline.py`, calibration 노브)

| 점수 | 산출 |
|------|------|
| `delivery` | 말빠르기(이상 110–160wpm) + 필러율(100단어당) → 0–100 |
| `stability` | 침묵(최장·횟수) + speechRatio → 0–100 |
| `content` | Gemini `contentScore` |
| answer `overallScore` | content 0.5 + delivery 0.25 + stability 0.25 |
| session `overallScore` | 답변 overall 평균 |
| session `summary`/`improvementPoints` | Gemini 총평(폴백 시 답변별 개선점 상위 N개 규칙 취합) |

- 가중치·이상범위는 한 곳에 상수로. 데모 수치 조정은 이 파일만 수정.

## 10. 병렬·성능

- **답변 내부**: Whisper(CPU 블로킹) ∥ CLOVA(HTTP 블로킹)를 `asyncio.to_thread` + `asyncio.gather`로 동시 실행.
- **답변 간**: 순차 처리(Whisper가 CPU 바운드라 과도 병렬 금지). 답변 수가 적어 충분.
- **Whisper 모델**: 모듈 레벨 싱글톤(`base`, `device=cpu`, `compute_type=int8`). 최초 1회 다운로드 비용 → 서버 기동/첫 요청 시 발생(로그로 안내).

## 11. 에러 처리 (답변 1개 실패가 세션 전체를 죽이지 않음)

- Whisper 실패 → CLOVA 기반 축약 metrics, `degraded:true`.
- CLOVA 실패 → Whisper 텍스트를 정본으로, `degraded:true`.
- Gemini 실패 → §8 폴백.
- 답변 전부 실패 등 예기치 못한 전체 오류만 `store.fail(id, error)` → `status:failed`.
- 입력 검증 실패 → `400` + 한국어 메시지. 없는 id 조회 → `404`.

### 구현 단계에서 검증 필요 (정직하게 명시)

1. **CLOVA가 webm/opus를 받는지** — 미지원이면 업로드 직후 wav 트랜스코딩(scipy 보유) 또는 프론트에서 포맷 변경. 실측 확인.
2. **Whisper `vad_filter`** — true면 침묵을 제거해 침묵 지표와 충돌. vad off + 세그먼트/단어 간격으로 침묵 산출(노브)로 회피, 실측 확인.

## 12. 환경변수 / 설정

- 비밀키는 루트 `.env`(`CLOVA_*`, `GEMINI_API_KEY`) — 기존 그대로, 추가 없음.
- 신규 의존성 없음.
- CORS: 기존 `main.py` 설정 재사용(프론트 origin 이미 허용).

## 13. Swagger

- `POST /analyses`·`GET /analyses/{id}`에 `summary`·`tags`·`response_model`·`Form(..., description=...)` 부여.
- 검증: `http://localhost:8080/docs`에서 multipart 폼·응답 스키마 확인 + "Try it out".

## 14. 테스트 (`backend/test_analysis.py`, 외부키 없이 통과)

1. `speech_metrics`: 합성 `words[]` → 말빠르기·필러·침묵·timeline 정확.
2. `analysis_store`: create → get(processing) → complete → get(completed) 수명주기.
3. `analysis_pipeline`: Whisper·CLOVA·Gemini를 mock으로 주입 → N답변 `SessionReport` + overall 합성 검증(점수 공식 포함).
4. `TestClient`: `POST /analyses`(mock 파이프라인) → `200 {processing}`, 처리 후 `GET` → `200 {completed}`. 길이 불일치 → `400`.

## 15. 프론트 연동 (풀 스택)

### 15.1 타입 (`features/analysis/types.ts` — 단일 진실)

- `AnalysisReport`를 답변 단위로 유지/재사용하고 `SessionReport`(overall + `answers`) 추가.
- API 계약 변경 시 이 파일을 함께 수정.

### 15.2 녹음 누적 (`InterviewPage` + `useRecorder`/`store`)

- 현재 `reset()`이 답변 blob을 폐기 → 질문 넘어갈 때 `{ audioBlob, question, competency }`를 store(또는 ref 배열)에 **누적**.
- 마지막 "분석하기" → 누적분으로 `POST /analyses` multipart 업로드 → 반환 `id`를 분석 store에 저장 → `/result`로 이동.

### 15.3 폴링 (`useAnalysisReportQuery`)

- mock 제거 → `GET /analyses/:id` 실제 호출. `status`가 `processing`이면 2초 폴링, 그 외 중단(기존 컨벤션).
- 응답을 `SessionReport`로 어댑트.

### 15.4 결과 화면 (`AnalysisPage`)

- 단일 리포트 → **세션 종합(overall) + 답변별 카드 N개** 렌더로 확장.
- 답변별 카드는 기존 단일 리포트 UI 컴포넌트 재사용(질문·점수·transcript·timeline·피드백). 오디오는 로컬 blob URL을 인덱스로 매핑.
- `degraded` 답변은 배지로 표시.

## 16. 구현 순서 (요약)

1. `analysis_store.py` → `speech_metrics.py`(+필러 공유) → `whisper_stt.py` → `gemini_verify.py`(폴백 먼저) → `analysis_pipeline.py` → `schemas/analysis.py` → `routers/analysis.py` → `main.py` 등록.
2. `test_analysis.py` 통과(키 없이).
3. 서버 기동 + `/docs` 수동 검증 + 실제 오디오로 webm/vad 리스크(§11) 확인.
4. 프론트: 타입 → 녹음 누적 → 업로드 → 폴링 → 결과 화면 → 전체 흐름 E2E 확인.
