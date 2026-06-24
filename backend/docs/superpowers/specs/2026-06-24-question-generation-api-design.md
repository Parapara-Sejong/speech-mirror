# 질문 생성 API 설계 (POST /questions/recommend)

- **이슈**: `.issues/20260624_기능추가_백엔드_FastAPI_질문생성_분석API.md` (1차 범위)
- **날짜**: 2026-06-24
- **범위**: 질문 생성 API만. 발화 분석 API는 별도 사이클(다음 spec)에서 진행.

## 1. 목표

이력서·자기소개서·인재상(파일/텍스트) + 직종·면접종류·인재상 키워드를 받아,
GEMINI로 평가 역량 태그가 포함된 맞춤 면접 질문 6개를 생성해 반환한다.
프론트의 mock 시임(`questionApi.ts`)을 실제 호출로 교체해 데모가 진짜 입력으로 동작하게 한다.

## 2. 비범위 (YAGNI)

- 발화 분석(STT·리포트·폴링) — 다음 사이클
- 영상 분석, 다중 사용자 세션, 인증, DB 영속화
- STT 정밀도 튜닝
- 질문 생성 결과 캐싱/저장

## 3. 구조 (작은 파일 분리, 단일 책임)

```
backend/app/
  main.py                        # (기존) 루트 .env 로드 + CORS + questions 라우터 등록
  routers/questions.py           # 엔드포인트: multipart 파싱 + 입력 검증 + 위임
  services/text_extract.py       # 파일 bytes → 평문 (PDF/DOCX/MD/TXT)
  services/gemini_questions.py   # 프롬프트 빌드 + GEMINI 호출 + mock 폴백
  schemas/questions.py           # RecommendedQuestion 응답 모델 (pydantic)
backend/test_questions.py        # 추출·폴백·엔드포인트 검증 (GEMINI 키 없이 통과)
```

각 unit은 평문 텍스트로만 통신한다.
- `routers/questions.py`: 입출력 경계. 무엇을 받고 무엇을 주는지만 안다.
- `text_extract.py`: 파일 → 텍스트. GEMINI를 모른다.
- `gemini_questions.py`: 텍스트 → 질문. 파일/HTTP를 모른다.

## 4. API 계약

프론트 `features/interview/questionApi.ts` 스텁 및 `types.ts`의 `QuestionGenInput`·`RecommendedQuestion`과 1:1로 맞춘다.

### 요청 — `POST /questions/recommend` (multipart/form-data)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `resume` | file | 선택 | 이력서 원본 파일 (PDF/DOCX/MD/TXT) |
| `coverLetter` | file | 선택 | 자기소개서 원본 파일 |
| `idealProfile` | file | 선택 | 인재상 원본 파일 |
| `resumeText` | string | 선택 | 이력서 텍스트 (파일 대신) |
| `coverLetterText` | string | 선택 | 자기소개서 텍스트 |
| `idealProfileText` | string | 선택 | 인재상 텍스트 |
| `idealTraits` | string(JSON 배열) | 선택 | 인재상 키워드 칩, 예 `["도전정신","협업·소통"]` |
| `job` | string | **필수** | 직종 (예: "백엔드") |
| `interviewType` | string | **필수** | 면접 종류 id (예: "직무") |

- 소스별로 파일 **또는** 텍스트 중 하나가 온다(프론트 `appendDoc` 규칙). 둘 다 없어도 됨.
- 파일이 오면 백엔드가 텍스트를 추출한다. 텍스트가 오면 그대로 사용.

### 응답 — `200 OK`

```json
[
  { "id": "q1", "question": "...", "competency": "문제해결력" },
  ...
]
```

- `RecommendedQuestion[]`, **6개** 반환 (프론트가 최대 3개 선택 + 미선택 중 1개 랜덤 → 여유 필요).
- `id`는 백엔드가 `q1..q6` 부여. GEMINI는 `question`·`competency`만 생성.

## 5. 입력 검증 (경계)

- `job`·`interviewType`가 비어 있으면 `400` (명확한 한국어 메시지).
- `idealTraits` JSON 파싱 실패 시 빈 배열로 안전 처리(요청 자체는 통과).
- 소스 파일/텍스트는 전부 선택 — 없으면 직종·면접종류·인재상 키워드만으로 생성.
- 파일 크기/형식 제한은 1차 범위 밖(데모). 알 수 없는 확장자는 추출 생략.

