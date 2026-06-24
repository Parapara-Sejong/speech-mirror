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
