FROM node:25-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY package-lock.json* ./
COPY tsconfig.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm cache clean --force

COPY server.ts ./
COPY server/ ./server/
COPY config/ ./config/
COPY docker/ ./docker/
COPY execution/ ./execution/
COPY file/ ./file/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY types/ ./types/
COPY utils/ ./utils/

RUN npm run build

FROM node:25-slim AS production

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    wget \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/code /app/output /app/tool_cache \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
