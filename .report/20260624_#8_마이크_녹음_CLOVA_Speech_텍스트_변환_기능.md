# 마이크 녹음 → CLOVA Speech 텍스트 변환 기능

### 📌 작업 개요
면접 답변을 마이크로 녹음하고, 녹음 종료 시 CLOVA Speech API로 텍스트 변환(STT)해서 화면에 보여주는 기능 추가. 이 레포에는 백엔드가 전혀 없었기 때문에 `backend/` 폴더를 신규 생성해서 FastAPI 서버를 함께 구현. 기존 화면(`AnalysisPage`, `ShowcasePage`)은 변경 없이, `/interview`라는 새 페이지에서만 동작.

### 🎯 구현 목표
- 브라우저 마이크 입력을 녹음해서 오디오 파일로 만든다
- 그 파일을 서버로 전송해 CLOVA Speech가 텍스트로 변환하게 한다
- 변환된 텍스트(전체 텍스트 + 화자별 구간)를 화면에 보여준다
- 마이크 권한 거부, 서버 오류 등 실패 상황에 사용자에게 에러를 보여준다

### ✅ 구현 내용

#### 프론트엔드 - 녹음 페이지 추가
- **파일**: `frontend/src/pages/InterviewPage.tsx` (신규)
- **변경 내용**: 녹음 시작/종료 버튼, 녹음 중 상태 표시, 업로드 중 로딩 표시, 전사 결과(전체 텍스트 + 화자별 구간) 렌더링까지 한 컴포넌트에 구현
- **이유**: 별도 훅/타입 파일로 나누지 않고 한 파일에 모아서, 기존 코드에 영향을 최소화하고 기능 단위로 한눈에 보이게 구성

#### 프론트엔드 - 라우팅 연결
- **파일**: `frontend/src/App.tsx`
- **변경 내용**: 상단 네비게이션에 "Interview" 링크 추가, `/interview` 경로에 `InterviewPage` 라우트 추가
- **이유**: 기존 `/`(Analysis), `/showcase` 화면은 그대로 두고 새 기능만 별도 경로로 분리

#### 백엔드 - STT 엔드포인트 신규 구현
- **파일**: `backend/app/main.py`, `backend/app/routers/interview.py`, `backend/app/services/clova_speech.py`, `backend/requirements.txt`, `backend/.env.example`
- **변경 내용**: FastAPI 앱과 `POST /interview/transcribe` 엔드포인트 신규 구현. 업로드된 오디오를 임시 파일로 저장 → CLOVA Speech 호출 → 결과 반환 → 임시 파일 삭제
- **이유**: 이 레포에 백엔드 코드가 전혀 없었어서(원래 별도 레포에서 관리) `backend/` 폴더를 새로 만들어 최소 구성으로 구현

### 🔧 전체 동작 흐름 (마이크 입력 → 화면 표시까지)

**1단계 — 마이크 권한 요청 및 녹음 시작**
- 사용자가 `/interview` 페이지에서 "녹음 시작" 버튼 클릭
- `InterviewPage.tsx`의 `handleStart()`가 `navigator.mediaDevices.getUserMedia({ audio: true })` 호출 → 브라우저가 마이크 권한 팝업 표시
- 권한 허용 시 `MediaRecorder`를 생성해 녹음 시작, 화면에 "녹음 중..." 표시로 전환
- 권한 거부/실패 시 `catch`에서 "마이크 권한을 확인해주세요." 에러 메시지를 화면에 표시하고 종료

**2단계 — 녹음 중 데이터 수집**
- `MediaRecorder.ondataavailable` 이벤트가 발생할 때마다 오디오 조각(Blob)을 `chunksRef`라는 배열에 누적
- 이 시점에는 아직 서버로 아무것도 전송되지 않음 (브라우저 메모리에만 보관)

**3단계 — 녹음 종료 및 오디오 파일 생성**
- "녹음 종료" 버튼 클릭 → `handleStop()` 실행 → `MediaRecorder.stop()` 호출
- `onstop` 콜백에서 마이크 스트림을 정지하고, 누적된 Blob 조각들을 합쳐 하나의 `audio/webm` Blob(오디오 파일)을 만듦

**4단계 — 백엔드로 업로드**
- 생성된 오디오 Blob을 `FormData`에 `media`라는 필드명으로 담아서 `apiClient.post('/interview/transcribe', formData)` 호출
- `apiClient`(axios)의 `baseURL`이 `VITE_API_BASE_URL`(기본값 `http://localhost:8080`)이므로, 실제 요청은 `POST http://localhost:8080/interview/transcribe`로 전송됨
- 업로드 중에는 화면에 "텍스트로 변환 중..." 표시 (`isUploading` 상태)
- 타임아웃은 60초로 설정 (CLOVA 응답이 늦어질 수 있어서 기본 10초보다 늘림)

