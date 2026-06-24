# 면접 발화 분석 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 면접 답변 녹음들을 받아 Whisper·CLOVA 병렬 전사 + Gemini 검증·채점으로 답변별 리포트 N개와 세션 종합을 비동기로 반환하고, 프론트의 mock 결과 화면을 실제 폴링으로 교체한다.

**Architecture:** `POST /analyses`가 멀티파트 오디오를 받아 메모리 store에 `processing`으로 적재하고 id를 즉시 반환, FastAPI BackgroundTask가 답변마다 Whisper(필러·타임라인) ∥ CLOVA(정본 텍스트)를 동시 실행해 결정론적 발화 지표를 계산하고 Gemini로 두 전사를 검증·채점한 뒤 종합한다. 프론트는 `GET /analyses/{id}`를 2초 폴링한다.

**Tech Stack:** FastAPI · faster-whisper · CLOVA Speech(HTTP) · google-generativeai(gemini-2.0-flash) · pydantic. 프론트: React 19 · TanStack Query · Zustand · Axios.

## Global Constraints

- **검증 = 런타임 스모크.** pytest 등 테스트 프레임워크/테스트 파일(`test_*.py`)을 만들지 않는다. 검증은 `python -c` import·로직 스모크, `uvicorn` 기동 + `/docs` Swagger, 프론트 `npm run build`(tsc 타입체크) + 수동 클릭으로 한다. `requirements.txt`에 테스트용 의존성(pytest·httpx) 추가 금지.
- **구현자(implementer)는 커밋하지 않는다.** 컨트롤러가 리뷰 통과 후 명시 경로로만 커밋(`git add -A` 금지). 따라서 각 태스크에 커밋 스텝 없음.
- 커밋 메시지 형식(컨트롤러용): `<type> : <설명> #12` — 이슈 #12. **Co-Authored-By 태그 금지.**
- 작업 위치: 현재 피처 브랜치 in-place(워크트리 미사용). `backend/.env`·`backend/.env.example` 등 사용자 파일은 건드리지 않는다.
- 답변·주석은 한국어, 주석은 WHY 중심·과하지 않게, 주변 코드 스타일에 맞춘다.
- 불변(immutable) 패턴 우선 — 기존 객체 변형 대신 새 객체 반환. (단, `analysis_store`는 저장소 특성상 dict 보관.)
- 신규 런타임 의존성 없음(분석 엔진 `faster-whisper`·`google-generativeai`·`scipy`는 이미 설치/명시됨).
- 비밀키는 루트 `.env`(`CLOVA_INVOKE_URL`·`CLOVA_SECRET_KEY`·`GEMINI_API_KEY`). 코드에 하드코딩 금지.
- 발화 지표·점수 공식의 상수는 각 파일 상단 한 곳에 모은다(calibration 노브, `# ponytail` 주석).
- 백엔드 스모크는 `backend/`에서 `.venv` 활성화 후 실행(없으면 `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`).

---

## 파일 구조 (생성/수정)

**백엔드**
- Create `backend/app/services/analysis_store.py` — 메모리 잡 store.
- Create `backend/app/schemas/analysis.py` — pydantic 응답 모델.
- Create `backend/app/services/speech_metrics.py` — 단어 타임스탬프 → 발화 지표·타임라인(결정론적).
- Create `backend/app/services/whisper_stt.py` — Whisper 전사(모델 싱글톤) + 단어 평탄화.
- Create `backend/app/services/gemini_verify.py` — Gemini 검증·채점 + 폴백.
- Create `backend/app/services/analysis_pipeline.py` — 오케스트레이션 + 점수 합성 + 종합.
- Create `backend/app/routers/analysis.py` — `POST /analyses`, `GET /analyses/{id}`.
- Modify `backend/app/main.py` — analysis 라우터 등록.

**프론트엔드**
- Modify `frontend/src/features/analysis/types.ts` — `SessionReport`·`AnswerReport` 추가.
- Modify `frontend/src/features/interview/useRecorder.ts` — `audioBlob` 노출.
- Create `frontend/src/features/analysis/analysisApi.ts` — `submitAnalysis` 멀티파트 업로드.
- Modify `frontend/src/stores/useAnalysisStore.ts` — `sessionId`·`answerAudioUrls` 보관.
- Modify `frontend/src/pages/InterviewPage.tsx` — 답변 누적 + 업로드 + 이동.
- Modify `frontend/src/features/analysis/useAnalysisReportQuery.ts` — 실제 폴링 + SessionReport 어댑트.
- Modify `frontend/src/features/analysis/mockReport.ts` — `MOCK_SESSION` 추가.
- Modify `frontend/src/pages/ResultPage.tsx` — 종합 + 답변별 N개 렌더.

---

## Task 1: 메모리 잡 store

**Files:** Create `backend/app/services/analysis_store.py`

**Interfaces (Produces):**
- `create() -> str` (8자리 id, 상태 `processing`로 등록)
- `get(sid: str) -> dict | None`
- `complete(sid: str, report: dict) -> None` (status를 `completed`로 강제)
- `fail(sid: str, error: str) -> None`
- `reset() -> None`

- [ ] **Step 1: 구현**

```python
import uuid

# 메모리 단일 소스. 프로세스 재시작 시 소멸(데모 범위, DB 없음).
_store: dict[str, dict] = {}


def create() -> str:
    sid = uuid.uuid4().hex[:8]
    _store[sid] = {"id": sid, "status": "processing"}
    return sid


def get(sid: str) -> dict | None:
    return _store.get(sid)


def complete(sid: str, report: dict) -> None:
    # 새 dict로 교체(보관값 자체를 외부에서 변형하지 않게)
    _store[sid] = {**report, "id": sid, "status": "completed"}


def fail(sid: str, error: str) -> None:
    _store[sid] = {"id": sid, "status": "failed", "error": error}


def reset() -> None:
    _store.clear()
```

