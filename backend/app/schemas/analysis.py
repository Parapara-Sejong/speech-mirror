from pydantic import BaseModel


class RatePoint(BaseModel):
    t: float
    wpm: float


class TimelineSegment(BaseModel):
    start: float
    end: float
    type: str  # 'speech' | 'silence' | 'filler'
    word: str | None = None


class SpeechMetrics(BaseModel):
    speakingRate: float
    silenceCount: int
    longestSilence: float
    speechRatio: float
    fillerWords: dict[str, int]
    rateSeries: list[RatePoint]


class ContentAxis(BaseModel):
    diagnosis: str
    example: str


class ContentFeedback(BaseModel):
    logic: ContentAxis
    expertise: ContentAxis
    competencyFit: str


class Scores(BaseModel):
    content: int
    delivery: int
    stability: int


class AnswerReport(BaseModel):
    question: str
    questionCompetency: str
    overallScore: int
    scores: Scores
    transcript: str
    speechMetrics: SpeechMetrics
    timeline: list[TimelineSegment]
    contentFeedback: ContentFeedback
    improvementPoints: list[str]
    degraded: bool = False


class Overall(BaseModel):
    score: int
    scores: Scores
    summary: str
    improvementPoints: list[str]


class SessionReport(BaseModel):
    id: str
    status: str  # 'completed'
    createdAt: str
    updatedAt: str
    overall: Overall
    answers: list[AnswerReport]
