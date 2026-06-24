import { apiClient } from '../../lib/apiClient';

export type AnswerUpload = {
  blob: Blob;
  question: string;
  competency: string;
};

// 답변 오디오들 + 질문/역량 메타를 멀티파트로 업로드해 분석을 시작한다.
// 추출·전사·채점은 FastAPI 담당. 프론트는 업로드만.
export async function submitAnalysis(answers: AnswerUpload[]): Promise<{ id: string }> {
  const form = new FormData();
  const meta = answers.map((a) => ({ question: a.question, competency: a.competency }));
  answers.forEach((a, i) => form.append('files', a.blob, `answer-${i}.webm`));
  form.append('meta', JSON.stringify(meta));

  const { data } = await apiClient.post<{ id: string; status: string }>('/analyses', form);
  return { id: data.id };
}