- [ ] **Step 2: 스모크 검증**

Run (backend/):
```bash
python -c "from app.services import analysis_store as s; s.reset(); sid=s.create(); assert s.get(sid)['status']=='processing'; s.complete(sid,{'overall':{}}); assert s.get(sid)['status']=='completed'; s.fail(sid,'x'); assert s.get(sid)=={'id':sid,'status':'failed','error':'x'}; assert s.get('none') is None; print('OK', sid)"
```
Expected: `OK <8자리>` 출력, 예외 없음.

---

## Task 2: 응답 스키마 (pydantic)

**Files:** Create `backend/app/schemas/analysis.py`

**Interfaces (Produces, 프론트 `AnalysisReport`와 필드명 1:1):**
- `RatePoint{t,wpm}` · `TimelineSegment{start,end,type,word?}` · `SpeechMetrics{speakingRate,silenceCount,longestSilence,speechRatio,fillerWords,rateSeries}`
- `ContentAxis{diagnosis,example}` · `ContentFeedback{logic,expertise,competencyFit}` · `Scores{content,delivery,stability}`
- `AnswerReport{question,questionCompetency,overallScore,scores,transcript,speechMetrics,timeline,contentFeedback,improvementPoints,degraded}`
- `Overall{overallScore,scores,summary,improvementPoints}` · `SessionReport{id,status,createdAt,updatedAt,overall,answers}`

- [ ] **Step 1: 구현**

```python
from pydantic import BaseModel


class RatePoint(BaseModel):
    t: float
    wpm: float


class TimelineSegment(BaseModel):
    start: float
    end: float
    type: str  # 'speech' | 'silence' | 'filler'
    word: str | None = None


class SpeechMetrics(BaseModel):
    speakingRate: float
    silenceCount: int
    longestSilence: float
    speechRatio: float
    fillerWords: dict[str, int]
    rateSeries: list[RatePoint]


class ContentAxis(BaseModel):
    diagnosis: str
    example: str


class ContentFeedback(BaseModel):
    logic: ContentAxis
    expertise: ContentAxis
    competencyFit: str


class Scores(BaseModel):
    content: int
    delivery: int
    stability: int


class AnswerReport(BaseModel):
    question: str
    questionCompetency: str
    overallScore: int
    scores: Scores
    transcript: str
    speechMetrics: SpeechMetrics
    timeline: list[TimelineSegment]
    contentFeedback: ContentFeedback
    improvementPoints: list[str]
    degraded: bool = False


class Overall(BaseModel):
    overallScore: int
    scores: Scores
    summary: str
    improvementPoints: list[str]


class SessionReport(BaseModel):
    id: str
    status: str  # 'completed'
    createdAt: str
    updatedAt: str
    overall: Overall
    answers: list[AnswerReport]
```

- [ ] **Step 2: 스모크 검증**

Run (backend/):
```bash
python -c "from app.schemas.analysis import SessionReport, SpeechMetrics; m=SpeechMetrics(speakingRate=130,silenceCount=1,longestSilence=1.2,speechRatio=0.9,fillerWords={'음':1},rateSeries=[{'t':0,'wpm':130}]); print('OK', m.fillerWords)"
```
Expected: `OK {'음': 1}`.

---

## Task 3: 발화 지표 계산 (결정론적)

**Files:** Create `backend/app/services/speech_metrics.py`

**Interfaces:**
- Consumes: `words: list[dict]`, 각 원소 `{"word": str, "start": float, "end": float}`.
- Produces: `count_fillers(words) -> dict[str,int]` · `compute_metrics(words, duration: float) -> dict` · `build_timeline(words, duration: float) -> list[dict]`

- [ ] **Step 1: 구현**

```python
import re
from collections import Counter

# calibration 노브 — 데모 수치는 여기만 수정
FILLER_WORDS = ["음", "어", "아", "저", "그", "이제", "약간", "뭔가", "사실", "그러니까", "그니까", "막", "뭐"]
SILENCE_GAP = 0.8   # 단어 간 간격이 이 이상이면 침묵
RATE_WINDOW = 8.0   # rateSeries 윈도우(초)


def _normalize(word: str) -> str:
    return re.sub(r"[^가-힣A-Za-z0-9]", "", word.strip())


def count_fillers(words: list[dict]) -> dict[str, int]:
    counts: Counter = Counter()
    for w in words:
        token = _normalize(w.get("word", ""))
        if token in FILLER_WORDS:
            counts[token] += 1
    return dict(counts)


def _silences(words: list[dict]) -> list[tuple[float, float]]:
    gaps = []
    for prev, cur in zip(words, words[1:]):
        gap = cur["start"] - prev["end"]
        if gap >= SILENCE_GAP:
            gaps.append((prev["end"], cur["start"]))
    return gaps


def compute_metrics(words: list[dict], duration: float) -> dict:
    fillers = count_fillers(words)
    silences = _silences(words)
    speak_time = sum(w["end"] - w["start"] for w in words)
    longest = max((b - a for a, b in silences), default=0.0)

    rate = round(len(words) / duration * 60, 1) if duration > 0 else 0.0
    series = _rate_series(words, duration)

    return {
        "speakingRate": rate,
        "silenceCount": len(silences),
        "longestSilence": round(longest, 2),
        "speechRatio": round(speak_time / duration, 2) if duration > 0 else 0.0,
        "fillerWords": fillers,
        "rateSeries": series,
    }


def _rate_series(words: list[dict], duration: float) -> list[dict]:
    if duration <= 0:
        return []
    points = []
    t = 0.0
    while t < duration:
        window_end = t + RATE_WINDOW
        n = sum(1 for w in words if t <= w["start"] < window_end)
        wpm = round(n / RATE_WINDOW * 60, 1)
        points.append({"t": round(t, 1), "wpm": wpm})
        t = window_end
    return points


def build_timeline(words: list[dict], duration: float) -> list[dict]:
    # 단어 구간은 speech, 필러는 filler, 단어 간 큰 간격은 silence.
    segments: list[dict] = []
    cursor = 0.0
    for w in words:
        if w["start"] - cursor >= SILENCE_GAP:
            segments.append({"start": round(cursor, 2), "end": round(w["start"], 2),
                             "type": "silence", "word": None})
        token = _normalize(w.get("word", ""))
        seg_type = "filler" if token in FILLER_WORDS else "speech"
        seg = {"start": round(w["start"], 2), "end": round(w["end"], 2), "type": seg_type, "word": None}
        if seg_type == "filler":
            seg["word"] = token
        segments.append(seg)
        cursor = w["end"]
    if duration - cursor >= SILENCE_GAP:
        segments.append({"start": round(cursor, 2), "end": round(duration, 2),
                         "type": "silence", "word": None})
    return segments
```

