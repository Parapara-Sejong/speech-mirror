from pydantic import BaseModel, Field


class FillerOccurrence(BaseModel):
    word: str = Field(..., description="정규화된 필러 단어 (예: 음, 어)")
    # CLOVA 단어 정렬 타임스탬프(ms). words가 비어 text 보조 카운트면 None.
    start: float | None = Field(None, description="필러 시작 시각(ms)")
    end: float | None = Field(None, description="필러 종료 시각(ms)")
    segment_text: str | None = Field(None, description="필러가 속한 구간 텍스트")


class FillerAnalysis(BaseModel):
    total: int = Field(..., description="필러 총 개수")
    counts: dict[str, int] = Field(..., description="필러 단어별 개수")
    occurrences: list[FillerOccurrence] = Field(..., description="필러 출현 위치 목록")


class TranscribeResponse(BaseModel):
    text: str = Field(..., description="전사 전문")
    # segments·speakers는 CLOVA 원본 구조 — 형태를 고정하지 않는다.
    segments: list[dict] = Field(..., description="CLOVA 구간 목록(원본 구조)")
    speakers: list[dict] = Field(..., description="CLOVA 화자 목록(원본 구조)")
    filler_analysis: FillerAnalysis = Field(..., description="필러 분석 결과")
