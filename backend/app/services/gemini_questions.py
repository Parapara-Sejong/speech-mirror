import json
import logging
import os

from app.schemas.questions import RecommendedQuestion

logger = logging.getLogger(__name__)

MODEL = "gemini-3.1-flash-lite"
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
        if len(pairs) < QUESTION_COUNT:
            raise ValueError(f"GEMINI 응답 부족: {len(pairs)}개")
        return _with_ids(pairs)
    except Exception as exc:  # noqa: BLE001 - 실패 시 폴백으로 데모 유지
        logger.warning("GEMINI 질문 생성 실패 — 폴백 반환: %s", exc)
        return _fallback()
