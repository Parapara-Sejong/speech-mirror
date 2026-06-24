import type { AnalysisSession, AnswerReport } from './types';

// 데모용 고정 세션. 면접 한 번 = 답변 3개 + 종합.
// transcript는 짧게(외우기 쉽게) — 발표자가 그대로 말하면 화면과 일치한다.
// answers[1](문제해결력)이 쇼케이스. 실제 음성 분석이 아니라 고정 mock(2차에서 실연동).
// 문구·수치는 이 파일만 수정.

const ANSWERS: AnswerReport[] = [
  {
    question:
      "커버링의 '쓰레기로 고민하지 않는 세상'이라는 미션에 공감해 지원했다고 하셨는데, 라이더스 앱에서 가장 먼저 개선하고 싶은 사용자 불편은 무엇이고 왜 그렇게 보셨나요?",
    questionCompetency: '지원동기·직무이해',
    overallScore: 57,
    scores: { content: 58, delivery: 56, stability: 57 },
    transcript:
      '음 저는 수거 상태가 어 실시간으로 안 보이는 점을 개선하고 싶습니다 상태 추적과 알림으로 사용자에게 신뢰를 주고 싶습니다',
    speechMetrics: {
      speakingRate: 132,
      silenceCount: 1,
      longestSilence: 1.2,
      speechRatio: 0.85,
      fillerWords: { 음: 1, 어: 1 },
      rateSeries: [
        { t: 0, wpm: 120 },
        { t: 6, wpm: 138 },
        { t: 12, wpm: 130 },
      ],
    },
    timeline: [
      { start: 0.0, end: 0.4, type: 'filler', word: '음' },
      { start: 0.4, end: 4.5, type: 'speech' },
      { start: 4.5, end: 4.9, type: 'filler', word: '어' },
      { start: 4.9, end: 9.0, type: 'speech' },
      { start: 9.0, end: 10.2, type: 'silence' },
      { start: 10.2, end: 13.5, type: 'speech' },
    ],
    contentFeedback: {
      logic: {
        diagnosis: '개선점과 이유를 간결히 제시했습니다.',
        example: '"신뢰를 주고 싶다" 뒤에 기대 효과(예: 문의 감소)를 한 줄 더하면 설득력이 커집니다.',
      },
      expertise: {
        diagnosis: '사용자 관점은 좋으나 구현 방법 언급이 적습니다.',
        example: '"상태 추적"을 어떤 화면·이벤트로 만들지 한 가지만 짚어 보세요.',
      },
      competencyFit: '지원 동기와 직무 이해는 드러나나 답변이 짧아 구체성이 아쉽습니다.',
    },
    improvementPoints: [
      '답변이 짧으니 근거를 한 문장 더 보강하세요.',
      '기대 효과를 수치로 제시해 보세요.',
    ],
  },
  {
    question:
      '금융 교육 앱에서 퀴즈 API 호출을 32회에서 2회로 94% 줄였다고 했는데, 어떤 기준으로 호출을 합쳤고 그 과정에서 감수한 트레이드오프는 무엇이었나요?',
    questionCompetency: '문제해결력',
    overallScore: 66,
    scores: { content: 70, delivery: 62, stability: 66 },
    transcript:
      '음 퀴즈를 풀 때마다 어 매번 서버에 요청하다 보니 호출이 너무 많았습니다 그래서 세트를 시작할 때 한 번에 받아오게 바꿔서 서른두 번이던 호출을 두 번으로 줄였습니다',
    speechMetrics: {
      speakingRate: 134,
      silenceCount: 1,
      longestSilence: 1.0,
      speechRatio: 0.87,
      fillerWords: { 음: 1, 어: 1 },
      rateSeries: [
        { t: 0, wpm: 122 },
        { t: 7, wpm: 140 },
        { t: 14, wpm: 132 },
      ],
    },
    timeline: [
      { start: 0.0, end: 0.4, type: 'filler', word: '음' },
      { start: 0.4, end: 5.0, type: 'speech' },
      { start: 5.0, end: 5.4, type: 'filler', word: '어' },
      { start: 5.4, end: 10.0, type: 'speech' },
      { start: 10.0, end: 11.0, type: 'silence' },
      { start: 11.0, end: 16.0, type: 'speech' },
    ],
    contentFeedback: {
      logic: {
        diagnosis: '문제 → 해결과 결과(32회→2회)를 분명히 제시했습니다.',
        example: '질문이 물은 트레이드오프를 한 문장 덧붙이면 답이 완성됩니다.',
      },
      expertise: {
        diagnosis: '호출 횟수를 수치로 제시해 설득력이 있습니다.',
        example: '"세트 단위 일괄 요청"처럼 어떻게 합쳤는지 방법을 한 번 더 짚어 보세요.',
      },
      competencyFit: '문제 정의와 해결은 좋으나 질문이 물은 트레이드오프 언급이 빠졌습니다.',
    },
    improvementPoints: [
      "질문이 물은 '트레이드오프'를 꼭 한 문장 답하세요.",
      "필러 '음·어'를 줄이면 전달이 더 또렷해집니다.",
    ],
  },
  {
    question:
      'Block Drag를 Clean Architecture와 Riverpod·Freezed로 전면 리팩토링했다고 했습니다. 리팩토링 전후 구조의 핵심 차이와, 그 설계를 선택한 근거를 설명해 주세요.',
    questionCompetency: '기술 전문성',
    overallScore: 54,
    scores: { content: 56, delivery: 52, stability: 54 },
    transcript:
      '처음엔 어 화면에 상태랑 로직이 섞여 있었습니다 그래서 계층을 나누고 음 상태를 Riverpod로 관리해서 확장이 쉬워졌습니다',
    speechMetrics: {
      speakingRate: 126,
      silenceCount: 1,
      longestSilence: 1.3,
      speechRatio: 0.82,
      fillerWords: { 음: 1, 어: 1 },
      rateSeries: [
        { t: 0, wpm: 116 },
        { t: 6, wpm: 132 },
        { t: 12, wpm: 126 },
      ],
    },
    timeline: [
      { start: 0.0, end: 3.0, type: 'speech' },
      { start: 3.0, end: 3.4, type: 'filler', word: '어' },
      { start: 3.4, end: 8.0, type: 'speech' },
      { start: 8.0, end: 9.3, type: 'silence' },
      { start: 9.3, end: 9.7, type: 'filler', word: '음' },
      { start: 9.7, end: 13.0, type: 'speech' },
    ],
    contentFeedback: {
      logic: {
        diagnosis: '전(혼재) → 후(계층 분리) 대비가 간결합니다.',
        example: '분리로 무엇이 쉬워졌는지 예를 하나 들어 보세요.',
      },
      expertise: {
        diagnosis: 'Riverpod·계층 분리 개념은 맞으나 설명이 짧습니다.',
        example: 'Freezed 불변이 왜 버그를 줄였는지 한 줄 근거를 더하면 깊이가 생깁니다.',
      },
      competencyFit: '구조 개선 의도는 보이나 근거가 짧아 전문성이 덜 드러납니다.',
    },
    improvementPoints: [
      '리팩토링 효과를 수치(버그·작업시간 감소 등)로 제시해 보세요.',
      '핵심 결론을 먼저 말하고 부연하세요.',
    ],
  },
];

export const MOCK_SESSION: AnalysisSession = {
  id: 'demo-1',
  status: 'completed',
  createdAt: '2026-06-24T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
  overall: {
    score: 59,
    scores: { content: 61, delivery: 57, stability: 59 },
    summary:
      '답변이 짧아 핵심만 전달되고 근거·구체성이 부족해 점수가 낮습니다. 사례·수치·이유를 문장마다 보강하면 크게 오를 여지가 있습니다.',
    improvementPoints: [
      '답변마다 근거(수치·사례)를 한 문장씩 보강하세요.',
      "질문이 물은 핵심(예: 트레이드오프)을 빠뜨리지 마세요.",
      "필러 '음·어'는 문장 전 1초 멈춤으로 줄이세요.",
    ],
  },
  answers: ANSWERS,
};
