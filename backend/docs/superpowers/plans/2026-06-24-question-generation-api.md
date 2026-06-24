# 질문 생성 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이력서·자소서·인재상 + 직종·면접종류·인재상 키워드를 받아 GEMINI로 면접 질문 6개를 생성하는 FastAPI 엔드포인트(`POST /questions/recommend`)를 만들고, 프론트 mock을 실제 호출로 교체한다.

**Architecture:** FastAPI 라우터가 multipart를 파싱·검증하고, `text_extract`(파일→평문)와 `gemini_questions`(텍스트→질문+폴백) 서비스에 위임한다. GEMINI 키 없거나 실패하면 canned 폴백 6개를 200으로 반환해 데모가 안 깨진다. 비밀키는 루트 `.env` 단일 소스.

**Tech Stack:** Python 3.13, FastAPI, pydantic v2, google-generativeai(gemini-2.0-flash), pypdf, python-docx, pytest. 프론트는 React 19 + axios.

## Global Constraints

- 엔드포인트 경로·필드명은 프론트 `frontend/src/features/interview/questionApi.ts`·`types.ts`와 1:1 일치 — 변경 금지.
- 응답은 `RecommendedQuestion[]` = `[{id, question, competency}]`, **정확히 6개**.
- GEMINI 모델: `gemini-2.0-flash`.
- 비밀키는 루트 `.env`(`GEMINI_API_KEY` 등). `app/main.py`에서 `load_dotenv(Path(__file__).resolve().parents[2] / ".env")`로 로드.
- 모든 백엔드 명령은 `backend/.venv` 활성화 상태에서 실행.
- **테스트 코드 작성 금지(사용자 지시).** 각 태스크의 "실패 테스트/pytest" 스텝은 건너뛰고, 대신 런타임 스모크 체크(import 확인·서버 기동·Swagger·타입체크)로 검증한다. `test_*.py` 파일을 만들지 않는다.
- **구현자는 커밋하지 않는다.** 코드만 작성하고 보고한다 — 커밋은 컨트롤러가 명시 경로로 수행(`git add -A` 금지).
- 커밋 메시지 형식: `<type> : <설명> #<이슈번호>`. 이슈는 `20260624_기능추가_백엔드_FastAPI_질문생성_분석API`. **Co-Authored-By 금지.**
- 발화 분석 관련 파일(`app/routers/interview.py`, `services/clova_speech.py`, `services/filler_words.py`, 프론트 `useAnalysisReportQuery.ts`)은 건드리지 않는다.
- 주석은 한국어, WHY 중심.

---

### Task 1: 프로젝트 셋업 (venv · 의존성 · main.py env/CORS)

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: 없음
- Produces: 루트 `.env`가 로드된 부팅 가능한 `app.main:app`. CORS가 `5173`/`5175` 허용.

- [ ] **Step 1: venv 생성 + 의존성 추가**

`backend/requirements.txt` 끝에 3줄 추가 (기존 줄은 유지):

```
google-generativeai
pypdf
python-docx
```

- [ ] **Step 2: venv 만들고 설치** (faster-whisper/scipy 포함이라 수 분 걸릴 수 있음)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

- [ ] **Step 3: main.py 수정 — 루트 .env 로드 + CORS origin**

`backend/app/main.py` 전체를 아래로 교체:

```python
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import interview

# 비밀키는 루트 .env 단일 소스. backend/app/main.py → parents[2] = repo root.
# uvicorn을 backend/에서 띄워도(cwd=backend) 루트 .env를 읽게 경로를 명시한다.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(title="Speech Mirror API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
```

- [ ] **Step 4: 부팅 검증**

Run:
```bash
cd backend && source .venv/bin/activate && python -c "from app.main import app; print('ok', [r.path for r in app.routes][:3])"
```
Expected: `ok [...]` 출력, ImportError 없음.

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/app/main.py
git commit -m "chore : 백엔드 셋업 - 루트 .env 로드·CORS·질문생성 의존성 #20260624"
```

---

### Task 2: 텍스트 추출 서비스 (`text_extract.py`)

**Files:**
- Create: `backend/app/services/text_extract.py`
- Test: `backend/test_text_extract.py`

**Interfaces:**
- Consumes: 없음
- Produces: `extract_text(filename: str, content: bytes) -> str` — PDF/DOCX/MD/TXT는 평문, 그 외·실패는 `""`.

- [ ] **Step 1: 실패 테스트 작성**

`backend/test_text_extract.py`:

```python
import io

