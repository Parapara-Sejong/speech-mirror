export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AnalysisResult = {
  id: string;
  status: AnalysisStatus;
  transcript?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

// AnalysisStatus와 동일 — 중복 방지 위해 별칭
export type ReportStatus = AnalysisStatus;

export type TimelineSegment =
  | { start: number; end: number; type: 'speech' }
  | { start: number; end: number; type: 'silence' }
  | { start: number; end: number; type: 'filler'; word: string };

export type SpeechMetrics = {
  speakingRate: number;
  silenceCount: number;
  longestSilence: number;
  speechRatio: number;
  fillerWords: Record<string, number>;
  rateSeries: { t: number; wpm: number }[];
};

export type ContentFeedbackAxis = { diagnosis: string; example: string };

export type ContentFeedback = {
  logic: ContentFeedbackAxis;
  expertise: ContentFeedbackAxis;
  competencyFit: string;
};

// 답변 1개 단위 분석(질문별). 면접 세션은 이걸 N개 가진다.
export type AnswerReport = {
  question: string;
  questionCompetency: string;
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
  transcript: string;
  speechMetrics: SpeechMetrics;
  timeline: TimelineSegment[];
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
};

// 면접 한 세션 = 답변 N개 + 종합. POST /analyses 가 N개 오디오를 한 번에 받아 만든다.
export type AnalysisSession = {
  id: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  // 면접 전체 종합(답변들을 묶은 결과)
  overall: {
    score: number;
    scores: { content: number; delivery: number; stability: number };
    summary: string;
    improvementPoints: string[];
  };
  answers: AnswerReport[];
};
