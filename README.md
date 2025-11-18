## 온라인 컴파일러 (Online Compiler) 🚀

멀티 언어를 지원하는 **온라인 코드 실행기(온라인 컴파일러)** 입니다.  
프론트엔드는 React + Vite 기반의 단일 페이지 애플리케이션이며, 백엔드는 Express 기반 Node 서버가 **Docker 컨테이너**를 통해 코드를 안전하게 실행합니다.

### 주요 특징 ✨

- **다중 언어 지원** 🧪: Python, JavaScript, Java, C/C++, C#, Go, Rust, PHP, R, Ruby, Kotlin, TypeScript, Swift, Perl, Haskell, Bash 등
- **Docker 격리 실행** 🐳: 각 언어별 공식 Docker 이미지를 사용하여 코드 실행 환경을 격리
- **실행 제한** 🧯: 실행 시간, 메모리, CPU, 출력 크기 제한으로 서버 보호
- **코드/설정 보존** 💾: 언어별 코드, 인터페이스 언어, 테마, 폰트 설정 등을 `localStorage` 에 자동 저장
- **사용자 경험(UI/UX)** 🎨:
  - Ace 기반 코드 에디터
  - 실행 결과/오류 콘솔, 실행 시간(ms) 표시
  - R 언어의 경우 이미지 출력(`png`)을 지원하여 결과 이미지를 UI에 표시
  - 다국어 지원(한국어/영어), 다크/라이트/시스템 테마
  - 키보드 단축키(Ctrl+Enter 실행, Ctrl+K 초기화, Ctrl+Shift+/ 단축키 도움말 표시 등)

### 빠르게 시작하기 ⏱️

1. 루트에서 `npm install` 실행
2. `cd frontend && npm install`, `cd ../backend && npm install`
3. 루트에서 `npm run dev` 실행
4. 브라우저에서 `http://localhost:5173` 접속 후 코드 작성 → **Ctrl+Enter** 로 실행

---

## 기술 스택 🧰

- **프론트엔드**
  - React 19, TypeScript
  - Vite
  - Ace Editor (`react-ace`, `ace-builds`)
  - Tailwind 기반 유틸리티 + 커스텀 CSS
- **백엔드**
  - Node.js (TypeScript)
  - Express 5, CORS, Helmet, express-rate-limit
  - Docker CLI 연동 (`docker run`, `docker images`, `docker pull` 등)
- **인프라/실행**
  - Docker / Docker Desktop
  - `docker-compose` 로 백엔드 컨테이너 실행

---

## 디렉터리 구조 개요 🗂️

- `backend/`  
  - `server.ts`: Express 서버 진입점, 미들웨어/라우팅/워밍업 설정
  - `routes/execute.ts`: `/api/execute` 엔드포인트, 코드 검증 및 Docker 실행 요청
  - `routes/health.ts`: `/api/health` 헬스 체크
  - `config/`: 언어별 Docker 이미지/명령어, 리소스 제한, 위험 패턴, 타임아웃 등 설정
  - `docker/`: Docker 명령 실행, 이미지 프리로드 및 컨테이너 워밍업
  - `execution/`: Docker 프로세스 실행/출력 수집/결과 후처리
  - `file/`: 코드/입력/출력 파일 관리, 디렉터리 생성
  - `middleware/`: rate limit 설정
  - `utils/`: 경로/검증/에러 메시지 필터링 유틸리티
- `frontend/`  
  - `src/App.tsx`: 전역 컨텍스트와 페이지(컴파일러/설정) 스위칭
  - `src/pages/CompilerPage.tsx`: 코드 에디터, 언어 선택, 실행/초기화, 결과 패널
  - `src/pages/SettingsPage.tsx`: 테마, 폰트, 인터페이스 언어 설정
  - `src/context/AppContext.tsx`: 앱 상태(코드, 언어, 테마, 실행 상태 등) 전역 관리
  - `src/services/api.ts`: 백엔드 `/api/execute` 호출
  - `src/components/`: `CodeEditor`, `OutputPanel`, `Header`, `Modal`, `Toast`, `KeyboardShortcuts` 등 UI 컴포넌트
  - `src/config/constants.ts`: 프론트 설정, 언어별 템플릿/아이콘/표기, 폰트 목록
  - `src/i18n/translations.ts`: 한/영 번역
  - `src/utils/outputFormatter.ts`: 백엔드 출력/오류 문자열 정리
- 최상위
  - `docker-compose.yml`: 백엔드 컨테이너 실행 정의
  - `package.json`: 루트 스크립트(dev, lint, docker:up 등) 정의
  - `LICENSE.md`: Apache-2.0 라이선스 템플릿

---

## 설치 및 실행 🛠️

### 1. 사전 요구 사항

- Node.js (LTS 버전 권장)
- npm 또는 pnpm
- Docker 및 Docker Compose
  - 로컬 실행 시 **Docker Desktop** 실행 필요 (Windows/macOS)
  - 백엔드 컨테이너는 호스트의 Docker 데몬(`docker.sock`)을 사용하여 언어별 실행용 컨테이너를 추가로 띄웁니다.