from docx import Document

from app.services.text_extract import extract_text


def test_extract_txt():
    assert extract_text("a.txt", "안녕 이력서".encode("utf-8")) == "안녕 이력서"


def test_extract_md():
    assert extract_text("a.md", b"# title\nbody") == "# title\nbody"


def test_extract_docx_roundtrip():
    buf = io.BytesIO()
    doc = Document()
    doc.add_paragraph("자기소개서 내용")
    doc.save(buf)
    assert "자기소개서 내용" in extract_text("a.docx", buf.getvalue())


def test_extract_unknown_returns_empty():
    assert extract_text("a.png", b"\x89PNG") == ""
```

- [ ] **Step 2: 실패 확인**

Run: `cd backend && source .venv/bin/activate && pytest test_text_extract.py -v`
Expected: FAIL — `ModuleNotFoundError: app.services.text_extract`

- [ ] **Step 3: 구현**

`backend/app/services/text_extract.py`:

```python
import io
import logging
from pathlib import Path

from docx import Document
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text(filename: str, content: bytes) -> str:
    """업로드 파일 bytes에서 평문 추출. 알 수 없는 형식·추출 실패 시 빈 문자열."""
    ext = Path(filename).suffix.lower()
    try:
        if ext == ".pdf":
            return _from_pdf(content)
        if ext == ".docx":
            return _from_docx(content)
        if ext in (".txt", ".md"):
            return content.decode("utf-8", errors="ignore").strip()
    except Exception as exc:  # noqa: BLE001 - 추출 실패가 질문 생성 흐름을 막지 않게 한다
        logger.warning("텍스트 추출 실패 (%s): %s", filename, exc)
    return ""


def _from_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def _from_docx(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs).strip()
```

- [ ] **Step 4: 통과 확인**

Run: `cd backend && source .venv/bin/activate && pytest test_text_extract.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/text_extract.py backend/test_text_extract.py
git commit -m "feat : 업로드 파일 텍스트 추출 서비스(PDF/DOCX/MD/TXT) #20260624"
```

---

### Task 3: 응답 스키마 + GEMINI 질문 생성 서비스 (`schemas/questions.py`, `gemini_questions.py`)

**Files:**
- Create: `backend/app/schemas/__init__.py` (빈 파일)
- Create: `backend/app/schemas/questions.py`
- Create: `backend/app/services/gemini_questions.py`
- Test: `backend/test_gemini_questions.py`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `RecommendedQuestion(BaseModel)` — 필드 `id: str`, `question: str`, `competency: str`.
  - `generate_questions(*, job, interview_type, ideal_traits, resume, cover_letter, ideal_profile) -> list[RecommendedQuestion]` — 키 있으면 GEMINI, 없거나 실패 시 폴백 6개.
  - `build_prompt(job, interview_type, ideal_traits, resume, cover_letter, ideal_profile) -> str`.

- [ ] **Step 1: 실패 테스트 작성**

`backend/test_gemini_questions.py`:

```python
import app.services.gemini_questions as gq


def test_fallback_returns_six(monkeypatch):
    # 키를 지워 폴백 경로 강제(루트 .env가 키를 넣어둘 수 있으므로)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    result = gq.generate_questions(
        job="백엔드",
        interview_type="직무",
        ideal_traits=["도전정신"],
        resume="",
        cover_letter="",
        ideal_profile="",
    )
    assert len(result) == 6
    assert result[0].id == "q1"
    assert result[0].question and result[0].competency


def test_build_prompt_includes_inputs():
    prompt = gq.build_prompt("백엔드", "직무", ["협업·소통"], "이력서텍스트", "", "")
    assert "백엔드" in prompt
    assert "직무/역량" in prompt  # 면접종류 id→label 매핑 확인
    assert "협업·소통" in prompt
    assert "이력서텍스트" in prompt
```

- [ ] **Step 2: 실패 확인**

Run: `cd backend && source .venv/bin/activate && pytest test_gemini_questions.py -v`
Expected: FAIL — `ModuleNotFoundError: app.services.gemini_questions`

- [ ] **Step 3: 스키마 구현**

`backend/app/schemas/__init__.py`: 빈 파일 생성.

`backend/app/schemas/questions.py`:

```python
from pydantic import BaseModel, Field


class RecommendedQuestion(BaseModel):
    id: str = Field(..., examples=["q1"])
    question: str = Field(..., description="면접 질문")
    competency: str = Field(..., description="평가 역량 태그 (예: 문제해결력)")