- [ ] **Step 2: 스모크 검증** (로직 정확성 — assert로 자체 확인, 테스트 파일은 만들지 않음)

Run (backend/):
```bash
python -c "
from app.services import speech_metrics as s
w=[{'word':'저는','start':0.0,'end':1.0},{'word':'음','start':1.0,'end':1.4},{'word':'개발자','start':2.4,'end':3.0}]
assert s.count_fillers(w)=={'음':1}
m=s.compute_metrics(w,3.0); assert m['silenceCount']==1 and round(m['longestSilence'],1)==1.0 and m['speakingRate']==60.0, m
tl=s.build_timeline(w,3.0); assert any(x['type']=='filler' and x['word']=='음' for x in tl) and any(x['type']=='silence' for x in tl), tl
print('OK', m)"
```
Expected: `OK {...}` 출력, assert 통과.

---

## Task 4: Whisper 전사 (모델 싱글톤 + 단어 평탄화)

**Files:** Create `backend/app/services/whisper_stt.py`

**Interfaces (Produces):**
- `transcribe(audio_path: str) -> dict` → `{"text": str, "words": list[dict], "duration": float}` (라이브 경로)
- `flatten_segments(segments) -> tuple[list[dict], list[str]]` (순수 함수)

- [ ] **Step 1: 구현**

```python
import logging
import os

logger = logging.getLogger(__name__)

# Windows symlink 경고 억제(기존 test_faster_whisper.py와 동일 의도)
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

# calibration 노브
MODEL_SIZE = "base"   # tiny=빠름·저정확, base=균형
_INITIAL_PROMPT = (
    "다음 음성에는 '음', '어', '아', '그', '이제' 같은 말버릇이나 "
    "필러 단어가 포함될 수 있으니 가능한 그대로 전사해 주세요."
)

_model = None


def _get_model():
    # 최초 1회만 로딩(다운로드 비용). 이후 재사용.
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        logger.info("Whisper 모델 로딩: %s (최초 실행 시 다운로드)", MODEL_SIZE)
        _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


def flatten_segments(segments) -> tuple[list[dict], list[str]]:
    words: list[dict] = []
    texts: list[str] = []
    for seg in segments:
        texts.append(seg.text)
        for w in seg.words or []:
            words.append({"word": w.word, "start": w.start, "end": w.end})
    return words, texts


def transcribe(audio_path: str) -> dict:
    # vad_filter=False: 침묵을 보존해야 침묵 지표를 계산할 수 있음(spec §11).
    segments, info = _get_model().transcribe(
        audio_path,
        language="ko",
        beam_size=5,
        vad_filter=False,
        word_timestamps=True,
        initial_prompt=_INITIAL_PROMPT,
    )
    words, texts = flatten_segments(segments)
    return {"text": " ".join(texts).strip(), "words": words, "duration": float(info.duration)}
```

- [ ] **Step 2: 스모크 검증** (모델 로딩 없이 순수 함수만 — 가짜 세그먼트로 평탄화 확인)

Run (backend/):
```bash
python -c "
from types import SimpleNamespace
from app.services import whisper_stt as w
seg=SimpleNamespace(text='저는 음', words=[SimpleNamespace(word='저는',start=0.0,end=1.0),SimpleNamespace(word='음',start=1.0,end=1.4)])
words,texts=w.flatten_segments([seg])
assert texts==['저는 음'] and words[0]=={'word':'저는','start':0.0,'end':1.0}, (words,texts)
print('OK', words)"
```
Expected: `OK [...]`. (실제 모델 전사는 Task 7 라이브 검증에서 확인.)

---

## Task 5: Gemini 검증·채점 + 폴백

**Files:** Create `backend/app/services/gemini_verify.py`

**Interfaces (Produces):**
- `verify_and_score(*, question, competency, clova_text, whisper_text, job="", interview_type="") -> dict`
  → `{"contentScore": int, "verifiedTranscript": str, "contentFeedback": {...}, "improvementPoints": list[str]}`
- `GEMINI_API_KEY` 미설정/실패 시 폴백 dict 반환(스키마 동일).

- [ ] **Step 1: 구현**

