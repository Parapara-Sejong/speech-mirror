import re
from collections import Counter

# calibration 노브 — 데모 수치는 여기만 수정
FILLER_WORDS = ["음", "어", "아", "저", "그", "이제", "약간", "뭔가", "사실", "그러니까", "그니까", "막", "뭐"]
SILENCE_GAP = 0.8   # 단어 간 간격이 이 이상이면 침묵
RATE_WINDOW = 8.0   # rateSeries 윈도우(초)


def _normalize(word: str) -> str:
    return re.sub(r"[^가-힣A-Za-z0-9]", "", word.strip())


def count_fillers(words: list[dict]) -> dict[str, int]:
    counts: Counter = Counter()
    for w in words:
        token = _normalize(w.get("word", ""))
        if token in FILLER_WORDS:
            counts[token] += 1
    return dict(counts)


def _silences(words: list[dict]) -> list[tuple[float, float]]:
    gaps = []
    for prev, cur in zip(words, words[1:]):
        gap = cur["start"] - prev["end"]
        if gap >= SILENCE_GAP:
            gaps.append((prev["end"], cur["start"]))
    return gaps


def compute_metrics(words: list[dict], duration: float) -> dict:
    fillers = count_fillers(words)
    silences = _silences(words)
    speak_time = sum(w["end"] - w["start"] for w in words)
    longest = max((b - a for a, b in silences), default=0.0)

    rate = round(len(words) / duration * 60, 1) if duration > 0 else 0.0
    series = _rate_series(words, duration)

    return {
        "speakingRate": rate,
        "silenceCount": len(silences),
        "longestSilence": round(longest, 2),
        "speechRatio": round(speak_time / duration, 2) if duration > 0 else 0.0,
        "fillerWords": fillers,
        "rateSeries": series,
    }


def _rate_series(words: list[dict], duration: float) -> list[dict]:
    if duration <= 0:
        return []
    points = []
    t = 0.0
    while t < duration:
        window_end = t + RATE_WINDOW
        n = sum(1 for w in words if t <= w["start"] < window_end)
        wpm = round(n / RATE_WINDOW * 60, 1)
        points.append({"t": round(t, 1), "wpm": wpm})
        t = window_end
    return points


def build_timeline(words: list[dict], duration: float) -> list[dict]:
    # 단어 구간은 speech, 필러는 filler, 단어 간 큰 간격은 silence.
    segments: list[dict] = []
    cursor = 0.0
    for w in words:
        if w["start"] - cursor >= SILENCE_GAP:
            segments.append({"start": round(cursor, 2), "end": round(w["start"], 2),
                             "type": "silence", "word": None})
        token = _normalize(w.get("word", ""))
        seg_type = "filler" if token in FILLER_WORDS else "speech"
        seg = {"start": round(w["start"], 2), "end": round(w["end"], 2), "type": seg_type, "word": None}
        if seg_type == "filler":
            seg["word"] = token
        segments.append(seg)
        cursor = w["end"]
    if duration - cursor >= SILENCE_GAP:
        segments.append({"start": round(cursor, 2), "end": round(duration, 2),
                         "type": "silence", "word": None})
    return segments
