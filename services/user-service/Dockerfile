FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/user-service/package.json ./services/user-service/

# Install dependencies
RUN cd services/user-service && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/user-service/src ./services/user-service/src
COPY services/user-service/tsconfig.json ./services/user-service/
COPY services/user-service/nest-cli.json ./services/user-service/
COPY tsconfig.base.json ./

WORKDIR /app/services/user-service

EXPOSE 3001
CMD ["bun", "run", "src/main.ts"]
