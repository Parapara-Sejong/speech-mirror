import { AudioTimelinePlayer } from '../components/result/AudioTimelinePlayer';
import { ContentFeedbackPanel } from '../components/result/ContentFeedbackPanel';
import { FillerCard } from '../components/result/FillerCard';
import { ImprovementList } from '../components/result/ImprovementList';
import { ReportHeader } from '../components/result/ReportHeader';
import { ScorePanel } from '../components/result/ScorePanel';
import { SilenceCard } from '../components/result/SilenceCard';
import { SpeedGraph } from '../components/result/SpeedGraph';
import { TranscriptPanel } from '../components/result/TranscriptPanel';
import { useAnalysisReportQuery } from '../features/analysis/useAnalysisReportQuery';

export function ResultPage() {
  const { data: report, isLoading, error } = useAnalysisReportQuery('demo-1');

  if (isLoading) {
    return <main className="bg-canvas p-12 text-center text-muted">분석 결과 불러오는 중…</main>;
  }
  if (error || !report) {
    return <main className="bg-canvas p-12 text-center text-error">결과를 불러오지 못했습니다.</main>;
  }

  const m = report.speechMetrics;

  return (
    <main className="min-h-screen bg-canvas">
      <AudioTimelinePlayer audioUrl={report.audioUrl} timeline={report.timeline} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <ReportHeader question={report.question} competency={report.questionCompetency} />
        <TranscriptPanel transcript={report.transcript} fillerWords={m.fillerWords} />
        <ScorePanel overallScore={report.overallScore} scores={report.scores} />
        <SpeedGraph rateSeries={m.rateSeries} averageWpm={m.speakingRate} />
        <div className="grid gap-6 sm:grid-cols-2">
          <SilenceCard
            silenceCount={m.silenceCount}
            longestSilence={m.longestSilence}
            speechRatio={m.speechRatio}
          />
          <FillerCard fillerWords={m.fillerWords} />
        </div>
        <ContentFeedbackPanel feedback={report.contentFeedback} />
        <ImprovementList points={report.improvementPoints} />
      </div>
    </main>
  );
}