### 2. 의존성 설치

루트, 프론트엔드, 백엔드 각각에서 필요한 패키지를 설치합니다.

```bash
# 루트 스크립트를 위한 dev 의존성 설치
npm install

# 프론트엔드
cd frontend
npm install

# 백엔드
cd ../backend
npm install
```

### 3. 개발 서버 실행 (로컬 개발)

루트 `package.json` 에 정의된 스크립트를 사용하면 편리합니다.

```bash
# 루트에서 실행
npm run dev         # 프론트엔드 + 백엔드 동시 실행 (scripts/dev.cjs)

# 또는 개별 실행
npm run dev:frontend
npm run dev:backend
```

- 프론트엔드: 기본 `http://localhost:5173`
- 백엔드: 기본 `http://localhost:4000`
  - 프론트엔드의 Vite dev 서버는 `/api` 경로를 백엔드로 프록시 합니다.  
    (`frontend/vite.config.ts` 참고)

### 4. Docker 환경에서 실행 (백엔드만 컨테이너로 실행)

백엔드를 Docker 컨테이너로 실행할 수 있습니다.

```bash
# 백엔드 컨테이너 빌드 및 실행
npm run docker:build
npm run docker:up

# 로그 확인
npm run docker:logs

# 종료
npm run docker:down
```

- `docker-compose.yml` 에서 `backend` 서비스가 정의되어 있습니다.
- 컨테이너 내부 포트는 3000이며, 호스트 포트는 `BACKEND_PORT` 환경 변수로 조정 가능(기본 3000).
- 프론트엔드는 여전히 로컬 Vite dev 서버(또는 별도 배포된 정적 파일)로 접근하고, `/api` 요청만 백엔드 컨테이너로 전달합니다.

---

## 환경 변수 ⚙️

### docker-compose / 백엔드

`docker-compose.yml` 및 `backend/config/index.ts` 기준 주요 환경 변수는 다음과 같습니다.

- **포트 관련**
  - `BACKEND_PORT`: 호스트에서 노출할 백엔드 포트 (기본: 3000)
  - `PORT`: 컨테이너 내부 서버 포트 (기본: 3000, `CONFIG.PORT` 기본값은 4000이지만 compose 환경에서 덮어씀)
- **리소스 제한**
  - `MAX_OUTPUT_BYTES`: 최대 출력 바이트 수 (기본: 1MB)
  - `MAX_INPUT_LENGTH`: 입력 문자열 최대 길이 (기본: 1,000,000)
- **동작 플래그**
  - `ENABLE_PRELOAD`: 서버 시작 시 언어별 Docker 이미지 사전 pull 여부 (기본: `true`)
  - `ENABLE_WARMUP`: 언어별 실행 환경 워밍업 여부 (기본: `true`)
  - `TRUST_PROXY`: 프록시 신뢰 설정 (기본: `false`)
  - `DEBUG`: 디버그 로그 활성화 (`true`/`false`, 기본: 개발 환경에서 자동 활성화)
- **기타 (JSON 문자열)**
  - `CPU_LIMITS`, `TMPFS_SIZES`, `EXECUTION_TIMEOUTS`, `WARMUP_TIMEOUTS` 등은 언어별 제한값을 JSON으로 덮어쓸 수 있습니다.

`.env` 파일은 선택적이며, 존재하지 않으면 기본값을 사용합니다.

### 프론트엔드

- `VITE_API_URL`
  - 기본적으로 비워져 있으며, Vite dev 서버의 proxy(`/api` → 백엔드)를 이용해 상대 경로로 호출합니다.
  - 별도 도메인/포트의 API 서버를 사용할 경우 이 값을 설정합니다. (예: `https://api.example.com`)

---

## API 개요 📡

### `POST /api/execute`

코드를 Docker 컨테이너에서 실행하고 결과를 반환합니다.

- **Request Body (JSON)**:
  - `code` (string, required): 실행할 코드
  - `language` (string, required): 언어 키 (예: `python`, `javascript`, `java`, `c`, `cpp`, `csharp`, `go`, `rust`, `php`, `r`, `ruby`, `kotlin`, `typescript`, `swift`, `perl`, `haskell`, `bash`)
  - `input` (string, optional): 표준 입력으로 전달할 문자열
- **Response (200)**:
  - `output` (string, optional): 표준 출력 결과 (필터링/정리 후)
  - `error` (string, optional): 사용자에게 노출 가능한 오류 메시지
  - `executionTime` (number, ms): 실행 시간 (백엔드에서 측정)
  - `images` (optional): 이미지 결과 배열 (주로 R의 `plot` 등)
    - `name`: 파일 이름
    - `data`: `data:image/...;base64,...` 형식의 Base64 인코딩 데이터

**검증/제한 사항 ✅**

