FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/feedback-service/package.json ./services/feedback-service/

# Install dependencies
RUN cd services/feedback-service && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/feedback-service/src ./services/feedback-service/src
COPY services/feedback-service/tsconfig.json ./services/feedback-service/
COPY services/feedback-service/nest-cli.json ./services/feedback-service/
COPY tsconfig.base.json ./

WORKDIR /app/services/feedback-service

EXPOSE 3004
CMD ["bun", "run", "src/main.ts"]
