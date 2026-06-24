export type PricingTier = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
};

// 더미값 — 실제 가격/기능은 이 파일만 수정한다(calibration 노브)
export const PRICING_TIERS: PricingTier[] = [
  {
    name: '무료',
    price: '₩0',
    period: '/월',
    features: ['월 3회 모의 면접', '기본 피드백', '기록 7일 보관'],
    ctaLabel: '무료로 시작',
  },
  {
    name: '프로',
    price: '₩9,900',
    period: '/월',
    featured: true,
    features: ['무제한 모의 면접', 'AI 상세 피드백', '직무별 질문 세트', '기록 무제한'],
    ctaLabel: '프로 시작하기',
  },
  {
    name: '맥스',
    price: '₩19,000',
    period: '/월',
    features: ['프로 전체 포함', '실시간 음성 면접', '맞춤 커리큘럼', '우선 지원'],
    ctaLabel: '맥스 시작하기',
  },
];
