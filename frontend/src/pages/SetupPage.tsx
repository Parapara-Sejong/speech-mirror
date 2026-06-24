import { useNavigate } from 'react-router-dom';

import cheeringMascot from '../../assets/images/cheering.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { CategoryTab } from '../components/ui/CategoryTab';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { IDEAL_TRAITS, INTERVIEW_TYPES, JOBS } from '../features/interview/types';

export function SetupPage() {
  const navigate = useNavigate();
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const mode = useInterviewStore((s) => s.mode);
  const setJob = useInterviewStore((s) => s.setJob);
  const setInterviewType = useInterviewStore((s) => s.setInterviewType);
  const setMode = useInterviewStore((s) => s.setMode);
  const setRecommended = useInterviewStore((s) => s.setRecommended);
  const idealTraits = useInterviewStore((s) => s.idealTraits);
  const toggleIdealTrait = useInterviewStore((s) => s.toggleIdealTrait);

  const ready = job !== '' && interviewType !== '';

  function onProceed() {
    setRecommended(recommendQuestions(job, interviewType));
    navigate('/questions');
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <FlowProgress current={1} />
        <img src={cheeringMascot} alt="말거울 캐릭터" className="mx-auto w-24" />

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">직종</h2>
          <div className="flex flex-wrap gap-2">
            {JOBS.map((j) => (
              <CategoryTab key={j} active={job === j} onClick={() => setJob(j)}>
                {j}
              </CategoryTab>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">면접 종류</h2>
          <div className="flex flex-wrap gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <CategoryTab
                key={t.id}
                active={interviewType === t.id}
                onClick={() => setInterviewType(t.id)}
              >
                {t.label}
              </CategoryTab>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">
            인재상 <span className="text-body-sm text-muted">(선택)</span>
          </h2>
          <p className="text-body-sm text-muted">지원 회사가 원하는 가치를 고르면 추후 질문·피드백에 반영돼요.</p>
          <div className="flex flex-wrap gap-2">
            {IDEAL_TRAITS.map((trait) => (
              <CategoryTab
                key={trait}
                active={idealTraits.includes(trait)}
                onClick={() => toggleIdealTrait(trait)}
              >
                {trait}
              </CategoryTab>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-lg font-medium text-ink">모드</h2>
          <div className="flex gap-2">
            <CategoryTab active={mode === 'practice'} onClick={() => setMode('practice')}>
              연습 모드
            </CategoryTab>
            <CategoryTab active={false} disabled className="cursor-not-allowed opacity-50">
              실전 모드 (준비 중)
            </CategoryTab>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={onProceed} disabled={!ready}>
            질문 추천 받기
          </Button>
        </div>
      </div>
    </main>
  );
}
