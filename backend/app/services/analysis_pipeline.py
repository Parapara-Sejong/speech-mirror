import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from app.services import analysis_store, clova_speech, gemini_verify, speech_metrics, whisper_stt

logger = logging.getLogger(__name__)

# calibration 노브 — 점수 가중치·이상범위·기준선
# content(Gemini)는 변별력이 좋아 비중을 키우고, delivery/stability는 100이 아닌 88에서
# 시작해(만점 자제) 감점을 키워 유창함만으로 총점이 떠받쳐지지 않게 한다.
WEIGHTS = {"content": 0.6, "delivery": 0.2, "stability": 0.2}
IDEAL_WPM = (110, 160)
DELIVERY_BASE = 88
STABILITY_BASE = 88


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def score_delivery(metrics: dict) -> int:
    wpm = metrics["speakingRate"]
    if wpm < IDEAL_WPM[0]:
        rate_pen = min(40, (IDEAL_WPM[0] - wpm) * 1.0)
    elif wpm > IDEAL_WPM[1]:
        rate_pen = min(40, (wpm - IDEAL_WPM[1]) * 1.0)
    else:
        rate_pen = 0
    fillers = sum(metrics["fillerWords"].values())
    filler_pen = min(45, fillers * 5)  # 필러 1개당 5점 감점, 최대 45
    return max(0, round(DELIVERY_BASE - rate_pen - filler_pen))


def score_stability(metrics: dict) -> int:
    sil_pen = min(45, metrics["silenceCount"] * 7 + max(0.0, metrics["longestSilence"] - 1.5) * 10)
    ratio_pen = max(0.0, 0.85 - metrics["speechRatio"]) * 120  # speechRatio<0.85면 감점
    return max(0, round(STABILITY_BASE - sil_pen - ratio_pen))


def _transcribe_both(answer: dict) -> tuple[dict, str, bool]:
    # Whisper(필러·타임라인) ∥ CLOVA(정본) 동시 실행. 한쪽 실패는 degraded로.
    degraded = False
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_whisper = ex.submit(whisper_stt.transcribe, answer["audio_path"])
        f_clova = ex.submit(
            clova_speech.transcribe_audio, answer["audio_path"], answer["filename"], answer["content_type"]
        )
        try:
            whisper_res = f_whisper.result()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Whisper 실패 — degraded: %s", exc)
            whisper_res = {"text": "", "words": [], "duration": 0.0}
            degraded = True
        try:
            clova_text = f_clova.result().get("text", "")
        except Exception as exc:  # noqa: BLE001
            logger.warning("CLOVA 실패 — degraded: %s", exc)
            clova_text = ""
            degraded = True
    return whisper_res, clova_text, degraded


def analyze_answer(answer: dict, context: dict) -> dict:
    whisper_res, clova_text, degraded = _transcribe_both(answer)
    words, duration = whisper_res["words"], whisper_res["duration"]

    metrics = speech_metrics.compute_metrics(words, duration)
    timeline = speech_metrics.build_timeline(words, duration)

    verdict = gemini_verify.verify_and_score(
        question=answer["question"],
        competency=answer["competency"],
        clova_text=clova_text,
        whisper_text=whisper_res["text"],
        job=context.get("job", ""),
        interview_type=context.get("interviewType", ""),
    )

    delivery = score_delivery(metrics)
    stability = score_stability(metrics)
    content = verdict["contentScore"]
    overall = round(content * WEIGHTS["content"] + delivery * WEIGHTS["delivery"] + stability * WEIGHTS["stability"])

    return {
        "question": answer["question"],
        "questionCompetency": answer["competency"],
        "overallScore": overall,
        "scores": {"content": content, "delivery": delivery, "stability": stability},
        "transcript": verdict["verifiedTranscript"] or clova_text or whisper_res["text"],
        "speechMetrics": metrics,
        "timeline": timeline,
        "contentFeedback": verdict["contentFeedback"],
        "improvementPoints": verdict["improvementPoints"],
        "degraded": degraded,
    }


def build_session(session_id: str, reports: list[dict]) -> dict:
    n = len(reports)
    avg = lambda key: round(sum(r["scores"][key] for r in reports) / n)
    overall_score = round(sum(r["overallScore"] for r in reports) / n)

    points: list[str] = []
    for r in reports:
        points.extend(r["improvementPoints"])
    points = list(dict.fromkeys(points))[:5]  # 중복 제거 후 상위 5개

    now = _now()
    return {
        "id": session_id,
        "status": "completed",
        "createdAt": now,
        "updatedAt": now,
        "overall": {
            "score": overall_score,
            "scores": {"content": avg("content"), "delivery": avg("delivery"), "stability": avg("stability")},
            "summary": f"총 {n}개 답변 평균 {overall_score}점.",
            "improvementPoints": points,
        },
        "answers": reports,
    }


def run_session(session_id: str, answers: list[dict], context: dict) -> None:
    # BackgroundTask 진입점. 예기치 못한 전체 오류만 fail 처리.
    try:
        reports = [analyze_answer(a, context) for a in answers]
        analysis_store.complete(session_id, build_session(session_id, reports))
    except Exception as exc:  # noqa: BLE001
        logger.exception("세션 분석 실패: %s", session_id)
        analysis_store.fail(session_id, str(exc))
