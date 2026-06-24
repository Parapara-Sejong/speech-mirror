import type { AnalysisReport } from './types';

// PRD §11 예시값 기반 임시 데이터. 실제 문구/수치는 이 파일만 수정(calibration 노브).
export const MOCK_REPORT: AnalysisReport = {
  id: 'demo-1',
  status: 'completed',
  question: '링커리어에서 진행한 콘텐츠 프로젝트 중 가장 어려웠던 점은?',
  questionCompetency: '문제해결력',
  overallScore: 81,
  scores: { content: 84, delivery: 76, stability: 82 },
  transcript:
    '저는 팀 프로젝트에서 음 백엔드 API 개발을 맡았습니다 어 처음에는 약간 막막했지만 차근차근 문제를 나눠서 접근했습니다',
  audioUrl: '/sample-answer.mp3',
  speechMetrics: {
    speakingRate: 138,
    silenceCount: 5,
    longestSilence: 2.8,
    speechRatio: 0.84,
    fillerWords: { 음: 3, 어: 4, 약간: 2 },
    rateSeries: [
      { t: 0, wpm: 120 },
      { t: 8, wpm: 145 },
      { t: 16, wpm: 132 },
      { t: 24, wpm: 150 },
      { t: 32, wpm: 128 },
      { t: 40, wpm: 138 },
    ],
  },
  timeline: [
    { start: 0.0, end: 8.2, type: 'speech' },
    { start: 8.2, end: 10.5, type: 'silence' },
    { start: 11.0, end: 11.4, type: 'filler', word: '음' },
    { start: 11.4, end: 20.0, type: 'speech' },
    { start: 20.0, end: 22.0, type: 'silence' },
    { start: 22.0, end: 22.4, type: 'filler', word: '어' },
    { start: 22.4, end: 34.0, type: 'speech' },
    { start: 34.0, end: 34.5, type: 'filler', word: '약간' },
    { start: 34.5, end: 42.0, type: 'speech' },
  ],
  contentFeedback: {
    logic: {
      diagnosis: '결론이 답변 끝에 묻혀 약합니다.',
      example: '"제가 맡은 핵심은 API 안정화였습니다"로 먼저 결론을 제시하세요.',
    },
    expertise: {
      diagnosis: '사례는 있으나 수치가 없습니다.',
      example: '"응답 지연을 40% 줄였습니다"처럼 성과를 수치로 보강하세요.',
    },
    competencyFit: '문제해결력 질문에 대해 과정 설명은 충분하나 결과 임팩트가 부족함',
  },
  improvementPoints: [
    '답변 마지막에 핵심 역량을 한 문장으로 정리하세요.',
    '필러 단어를 줄이기 위해 문장 시작 전 1초 정도 생각하세요.',
  ],
  createdAt: '2026-06-24T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
};
