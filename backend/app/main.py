from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analysis, interview, questions

# 비밀키는 루트 .env 단일 소스. backend/app/main.py → parents[2] = repo root.
# uvicorn을 backend/에서 띄워도(cwd=backend) 루트 .env를 읽게 경로를 명시한다.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

TAGS_METADATA = [
    {"name": "questions", "description": "이력서·자소서·인재상 기반 면접 질문 추천."},
    {"name": "analyses", "description": "면접 답변 오디오 비동기 분석 시작·조회(폴링)."},
    {"name": "interview", "description": "단일 오디오 전사 + 필러 분석."},
]

app = FastAPI(
    title="Speech Mirror API",
    description=(
        "음성 면접 답변을 분석하는 API. 질문 추천 → 답변 업로드 → 비동기 분석 → "
        "`GET /analyses/{id}` 폴링으로 세션 리포트를 받는 흐름이다."
    ),
    version="0.1.0",
    openapi_tags=TAGS_METADATA,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(questions.router)
app.include_router(analysis.router)
