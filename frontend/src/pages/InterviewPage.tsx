import { useRef, useState } from 'react';

import { apiClient } from '../lib/apiClient';

type TranscribeResult = {
  text: string;
  segments: { text: string; speaker?: { label: string; name?: string } }[];
  filler_analysis?: { total: number; counts: Record<string, number> };
};

export function InterviewPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStart = async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError('마이크 권한을 확인해주세요.');
    }
  };

  const handleStop = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      return;
    }

    mediaRecorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('media', blob, 'recording.webm');

      setIsUploading(true);
      try {
        const response = await apiClient.post<TranscribeResult>('/interview/transcribe', formData, {
          timeout: 60_000,
        });
        setResult(response.data);
      } catch {
        setError('음성 변환에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsUploading(false);
      }
    };

    mediaRecorder.stop();
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-3xl font-semibold">Interview Recording</h1>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              {isRecording ? '녹음 중...' : '면접 답변을 녹음해주세요.'}
            </span>

            {isRecording ? (
              <button
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-50"
                onClick={handleStop}
              >
                녹음 종료
              </button>
            ) : (
              <button
                className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
                disabled={isUploading}
                onClick={handleStart}
              >
                녹음 시작
              </button>
            )}
          </div>

          {isUploading ? <p className="mt-3 text-sm text-zinc-400">텍스트로 변환 중...</p> : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {result ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="rounded-md bg-zinc-950 p-3 text-sm text-zinc-100">{result.text}</p>
              {result.segments.length > 0 ? (
                <div className="flex flex-col gap-1 text-xs text-zinc-400">
                  {result.segments.map((segment, index) => (
                    <p key={index}>
                      <span className="font-medium text-cyan-300">
                        {segment.speaker?.name ?? segment.speaker?.label ?? '화자'}
                      </span>{' '}
                      {segment.text}
                    </p>
                  ))}
                </div>
              ) : null}

              {result.filler_analysis ? (
                <p className="text-xs text-zinc-400">
                  필러 단어 {result.filler_analysis.total}회
                  {Object.entries(result.filler_analysis.counts).length > 0
                    ? ` (${Object.entries(result.filler_analysis.counts)
                        .map(([word, count]) => `${word} ${count}회`)
                        .join(', ')})`
                    : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
