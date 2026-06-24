import { ReactNode } from 'react';

import { CtaBand } from '../components/sections/CtaBand';
import { Footer } from '../components/sections/Footer';
import { HeroBand } from '../components/sections/HeroBand';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CalloutCardCoral } from '../components/ui/CalloutCardCoral';
import { CategoryTab } from '../components/ui/CategoryTab';
import { CodeWindowCard } from '../components/ui/CodeWindowCard';
import { FeatureCard } from '../components/ui/FeatureCard';
import { IconButton } from '../components/ui/IconButton';
import { PricingTierCard } from '../components/ui/PricingTierCard';
import { ProductMockupCardDark } from '../components/ui/ProductMockupCardDark';
import { TextInput } from '../components/ui/TextInput';
import { PRICING_TIERS } from '../constants/pricing';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-display-md font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function ShowcasePage() {
  return (
    <main className="min-h-screen bg-canvas text-body">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-section px-6 py-12">
        <HeroBand
          eyebrow="AI 모의 면접"
          title="면접, 혼자서도 완벽하게"
          subtitle="AI와 실전처럼 연습하고 즉시 피드백을 받으세요."
          actions={
            <>
              <Button>무료로 시작</Button>
              <Button variant="secondary">데모 보기</Button>
            </>
          }
          aside={
            <ProductMockupCardDark title="실시간 피드백">
              답변 구조, 말 속도, 군더더기 표현을 분석합니다.
            </ProductMockupCardDark>
          }
        />

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="text-link">Text link</Button>
            <IconButton aria-label="더보기">→</IconButton>
          </div>
          <div className="rounded-lg bg-surface-dark p-6">
            <Button variant="secondary-on-dark">Secondary on dark</Button>
          </div>
        </Section>

        <Section title="Badges & Tabs">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>카테고리</Badge>
            <Badge variant="coral">NEW</Badge>
            <CategoryTab active>활성 탭</CategoryTab>
            <CategoryTab>비활성 탭</CategoryTab>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="max-w-sm">
            <TextInput placeholder="이메일을 입력하세요" />
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              }
              title="실전 질문"
            >
              직무별 맞춤 질문으로 연습합니다.
            </FeatureCard>
            <FeatureCard title="즉시 피드백">답변 직후 개선점을 제시합니다.</FeatureCard>
            <FeatureCard title="기록 관리">지난 면접을 다시 돌아봅니다.</FeatureCard>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ProductMockupCardDark title="대시보드">
              면접 진행 상황과 점수 추이를 한눈에.
            </ProductMockupCardDark>
            <CodeWindowCard
              filename="feedback.json"
              code={'{\n  "clarity": 0.86,\n  "pace": "보통",\n  "fillers": 3\n}'}
            />
          </div>
          <CalloutCardCoral
            title="지금 바로 면접을 연습하세요"
            action={<Button variant="secondary">무료로 시작</Button>}
          >
            카드 등록 없이 바로 시작할 수 있습니다.
          </CalloutCardCoral>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <PricingTierCard key={tier.name} {...tier} />
            ))}
          </div>
        </Section>

        <Section title="Sections">
          <CtaBand
            title="더 깊이 준비하고 싶다면"
            subtitle="프로 플랜으로 무제한 모의 면접과 상세 피드백을 받으세요."
            action={<Button variant="secondary">프로 보기</Button>}
          />
          <Footer />
        </Section>
      </div>
    </main>
  );
}
