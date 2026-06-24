export type TranscriptToken = { text: string; isFiller: boolean };

// 공백을 보존하며 토큰화하고, 필러 단어와 정확히 일치하는 토큰만 표시.
// 단어 단위 타임스탬프가 없어 재생 위치와 무관한 정적 하이라이트.
export function highlightFillers(
  transcript: string,
  fillerWords: Record<string, number>,
): TranscriptToken[] {
  const fillers = new Set(Object.keys(fillerWords));
  return transcript.split(/(\s+)/).map((part) => {
    const word = part.trim();
    return { text: part, isFiller: word.length > 0 && fillers.has(word) };
  });
}
