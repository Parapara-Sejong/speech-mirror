import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import helloMascot from '../../assets/images/hello.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { extractResume } from '../features/interview/lib/extractResume';
import { useInterviewStore } from '../features/interview/store';

export function UploadPage() {
  const navigate = useNavigate();
  const resumeText = useInterviewStore((s) => s.resumeText);
  const setResumeText = useInterviewStore((s) => s.setResumeText);
  const [notice, setNotice] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractResume(file);
    if (text) {
      setResumeText(text);
      setNotice('이력서 텍스트를 추출했어요. 필요하면 수정하세요.');
    } else {
      setNotice('이 형식은 자동 추출이 안 돼요. 내용을 직접 붙여넣어 주세요.');
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={0} />
        <img src={helloMascot} alt="말거울 캐릭터" className="mx-auto w-24" />
        <h1 className="text-display-sm font-semibold text-ink">이력서 업로드</h1>
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={onFile}
          aria-label="이력서 파일 선택"
          className="text-body-sm text-body"
        />
        {notice ? <p className="text-body-sm text-muted">{notice}</p> : null}
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="이력서 내용을 직접 입력하거나 파일에서 추출하세요."
          className="min-h-48 rounded-md border border-hairline bg-canvas p-4 text-body-md text-ink outline-none focus:border-primary"
        />
        <div className="flex justify-end">
          <Button onClick={() => navigate('/setup')} disabled={resumeText.trim().length === 0}>
            다음
          </Button>
        </div>
      </div>
    </main>
  );
}
