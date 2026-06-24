// 전체 프로젝트 mock/실서버 분기 스위치.
// .env.local 의 VITE_MOCK_DATA=true 면 mock 데이터, 그 외(false·미설정)면 FastAPI 실호출.
// (Vite는 VITE_ 접두사 env만 클라이언트 번들에 노출하므로 mockData가 아니라 VITE_MOCK_DATA)
export const USE_MOCK = import.meta.env.VITE_MOCK_DATA === 'true';

// mock 모드에서 "처리 중"처럼 보이게 하는 인위적 지연(ms). 질문생성·분석/결과 공통.
export const MOCK_DELAY_MS = 10_000;

// 지정 ms 만큼 대기(mock 로딩 연출용).
export const mockDelay = (ms: number = MOCK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
