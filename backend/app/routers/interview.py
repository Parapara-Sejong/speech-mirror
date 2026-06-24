import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.clova_speech import ClovaSpeechError, transcribe_audio

from app.services.filler_words import analyze_fillers

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/transcribe")
async def transcribe(media: UploadFile = File(...)):
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
