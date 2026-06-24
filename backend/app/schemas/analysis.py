from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RatePoint(BaseModel):
    t: float = Field(..., description="구간 시작 시각(초)")
    wpm: float = Field(..., description="해당 구간 말속도(분당 단어 수)")


class TimelineSegment(BaseModel):
    start: float = Field(..., description="구간 시작(초)")
    end: float = Field(..., description="구간 종료(초)")
    type: Literal["speech", "silence", "filler"] = Field(..., description="구간 유형")
    word: str | None = Field(None, description="filler일 때만 해당 필러 단어")


class SpeechMetrics(BaseModel):
    speakingRate: float = Field(..., description="평균 말속도(분당 단어 수)")
    silenceCount: int = Field(..., description="침묵(0.8초 이상 공백) 횟수")
    longestSilence: float = Field(..., description="최장 침묵 길이(초)")
    speechRatio: float = Field(..., description="전체 길이 중 발화 비율(0~1)")
    fillerWords: dict[str, int] = Field(..., description="필러 단어별 개수")
    rateSeries: list[RatePoint] = Field(..., description="구간별 말속도 시계열")


class ContentAxis(BaseModel):
    diagnosis: str = Field(..., description="진단")
    example: str = Field(..., description="개선 예시 문장")


class ContentFeedback(BaseModel):
    logic: ContentAxis = Field(..., description="논리 구성 피드백")
    expertise: ContentAxis = Field(..., description="전문성 피드백")
    competencyFit: str = Field(..., description="평가 역량 부합도 코멘트")


class Scores(BaseModel):
    content: int = Field(..., description="내용 점수(0~100, Gemini)")
    delivery: int = Field(..., description="전달력 점수(0~100, 규칙 기반)")
    stability: int = Field(..., description="안정성 점수(0~100, 규칙 기반)")


class AnswerReport(BaseModel):
    question: str = Field(..., description="질문")
    questionCompetency: str = Field(..., description="평가 역량 태그")
    overallScore: int = Field(..., description="답변 종합 점수(가중 합성)")
    scores: Scores
    transcript: str = Field(..., description="검증된 전사")
    speechMetrics: SpeechMetrics
    timeline: list[TimelineSegment] = Field(..., description="발화/침묵/필러 타임라인")
    contentFeedback: ContentFeedback
    improvementPoints: list[str] = Field(..., description="개선점")
    degraded: bool = Field(False, description="STT 한쪽 실패 시 true")


class Overall(BaseModel):
    score: int = Field(..., description="세션 종합 점수(답변 평균)")
    scores: Scores
    summary: str = Field(..., description="종합 요약 문구")
    improvementPoints: list[str] = Field(..., description="중복 제거 상위 개선점")


class SessionReport(BaseModel):
    id: str = Field(..., description="분석 세션 id(8자리)")
    status: Literal["completed"] = Field(..., description="완료 상태")
    createdAt: str = Field(..., description="생성 시각(ISO8601)")
    updatedAt: str = Field(..., description="갱신 시각(ISO8601)")
    overall: Overall
    answers: list[AnswerReport] = Field(..., description="답변별 상세 리포트")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4",
                "status": "completed",
                "createdAt": "2026-06-24T10:00:00+00:00",
                "updatedAt": "2026-06-24T10:00:20+00:00",
                "overall": {
                    "score": 72,
                    "scores": {"content": 75, "delivery": 70, "stability": 68},
                    "summary": "총 1개 답변 평균 72점.",
                    "improvementPoints": ["결론을 먼저 말하고 근거를 덧붙이세요."],
                },
                "answers": [
                    {
                        "question": "자신을 한 문장으로 소개해 주세요.",
                        "questionCompetency": "자기이해",
                        "overallScore": 72,
                        "scores": {"content": 75, "delivery": 70, "stability": 68},
                        "transcript": "저는 문제 해결을 좋아하는 백엔드 개발자입니다.",
                        "speechMetrics": {
                            "speakingRate": 132.0,
                            "silenceCount": 2,
                            "longestSilence": 1.2,
                            "speechRatio": 0.88,
                            "fillerWords": {"음": 1},
                            "rateSeries": [{"t": 0.0, "wpm": 130.0}],
                        },
                        "timeline": [
                            {"start": 0.0, "end": 3.5, "type": "speech", "word": None}
                        ],
                        "contentFeedback": {
                            "logic": {
                                "diagnosis": "결론이 명확합니다.",
                                "example": "근거를 한 문장 더 붙여 보세요.",
                            },
                            "expertise": {
                                "diagnosis": "직무 연결이 적절합니다.",
                                "example": "구체적 수치를 더하세요.",
                            },
                            "competencyFit": "자기이해 역량에 부합합니다.",
                        },
                        "improvementPoints": ["결론을 먼저 말하고 근거를 덧붙이세요."],
                        "degraded": False,
                    }
                ],
            }
        }
    )


class AnalysisAccepted(BaseModel):
    id: str = Field(..., description="분석 세션 id(이후 조회·폴링에 사용)")
    status: Literal["processing"] = Field(..., description="분석 시작됨")