```python
import json
import logging
import os

logger = logging.getLogger(__name__)

MODEL = "gemini-2.0-flash"
FALLBACK_SCORE = 70  # calibration 노브: 키 없거나 실패 시 중립 점수

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "contentScore": {"type": "integer"},
        "verifiedTranscript": {"type": "string"},
        "contentFeedback": {
            "type": "object",
            "properties": {
                "logic": {
                    "type": "object",
                    "properties": {"diagnosis": {"type": "string"}, "example": {"type": "string"}},
                    "required": ["diagnosis", "example"],
                },
                "expertise": {
                    "type": "object",
                    "properties": {"diagnosis": {"type": "string"}, "example": {"type": "string"}},
                    "required": ["diagnosis", "example"],
                },
                "competencyFit": {"type": "string"},
            },
            "required": ["logic", "expertise", "competencyFit"],
        },
        "improvementPoints": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["contentScore", "verifiedTranscript", "contentFeedback", "improvementPoints"],
}


def _fallback(text: str) -> dict:
    return {
        "contentScore": FALLBACK_SCORE,
        "verifiedTranscript": text,
        "contentFeedback": {
            "logic": {"diagnosis": "자동 채점이 비활성화되어 논리 진단을 생성하지 못했습니다.",
                      "example": "결론을 먼저 말하고 근거를 덧붙여 보세요."},
            "expertise": {"diagnosis": "전문성 진단을 생성하지 못했습니다.",
                          "example": "구체적 사례와 수치를 더해 보세요."},
            "competencyFit": "역량 부합도 평가를 생성하지 못했습니다.",
        },
        "improvementPoints": ["답변 끝에 핵심 역량을 한 문장으로 정리하세요."],
    }


def _build_prompt(question, competency, clova_text, whisper_text, job, interview_type) -> str:
    return (
        "당신은 채용 면접관입니다. 한 답변을 평가하세요.\n"
        "두 STT 전사가 주어집니다. CLOVA는 정확한 텍스트, Whisper는 필러(음/어)를 포함합니다.\n"
        "둘을 대조해 가장 정확한 verifiedTranscript를 만들고, 내용을 0~100으로 채점하세요.\n\n"
        f"직종: {job or '(없음)'} / 면접종류: {interview_type or '(없음)'}\n"
        f"질문: {question}\n평가 역량: {competency}\n\n"
        f"[CLOVA 정본]\n{clova_text or '(없음)'}\n\n"
        f"[Whisper 전사]\n{whisper_text or '(없음)'}\n"
    )


def verify_and_score(*, question: str, competency: str, clova_text: str,
                     whisper_text: str, job: str = "", interview_type: str = "") -> dict:
    base_text = clova_text or whisper_text
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY 미설정 — 검증·채점 폴백")
        return _fallback(base_text)

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL)
        response = model.generate_content(
            _build_prompt(question, competency, clova_text, whisper_text, job, interview_type),
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": _RESPONSE_SCHEMA,
            },
        )
        data = json.loads(response.text)
        data["contentScore"] = max(0, min(100, int(data["contentScore"])))  # 점수 범위 보정
        if not data.get("verifiedTranscript"):
            data["verifiedTranscript"] = base_text
        return data
    except Exception as exc:  # noqa: BLE001 - 실패 시 폴백으로 데모 유지
        logger.warning("Gemini 검증·채점 실패 — 폴백: %s", exc)
        return _fallback(base_text)
```

- [ ] **Step 2: 스모크 검증** (키 없는 폴백 경로)

Run (backend/):
```bash
GEMINI_API_KEY= python -c "
from app.services import gemini_verify as g
o=g.verify_and_score(question='자기소개',competency='자기이해',clova_text='저는 개발자입니다',whisper_text='저는 음 개발자입니다')
assert isinstance(o['contentScore'],int) and o['verifiedTranscript']=='저는 개발자입니다'
assert set(o['contentFeedback'])=={'logic','expertise','competencyFit'}
print('OK', o['contentScore'])"
```
Expected: `OK 70`.

---

## Task 6: 파이프라인 (점수 합성 + 답변 분석 + 종합)

**Files:** Create `backend/app/services/analysis_pipeline.py`

**Interfaces:**
- Consumes: `speech_metrics`, `whisper_stt`, `clova_speech.transcribe_audio`, `gemini_verify`, `analysis_store`.
- Produces: `score_delivery(metrics) -> int` · `score_stability(metrics) -> int` · `analyze_answer(answer, context) -> dict` · `build_session(session_id, reports) -> dict` · `run_session(session_id, answers, context) -> None`
- `answer` dict 형태: `{"audio_path","filename","content_type","question","competency"}`

- [ ] **Step 1: 구현**

