import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import listeningMascot from '../../assets/images/listening.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { MicStatus } from '../components/interview/MicStatus';
import { RecorderControls } from '../components/interview/RecorderControls';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { useRecorder } from '../features/interview/useRecorder';

export function InterviewPage() {
  const navigate = useNavigate();
  const storeFinal = useInterviewStore((s) => s.finalQuestions);

  // 딥링크 폴백: 최종 질문이 없으면 mock 4문항 구성
  const questions =
    storeFinal.length > 0
      ? storeFinal
      : buildFinalQuestions(recommendQuestions('', ''), ['q1', 'q2', 'q3']);

  const [index, setIndex] = useState(0);
  const recorder = useRecorder();
  const current = questions[index];
  const isLast = index === questions.length - 1;

  function onNext() {
    recorder.reset();
    if (isLast) {
      navigate('/result');
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={3} />
        <img src={listeningMascot} alt="말거울 캐릭터" className="mx-auto w-24" />
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted">
            {index + 1} / {questions.length}
          </span>
          <MicStatus status={recorder.micStatus} />
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-surface-card p-6">
          <Badge>{current.competency}</Badge>
          <p className="text-title-md text-ink">{current.question}</p>
        </div>
        <RecorderControls
          micStatus={recorder.micStatus}
          isRecording={recorder.isRecording}
          audioUrl={recorder.audioUrl}
          onRequestMic={recorder.requestMic}
          onStart={recorder.start}
          onStop={recorder.stop}
        />
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={recorder.isRecording}>
            {isLast ? '분석하기' : '다음 질문'}
          </Button>
        </div>
      </div>
    </main>
  );
}
