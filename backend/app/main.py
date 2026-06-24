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
