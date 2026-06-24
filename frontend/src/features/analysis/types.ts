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

export type AnalysisReport = {
  id: string;
  status: ReportStatus;
  question: string;
  questionCompetency: string;
  overallScore: number;
  scores: { content: number; delivery: number; stability: number };
  transcript: string;
  audioUrl: string;
  speechMetrics: SpeechMetrics;
  timeline: TimelineSegment[];
  contentFeedback: ContentFeedback;
  improvementPoints: string[];
  createdAt: string;
  updatedAt: string;
};
