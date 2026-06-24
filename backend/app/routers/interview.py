import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.interview import TranscribeResponse
from app.services.clova_speech import ClovaSpeechError, transcribe_audio

from app.services.filler_words import analyze_fillers

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post(
    "/transcribe",
    summary="단일 오디오 전사 + 필러 분석",
    description="오디오 1개를 CLOVA로 전사하고 필러(음·어 등)를 분석해 반환한다.",
    response_model=TranscribeResponse,
    responses={502: {"description": "CLOVA 전사 실패(연결·설정·응답 오류, status 가변)"}},
)
async def transcribe(media: UploadFile = File(..., description="전사할 오디오(webm 등)")):
    suffix = os.path.splitext(media.filename or "")[1] or ".webm"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_path = tmp_file.name
        tmp_file.write(await media.read())

    try:
        result = transcribe_audio(tmp_path, media.filename or "audio", media.content_type)
    except ClovaSpeechError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    finally:
        os.remove(tmp_path)

    filler_analysis = analyze_fillers(result)

    return {
        "text": result.get("text", ""),
        "segments": result.get("segments", []),
        "speakers": result.get("speakers", []),
        "filler_analysis": filler_analysis,
    }