**5단계 — 백엔드: 오디오 임시 저장**
- `backend/app/routers/interview.py`의 `transcribe()` 함수가 요청을 받음
- 업로드된 파일을 읽어서(`await media.read()`) OS 임시 폴더에 `.webm` 확장자로 임시 파일 생성 (`tempfile.NamedTemporaryFile`)

**6단계 — 백엔드: CLOVA Speech 호출**
- `backend/app/services/clova_speech.py`의 `transcribe_audio()`가 호출됨
- `.env`에서 읽어온 `CLOVA_INVOKE_URL`, `CLOVA_SECRET_KEY`로 `{CLOVA_INVOKE_URL}/recognizer/upload`에 `requests.post()` 전송
  - 헤더: `Accept: application/json;UTF-8`, `X-CLOVASPEECH-API-KEY: {SECRET}`
  - `multipart/form-data`로 오디오 파일(`media`)과 옵션(`params`, JSON 문자열)을 같이 전송
  - `params`에는 `language: ko-KR`, `completion: sync`, `diarization.enable: true`(화자 분리), `noiseFiltering: false`가 포함됨
- CLOVA가 동기(`sync`) 방식으로 처리해서 텍스트 변환 결과를 바로 응답으로 돌려줌

**7단계 — 백엔드: 임시 파일 삭제 및 응답 가공**
- CLOVA 응답(JSON)에서 `text`, `segments`, `speakers` 필드만 꺼내서 그대로 클라이언트에 반환
- 처리가 끝나면 `finally` 블록에서 임시 파일을 삭제 (`os.remove`) — 성공/실패 여부와 무관하게 항상 삭제됨
- CLOVA 호출이 실패하면(`ClovaSpeechError`) 적절한 HTTP 상태코드와 에러 메시지로 변환해 응답

**8단계 — 프론트엔드: 결과 표시**
- 프론트엔드가 `{ text, segments }` 형태의 JSON 응답을 받아 `result` 상태에 저장
- 전체 텍스트(`result.text`)를 회색 박스에 표시
- `result.segments`가 있으면 각 구간을 화자 이름(또는 라벨) + 발화 텍스트로 한 줄씩 나열
- 서버 요청이 실패하면(`catch`) "음성 변환에 실패했습니다. 다시 시도해주세요." 에러를 표시

### 🔧 주요 변경사항 상세

#### `noiseFiltering: false` (고정값)
한국어 필러 단어("음", "어", "그")를 텍스트 변환 결과에서 지우지 않고 그대로 보존하기 위한 설정. 면접 답변 분석에서는 이런 발화 습관 자체가 분석 대상이 될 수 있어 의도적으로 끄는 값. **변경하면 안 되는 값**으로 코드에 주석 처리해둠.

#### 임시 파일 처리
오디오를 메모리에만 들고 있지 않고 디스크에 임시로 저장한 뒤 CLOVA에 전송하는 방식 사용. 요청이 끝나면 무조건 삭제되도록 `try/finally` 구조로 작성해서 디스크에 오디오 파일이 남지 않게 함.

**특이사항**:
- CORS는 개발 단계라 모든 출처(`*`)를 허용하도록 설정. 실제 배포 전에는 프론트엔드 도메인으로 좁혀야 함
- CLOVA 응답을 그대로 통과시키는 구조라, CLOVA가 `segments`/`speakers` 형식을 바꾸면 프론트 타입(`TranscribeResult`)도 같이 맞춰야 함

### 📦 의존성 변경
- 백엔드 신규 설치: `fastapi`, `uvicorn[standard]`, `python-multipart`, `requests`, `python-dotenv`
- 프론트엔드: 신규 라이브러리 없음 (기존 axios 재사용)

### 🧪 테스트 및 검증
- `npm run lint`, `npm run build` 통과 확인
- 백엔드 파이썬 파일 문법 컴파일 확인 (`py_compile`)
- 실제 마이크 입력 → CLOVA 응답까지의 end-to-end 동작은 로컬에서 `.env`에 실제 키를 넣고 직접 확인 필요 (자동화된 테스트는 작성하지 않음)

### 📌 참고사항
- 백엔드 실행 전 `backend/.env`에 `CLOVA_INVOKE_URL`, `CLOVA_SECRET_KEY` 값이 채워져 있어야 함
- 로컬 실행: 백엔드(`uvicorn app.main:app --reload --port 8080`)와 프론트(`npm run dev`)를 각각 켜둔 상태에서 `http://localhost:5173/interview` 접속
- 추후 분석 화면(`AnalysisPage`)과 연동하려면 전사 결과를 분석 API로 넘기는 단계가 추가로 필요함 (현재는 `/interview` 화면 내에서 결과 표시까지만 구현)