```

- [ ] **Step 4: 서비스 구현**

`backend/app/services/gemini_questions.py`:

```python
import json
import logging
import os

from app.schemas.questions import RecommendedQuestion

logger = logging.getLogger(__name__)

MODEL = "gemini-2.0-flash"
QUESTION_COUNT = 6

# 면접종류 id → (label, desc). 프론트 types.ts의 INTERVIEW_TYPES와 동기화.
INTERVIEW_TYPES = {
    "인성": ("인성/태도", "가치관·조직 적합성"),
    "직무": ("직무/역량", "직무 지식·문제 해결력"),
    "PT": ("PT 면접", "발표력·논리력"),
    "상황": ("상황/롤플레잉", "업무 상황 대응력"),
    "압박": ("압박 면접", "스트레스 대응력"),
}

# 폴백 질문 풀(프론트 mockQuestions 포팅). 키 없거나 GEMINI 실패 시 사용.
_FALLBACK_POOL = [
    ("자신을 한 문장으로 소개해 주세요.", "자기이해"),
    ("가장 어려웠던 프로젝트와 그때의 역할은 무엇이었나요?", "문제해결력"),
    ("협업 중 갈등을 어떻게 해결했는지 사례를 들어 주세요.", "협업·소통"),
    ("최근에 새롭게 배운 기술이나 개념은 무엇인가요?", "학습민첩성"),
    ("실패했던 경험과 거기서 얻은 교훈을 말해 주세요.", "회복탄력성"),
    ("이 직무에 지원한 이유와 강점을 연결해 설명해 주세요.", "직무이해도"),
]


def _with_ids(pairs: list[tuple[str, str]]) -> list[RecommendedQuestion]:
    return [
        RecommendedQuestion(id=f"q{i + 1}", question=q, competency=c)
        for i, (q, c) in enumerate(pairs)
    ]


def _fallback() -> list[RecommendedQuestion]:
    return _with_ids(_FALLBACK_POOL[:QUESTION_COUNT])


def build_prompt(
    job: str,
    interview_type: str,
    ideal_traits: list[str],
    resume: str,
    cover_letter: str,
    ideal_profile: str,
) -> str:
    label, desc = INTERVIEW_TYPES.get(interview_type, (interview_type, ""))
    traits = ", ".join(ideal_traits) if ideal_traits else "(없음)"
    return (
        f"당신은 채용 면접관입니다. 아래 정보를 바탕으로 한국어 면접 질문 {QUESTION_COUNT}개를 만드세요.\n"
        f"각 질문에는 평가 역량 태그(competency)를 하나씩 붙이세요.\n\n"
        f"직종: {job}\n"
        f"면접 종류: {label} ({desc})\n"
        f"회사 인재상 키워드: {traits}\n\n"
        f"[이력서]\n{resume or '(없음)'}\n\n"
        f"[자기소개서]\n{cover_letter or '(없음)'}\n\n"
        f"[인재상 문서]\n{ideal_profile or '(없음)'}\n"
    )


def generate_questions(
    *,
    job: str,
    interview_type: str,
    ideal_traits: list[str],
    resume: str,
    cover_letter: str,
    ideal_profile: str,
) -> list[RecommendedQuestion]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY 미설정 — 폴백 질문 반환")
        return _fallback()

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL)
        prompt = build_prompt(
            job, interview_type, ideal_traits, resume, cover_letter, ideal_profile
        )
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "competency": {"type": "string"},
                        },
                        "required": ["question", "competency"],
                    },
                },
            },
        )
        items = json.loads(response.text)
        pairs = [(it["question"], it["competency"]) for it in items][:QUESTION_COUNT]
        if not pairs:
            raise ValueError("GEMINI 빈 응답")
        return _with_ids(pairs)
    except Exception as exc:  # noqa: BLE001 - 실패 시 폴백으로 데모 유지
        logger.warning("GEMINI 질문 생성 실패 — 폴백 반환: %s", exc)
        return _fallback()
