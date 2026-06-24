import { useNavigate } from 'react-router-dom';

import thinkingMascot from '../../assets/images/thinking.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { QuestionCard } from '../components/interview/QuestionCard';
import { Button } from '../components/ui/Button';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';

export function QuestionsPage() {
  const navigate = useNavigate();
  const recommended = useInterviewStore((s) => s.recommended);
  const selectedIds = useInterviewStore((s) => s.selectedIds);
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const toggleSelected = useInterviewStore((s) => s.toggleSelected);
  const setFinalQuestions = useInterviewStore((s) => s.setFinalQuestions);

  // 딥링크 폴백: 추천이 비어 있으면 mock 사용(스토어는 건드리지 않음)
  const list = recommended.length > 0 ? recommended : recommendQuestions(job, interviewType);
  const reachedMax = selectedIds.length >= 3;

  function onStart() {
    setFinalQuestions(buildFinalQuestions(list, selectedIds));
    navigate('/interview');
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={2} />
        <img src={thinkingMascot} alt="말거울 캐릭터" className="mx-auto w-24" />
        <div className="flex flex-col gap-1">
          <h1 className="text-display-sm font-semibold text-ink">질문 3개를 골라주세요</h1>
          <p className="text-body-sm text-muted">
            선택 {selectedIds.length}/3 · 미선택 질문 중 1개가 랜덤으로 추가돼 총 4문항으로 진행돼요.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {list.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selected={selectedIds.includes(q.id)}
              disabled={reachedMax}
              onToggle={() => toggleSelected(q.id)}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={onStart} disabled={selectedIds.length !== 3}>
            면접 시작
          </Button>
        </div>
      </div>
    </main>
  );
}
