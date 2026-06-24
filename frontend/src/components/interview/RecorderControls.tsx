import type { MicStatus } from '../../features/interview/useRecorder';
import { Button } from '../ui/Button';

type RecorderControlsProps = {
  micStatus: MicStatus;
  isRecording: boolean;
  audioUrl: string | null;
  onRequestMic: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function RecorderControls({
  micStatus,
  isRecording,
  audioUrl,
  onRequestMic,
  onStart,
  onStop,
}: RecorderControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      {micStatus === 'idle' ? (
        <Button onClick={onRequestMic}>마이크 켜기</Button>
      ) : isRecording ? (
        <Button onClick={onStop}>녹음 정지</Button>
      ) : (
        <Button onClick={onStart} disabled={micStatus === 'denied' || micStatus === 'error'}>
          {audioUrl ? '다시 녹음' : '녹음 시작'}
        </Button>
      )}
      {audioUrl && !isRecording ? (
        <audio controls src={audioUrl} className="w-full">
          <track kind="captions" />
        </audio>
      ) : null}
    </div>
  );
}
