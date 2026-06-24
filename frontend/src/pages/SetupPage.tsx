import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import cheeringMascot from '../../assets/images/cheering.png';
import { FileDropzone } from '../components/interview/FileDropzone';
import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { CategoryTab } from '../components/ui/CategoryTab';
import { extractText } from '../features/interview/lib/extractText';
import { generateQuestions } from '../features/interview/questionApi';
import { useInterviewStore } from '../features/interview/store';
import { IDEAL_TRAITS, INTERVIEW_TYPES, JOBS } from '../features/interview/types';

export function SetupPage() {
  const navigate = useNavigate();
  const job = useInterviewStore((s) => s.job);
  const interviewType = useInterviewStore((s) => s.interviewType);
  const mode = useInterviewStore((s) => s.mode);
  const resume = useInterviewStore((s) => s.resume);
  const coverLetter = useInterviewStore((s) => s.coverLetter);
  const idealProfile = useInterviewStore((s) => s.idealProfile);
  const idealTraits = useInterviewStore((s) => s.idealTraits);
  const setJob = useInterviewStore((s) => s.setJob);
  const setInterviewType = useInterviewStore((s) => s.setInterviewType);
  const setMode = useInterviewStore((s) => s.setMode);
  const setSource = useInterviewStore((s) => s.setSource);
  const toggleIdealTrait = useInterviewStore((s) => s.toggleIdealTrait);
  const setRecommended = useInterviewStore((s) => s.setRecommended);

  const [generating, setGenerating] = useState(false);
  const ready = job !== '' && interviewType !== '';

  // 인재상 파일: 원본 보관 + TXT/MD면 미리보기 텍스트
  async function onIdealFile(file: File) {
    setSource('idealProfile', { file, fileName: file.name });
    const text = await extractText(file);
    if (text) setSource('idealProfile', { text });
  }

  // 질문 생성(현재 mock). 백엔드 연동 시 generateQuestions만 실제 호출로 동작.
  async function onProceed() {
    setGenerating(true);
    try {
      const questions = await generateQuestions({
        resume,
        coverLetter,
        idealProfile,
        idealTraits,
        job,
        interviewType,
      });
      setRecommended(questions);
      navigate('/questions');
    } finally {
      setGenerating(false);
    }
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
          <p className="text-body-sm text-muted">
            지원 회사가 원하는 가치를 고르거나, 인재상 파일(.md·.pdf 등)을 올리면 추후 질문·피드백에
            반영돼요.
          </p>
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
          <FileDropzone
            label="인재상 파일을 끌어다 놓거나 클릭해 선택"
            accept=".txt,.md,.pdf,.docx"
            hint="TXT·MD는 미리보기까지 · PDF·DOCX는 업로드만"
            fileName={idealProfile.fileName}
            onFile={onIdealFile}
          />
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
          <Button onClick={onProceed} disabled={!ready || generating}>
            {generating ? '질문 생성 중…' : '질문 추천 받기'}
          </Button>
        </div>
      </div>
    </main>
  );
}
