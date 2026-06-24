import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import listeningMascot from '../../assets/images/listening.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { MicStatus } from '../components/interview/MicStatus';
import { RecorderControls } from '../components/interview/RecorderControls';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { submitAnalysis, type AnswerUpload } from '../features/analysis/analysisApi';
import { buildFinalQuestions } from '../features/interview/lib/buildFinalQuestions';
import { recommendQuestions } from '../features/interview/mockQuestions';
import { useInterviewStore } from '../features/interview/store';
import { useRecorder } from '../features/interview/useRecorder';
import { USE_MOCK } from '../lib/config';
import { useAnalysisStore } from '../stores/useAnalysisStore';

export function InterviewPage() {
  const navigate = useNavigate();
  const storeFinal = useInterviewStore((s) => s.finalQuestions);

  // 실서버 모드: store의 최종 질문만 사용. mock 모드 + 딥링크로 비면 mock 4문항 구성.
  const questions =
    storeFinal.length > 0
      ? storeFinal
      : USE_MOCK
        ? buildFinalQuestions(recommendQuestions('', ''), ['q1', 'q2', 'q3'])
        : [];

  const setSessionId = useAnalysisStore((s) => s.setSessionId);
  const answersRef = useRef<AnswerUpload[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [index, setIndex] = useState(0);
  const recorder = useRecorder();
  const current = questions[index];
  const isLast = index === questions.length - 1;

  // 질문 없이 직접 진입(실서버 모드 딥링크 등) — 처음부터 진행하도록 안내
  if (!current) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <p className="text-title-md text-ink">진행할 질문이 없어요.</p>
          <Button onClick={() => navigate('/setup')}>처음부터 시작</Button>
        </div>
      </main>
    );
  }

  // 현재 답변 녹음을 누적(업로드용). blob이 없으면(녹음 안 함) 건너뜀.
  function captureCurrent() {
    if (recorder.audioBlob) {
      answersRef.current.push({
        blob: recorder.audioBlob,
        question: current.question,
        competency: current.competency,
      });
    }
  }

  async function onNext() {
    captureCurrent();
    if (!isLast) {
      recorder.reset();
      setIndex((i) => i + 1);
      return;
    }
    // 마지막 질문: mock 모드는 업로드 없이 결과(MOCK_SESSION)로, 실서버는 업로드 후 세션 id 연결.
    if (USE_MOCK) {
      recorder.reset();
      navigate('/result');
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await submitAnalysis(answersRef.current);
      setSessionId(id);
      recorder.reset();
      navigate('/result');
    } catch {
      setSubmitting(false);
      alert('분석 요청에 실패했습니다. 백엔드 서버를 확인하세요.');
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={3} />
        <img src={listeningMascot} alt="말거울 캐릭터" className="mx-auto w-32" />
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
          <Button onClick={onNext} disabled={recorder.isRecording || submitting}>
            {isLast ? (submitting ? '분석 요청 중…' : '분석하기') : '다음 질문'}
          </Button>
        </div>
      </div>
    </main>
  );
}
