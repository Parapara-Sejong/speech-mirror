import type { RecommendedQuestion } from './types';

// 데모용 mock 질문 풀. assets/mocks/이력서.md·자기소개서.md(홍의민) 기준으로
// "GEMINI가 이 서류를 읽고 만든 것처럼" 보이게 맞춤 작성. GEMINI 연동(quota) 전 데모 경로.
const MOCK_POOL: RecommendedQuestion[] = [
  {
    id: 'q1',
    question:
      "커버링의 '쓰레기로 고민하지 않는 세상'이라는 미션에 공감해 지원했다고 하셨는데, 라이더스 앱에서 가장 먼저 개선하고 싶은 사용자 불편은 무엇이고 왜 그렇게 보셨나요?",
    competency: '지원동기·직무이해',
  },
  {
    id: 'q2',
    question:
      '금융 교육 앱에서 퀴즈 API 호출을 32회에서 2회로 94% 줄였다고 했는데, 어떤 기준으로 호출을 합쳤고 그 과정에서 감수한 트레이드오프는 무엇이었나요?',
    competency: '문제해결력',
  },
  {
    id: 'q3',
    question:
      'Block Drag를 Clean Architecture와 Riverpod·Freezed로 전면 리팩토링했다고 했습니다. 리팩토링 전후 구조의 핵심 차이와, 그 설계를 선택한 근거를 설명해 주세요.',
    competency: '기술 전문성',
  },
  {
    id: 'q4',
    question:
      '앱 개발 경험이 전무한 상태에서 4개월 독학으로 RuleBook을 양대 스토어에 출시했는데, 가장 막혔던 지점과 그것을 어떻게 돌파했는지 구체적으로 말해 주세요.',
    competency: '도전정신·실행력',
  },
  {
    id: 'q5',
    question:
      'iOS Share Extension과 Android Intent Filter처럼 처음 접하는 네이티브 영역에 부딪혔을 때, 무엇을 단서로 학습했고 어떻게 실제 기능으로 완성했나요?',
    competency: '학습민첩성',
  },
  {
    id: 'q6',
    question:
      '6인 팀에서 Notion PRD·GitHub Issue로 협업했다고 했는데, 의견 충돌이 있었던 순간과 그때 본인이 택한 소통 방식을 사례로 들어 주세요.',
    competency: '협업·소통',
  },
  {
    id: 'q7',
    question:
      '은샘교회 웹사이트를 Next.js + FastAPI로 프론트부터 백엔드 API·CMS까지 직접 만들었는데, 풀스택으로 전 과정을 책임지며 가장 크게 배운 점은 무엇인가요?',
    competency: '주도성',
  },
  {
    id: 'q8',
    question:
      'Block Drag 초기 버전의 구조적 한계를 스스로 인지하고 종강 후 2개월간 전면 개선했는데, 실패를 더 나은 결과로 바꾼 그 경험에서 무엇을 얻었나요?',
    competency: '회복탄력성',
  },
];

// 직종·면접종류는 데모 mock에선 미사용(맞춤 풀 반환). 시그니처는 백엔드 계약과 동일하게 유지.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function recommendQuestions(_job: string, _interviewType: string): RecommendedQuestion[] {
  return MOCK_POOL;
}
