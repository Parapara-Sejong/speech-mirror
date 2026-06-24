import { recommendQuestions } from './mockQuestions';
import type { QuestionGenInput, RecommendedQuestion } from './types';
// import { apiClient } from '../../lib/apiClient';

// 이력서·자기소개서·인재상 기반 GEMINI 질문 생성 시임.
// 추출(PDF/DOCX 포함)·GEMINI 호출은 FastAPI가 담당. 프론트는 원본 파일을 multipart로 업로드만 한다.
// 지금은 백엔드가 없어 mock 질문을 반환한다. 연동 시 아래 스텁으로 교체.
export async function generateQuestions(input: QuestionGenInput): Promise<RecommendedQuestion[]> {
  // --- FastAPI 연동 시(스텁) — POST /questions/recommend (multipart) ---
  // const form = new FormData();
  // appendDoc(form, 'resume', input.resume);
  // appendDoc(form, 'coverLetter', input.coverLetter);
  // appendDoc(form, 'idealProfile', input.idealProfile);
  // form.append('idealTraits', JSON.stringify(input.idealTraits));
  // form.append('job', input.job);
  // form.append('interviewType', input.interviewType);
  // const { data } = await apiClient.post<RecommendedQuestion[]>('/questions/recommend', form);
  // return data;

  // 임시: 백엔드 없이 mock 질문(생성 지연 흉내)
  await new Promise((resolve) => setTimeout(resolve, 400));
  return recommendQuestions(input.job, input.interviewType);
}

// 원본 파일이 있으면 파일을, 없으면 텍스트를 multipart에 싣는다(백엔드 연동 시 사용).
// function appendDoc(form: FormData, key: string, doc: SourceDoc) {
//   if (doc.file) form.append(key, doc.file);
//   else if (doc.text) form.append(`${key}Text`, doc.text);
// }
