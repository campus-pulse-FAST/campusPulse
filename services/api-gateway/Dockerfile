FROM oven/bun:1
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY libs/shared/package.json ./libs/shared/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies
RUN cd services/api-gateway && bun install 2>/dev/null || true

# Copy shared lib source
COPY libs/shared/src ./libs/shared/src
COPY libs/shared/tsconfig.json ./libs/shared/

# Copy service source
COPY services/api-gateway/src ./services/api-gateway/src
COPY services/api-gateway/tsconfig.json ./services/api-gateway/
COPY services/api-gateway/nest-cli.json ./services/api-gateway/
COPY tsconfig.base.json ./

WORKDIR /app/services/api-gateway

EXPOSE 3000
CMD ["bun", "run", "src/main.ts"]
