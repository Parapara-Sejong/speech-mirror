import logging
import os

logger = logging.getLogger(__name__)

# Windows symlink 경고 억제(기존 test_faster_whisper.py와 동일 의도)
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

# calibration 노브
MODEL_SIZE = "base"   # tiny=빠름·저정확, base=균형
_INITIAL_PROMPT = (
    "다음 음성에는 '음', '어', '아', '그', '이제' 같은 말버릇이나 "
    "필러 단어가 포함될 수 있으니 가능한 그대로 전사해 주세요."
)

_model = None


def _get_model():
    # 최초 1회만 로딩(다운로드 비용). 이후 재사용.
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        logger.info("Whisper 모델 로딩: %s (최초 실행 시 다운로드)", MODEL_SIZE)
        _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


def flatten_segments(segments) -> tuple[list[dict], list[str]]:
    words: list[dict] = []
    texts: list[str] = []
    for seg in segments:
        texts.append(seg.text)
        for w in seg.words or []:
            words.append({"word": w.word, "start": w.start, "end": w.end})
    return words, texts


def transcribe(audio_path: str) -> dict:
    # vad_filter=False: 침묵을 보존해야 침묵 지표를 계산할 수 있음(spec §11).
    segments, info = _get_model().transcribe(
        audio_path,
        language="ko",
        beam_size=5,
        vad_filter=False,
        word_timestamps=True,
        initial_prompt=_INITIAL_PROMPT,
    )
    words, texts = flatten_segments(segments)
    return {"text": " ".join(texts).strip(), "words": words, "duration": float(info.duration)}
