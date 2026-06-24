// TXT만 실제 추출. 그 외 형식·실패 시 null → UI가 직접 입력 폴백을 노출한다.
export async function extractResume(file: File): Promise<string | null> {
  const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
  if (!isTxt) return null;
  try {
    const text = await file.text();
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}