```python
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from app.services import analysis_store, clova_speech, gemini_verify, speech_metrics, whisper_stt

logger = logging.getLogger(__name__)

# calibration 노브 — 점수 가중치·이상범위
WEIGHTS = {"content": 0.5, "delivery": 0.25, "stability": 0.25}
IDEAL_WPM = (110, 160)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def score_delivery(metrics: dict) -> int:
    wpm = metrics["speakingRate"]
    if wpm < IDEAL_WPM[0]:
        rate_pen = min(40, (IDEAL_WPM[0] - wpm) * 0.8)
    elif wpm > IDEAL_WPM[1]:
        rate_pen = min(40, (wpm - IDEAL_WPM[1]) * 0.8)
    else:
        rate_pen = 0
    fillers = sum(metrics["fillerWords"].values())
    filler_pen = min(40, fillers * 4)  # 필러 1개당 4점 감점, 최대 40
    return max(0, round(100 - rate_pen - filler_pen))


def score_stability(metrics: dict) -> int:
    sil_pen = min(40, metrics["silenceCount"] * 5 + max(0.0, metrics["longestSilence"] - 2) * 8)
    ratio_pen = max(0.0, 0.8 - metrics["speechRatio"]) * 100  # speechRatio<0.8면 감점
    return max(0, round(100 - sil_pen - ratio_pen))


def _transcribe_both(answer: dict) -> tuple[dict, str, bool]:
    # Whisper(필러·타임라인) ∥ CLOVA(정본) 동시 실행. 한쪽 실패는 degraded로.
    degraded = False
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_whisper = ex.submit(whisper_stt.transcribe, answer["audio_path"])
        f_clova = ex.submit(
            clova_speech.transcribe_audio, answer["audio_path"], answer["filename"], answer["content_type"]
        )
        try:
            whisper_res = f_whisper.result()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Whisper 실패 — degraded: %s", exc)
            whisper_res = {"text": "", "words": [], "duration": 0.0}
            degraded = True
        try:
            clova_text = f_clova.result().get("text", "")
        except Exception as exc:  # noqa: BLE001
            logger.warning("CLOVA 실패 — degraded: %s", exc)
            clova_text = ""
            degraded = True
    return whisper_res, clova_text, degraded


def analyze_answer(answer: dict, context: dict) -> dict:
    whisper_res, clova_text, degraded = _transcribe_both(answer)
    words, duration = whisper_res["words"], whisper_res["duration"]

    metrics = speech_metrics.compute_metrics(words, duration)
    timeline = speech_metrics.build_timeline(words, duration)

    verdict = gemini_verify.verify_and_score(
        question=answer["question"],
        competency=answer["competency"],
        clova_text=clova_text,
        whisper_text=whisper_res["text"],
        job=context.get("job", ""),
        interview_type=context.get("interviewType", ""),
    )

    delivery = score_delivery(metrics)
    stability = score_stability(metrics)
    content = verdict["contentScore"]
    overall = round(content * WEIGHTS["content"] + delivery * WEIGHTS["delivery"] + stability * WEIGHTS["stability"])

    return {
        "question": answer["question"],
        "questionCompetency": answer["competency"],
        "overallScore": overall,
        "scores": {"content": content, "delivery": delivery, "stability": stability},
        "transcript": verdict["verifiedTranscript"] or clova_text or whisper_res["text"],
        "speechMetrics": metrics,
        "timeline": timeline,
        "contentFeedback": verdict["contentFeedback"],
        "improvementPoints": verdict["improvementPoints"],
        "degraded": degraded,
    }


def build_session(session_id: str, reports: list[dict]) -> dict:
    n = len(reports)
    avg = lambda key: round(sum(r["scores"][key] for r in reports) / n)
    overall_score = round(sum(r["overallScore"] for r in reports) / n)

    points: list[str] = []
    for r in reports:
        points.extend(r["improvementPoints"])
    points = list(dict.fromkeys(points))[:5]  # 중복 제거 후 상위 5개

    now = _now()
    return {
        "id": session_id,
        "status": "completed",
        "createdAt": now,
        "updatedAt": now,
        "overall": {
            "overallScore": overall_score,
            "scores": {"content": avg("content"), "delivery": avg("delivery"), "stability": avg("stability")},
            "summary": f"총 {n}개 답변 평균 {overall_score}점.",
            "improvementPoints": points,
        },
        "answers": reports,
    }


def run_session(session_id: str, answers: list[dict], context: dict) -> None:
    # BackgroundTask 진입점. 예기치 못한 전체 오류만 fail 처리.
    try:
        reports = [analyze_answer(a, context) for a in answers]
        analysis_store.complete(session_id, build_session(session_id, reports))
    except Exception as exc:  # noqa: BLE001
        logger.exception("세션 분석 실패: %s", session_id)
        analysis_store.fail(session_id, str(exc))
```

- [ ] **Step 2: 스모크 검증** (엔진을 가짜로 대체해 합성·종합 확인)

Run (backend/):
```bash
GEMINI_API_KEY= python -c "
from app.services import analysis_pipeline as p, analysis_store
# 점수 헬퍼
good={'speakingRate':135.0,'silenceCount':0,'longestSilence':0.0,'speechRatio':0.95,'fillerWords':{}}
assert p.score_delivery(good)==100 and p.score_stability(good)>=95
noisy={**good,'fillerWords':{'음':5}}; assert p.score_delivery(noisy)<100
# 엔진 가짜 주입
words=[{'word':'저는','start':0.0,'end':1.0},{'word':'음','start':1.0,'end':1.4},{'word':'개발자','start':2.4,'end':3.0}]
p.whisper_stt.transcribe=lambda path:{'text':'저는 음 개발자','words':words,'duration':3.0}
p.clova_speech.transcribe_audio=lambda path,fn,ct:{'text':'저는 개발자입니다'}
p.gemini_verify.verify_and_score=lambda **k:{'contentScore':90,'verifiedTranscript':'저는 개발자입니다','contentFeedback':{'logic':{'diagnosis':'d','example':'e'},'expertise':{'diagnosis':'d','example':'e'},'competencyFit':'적절'},'improvementPoints':['결론 먼저']}
analysis_store.reset(); sid=analysis_store.create()
p.run_session(sid,[{'audio_path':'x','filename':'x.webm','content_type':'audio/webm','question':'자기소개','competency':'자기이해'}],{'job':'백엔드','interviewType':'직무'})
r=analysis_store.get(sid)
assert r['status']=='completed' and r['answers'][0]['scores']['content']==90 and r['answers'][0]['transcript']=='저는 개발자입니다'
assert r['answers'][0]['speechMetrics']['fillerWords']=={'음':1} and r['overall']['overallScore']==r['answers'][0]['overallScore']
print('OK', r['overall'])"
```
Expected: `OK {...}` 출력, 모든 assert 통과.

---

## Task 7: 엔드포인트 + 라우터 등록 + 라이브 검증

**Files:** Create `backend/app/routers/analysis.py`, Modify `backend/app/main.py`

**Interfaces:**
- Consumes: `analysis_store`, `analysis_pipeline.run_session`, `SessionReport`.
- Produces: `POST /analyses`(multipart `files`,`meta`,`job?`,`interviewType?`) → `{id,status}`; `GET /analyses/{id}` → 상태별 응답.

- [ ] **Step 1: 라우터 구현** — `backend/app/routers/analysis.py`

