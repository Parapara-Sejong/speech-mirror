import json
import os

import requests

# noiseFiltering은 한국어 필러("음", "어", "그")를 보존하기 위해 항상 false로 고정
CLOVA_PARAMS = {
    "language": "ko-KR",
    "completion": "sync",
    "wordAlignment": True,
    "fullText": True,
    "diarization": {"enable": True},
    "sed": {"enable": False},
    "noiseFiltering": False,
}


class ClovaSpeechError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def transcribe_audio(file_path: str, filename: str, content_type: str | None) -> dict:
    invoke_url = os.getenv("CLOVA_INVOKE_URL")
    secret_key = os.getenv("CLOVA_SECRET_KEY")

    if not invoke_url or not secret_key:
        raise ClovaSpeechError(500, "CLOVA_INVOKE_URL / CLOVA_SECRET_KEY가 설정되지 않았습니다.")

    headers = {
        "Accept": "application/json;UTF-8",
        "X-CLOVASPEECH-API-KEY": secret_key,
    }

    with open(file_path, "rb") as media_file:
        files = {
            "media": (filename, media_file, content_type or "application/octet-stream"),
            "params": (None, json.dumps(CLOVA_PARAMS), "application/json"),
        }

        try:
            response = requests.post(
                f"{invoke_url}/recognizer/upload",
                headers=headers,
                files=files,
                timeout=60,
            )
        except requests.RequestException as exc:
            raise ClovaSpeechError(502, "CLOVA Speech 서버에 연결할 수 없습니다.") from exc

    if response.status_code >= 400:
        raise ClovaSpeechError(
            response.status_code, f"CLOVA Speech 호출 실패: {response.text}"
        )

    try:
        return response.json()
    except ValueError as exc:
        raise ClovaSpeechError(502, "CLOVA Speech 응답을 해석할 수 없습니다.") from exc
