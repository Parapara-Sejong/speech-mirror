import { useNavigate } from 'react-router-dom';

import helloMascot from '../../assets/images/hello.png';
import { FileDropzone } from '../components/interview/FileDropzone';
import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { extractText } from '../features/interview/lib/extractText';
import { useInterviewStore } from '../features/interview/store';
import type { SourceKey } from '../features/interview/store';

const FILE_HINT = 'TXT·MD는 미리보기까지 · PDF·DOCX는 업로드만';

export function UploadPage() {
  const navigate = useNavigate();
  const resume = useInterviewStore((s) => s.resume);
  const coverLetter = useInterviewStore((s) => s.coverLetter);
  const setSource = useInterviewStore((s) => s.setSource);

  // 파일 선택 시: 원본 보관 + TXT/MD면 미리보기 텍스트 채움
  async function onFile(key: SourceKey, file: File) {
    setSource(key, { file, fileName: file.name });
    const text = await extractText(file);
    if (text) setSource(key, { text });
  }

  const resumeReady = resume.text.trim().length > 0 || resume.file !== null;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={0} />
        <img src={helloMascot} alt="말거울 캐릭터" className="mx-auto w-24" />
        <h1 className="text-display-sm font-semibold text-ink">이력서 · 자기소개서</h1>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-md font-medium text-ink">이력서</h2>
          <FileDropzone
            label="이력서 파일을 끌어다 놓거나 클릭해 선택"
            accept=".txt,.md,.pdf,.docx"
            hint={FILE_HINT}
            fileName={resume.fileName}
            onFile={(f) => onFile('resume', f)}
          />
          <textarea
            value={resume.text}
            onChange={(e) => setSource('resume', { text: e.target.value })}
            placeholder="이력서 내용을 직접 입력하거나 파일에서 불러오세요."
            className="min-h-40 rounded-md border border-hairline bg-canvas p-4 text-body-md text-ink outline-none focus:border-primary"
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-title-md font-medium text-ink">
            자기소개서 <span className="text-body-sm text-muted">(선택)</span>
          </h2>
          <FileDropzone
            label="자기소개서 파일을 끌어다 놓거나 클릭해 선택"
            accept=".txt,.md,.pdf,.docx"
            hint={FILE_HINT}
            fileName={coverLetter.fileName}
            onFile={(f) => onFile('coverLetter', f)}
          />
          <textarea
            value={coverLetter.text}
            onChange={(e) => setSource('coverLetter', { text: e.target.value })}
            placeholder="자기소개서 내용을 직접 입력하거나 파일에서 불러오세요."
            className="min-h-40 rounded-md border border-hairline bg-canvas p-4 text-body-md text-ink outline-none focus:border-primary"
          />
        </section>

        <div className="flex justify-end">
          <Button onClick={() => navigate('/setup')} disabled={!resumeReady}>
            다음
          </Button>
        </div>
      </div>
    </main>
  );
}
