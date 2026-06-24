from pydantic import BaseModel, Field


class RecommendedQuestion(BaseModel):
    id: str = Field(..., description="질문 id(q1, q2 …)", examples=["q1"])
    question: str = Field(..., description="면접 질문")
    competency: str = Field(..., description="평가 역량 태그 (예: 문제해결력)")
