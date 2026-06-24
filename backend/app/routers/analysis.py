import json
import os
import tempfile

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.schemas.analysis import SessionReport
from app.services import analysis_pipeline, analysis_store

router = APIRouter(prefix="/analyses", tags=["analyses"])


def _parse_meta(meta: str, file_count: int) -> list[dict]:
    try:
        items = json.loads(meta)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "meta가 올바른 JSON 배열이 아닙니다.") from exc
    if not isinstance(items, list) or len(items) != file_count:
        raise HTTPException(400, "meta 길이와 업로드 파일 수가 일치하지 않습니다.")
    for it in items:
        if not it.get("question") or not it.get("competency"):
            raise HTTPException(400, "각 meta 항목에는 question·competency가 필요합니다.")
    return items


@router.post("", summary="면접 답변들 분석 시작", response_model=None)
async def create_analysis(
    background: BackgroundTasks,
    files: list[UploadFile] = File(..., description="답변 오디오들(webm), 질문 순서대로"),
    meta: str = Form(..., description='[{"question","competency"}, ...] — files와 같은 순서·길이'),
    job: str = Form("", description="직종(선택, 내용 채점 맥락)"),
    interviewType: str = Form("", description="면접 종류 id(선택)"),
):
    if not files:
        raise HTTPException(400, "분석할 오디오가 없습니다.")
    items = _parse_meta(meta, len(files))

    # 업로드 파일을 임시 저장(BackgroundTask가 끝나고 정리).
    answers: list[dict] = []
    tmp_paths: list[str] = []
    for upload, item in zip(files, items):
        suffix = os.path.splitext(upload.filename or "")[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await upload.read())
            tmp_paths.append(tmp.name)
        answers.append({
            "audio_path": tmp_paths[-1],
            "filename": upload.filename or "audio.webm",
            "content_type": upload.content_type,
            "question": item["question"],
            "competency": item["competency"],
        })

    sid = analysis_store.create()
    context = {"job": job, "interviewType": interviewType}

    def _job():
        try:
            analysis_pipeline.run_session(sid, answers, context)
        finally:
            for p in tmp_paths:
                try:
                    os.remove(p)
                except OSError:
                    pass

    background.add_task(_job)
    return {"id": sid, "status": "processing"}


@router.get("/{sid}", summary="분석 상태·결과 조회", response_model=None)
def get_analysis(sid: str):
    record = analysis_store.get(sid)
    if record is None:
        raise HTTPException(404, "해당 분석을 찾을 수 없습니다.")
    if record["status"] == "completed":
        return SessionReport.model_validate(record)
    return record  # processing / failed
