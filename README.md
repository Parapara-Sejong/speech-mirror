# Speech Mirror (말거울)

Speech Mirror는 이력서·직종 기반 모의면접을 진행하고, 답변 오디오를 분석해 말하기를 교정하는 AI 발화 코칭 서비스입니다. 영어 중심 스피치 코칭이나 내용 중심 모의면접과 달리, 한국어 발화의 말 속도·침묵·필러 단어를 핵심 지표로 다룹니다.

## 핵심 컨셉

> 당신의 발표·면접을 비추는 AI 거울

사용자는 이력서와 직종을 입력해 맞춤 질문으로 면접을 연습하고, 종료 후 자신의 답변을 다시 들으며 전사 텍스트, 말하기 지표, 한국어 필러 단어, 내용 피드백, 종합 점수를 확인합니다.

## 주요 기능

- 이력서 파일 업로드 및 텍스트 추출
- 직종·면접 종류 기반 질문 추천
- 연습/실전 면접 흐름
- 브라우저 오디오 녹음
- STT 전사와 다시 듣기
- 말 속도, 침묵, 발화 비율 분석
- 한국어 필러 단어(`음`, `어`, `그`, `약간` 등) 카운트와 위치 표시
- 논리 구조·직무 전문성 중심의 답변 피드백
- 종합 점수 게이지와 내용·전달력·안정성 가중치 기여도·균형 분석 시각화
- 개선 포인트, 타임라인·말속도 그래프 시각화

## MVP 범위

P0는 음성·텍스트 기반 발화 코칭에 집중합니다.

- 로그인/회원가입 없음
- DB 장기 저장 없음
- 결제 없음
- 영상/자세/시선 분석은 P2 확장
- 모범답안 대필 기능 없음

## 기술 스택

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- TanStack Query
- Zustand
- Axios
- Vitest (단위 테스트)

### Backend

- FastAPI
- Pydantic
- python-multipart
- CLOVA Speech 또는 faster-whisper
- Google Generative AI
- pypdf, python-docx

## 프로젝트 구조

```text
.
├── PRD.md                  # 제품 요구사항 문서
├── backend/                # FastAPI API 서버와 음성 분석 실험 코드
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   └── requirements.txt
└── frontend/               # React + Vite 클라이언트
    ├── src/pages/
    ├── src/components/
    ├── src/features/
    └── src/constants/
```

## 실행 방법

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

루트 `.env`에 필요한 API 키를 설정합니다.

```env
GEMINI_API_KEY=...
CLOVA_INVOKE_URL=...
CLOVA_SECRET_KEY=...
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

`frontend/.env.local`에서 백엔드 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 주요 화면

- `/` — 홈
- `/upload` — 이력서 업로드
- `/setup` — 직종·면접 설정
- `/questions` — 추천 질문 선택
- `/interview` — 모의면접 진행
- `/result` — 분석 결과 리포트
- `/pricing` — 플랜 구조 UI
- `/showcase` — 디자인 시스템 쇼케이스

## API 초안

PRD 기준 목표 API입니다.

| 기능               | Method | Endpoint                            |
| ------------------ | ------ | ----------------------------------- |
| 이력서 업로드      | POST   | `/resume/upload`                    |
| 질문 추천          | POST   | `/questions/recommend`              |
| 면접 세션 생성     | POST   | `/interview/session`                |
| 질문 조회          | GET    | `/interview/{session_id}/questions` |
| 답변 오디오 업로드 | POST   | `/interview/answer`                 |
| 분석 실행          | POST   | `/analysis/run`                     |
| 분석 결과 조회     | GET    | `/analysis/{analysis_id}`           |
| 꼬리 질문(P2)      | POST   | `/interview/followup`               |

## 개발 명령어

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm run test
npm run format
```

Backend:

```bash
cd backend
source .venv/bin/activate
python -c "from app.main import app; print(app.title)"
```

## 제품 방향

Speech Mirror는 답변을 대신 써주는 서비스가 아닙니다. 사용자가 직접 말한 답변을 기준으로 말하기 전달력과 답변 품질을 진단해, 다음 답변을 더 명확하게 만들도록 돕는 코칭 도구입니다.