- `code` / `language` 필수, 타입 검사
- `MAX_CODE_LENGTH` (기본 100,000자) 초과 시 400 응답
- `MAX_INPUT_LENGTH` 초과 시 400 응답
- 언어는 사전에 허용된 목록만 가능 (`backend/config/index.ts`의 `ALLOWED_LANGUAGES`)
- 코드 내 위험 패턴 (`rm -rf`, `docker`, `sudo` 등)은 실행 전에 차단
- Docker가 설치/실행되지 않은 경우, 사용자 친화적인 한글 오류 메시지 반환

### `GET /api/health`

서버 상태 확인용 엔드포인트입니다.

- **Response**:
  - `{ "status": "ok" }`

`docker-compose.yml` 의 healthcheck 에서 이 엔드포인트를 사용합니다.

---

## 코드 실행 동작 방식 🔁

1. **프론트엔드**
   - `CompilerPage` 에서 사용자 코드/입력/언어를 관리
   - `executeCode` (`frontend/src/services/api.ts`)로 `/api/execute` 호출
   - 응답으로 받은 `output`, `error`, `images`, `executionTime` 을 `OutputPanel` 에 표시하고, 오류 시 Toast로 알림
2. **백엔드**
   - `routes/execute.ts`:
     - 요청 본문 검증 (`validateLanguage`, `sanitizeCode`, `validateJavaClass` 등)
     - 세션 ID 생성 후 `codeDir` 에 코드 파일 생성, 필요한 경우 입력 파일 생성
     - 언어별 `LANGUAGE_CONFIGS` 에서 Docker 이미지/실행 명령 구성
     - `executeDockerProcess` 를 호출해 `docker run ...` 실행
   - `execution/executor.ts`:
     - `spawn('docker', args)` 로 Docker 컨테이너 실행
     - `OutputCollector` 로 stdout/stderr를 최대 크기까지 버퍼링
     - 타임아웃/AbortController를 사용해 장시간 실행을 강제로 종료
     - 종료 후 `handleExecutionResult` 에게 결과 위임
   - `execution/resultHandler.ts`:
     - Docker 관련 로그/ANSI 코드 제거, 파일 경로 마스킹
     - R 결과 이미지가 있을 경우 파일을 읽어 Base64로 인코딩 후 응답에 포함
     - 필요 시 출력 디렉터리 삭제
   - `docker/dockerImage.ts`, `docker/dockerWarmup.ts`:
     - 서버 시작 시 언어별 Docker 이미지 존재 여부 확인 및 필요 시 `docker pull`
     - 자주 쓰는 언어(python, javascript, java, cpp 등)에 대한 정기 워밍업

---

## 보안 및 제한 사항 🔒

- **Docker 격리**
  - `--network=none` (일부 언어 제외)로 외부 네트워크 차단
  - `--read-only` 루트 파일 시스템, `/tmp` 만 `tmpfs`로 읽기/쓰기 가능
  - `--cap-drop=ALL`, `--security-opt no-new-privileges`
  - `--pids-limit`, `--ulimit nofile` 등으로 프로세스/파일 디스크립터 제한
- **코드 검증**
  - `DANGEROUS_PATTERNS` 를 통해 시스템 파괴/권한 상승 시도를 사전에 차단
  - 파일 경로 검증(`validatePath`, `convertToDockerPath`)으로 컨테이너 마운트 경로를 엄격히 제한
- **리소스 제한**
  - 언어별 CPU/메모리/타임아웃 설정 (`CPU_LIMITS`, `TMPFS_SIZES`, `EXECUTION_TIMEOUTS`)
  - 출력 크기 제한(`MAX_OUTPUT_BYTES`) 및 오버플로우 시 `[truncated]` 표시

이 프로젝트는 **교육/실험/데모용**으로 설계되었으며, 악의적 사용을 완전히 방지한다고 보장할 수는 없습니다.  
실서비스에 사용할 경우 **별도 샌드박스, 네트워크/권한 추가 격리, 자원 모니터링** 등 추가적인 방어를 반드시 검토해야 합니다.

---

## 개발 관련 스크립트 📜

루트:

- `npm run dev`: 프론트엔드/백엔드 동시 개발 서버 실행 (`scripts/dev.cjs`)
- `npm run test`: 테스트 스크립트 (구현 여부에 따라 다를 수 있음)
- `npm run clean`: 빌드 산출물/캐시 정리
- `npm run lint`, `npm run lint:fix`: ESLint 검사 및 자동 수정

백엔드(`backend/`):

- `npm run dev`: `tsx watch` 로 타입스크립트 실시간 실행
- `npm run build`: `tsc`로 빌드
- `npm run start`: 빌드 결과(`dist/server.js`) 실행
- `npm run type-check`: 타입 검사만 수행

프론트엔드(`frontend/`):

- `npm run dev`: Vite 개발 서버 (포트 기본 5173)
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 결과 미리보기
- `npm run lint`: ESLint 검사

---

## 라이선스 📄

`LICENSE.md` 파일은 Apache License 2.0 템플릿을 포함하고 있습니다.  
실제로 사용할 때는 저작권자 이름/연도 등을 프로젝트에 맞게 수정해야 합니다.


