import { useState } from 'react';

import { ContentFeedbackPanel } from '../components/result/ContentFeedbackPanel';
import { FillerCard } from '../components/result/FillerCard';
import { ImprovementList } from '../components/result/ImprovementList';
import { ReportHeader } from '../components/result/ReportHeader';
import { ScorePanel } from '../components/result/ScorePanel';
import { SilenceCard } from '../components/result/SilenceCard';
import { SpeedGraph } from '../components/result/SpeedGraph';
import { TranscriptPanel } from '../components/result/TranscriptPanel';
import { CategoryTab } from '../components/ui/CategoryTab';
import { useAnalysisReportQuery } from '../features/analysis/useAnalysisReportQuery';
import { useAnalysisStore } from '../stores/useAnalysisStore';

export function ResultPage() {
  const sessionId = useAnalysisStore((s) => s.sessionId);
  const { data: session, isLoading, error } = useAnalysisReportQuery(sessionId);
  const [active, setActive] = useState(0);

  if (isLoading || session?.status === 'processing') {
    return <main className="bg-canvas p-12 text-center text-muted">분석 결과 불러오는 중…</main>;
  }
  if (error || !session || session.status === 'failed') {
    return <main className="bg-canvas p-12 text-center text-error">결과를 불러오지 못했습니다.</main>;
  }

  // 탭 선택 답변(범위 밖이면 첫 답변)
  const answer = session.answers[active] ?? session.answers[0];
  const m = answer.speechMetrics;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        {/* 면접 전체 종합 */}
        <section className="flex flex-col gap-4">
          <h1 className="text-display-sm text-ink">면접 종합 리포트</h1>
          <ScorePanel overallScore={session.overall.score} scores={session.overall.scores} />
          <p className="text-body-md text-body">{session.overall.summary}</p>
          <ImprovementList points={session.overall.improvementPoints} />
        </section>

        {/* 답변별 상세 — 탭으로 전환 */}
        <section className="flex flex-col gap-3 border-t border-hairline pt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-title-lg font-medium text-ink">답변별 상세</h2>
            <span className="text-body-sm text-muted">질문 {session.answers.length}개 · 탭 선택</span>
          </div>
          <nav className="flex flex-wrap gap-2">
            {session.answers.map((a, i) => (
              <CategoryTab key={a.question} active={i === active} onClick={() => setActive(i)}>
                {`Q${i + 1} · ${a.questionCompetency}`}
              </CategoryTab>
            ))}
          </nav>
        </section>

        {/* 선택한 답변 상세 — 기존 per-answer 컴포넌트 재사용 */}
        <ReportHeader question={answer.question} competency={answer.questionCompetency} />
        <TranscriptPanel transcript={answer.transcript} fillerWords={m.fillerWords} />
        <ScorePanel overallScore={answer.overallScore} scores={answer.scores} />
        <SpeedGraph rateSeries={m.rateSeries} averageWpm={m.speakingRate} />
        <div className="grid gap-6 sm:grid-cols-2">
          <SilenceCard
            silenceCount={m.silenceCount}
            longestSilence={m.longestSilence}
            speechRatio={m.speechRatio}
          />
          <FillerCard fillerWords={m.fillerWords} />
        </div>
        <ContentFeedbackPanel feedback={answer.contentFeedback} />
        <ImprovementList points={answer.improvementPoints} />
      </div>
    </main>
  );
}
