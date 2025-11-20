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

1. Run `npm install` in the root directory
2. Run `cd frontend && npm install`, then `cd ../backend && npm install`
3. Run `npm run dev` in the root directory
4. Open `http://localhost:5173` in your browser, write code, then press **Ctrl+Enter** to execute

---

## Tech Stack

- **Frontend**
  - React 19, TypeScript
  - Vite
  - Ace Editor (`react-ace`, `ace-builds`)
  - Tailwind CSS + custom CSS
- **Backend**
  - Node.js (TypeScript)
  - Express 5, CORS, Helmet, express-rate-limit
  - Docker CLI integration (`docker run`, `docker images`, `docker pull`, etc.)
  - Jest (testing framework)
- **Infrastructure/Execution**
  - Docker / Docker Desktop
  - Docker Compose (backend container execution and network management)

---

## Directory Structure Overview

- `backend/`: Express server, Docker execution logic, code validation
  - `server.ts`: Server entry point
  - `routes/`: API endpoints (`/api/execute`, `/api/health`)
  - `config/`: Language-specific settings and resource limits
  - `docker/`: Docker image management and warmup
  - `execution/`: Code execution and result processing
- `frontend/`: React-based UI
  - `src/pages/`: Compiler page, settings page
  - `src/components/`: UI components
  - `src/services/`: API calls

---

## Installation and Execution

### 1. Prerequisites

- Node.js (LTS version recommended)
- npm or pnpm
- Docker and Docker Compose
  - **Docker Desktop** must be running for local execution (Windows/macOS)
  - The backend container uses the host's Docker daemon (`docker.sock`) to launch additional containers for language-specific execution.

### 2. Install Dependencies

Install required packages in the root, frontend, and backend directories.

```bash
# Install dev dependencies for root scripts
npm install

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Run Development Server (Local Development)

It's convenient to use the scripts defined in the root `package.json`.

```bash
# Run from root
npm run dev         # Run frontend + backend simultaneously (scripts/dev.cjs)

# Or run individually
npm run dev:frontend
npm run dev:backend
```

- Frontend: Default `http://localhost:5173`
- Backend: Default `http://localhost:4000`
  - The frontend Vite dev server proxies `/api` paths to the backend.  
    (See `frontend/vite.config.ts`)

### 4. Run in Docker Environment

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

---

## Environment Variables

Key environment variables (optional, defaults available):

- `PORT`: Backend server port (default: 4000)
- `BACKEND_PORT`: Docker container host port (default: 3000)
- `VITE_BACKEND_URL`: Backend URL for frontend (default: `http://localhost:4000`)
- `MAX_OUTPUT_BYTES`: Maximum output size (default: 1MB)
- `ENABLE_PRELOAD`: Pre-pull Docker images (default: `true`)
- `ENABLE_WARMUP`: Container warmup (default: `true`)

---

## API Overview

### `POST /api/execute`

Code execution request

- **Request**: `{ code: string, language: string, input?: string }`
- **Response**: `{ output?: string, error?: string, executionTime: number, images?: Array }`

### `GET /api/health`

Server status check

---

## Code Execution Flow

1. Frontend sends code execution request to `/api/execute`
2. Backend validates code and executes Docker container
3. Execution results (output/error/images) are returned to frontend

---

## Security and Limitations

- Docker container isolation (network blocking, read-only file system)
- Dangerous pattern validation and resource limits (CPU, memory, execution time, output size)
- Rate limiting to prevent API abuse

---

## Development Scripts

**Root**
- `npm run dev`: Run frontend/backend simultaneously
- `npm run test`: Run tests
- `npm run lint`: Code linting
- `npm run docker:build`, `docker:up`, `docker:down`: Docker management

**Backend/Frontend**
- Each directory supports `npm run dev`, `npm run build`, `npm test`, etc.

---

## License

Apache License 2.0
