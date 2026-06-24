# CLAUDE.md

**Speech Mirror Frontend**: 음성 분석(STT) 결과를 백엔드 API에서 폴링해 보여주는 프론트엔드 스캐폴드.
React 19 + TypeScript + **Vite** / Tailwind CSS v4(Vite 플러그인) / 서버 상태=TanStack Query · 클라 상태=Zustand · HTTP=Axios / 패키지 매니저 **npm**

---

## 금지 규칙

- **`git push`·커밋은 명시 요청 시에만** — 사용자가 요청할 때만 커밋/푸시한다 (자동 금지)
- **Co-Authored-By 태그 금지** — 커밋 메시지에 절대 추가하지 않는다
- **커밋 메시지에 이슈 태그 필수** — 형식: `<type> : <설명> #<번호>`
- **파일 삭제 시 사용자 허락 필수** — 확인 없이 삭제하지 않는다
- **답변은 항상 한국어** — 코드/커맨드 제외 모두 한국어
- **모르면 모른다고** — 확실하지 않은 내용은 추측하지 않는다
- **주석은 한국어, WHY 중심** — 과하지 않게, 주변 코드 스타일에 맞춘다

---

## 필수 명령어

```bash
npm install         # 의존성 설치
npm run dev         # 개발 서버 (Vite)
npm run build       # 타입체크(tsc -b) + 프로덕션 빌드
npm run lint        # ESLint
npm run format      # Prettier
npm run preview     # 빌드 결과 미리보기
```

## 환경 변수

`.env.example` → `.env.local` 복사. `VITE_API_BASE_URL` 미설정 시 `http://localhost:8080` 사용.

---

## 구조

```
src/
  main.tsx                     # 엔트리, QueryProvider 주입
  App.tsx                      # 분석 ID 입력 + 결과 폴링 UI
  lib/apiClient.ts             # axios 인스턴스 (baseURL = VITE_API_BASE_URL)
  providers/                   # QueryClient 생성 + QueryProvider
  stores/useAnalysisStore.ts   # 선택된 analysisId (Zustand)
  features/analysis/
    types.ts                   # AnalysisResult, AnalysisStatus
    useAnalysisQuery.ts        # GET /analyses/:id 폴링 훅
```

## 핵심 원칙

- **데이터 패칭** — 서버 상태는 TanStack Query로만. axios 직접 호출은 `features/*/use*Query.ts` 안에 둔다 (컴포넌트에서 직접 fetch 금지)
- **폴링** — `status`가 `pending`·`processing`이면 2초 간격 재요청, 그 외 중단 (`useAnalysisQuery.ts` 참조)
- **클라 상태** — UI/선택 상태는 Zustand. 서버 데이터를 Zustand에 복제하지 않는다
- **API 계약** — `GET /analyses/:id` → `AnalysisResult`(`id`, `status`, `createdAt`, `updatedAt`, 선택 `transcript`·`summary`). 변경 시 `types.ts`를 단일 진실로 함께 수정
- **스타일** — Tailwind 유틸리티. 디자인 토큰 참고는 `.claude/rules/DESIGN.md`
