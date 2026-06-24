import { ChangeEvent, DragEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import helloMascot from '../../assets/images/hello.png';
import { FlowProgress } from '../components/interview/FlowProgress';
import { Button } from '../components/ui/Button';
import { extractResume } from '../features/interview/lib/extractResume';
import { useInterviewStore } from '../features/interview/store';
import { cn } from '../lib/cn';

export function UploadPage() {
  const navigate = useNavigate();
  const resumeText = useInterviewStore((s) => s.resumeText);
  const setResumeText = useInterviewStore((s) => s.setResumeText);
  const [notice, setNotice] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // 파일 1개 추출 시도 → TXT면 본문 채움, 그 외/실패는 직접 입력 안내
  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await extractResume(file);
    if (text) {
      setResumeText(text);
      setNotice('이력서 텍스트를 추출했어요. 필요하면 수정하세요.');
    } else {
      setNotice('이 형식은 자동 추출이 안 돼요. 아래에 내용을 직접 붙여넣어 주세요.');
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <FlowProgress current={0} />
        <img src={helloMascot} alt="말거울 캐릭터" className="mx-auto w-24" />
        <h1 className="text-display-sm font-semibold text-ink">이력서 업로드</h1>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-8 text-center',
            dragActive ? 'border-primary bg-surface-soft' : 'border-hairline bg-canvas',
          )}
        >
          <span className="text-title-sm font-medium text-ink">
            이력서 파일을 끌어다 놓거나 클릭해 선택
          </span>
          <span className="text-body-sm text-muted">TXT는 자동 추출 · PDF·DOCX 등은 아래에 직접 입력</span>
          {fileName ? <span className="mt-1 text-body-sm text-primary">{fileName}</span> : null}
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={onInputChange}
            aria-label="이력서 파일 선택"
            className="sr-only"
          />
        </label>

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
