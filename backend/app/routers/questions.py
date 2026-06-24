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
    job: str = Form("", description="직종 (예: 백엔드)"),
    interviewType: str = Form("", description="면접 종류 id (예: 직무)"),
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