```python
import json
import os
import tempfile

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.schemas.analysis import SessionReport
from app.services import analysis_pipeline, analysis_store

router = APIRouter(prefix="/analyses", tags=["analyses"])


def _parse_meta(meta: str, file_count: int) -> list[dict]:
    try:
        items = json.loads(meta)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "meta가 올바른 JSON 배열이 아닙니다.") from exc
    if not isinstance(items, list) or len(items) != file_count:
        raise HTTPException(400, "meta 길이와 업로드 파일 수가 일치하지 않습니다.")
    for it in items:
        if not it.get("question") or not it.get("competency"):
            raise HTTPException(400, "각 meta 항목에는 question·competency가 필요합니다.")
    return items


@router.post("", summary="면접 답변들 분석 시작", response_model=None)
async def create_analysis(
    background: BackgroundTasks,
    files: list[UploadFile] = File(..., description="답변 오디오들(webm), 질문 순서대로"),
    meta: str = Form(..., description='[{"question","competency"}, ...] — files와 같은 순서·길이'),
    job: str = Form("", description="직종(선택, 내용 채점 맥락)"),
    interviewType: str = Form("", description="면접 종류 id(선택)"),
):
    if not files:
        raise HTTPException(400, "분석할 오디오가 없습니다.")
    items = _parse_meta(meta, len(files))

    # 업로드 파일을 임시 저장(BackgroundTask가 끝나고 정리).
    answers: list[dict] = []
    tmp_paths: list[str] = []
    for upload, item in zip(files, items):
        suffix = os.path.splitext(upload.filename or "")[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await upload.read())
            tmp_paths.append(tmp.name)
        answers.append({
            "audio_path": tmp_paths[-1],
            "filename": upload.filename or "audio.webm",
            "content_type": upload.content_type,
            "question": item["question"],
            "competency": item["competency"],
        })

    sid = analysis_store.create()
    context = {"job": job, "interviewType": interviewType}

    def _job():
        try:
            analysis_pipeline.run_session(sid, answers, context)
        finally:
            for p in tmp_paths:
                try:
                    os.remove(p)
                except OSError:
                    pass

    background.add_task(_job)
    return {"id": sid, "status": "processing"}


@router.get("/{sid}", summary="분석 상태·결과 조회", response_model=None)
def get_analysis(sid: str):
    record = analysis_store.get(sid)
    if record is None:
        raise HTTPException(404, "해당 분석을 찾을 수 없습니다.")
    if record["status"] == "completed":
        return SessionReport.model_validate(record)
    return record  # processing / failed
```

- [ ] **Step 2: 라우터 등록** — `backend/app/main.py`

`from app.routers import interview, questions` → `from app.routers import analysis, interview, questions`
그리고 등록부에 추가: `app.include_router(analysis.router)`

- [ ] **Step 3: 스모크 — import + 라우트 등록 확인**

Run (backend/):
```bash
python -c "from app.main import app; paths={r.path for r in app.routes}; assert '/analyses' in paths and '/analyses/{sid}' in paths, paths; print('OK', sorted(p for p in paths if 'analy' in p))"
```
Expected: `OK ['/analyses', '/analyses/{sid}']`.

- [ ] **Step 4: 라이브 검증 (리스크 §11 실측)**

```bash
uvicorn app.main:app --port 8080
```
`http://localhost:8080/docs`에서 `POST /analyses` "Try it out" → 실제 webm 1개 + `meta=[{"question":"자기소개","competency":"자기이해"}]` 업로드 → `{id, processing}` → `GET /analyses/{id}` 폴링해 `completed` 확인.
**확인 포인트:** ① CLOVA가 webm/opus 정상 처리 여부(아니면 wav 트랜스코딩 필요), ② Whisper 침묵 지표 타당성. 문제 시 `whisper_stt`/`clova_speech` 조정 후 재검증. (길이 불일치 meta → 400, 없는 id → 404도 확인.)

---

## Task 8: 프론트 타입 (SessionReport·AnswerReport)

**Files:** Modify `frontend/src/features/analysis/types.ts`

- [ ] **Step 1: 타입 추가** (파일 끝에)

```ts
// 세션(면접 전체) 단위 분석 결과. 백엔드 SessionReport와 1:1.
export type SessionStatus = 'processing' | 'completed' | 'failed';

// 답변 1개 리포트 = 기존 단일 리포트에서 세션 레벨 필드 제외 + degraded.
// audioUrl은 서버가 모름 → 프론트가 로컬 blob URL을 인덱스로 주입.
export type AnswerReport = {
  question: string;
  questionCompetency: string;
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
  transcript: string;
  speechMetrics: SpeechMetrics;
  timeline: TimelineSegment[];
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
  degraded?: boolean;
};

export type SessionReport = {
  id: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  overall: {
    overallScore: number;
    scores: { content: number; delivery: number; stability: number };
    summary: string;
    improvementPoints: string[];
  };
  answers: AnswerReport[];
};
```

- [ ] **Step 2: 스모크** — `cd frontend && npm run build` → 타입 에러 없음(빌드 성공).

---

## Task 9: 녹음 Blob 노출 (`useRecorder`)

**Files:** Modify `frontend/src/features/interview/useRecorder.ts`

**Interfaces (Produces):** `useRecorder()` 반환에 `audioBlob: Blob | null` 추가. 기존 반환 유지.

- [ ] **Step 1: 구현**

`const [audioUrl, setAudioUrl] = useState<string | null>(null);` 아래에:
```ts
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
```
`recorder.onstop`에서 blob 생성 직후 `setAudioBlob(blob);`:
```ts
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
    };
```
`start()`의 `setAudioUrl(null);` 옆 + `reset()`의 `setAudioUrl(null);` 옆에 `setAudioBlob(null);` 추가.
반환 객체에 `audioBlob` 추가:
```ts
  return {
    micStatus,
    isRecording: micStatus === 'recording',
    audioUrl,
    audioBlob,
    requestMic,
    start,
    stop,
    reset,
  };
```

- [ ] **Step 2: 스모크** — `cd frontend && npm run build` → 빌드 성공.

---

## Task 10: 답변 누적 + 업로드 (`analysisApi` + `InterviewPage` + 세션 store)

**Files:** Create `frontend/src/features/analysis/analysisApi.ts`, Modify `frontend/src/stores/useAnalysisStore.ts`, `frontend/src/pages/InterviewPage.tsx`

