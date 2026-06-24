import re
from collections import Counter
from typing import Any


FILLER_WORDS = [
    "음",
    "어",
    "아",
    "저",
    "그",
    "이제",
    "약간",
    "뭔가",
    "사실",
    "그러니까",
    "그니까",
    "막",
    "뭐",
]


def normalize_word(word: str) -> str:
    """
    '어...', '음~', '그,' 같은 표현을 '어', '음', '그'로 정리
    """
    word = word.strip()
    word = re.sub(r"[.,!?…~]+", "", word)
    return word


def get_word_text(word_item: Any) -> str:
    """
    CLOVA words 구조가 list 또는 dict로 올 수 있어서 둘 다 처리
    예:
    [1200, 1500, "음"]
    {"start": 1200, "end": 1500, "text": "음"}
    """
    if isinstance(word_item, list) and len(word_item) >= 3:
        return str(word_item[2])

    if isinstance(word_item, dict):
        return str(
            word_item.get("text")
            or word_item.get("word")
            or word_item.get("value")
            or ""
        )

    return ""


def get_word_time(word_item: Any):
    if isinstance(word_item, list) and len(word_item) >= 2:
        return word_item[0], word_item[1]

    if isinstance(word_item, dict):
        return word_item.get("start"), word_item.get("end")

    return None, None


def analyze_fillers(clova_result: dict) -> dict:
    counts = Counter()
    occurrences = []

    # 1순위: segments[].words 기준으로 카운트
    for segment in clova_result.get("segments", []):
        segment_text = segment.get("text", "")

        for word_item in segment.get("words", []):
            raw_word = get_word_text(word_item)
            word = normalize_word(raw_word)

            if word in FILLER_WORDS:
                start, end = get_word_time(word_item)
                counts[word] += 1
                occurrences.append(
                    {
                        "word": word,
                        "start": start,
                        "end": end,
                        "segment_text": segment_text,
                    }
                )

    # words가 비어 있으면 전체 text에서 보조 카운트
    if not occurrences:
        text = clova_result.get("text", "")

        for filler in FILLER_WORDS:
            pattern = rf"(?<![가-힣A-Za-z0-9]){re.escape(filler)}(?![가-힣A-Za-z0-9])"
            matched = re.findall(pattern, text)
            counts[filler] += len(matched)

            for _ in matched:
                occurrences.append(
                    {
                        "word": filler,
                        "start": None,
                        "end": None,
                        "segment_text": None,
                    }
                )

    return {
        "total": sum(counts.values()),
        "counts": dict(counts),
        "occurrences": occurrences,
    }