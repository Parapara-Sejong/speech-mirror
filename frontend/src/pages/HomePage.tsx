import { useNavigate } from 'react-router-dom';

import { CtaBand } from '../components/sections/CtaBand';
import { Footer } from '../components/sections/Footer';
import { HeroBand } from '../components/sections/HeroBand';
import { Button } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/FeatureCard';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-canvas text-body">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-section px-6 py-12">
        <HeroBand
          eyebrow="AI 발화 코칭"
          title="당신의 면접을 비추는 거울"
          subtitle="한국어 발화를 분석해 말 속도·침묵·필러 단어까지 교정합니다."
          actions={<Button onClick={() => navigate('/upload')}>시작하기</Button>}
        />
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard title="말 속도 분석">
            분당 단어 수로 너무 빠르거나 느린 구간을 짚어줍니다.
          </FeatureCard>
          <FeatureCard title="침묵·머뭇거림">
            긴 침묵과 횟수를 타임라인으로 보여줍니다.
          </FeatureCard>
          <FeatureCard title="한국어 필러 단어">
            "음·어·그·약간"의 사용 빈도와 위치를 분석합니다.
          </FeatureCard>
        </section>
        <CtaBand
          title="지금 바로 연습을 시작하세요"
          subtitle="이력서만 있으면 맞춤 질문으로 모의면접을 진행할 수 있어요."
          action={
            <Button variant="secondary" onClick={() => navigate('/upload')}>
              모의면접 시작
            </Button>
          }
        />
        <Footer />
      </div>
    </main>
  );
}
