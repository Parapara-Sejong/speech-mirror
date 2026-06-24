import { CtaBand } from '../components/sections/CtaBand';
import { Footer } from '../components/sections/Footer';
import { HeroBand } from '../components/sections/HeroBand';
import { Button } from '../components/ui/Button';
import { PricingTierCard } from '../components/ui/PricingTierCard';
import { ProductMockupCardDark } from '../components/ui/ProductMockupCardDark';
import { PRICING_TIERS } from '../constants/pricing';

export function PricingPage() {
  return (
    <main className="min-h-screen bg-canvas text-body">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-section px-6 py-12">
        <HeroBand
          eyebrow="수익화 구조"
          title="무료 연습에서 유료 코칭으로"
          subtitle="기본 모의 면접은 무료로 열어두고, 더 많은 연습과 상세 피드백은 유료 플랜으로 확장합니다."
          actions={<Button>무료로 시작</Button>}
          aside={
            <ProductMockupCardDark title="플랜 구조">
              무료 사용자가 말하기 습관을 확인한 뒤, 프로 플랜에서 무제한 연습과 직무별 피드백으로
              넘어가는 구조입니다.
            </ProductMockupCardDark>
          }
        />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <PricingTierCard key={tier.name} {...tier} />
          ))}
        </section>

        <CtaBand
          variant="dark"
          title="지금은 구조를 보여주는 화면입니다"
          subtitle="실제 결제 플로우 없이, 어떤 플랜으로 수익화할 수 있는지만 보여줍니다."
          action={<Button variant="secondary-on-dark">플랜 구조 확인</Button>}
        />

        <Footer />
      </div>
    </main>
  );
}
