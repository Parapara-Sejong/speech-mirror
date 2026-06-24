import { useNavigate } from 'react-router-dom';

import thinkingMascot from '../../assets/images/thinking.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { QuestionCard } from '../components/interview/QuestionCard';
import { Button } from '../components/ui/Button';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { USE_MOCK } from '../lib/config';

export function QuestionsPage() {
  const navigate = useNavigate();
  const recommended = useInterviewStore((s) => s.recommended);
  const selectedIds = useInterviewStore((s) => s.selectedIds);
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const toggleSelected = useInterviewStore((s) => s.toggleSelected);
  const setFinalQuestions = useInterviewStore((s) => s.setFinalQuestions);

  // 실서버 모드: store의 추천(FastAPI 결과)만 사용. mock 모드 + 딥링크로 추천이 비면 mock으로 채움.
  const list =
    recommended.length > 0 ? recommended : USE_MOCK ? recommendQuestions(job, interviewType) : [];
  const reachedMax = selectedIds.length >= 3;

  function onStart() {
    setFinalQuestions(buildFinalQuestions(list, selectedIds));
    navigate('/interview');
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={2} />
        <img src={thinkingMascot} alt="말거울 캐릭터" className="mx-auto w-32" />
        <div className="flex flex-col gap-1">
          <h1 className="text-display-md font-semibold text-ink">질문 3개를 골라주세요</h1>
          <p className="text-body-md text-muted">
            선택 {selectedIds.length}/3 · 고른 3문항으로 면접을 진행해요.
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
