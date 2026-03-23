FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/registration-service/package.json ./services/registration-service/

# Install dependencies
RUN cd services/registration-service && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/registration-service/src ./services/registration-service/src
COPY services/registration-service/tsconfig.json ./services/registration-service/
COPY services/registration-service/nest-cli.json ./services/registration-service/
COPY tsconfig.base.json ./

WORKDIR /app/services/registration-service

EXPOSE 3003
CMD ["bun", "run", "src/main.ts"]
