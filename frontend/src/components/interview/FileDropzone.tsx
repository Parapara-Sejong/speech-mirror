import { ChangeEvent, DragEvent, useState } from 'react';

import { cn } from '../../lib/cn';

type FileDropzoneProps = {
  label: string;
  accept: string;
  fileName: string; // 선택된 파일명('' = 없음)
  hint?: string;
  onFile: (file: File) => void;
};

// 이력서/자기소개서/인재상 공통 파일 드롭존. 클릭·드래그&드롭으로 파일 1개 선택.
// 추출은 하지 않고 File만 넘긴다(미리보기 추출/업로드는 호출부·백엔드 담당).
export function FileDropzone({ label, accept, fileName, hint, onFile }: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-6 text-center',
        dragActive ? 'border-primary bg-surface-soft' : 'border-hairline bg-canvas',
      )}
    >
      <span className="text-title-sm font-medium text-ink">{label}</span>
      {hint ? <span className="text-body-sm text-muted">{hint}</span> : null}
      {fileName ? <span className="mt-1 text-body-sm text-primary">{fileName}</span> : null}
      <input
        type="file"
        accept={accept}
        onChange={onInputChange}
        aria-label={label}
        className="sr-only"
      />
    </label>
  );
}
