export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AnalysisResult = {
  id: string;
  status: AnalysisStatus;
  transcript?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};
