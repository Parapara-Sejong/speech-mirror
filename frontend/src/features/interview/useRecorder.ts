import { useEffect, useRef, useState } from 'react';

export type MicStatus = 'idle' | 'ready' | 'recording' | 'denied' | 'error';

export function useRecorder() {
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // 마이크 권한 요청 + 스트림 확보
  async function requestMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus('ready');
    } catch {
      setMicStatus('denied');
    }
  }

  function revoke() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function start() {
    const stream = streamRef.current;
    if (!stream) {
      setMicStatus('error');
      return;
    }
    revoke();
    setAudioUrl(null);
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setMicStatus('recording');
  }

  function stop() {
    recorderRef.current?.stop();
    setMicStatus('ready');
  }

  // 다음 질문으로 넘어갈 때 현재 녹음 정리
  function reset() {
    revoke();
    setAudioUrl(null);
  }

  // 언마운트 시 스트림·URL 정리
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      revoke();
    };
  }, []);

  return {
    micStatus,
    isRecording: micStatus === 'recording',
    audioUrl,
    requestMic,
    start,
    stop,
    reset,
  };
}
