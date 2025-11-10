# 온라인 컴파일러

다양한 프로그래밍 언어를 지원하는 웹 기반 코드 실행 환경입니다. Docker를 사용하여 안전하고 격리된 환경에서 코드를 실행합니다.

## 주요 기능

- **다양한 언어 지원**: Python, JavaScript, Java, C++, C, Rust, PHP
- **안전한 실행 환경**: Docker 컨테이너를 통한 코드 격리
- **실시간 실행**: 코드 작성 후 즉시 실행 및 결과 확인

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/nevcea/online-compiler.git
cd online-compiler
```

### 2. 의존성 설치

```bash
npm install
cd backend
npm install
cd ..
```

### 3. 개발 환경 시작

```bash
npm run dev
```

### 4. 프론트엔드 접속

브라우저에서 `index.html` 파일을 엽니다.

## 사용 방법

1. 언어 선택: 상단에서 실행할 프로그래밍 언어를 선택합니다.
2. 코드 작성: 에디터에 코드를 입력합니다.
3. 실행: "실행" 버튼을 클릭하여 코드를 실행합니다.
4. 결과 확인: 실행 결과가 하단에 표시됩니다.

## 시스템 요구사항

- Node.js 20.x 이상
- Docker (Docker Compose v2)
- Windows 10/11
