FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies
RUN cd services/notification-service && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/notification-service/src ./services/notification-service/src
COPY services/notification-service/tsconfig.json ./services/notification-service/
COPY services/notification-service/nest-cli.json ./services/notification-service/
COPY tsconfig.base.json ./

WORKDIR /app/services/notification-service

EXPOSE 3005
CMD ["bun", "run", "src/main.ts"]
