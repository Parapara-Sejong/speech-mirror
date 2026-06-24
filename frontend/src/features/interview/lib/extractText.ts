// 미리보기·직접입력용 가벼운 텍스트 추출(TXT·MD만, 라이브러리 0).
// 실제 추출(PDF/DOCX 포함)은 FastAPI가 담당 — 원본 file은 그대로 업로드한다.
export async function extractText(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  const isText =
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    name.endsWith('.txt') ||
    name.endsWith('.md');
  if (!isText) return null;
  try {
    const text = (await file.text()).trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
