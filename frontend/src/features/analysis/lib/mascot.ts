// 말거울 마스코트 표정. 경로는 frontend/assets/images/ (Vite root=frontend 내부라 import 가능).
import cheeringImg from '../../../../assets/images/cheering.png';
import clapImg from '../../../../assets/images/clap.png';
import defaultImg from '../../../../assets/images/default.png';
import thinkingImg from '../../../../assets/images/thinking.png';

export type MascotKey = 'cheering' | 'clap' | 'default' | 'thinking';

export const MASCOT_SRC: Record<MascotKey, string> = {
  cheering: cheeringImg,
  clap: clapImg,
  default: defaultImg,
  thinking: thinkingImg,
};

// 종합 점수대별 반응. hello/listening은 온보딩·녹음 슬라이스용이라 제외.
export function scoreToMascot(score: number): MascotKey {
  if (score >= 85) return 'cheering';
  if (score >= 70) return 'clap';
  if (score >= 55) return 'default';
  return 'thinking';
}
