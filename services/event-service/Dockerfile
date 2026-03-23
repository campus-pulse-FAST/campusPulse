FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/event-service/package.json ./services/event-service/

# Install dependencies
RUN cd services/event-service && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/event-service/src ./services/event-service/src
COPY services/event-service/tsconfig.json ./services/event-service/
COPY services/event-service/nest-cli.json ./services/event-service/
COPY tsconfig.base.json ./

WORKDIR /app/services/event-service

EXPOSE 3002
CMD ["bun", "run", "src/main.ts"]
