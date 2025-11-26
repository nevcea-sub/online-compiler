## Online Compiler

A **multi-language online code execution platform (online compiler)**.  
The frontend is a React + Vite-based single-page application, and the backend is an Express-based Node server that safely executes code through **Docker containers**.

### Key Features

- **Multi-language Support**: Python, JavaScript, Java, C/C++, C#, Go, Rust, PHP, R, Ruby, Kotlin, TypeScript, Swift, Perl, Haskell, Bash, and more
- **Docker Isolation**: Uses official Docker images for each language to isolate code execution environments
- **Execution Limits**: Protects the server with execution time, memory, CPU, and output size limits
- **Code/Settings Persistence**: Automatically saves language-specific code, interface language, theme, and font settings to `localStorage`
- **User Experience (UI/UX)**:
  - Ace-based code editor
  - Execution results/error console, execution time (ms) display
  - For R language, supports image output (`png`) to display result images in the UI
  - Multi-language support (Korean/English), dark/light/system themes
  - Keyboard shortcuts (Ctrl+Enter to run, Ctrl+K to reset, Ctrl+Shift+/ to show shortcuts help, etc.)

### Quick Start

**Prerequisites**: Node.js 20+, Docker Desktop (must be running)

1. Install dependencies:
   ```bash
   npm install                    # Root dependencies
   cd frontend && npm install     # Frontend dependencies
   cd ../backend && npm install  # Backend dependencies
   cd ..                          # Return to root
   ```
2. Start the development server:
   ```bash
   # Open two terminals
   npm run dev:backend   # Terminal 1: Start backend
   npm run dev:frontend  # Terminal 2: Start frontend
   ```
3. Open `http://localhost:5173` in your browser
4. Write code and press **Ctrl+Enter** to execute

---

## Tech Stack

- **Frontend**
  - React 19, TypeScript
  - Vite, Vitest (Testing)
  - Ace Editor (`react-ace`, `ace-builds`)
  - Tailwind CSS
- **Backend**
  - Node.js (TypeScript)
  - Express 5, CORS, Helmet, express-rate-limit
  - Docker CLI integration
  - Jest (Testing)
- **Infrastructure**
  - Docker / Docker Desktop
  - Docker Compose

---

## Environment Variables

Key environment variables (optional, defaults available):

- `PORT`: Backend server port (default: 4000)
- `BACKEND_PORT`: Docker container host port (default: 3000)
- `VITE_BACKEND_URL`: Backend URL for frontend (default: `http://localhost:4000`)
- `MAX_OUTPUT_BYTES`: Maximum output size (default: 1MB)
- `ENABLE_PRELOAD`: Pre-pull Docker images (default: `true`)
- `ENABLE_WARMUP`: Container warmup (default: `true`)
- `ENABLE_CACHE`: Enable execution result caching (default: `true`)
- `CACHE_MAX_SIZE`: Maximum number of cached results (default: 1000)
- `CACHE_TTL_MS`: Cache time-to-live in milliseconds (default: 1 hour)

---

## API Overview

### `POST /api/execute`

Code execution request

- **Request Body**:
  ```json
  {
    "code": "string",
    "language": "string",
    "input": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "output": "string (optional)",
    "error": "string (optional)",
    "executionTime": "number (milliseconds)",
    "images": "Array<string> (optional, base64 encoded images for R language)"
  }
  ```

### `GET /api/health`

Server health check

---

## Security and Limitations

- Docker container isolation (network blocking, read-only file system)
- Resource limits (CPU, memory, execution time, output size)
- Code validation and dangerous pattern detection
- Rate limiting and security headers (Helmet.js)

---

## Development Scripts

- `npm run dev:frontend`: Run frontend development server
- `npm run dev:backend`: Run backend development server
- `npm run test:frontend`: Run frontend tests (Vitest)
- `npm run test:backend`: Run backend tests (Jest)
- `npm run benchmark:frontend`: Run frontend benchmarks
- `npm run benchmark:backend`: Run backend benchmarks
- `npm run lint`: Code linting (ESLint)
- `npm run format`: Code formatting (Prettier)
- `npm run docker:up`: Start containers with Docker Compose
- `npm run docker:down`: Stop containers

---

## License

Apache License 2.0
