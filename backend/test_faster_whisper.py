from faster_whisper import WhisperModel
from pathlib import Path
from collections import Counter
import sys
import re
import os


# Windows에서 Hugging Face symlink 경고 숨기기
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


FILLER_WORDS = [
    "음", "어", "아", "그", "저",
    "이제", "약간", "뭔가", "그러니까", "사실"
]


def normalize_word(word: str) -> str:
    """
    Whisper가 반환한 단어에서 공백/문장부호 제거.
    예: ' 어...' -> '어'
    """
    word = word.strip()
    word = re.sub(r"[^가-힣a-zA-Z0-9]", "", word)
    return word


def count_filler_words(text: str):
    """
    전체 전사 텍스트에서 필러 단어 개수 계산.
    '어떤', '그런' 같은 단어 안의 '어', '그'는 제외하기 위해
    앞뒤가 한글이 아닌 경우만 카운트.
    """
    counts = Counter()

    for word in FILLER_WORDS:
        pattern = rf"(?<![가-힣]){re.escape(word)}(?=$|[^가-힣])"
        matches = re.findall(pattern, text)
        counts[word] = len(matches)

    total = sum(counts.values())

    return {
        "total": total,
        "counts": dict(counts)
    }


def transcribe(audio_path: str, model_size: str = "tiny"):
    audio_file = Path(audio_path)

    if not audio_file.exists():
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {audio_file}")

    print(f"[INFO] 모델 로딩 중: {model_size}")
    print("[INFO] 첫 실행이면 모델 다운로드 때문에 시간이 걸릴 수 있습니다.")

    model = WhisperModel(
        model_size,
        device="cpu",
        compute_type="int8"
    )

    print(f"[INFO] 전사 시작: {audio_file}")

    segments, info = model.transcribe(
        str(audio_file),
        language="ko",
        beam_size=5,
        vad_filter=True,
        word_timestamps=True,
        initial_prompt=(
            "다음 음성에는 '음', '어', '아', '그', '이제' 같은 "
            "말버릇이나 필러 단어가 포함될 수 있으니 가능한 그대로 전사해 주세요."
        )
    )

    print(f"[INFO] 감지 언어: {info.language}")
    print("\n========== 전사 결과 ==========\n")

    full_text = []
    filler_events = []

    for segment in segments:
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
        full_text.append(segment.text)

        # 단어별 타임스탬프 기반 필러 감지
        if segment.words:
            for word_info in segment.words:
                clean_word = normalize_word(word_info.word)

                if clean_word in FILLER_WORDS:
                    filler_events.append({
                        "word": clean_word,
                        "start": word_info.start,
                        "end": word_info.end
                    })

    final_text = " ".join(full_text).strip()

    print("\n========== 전체 텍스트 ==========\n")
    print(final_text if final_text else "전사된 텍스트가 없습니다.")

    filler_result = count_filler_words(final_text)

    print("\n========== 필러 단어 분석 ==========\n")
    print(f"총 필러 단어 수: {filler_result['total']}회")

    has_filler = False

    for word, count in filler_result["counts"].items():
        if count > 0:
            has_filler = True
            print(f"{word}: {count}회")

    if not has_filler:
        print("감지된 필러 단어가 없습니다.")

    print("\n========== 필러 단어 타임라인 ==========\n")

    if filler_events:
        for event in filler_events:
            print(
                f"{event['word']} "
                f"({event['start']:.2f}s -> {event['end']:.2f}s)"
            )
    else:
        print("타임라인에서 감지된 필러 단어가 없습니다.")

    return {
        "text": final_text,
        "filler_counts": filler_result,
        "filler_events": filler_events
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법:")
        print("python test_faster_whisper.py samples\\test.m4a")
        print("python test_faster_whisper.py samples\\test.m4a base")
        print("python test_faster_whisper.py samples\\recorded.wav base")
        sys.exit(1)

    audio_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) >= 3 else "tiny"

    transcribe(audio_path, model_size)