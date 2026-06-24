from pathlib import Path
from scipy.io.wavfile import write
import sounddevice as sd


def record_audio(
    output_path: str = "samples/recorded.wav",
    duration: int = 10,
    sample_rate: int = 16000
):
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    print(f"[INFO] {duration}초 동안 녹음합니다.")
    print("[INFO] 지금 말하세요...")

    audio = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16"
    )

    sd.wait()

    write(str(output_file), sample_rate, audio)

    print(f"[INFO] 녹음 완료: {output_file}")


if __name__ == "__main__":
    record_audio(
        output_path="samples/recorded.wav",
        duration=10
    )