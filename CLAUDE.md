# CLAUDE.md

**Speech Mirror** — 음성 분석(STT) 결과를 보여주는 프로젝트. 현재 레포에는 프론트엔드만 있다.

- `frontend/` — React 19 + Vite + TS 클라이언트. 상세 규칙·명령어는 [frontend/CLAUDE.md](frontend/CLAUDE.md)
- 백엔드는 별도(레포 외부)이며 프론트는 `GET /analyses/:id`를 폴링한다. 기본 주소 `http://localhost:8080`

## 공통 규칙

- **답변은 항상 한국어** (코드/커맨드 제외)
- **`git push`·커밋은 명시 요청 시에만** — 자동 금지
- **Co-Authored-By 태그 금지**
- **커밋 메시지 형식** — `<type> : <설명> #<이슈번호>`
- **파일 삭제 시 사용자 허락 필수**
- **코드는 diff보다 intent(의도) 중심으로 판단** — 변경 라인 자체보다 왜 바뀌었는지, 요구사항·사용자 흐름·설계 목적에 맞는지를 우선 확인
- **모르면 모른다고** — 추측 금지

## 시작하기

```bash
cd frontend && npm install && cp .env.example .env.local && npm run dev
```
