import io
import logging
from pathlib import Path

from docx import Document
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text(filename: str, content: bytes) -> str:
    """업로드 파일 bytes에서 평문 추출. 알 수 없는 형식·추출 실패 시 빈 문자열."""
    ext = Path(filename).suffix.lower()
    try:
        if ext == ".pdf":
            return _from_pdf(content)
        if ext == ".docx":
            return _from_docx(content)
        if ext in (".txt", ".md"):
            return content.decode("utf-8", errors="ignore").strip()
    except Exception as exc:  # noqa: BLE001 - 추출 실패가 질문 생성 흐름을 막지 않게 한다
        logger.warning("텍스트 추출 실패 (%s): %s", filename, exc)
    return ""


def _from_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def _from_docx(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs).strip()