## 6. 텍스트 추출 (`text_extract.py`)

확장자(또는 content-type) 기준 분기:

| 형식 | 라이브러리 |
|------|-----------|
| PDF | `pypdf` |
| DOCX | `python-docx` |
| MD / TXT | utf-8 디코드 |
| 그 외 | 빈 문자열 반환(무시) |

- 순수 파이썬 의존성, 가볍다.
- 추출 실패(손상 파일 등)는 빈 문자열로 처리하고 로그만 남긴다 — 생성 흐름을 막지 않는다.

## 7. GEMINI 연동 + 폴백 (`gemini_questions.py`)

- SDK: `google-generativeai`
- 모델: `gemini-2.0-flash` (빠르고 저렴, 현행)
- **구조화 출력**: `response_mime_type="application/json"` + 응답 스키마로 `[{question, competency}]` 강제 → 파싱 안정.
- 프롬프트(한국어): 직종 + 면접종류(label·desc) + 인재상 키워드 + 추출 텍스트(이력서/자소서/인재상)를 넣어, 맞춤 질문 6개와 각 질문의 평가 역량 태그를 요청.
- **폴백 트리거**: `GEMINI_API_KEY` 미설정 **또는** GEMINI 호출/파싱 실패.
  - 직종·면접종류 기반 canned 질문 6개 반환 (프론트 `mockQuestions` 최소 포팅).
  - 경고 로그를 남기되 사용자 흐름은 정상 응답(200)으로 유지.

## 8. 환경변수 / 설정

- **백엔드 비밀키**: 루트 `.env` (`CLOVA_*`, `GEMINI_API_KEY`). 이미 존재, gitignore됨.
  - `app/main.py`에서 루트 경로 명시 로드:
    `load_dotenv(Path(__file__).resolve().parents[2] / ".env")`
    → `uvicorn`을 `backend/`에서 실행해도 루트 `.env`를 읽는다.
- **프론트 서버주소**: `frontend/.env.local`(`VITE_API_BASE_URL=http://localhost:8080`).
  Vite 특성상 자기 폴더 `.env`만 읽으므로 분리 불가피. `.env.example` 복사만 하면 됨.
- `requirements.txt`에 추가: `google-generativeai`, `pypdf`, `python-docx`.
- **CORS**: 이슈대로 `http://localhost:5173`·`http://localhost:5175` 명시 허용으로 변경.

## 9. Swagger

- FastAPI가 `/docs`(Swagger UI)·`/redoc`·`/openapi.json`을 자동 제공 — 별도 구축 없음.
- 쓸 만하게: 엔드포인트에 `response_model`(`RecommendedQuestion`), `summary`, `tags`, multipart `Form(..., description=...)` 필드 설명을 부여.
- 검증: 서버 기동 후 `http://localhost:8080/docs`에서 폼·응답 스키마 확인 + "Try it out" 동작.

## 10. 에러 처리

- 입력 검증 실패 → `400` + 한국어 메시지.
- GEMINI 실패 → 에러를 사용자에게 전파하지 않고 **폴백 200**(데모 안정).
- 추출 실패 → 해당 소스만 빈 텍스트, 200 유지.
- 예기치 못한 서버 오류만 `500`.

## 11. 테스트 (`backend/test_questions.py`)

GEMINI 키 없이 전부 통과해야 한다:
1. txt/md 텍스트 추출 정상 동작.
2. 키 없을 때 폴백이 질문 6개 반환.
3. `TestClient`로 `POST /questions/recommend` → `200` + 6개 응답(폴백 경로).

## 12. 프론트 연동 (분리 가능한 마지막 단계)

- `features/interview/questionApi.ts`의 mock 분기를 multipart axios 호출로 교체(스텁 주석 활성화).
- `apiClient`(baseURL=`VITE_API_BASE_URL`) 사용.
- 발화 분석 관련 파일(`useAnalysisReportQuery.ts` 등)은 **건드리지 않는다**.

## 13. 구현 순서(요약)

1. `backend/.venv` 생성 → `requirements.txt` 설치.
2. `main.py` 루트 `.env` 로드 + CORS origin 수정.
3. `text_extract.py` → `gemini_questions.py`(폴백 먼저) → `schemas` → `routers/questions.py`.
4. `test_questions.py` 통과 확인.
5. 서버 기동 + `/docs`에서 수동 검증.
6. 프론트 `questionApi.ts` 연동 + 실제 흐름 확인.