**Interfaces:**
- `submitAnalysis(answers: AnswerUpload[]) -> Promise<{ id: string }>`, `AnswerUpload = { blob: Blob; question: string; competency: string }`
- `useAnalysisStore`: `sessionId: string`, `answerAudioUrls: string[]`, `setSession(id, audioUrls)` (기존 `analysisId`/`setAnalysisId` 유지).

- [ ] **Step 1: 업로드 API** — `frontend/src/features/analysis/analysisApi.ts`

```ts
import { apiClient } from '../../lib/apiClient';

export type AnswerUpload = {
  blob: Blob;
  question: string;
  competency: string;
};

// 답변 오디오들 + 질문/역량 메타를 멀티파트로 업로드해 분석을 시작한다.
// 추출·전사·채점은 FastAPI 담당. 프론트는 업로드만.
export async function submitAnalysis(answers: AnswerUpload[]): Promise<{ id: string }> {
  const form = new FormData();
  const meta = answers.map((a) => ({ question: a.question, competency: a.competency }));
  answers.forEach((a, i) => form.append('files', a.blob, `answer-${i}.webm`));
  form.append('meta', JSON.stringify(meta));

  const { data } = await apiClient.post<{ id: string; status: string }>('/analyses', form);
  return { id: data.id };
}
```

- [ ] **Step 2: 세션 store** — `frontend/src/stores/useAnalysisStore.ts` 교체

```ts
import { create } from 'zustand';

type AnalysisState = {
  analysisId: string;
  setAnalysisId: (analysisId: string) => void;
  // 세션 분석: 백엔드 id + 답변별 로컬 오디오 blob URL(재생용, 인덱스 정렬)
  sessionId: string;
  answerAudioUrls: string[];
  setSession: (sessionId: string, answerAudioUrls: string[]) => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisId: '',
  setAnalysisId: (analysisId) => set({ analysisId }),
  sessionId: '',
  answerAudioUrls: [],
  setSession: (sessionId, answerAudioUrls) => set({ sessionId, answerAudioUrls }),
}));
```

- [ ] **Step 3: InterviewPage 누적·업로드** — `frontend/src/pages/InterviewPage.tsx`

import 추가:
```ts
import { useRef, useState } from 'react';
import { submitAnalysis, type AnswerUpload } from '../features/analysis/analysisApi';
import { useAnalysisStore } from '../stores/useAnalysisStore';
```
(기존 `import { useState } from 'react';`가 있으면 `useRef` 합치기.)

컴포넌트 상단:
```ts
  const setSession = useAnalysisStore((s) => s.setSession);
  const answersRef = useRef<AnswerUpload[]>([]);
  const [submitting, setSubmitting] = useState(false);
```

`onNext` 교체 + 누적 헬퍼:
```ts
  function captureCurrent() {
    if (recorder.audioBlob) {
      answersRef.current.push({
        blob: recorder.audioBlob,
        question: current.question,
        competency: current.competency,
      });
    }
  }

  async function onNext() {
    captureCurrent();
    if (isLast) {
      setSubmitting(true);
      try {
        const collected = answersRef.current;
        const audioUrls = collected.map((a) => URL.createObjectURL(a.blob));
        const { id } = await submitAnalysis(collected);
        setSession(id, audioUrls);
        recorder.reset();
        navigate('/result');
      } catch {
        setSubmitting(false);
        alert('분석 요청에 실패했습니다. 백엔드 서버를 확인하세요.');
      }
    } else {
      recorder.reset();
      setIndex((i) => i + 1);
    }
  }
```

버튼:
```tsx
          <Button onClick={onNext} disabled={recorder.isRecording || submitting}>
            {isLast ? (submitting ? '분석 요청 중…' : '분석하기') : '다음 질문'}
          </Button>
```

- [ ] **Step 4: 스모크** — `cd frontend && npm run build` → 빌드 성공.

---

## Task 11: 실제 폴링 + SessionReport 어댑트

**Files:** Modify `frontend/src/features/analysis/useAnalysisReportQuery.ts`, `frontend/src/features/analysis/mockReport.ts`

**Interfaces:** `useAnalysisReportQuery(sessionId: string)` → `SessionReport`. `processing`이면 2초 폴링, 그 외 중단.

- [ ] **Step 1: mock 세션** — `frontend/src/features/analysis/mockReport.ts` 끝에

```ts
import type { SessionReport } from './types';

// 단일 mock 리포트를 1답변 세션으로 감싼 데모용 값.
export const MOCK_SESSION: SessionReport = {
  id: 'demo-session',
  status: 'completed',
  createdAt: MOCK_REPORT.createdAt,
  updatedAt: MOCK_REPORT.updatedAt,
  overall: {
    overallScore: MOCK_REPORT.overallScore,
    scores: MOCK_REPORT.scores,
    summary: '총 1개 답변 평균 81점.',
    improvementPoints: MOCK_REPORT.improvementPoints,
  },
  answers: [
    {
      question: MOCK_REPORT.question,
      questionCompetency: MOCK_REPORT.questionCompetency,
      overallScore: MOCK_REPORT.overallScore,
      scores: MOCK_REPORT.scores,
      transcript: MOCK_REPORT.transcript,
      speechMetrics: MOCK_REPORT.speechMetrics,
      timeline: MOCK_REPORT.timeline,
      contentFeedback: MOCK_REPORT.contentFeedback,
      improvementPoints: MOCK_REPORT.improvementPoints,
    },
  ],
};
```
(`import type { SessionReport }`가 이미 있으면 합치기.)

- [ ] **Step 2: 폴링 훅 교체** — `frontend/src/features/analysis/useAnalysisReportQuery.ts` 전체

