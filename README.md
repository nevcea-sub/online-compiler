# Online Compiler

A secure, multi-language online code compiler and executor built with React and Node.js, using Docker for safe code execution.

## Features

- 17 programming languages
- Docker-based secure execution
- Modern React UI with dark/light theme
- Real-time execution with input/output
- Image generation support
- Korean and English support

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React 19, Vite, Tailwind CSS
- **Execution**: Docker containers

## Prerequisites

- Node.js v20+
- Docker

## Installation

```bash
git clone https://github.com/nevcea/online-compiler.git
cd online-compiler

npm install
cd backend && npm install
cd ../frontend && npm install
```

## Development

```bash
npm run dev
```

```bash
cd backend && npm run build && cd ../frontend && npm run build
```

## Docker Deployment

```bash
docker compose up -d
```

## API

**POST `/api/execute`**
```json
{ "code": "print('Hello, World!')", "language": "python", "input": "" }
```

**GET `/api/health`**
```json
{ "status": "ok" }
```
