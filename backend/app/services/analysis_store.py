import uuid

# 메모리 단일 소스. 프로세스 재시작 시 소멸(데모 범위, DB 없음).
_store: dict[str, dict] = {}


def create() -> str:
    sid = uuid.uuid4().hex[:8]
    _store[sid] = {"id": sid, "status": "processing"}
    return sid


def get(sid: str) -> dict | None:
    return _store.get(sid)


def complete(sid: str, report: dict) -> None:
    # 새 dict로 교체(보관값 자체를 외부에서 변형하지 않게)
    _store[sid] = {**report, "id": sid, "status": "completed"}


def fail(sid: str, error: str) -> None:
    _store[sid] = {"id": sid, "status": "failed", "error": error}


def reset() -> None:
    _store.clear()