```ts
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/apiClient';
import { USE_MOCK } from '../../lib/config';
import { MOCK_SESSION } from './mockReport';
import type { SessionReport } from './types';

async function getSession(id: string): Promise<SessionReport> {
  const { data } = await apiClient.get<SessionReport>(`/analyses/${id}`);
  return data;
}

// 세션 분석 결과 폴링. status가 processing이면 2초 간격 재요청, 그 외 중단.
export function useAnalysisReportQuery(sessionId: string) {
  return useQuery<SessionReport>({
    enabled: USE_MOCK || sessionId.length > 0,
    queryKey: ['sessionReport', sessionId],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return MOCK_SESSION;
      }
      return getSession(sessionId);
    },
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 2_000 : false),
  });
}
```

- [ ] **Step 3: 스모크** — `cd frontend && npm run build`. (ResultPage가 아직 단일 리포트 필드를 참조하면 Task 12에서 그린 달성. 본 태스크 변경 파일 자체의 타입 정합은 확인됨.)

---

## Task 12: 결과 화면 — 종합 + 답변별 N개 (`ResultPage`)

**Files:** Modify `frontend/src/pages/ResultPage.tsx`

**Interfaces:** `useAnalysisReportQuery(sessionId)` → `SessionReport`, `useAnalysisStore().answerAudioUrls`(인덱스별 로컬 오디오), 기존 `components/result/*` 재사용.

- [ ] **Step 1: 세션 렌더로 교체** — `frontend/src/pages/ResultPage.tsx` 전체

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
import type { AnswerReport } from '../features/analysis/types';
import { useAnalysisReportQuery } from '../features/analysis/useAnalysisReportQuery';
import { useAnalysisStore } from '../stores/useAnalysisStore';

export function ResultPage() {
  const sessionId = useAnalysisStore((s) => s.sessionId);
  const answerAudioUrls = useAnalysisStore((s) => s.answerAudioUrls);
  const { data: session, isLoading, error } = useAnalysisReportQuery(sessionId);

  if (isLoading || session?.status === 'processing') {
    return <main className="bg-canvas p-12 text-center text-muted">분석 결과 불러오는 중…</main>;
  }
  if (error || !session || session.status === 'failed') {
    return <main className="bg-canvas p-12 text-center text-error">결과를 불러오지 못했습니다.</main>;
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-display-sm text-ink">면접 종합 결과</h1>
          <p className="text-body-md text-muted">{session.overall.summary}</p>
        </header>
        <ScorePanel overallScore={session.overall.overallScore} scores={session.overall.scores} />
        <ImprovementList points={session.overall.improvementPoints} />

        <div className="flex flex-col gap-10">
          {session.answers.map((answer, i) => (
            <AnswerSection key={i} answer={answer} index={i} audioUrl={answerAudioUrls[i]} />
          ))}
        </div>
      </div>
    </main>
  );
}

function AnswerSection({
  answer,
  index,
  audioUrl,
}: {
  answer: AnswerReport;
  index: number;
  audioUrl?: string;
}) {
  const m = answer.speechMetrics;
  return (
    <section className="flex flex-col gap-6 border-t border-hairline pt-8">
      <p className="text-caption-uppercase text-muted">
        답변 {index + 1}
        {answer.degraded ? ' · 일부 분석 누락' : ''}
      </p>
      {audioUrl ? <AudioTimelinePlayer audioUrl={audioUrl} timeline={answer.timeline} /> : null}
      <ReportHeader question={answer.question} competency={answer.questionCompetency} />
      <TranscriptPanel transcript={answer.transcript} fillerWords={m.fillerWords} />
      <ScorePanel overallScore={answer.overallScore} scores={answer.scores} />
      <SpeedGraph rateSeries={m.rateSeries} averageWpm={m.speakingRate} />
      <div className="grid gap-6 sm:grid-cols-2">
        <SilenceCard
          silenceCount={m.silenceCount}
          longestSilence={m.longestSilence}
          speechRatio={m.speechRatio}
        />
        <FillerCard fillerWords={m.fillerWords} />
      </div>
      <ContentFeedbackPanel feedback={answer.contentFeedback} />
      <ImprovementList points={answer.improvementPoints} />
    </section>
  );
}
```

> 주의: 위 컴포넌트들의 실제 props 시그니처를 구현 전 확인하고 정확히 맞춘다(`components/result/*`). 불일치 시 컴포넌트가 아니라 이 호출부를 맞춘다(컴포넌트는 기존 단일 리포트와 동일 props).

- [ ] **Step 2: 스모크** — `cd frontend && npm run build && npm run lint` → 통과.

- [ ] **Step 3: 수동 E2E**

mock: `frontend/.env.local`에 `VITE_MOCK_DATA=true` → `npm run dev` → `/result` 방문 시 종합 + 답변1 렌더.
실서버: `VITE_MOCK_DATA=false` + 백엔드 기동 → `/upload`→`/setup`→`/questions`→`/interview` 녹음 후 "분석하기" → `/result`가 `processing`→`completed` 전환 + 답변별 카드 + 로컬 오디오 재생.

---

## Self-Review (작성자 점검)

- **Spec 커버리지:** §3 비동기+폴링(T7,T11) · §5 구조(T1–7) · §6 계약(T7) · §7 지표(T3) · §8 Gemini+폴백(T5) · §9 점수합성(T6) · §10 병렬(T6 `_transcribe_both`) · §11 degraded+리스크 실측(T6,T7) · §13 Swagger(T7) · §15 풀스택(T8–12). ✅
- **검증 규칙 일치:** 모든 태스크가 런타임 스모크/타입체크로 검증(테스트 파일 없음), pytest/httpx 미추가. ✅
- **타입 정합:** 백엔드 `AnswerReport`/`SessionReport` 필드 ↔ 프론트 동일 camelCase. `transcript`=Gemini `verifiedTranscript`. 점수 키 `content/delivery/stability` 일관. ✅
- **알려진 한계:** 프론트 단위 테스트는 러너 부재로 build+수동 검증으로 대체. 로컬 blob URL은 새로고침/딥링크 시 소실(데모 범위).