```

- [ ] **Step 5: 통과 확인**

Run: `cd backend && source .venv/bin/activate && pytest test_gemini_questions.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas backend/app/services/gemini_questions.py backend/test_gemini_questions.py
git commit -m "feat : GEMINI 질문 생성 서비스 + 폴백 #20260624"
```

---

### Task 4: 엔드포인트 라우터 (`routers/questions.py`) + main.py 등록

**Files:**
- Create: `backend/app/routers/questions.py`
- Modify: `backend/app/main.py` (questions 라우터 등록)
- Test: `backend/test_questions_api.py`

**Interfaces:**
- Consumes: `extract_text`(Task 2), `RecommendedQuestion`·`generate_questions`(Task 3)
- Produces: `POST /questions/recommend` → `list[RecommendedQuestion]` (200), 검증 실패 시 400.

- [ ] **Step 1: 실패 테스트 작성**

`backend/test_questions_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_recommend_returns_six(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)  # 폴백 경로 강제
    resp = client.post(
        "/questions/recommend",
        data={"job": "백엔드", "interviewType": "직무", "idealTraits": '["도전정신"]'},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 6
    assert {"id", "question", "competency"} <= set(body[0].keys())


def test_recommend_accepts_text_source(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    resp = client.post(
        "/questions/recommend",
        data={"job": "백엔드", "interviewType": "직무", "resumeText": "이력서 본문"},
    )
    assert resp.status_code == 200


def test_recommend_requires_job(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    resp = client.post("/questions/recommend", data={"job": "", "interviewType": "직무"})
    assert resp.status_code == 400


def test_recommend_bad_traits_json_is_safe(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    resp = client.post(
        "/questions/recommend",
        data={"job": "백엔드", "interviewType": "직무", "idealTraits": "not-json"},
    )
    assert resp.status_code == 200  # 파싱 실패해도 빈 배열로 안전 처리
```

- [ ] **Step 2: 실패 확인**

Run: `cd backend && source .venv/bin/activate && pytest test_questions_api.py -v`
Expected: FAIL — `ModuleNotFoundError: app.routers.questions` (app import 단계에서)

- [ ] **Step 3: 라우터 구현**

`backend/app/routers/questions.py`:

```python
import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.questions import RecommendedQuestion
from app.services.gemini_questions import generate_questions
from app.services.text_extract import extract_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/questions", tags=["questions"])


async def _read_source(file: UploadFile | None, text: str | None) -> str:
    """소스 1종을 평문으로. 파일 우선 추출, 없으면 텍스트, 둘 다 없으면 빈 문자열."""
    if file is not None:
        return extract_text(file.filename or "", await file.read())
    return (text or "").strip()


@router.post(
    "/recommend",
    response_model=list[RecommendedQuestion],
    summary="이력서·자소서·인재상 기반 면접 질문 추천",
)
async def recommend(
    job: str = Form(..., description="직종 (예: 백엔드)"),
    interviewType: str = Form(..., description="면접 종류 id (예: 직무)"),
    idealTraits: str = Form("[]", description="인재상 키워드 JSON 배열"),
    resume: UploadFile | None = File(None, description="이력서 파일(PDF/DOCX/MD/TXT)"),
    coverLetter: UploadFile | None = File(None, description="자기소개서 파일"),
    idealProfile: UploadFile | None = File(None, description="인재상 파일"),
    resumeText: str | None = Form(None, description="이력서 텍스트(파일 대신)"),
    coverLetterText: str | None = Form(None, description="자기소개서 텍스트"),
    idealProfileText: str | None = Form(None, description="인재상 텍스트"),
) -> list[RecommendedQuestion]:
    if not job.strip() or not interviewType.strip():
        raise HTTPException(status_code=400, detail="job·interviewType는 필수입니다.")

    # 인재상 키워드: 파싱 실패해도 빈 배열로 안전 처리(요청 자체는 통과)
    try:
        traits = json.loads(idealTraits)
        if not isinstance(traits, list):
            traits = []
    except (json.JSONDecodeError, TypeError):
        traits = []

    resume_text = await _read_source(resume, resumeText)
    cover_text = await _read_source(coverLetter, coverLetterText)
    ideal_text = await _read_source(idealProfile, idealProfileText)

    return generate_questions(
        job=job,
        interview_type=interviewType,
        ideal_traits=traits,
        resume=resume_text,
        cover_letter=cover_text,
        ideal_profile=ideal_text,
    )
```

- [ ] **Step 4: main.py에 라우터 등록**

`backend/app/main.py`에서 import와 등록 두 줄 수정:

```python
from app.routers import interview, questions
```
그리고 파일 끝에 추가:
```python
app.include_router(questions.router)
```

- [ ] **Step 5: 통과 확인**

Run: `cd backend && source .venv/bin/activate && pytest -v`
Expected: PASS (전체 10 passed: text_extract 4 + gemini 2 + api 4)

- [ ] **Step 6: 서버 기동 + Swagger 수동 검증**

```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8080
```
브라우저로 `http://localhost:8080/docs` 접속 → `POST /questions/recommend`가 보이고, "Try it out"에서 `job=백엔드`·`interviewType=직무` 넣고 Execute → 200 + 질문 6개. (확인 후 Ctrl+C)

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/questions.py backend/app/main.py backend/test_questions_api.py
git commit -m "feat : 질문 생성 API POST /questions/recommend #20260624"
```

---

### Task 5: 프론트 연동 (`questionApi.ts` mock → 실제 호출)

**Files:**
- Modify: `frontend/src/features/interview/questionApi.ts`

**Interfaces:**
- Consumes: `POST /questions/recommend`(Task 4), `apiClient`(`frontend/src/lib/apiClient.ts`)
- Produces: `generateQuestions(input: QuestionGenInput) -> Promise<RecommendedQuestion[]>` (실제 백엔드 호출)

- [ ] **Step 1: questionApi.ts 교체**

`frontend/src/features/interview/questionApi.ts` 전체를 아래로 교체 (mockQuestions import 제거):

```typescript
import { apiClient } from '../../lib/apiClient';
import type { QuestionGenInput, RecommendedQuestion, SourceDoc } from './types';

// 이력서·자기소개서·인재상 기반 GEMINI 질문 생성.
// 추출(PDF/DOCX 포함)·GEMINI 호출은 FastAPI가 담당. 프론트는 원본 파일을 multipart로 업로드만 한다.
export async function generateQuestions(input: QuestionGenInput): Promise<RecommendedQuestion[]> {
  const form = new FormData();
  appendDoc(form, 'resume', input.resume);
  appendDoc(form, 'coverLetter', input.coverLetter);
  appendDoc(form, 'idealProfile', input.idealProfile);
  form.append('idealTraits', JSON.stringify(input.idealTraits));
  form.append('job', input.job);
  form.append('interviewType', input.interviewType);

  const { data } = await apiClient.post<RecommendedQuestion[]>('/questions/recommend', form);
  return data;
}

// 원본 파일이 있으면 파일을, 없으면 텍스트를 multipart에 싣는다.
function appendDoc(form: FormData, key: string, doc: SourceDoc) {
  if (doc.file) form.append(key, doc.file);
  else if (doc.text) form.append(`${key}Text`, doc.text);
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `cd frontend && npm run build`
Expected: 타입 에러 없이 빌드 성공. (`recommendQuestions`/`mockQuestions` 미사용 경고가 나면 정상 — 해당 파일은 이번 범위에서 삭제하지 않음, 아래 노트 참고)

- [ ] **Step 3: 프론트 .env.local 준비(없으면)**

```bash
cd frontend && [ -f .env.local ] || cp .env.example .env.local
```

- [ ] **Step 4: 엔드투엔드 수동 확인**

백엔드(`uvicorn app.main:app --port 8080`)와 프론트(`npm run dev`)를 띄우고, 셋업→업로드→질문 화면에서 질문 6개가 실제 응답으로 뜨는지 확인.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/interview/questionApi.ts
git commit -m "feat : 프론트 질문 생성 API 연동(mock 제거) #20260624"
```

---

## 정리 / 후속 노트

- `frontend/src/features/interview/mockQuestions.ts`는 연동 후 미사용이 된다. **이번 범위에서 삭제하지 않음** — 삭제하려면 사용자 허락 필요(프로젝트 규칙).
- 발화 분석 API는 다음 사이클에서 별도 spec→plan으로 진행.
- 루트 `.env`에 실제 `GEMINI_API_KEY`가 있어야 실제 생성이 동작. 없으면 폴백 6개로 데모 유지.

## Self-Review

- **Spec coverage:** §3 구조→Task 1~4 / §4 계약→Task 4 / §5 검증→Task 4 / §6 추출→Task 2 / §7 GEMINI+폴백→Task 3 / §8 env·CORS·deps→Task 1 / §9 Swagger→Task 4 Step 6 / §10 에러→Task 3·4 / §11 테스트→Task 2~4 / §12 프론트 연동→Task 5. 누락 없음.
- **Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. TBD/TODO 없음.
- **Type consistency:** `RecommendedQuestion(id/question/competency)`·`generate_questions(키워드 인자)`·`extract_text(filename, content)`·`build_prompt(...)` 시그니처가 Task 3 정의와 Task 4 사용처에서 일치. 프론트 `appendDoc`은 `${key}` / `${key}Text` 규칙으로 백엔드 Form 필드명과 일치.
