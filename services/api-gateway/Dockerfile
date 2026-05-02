FROM campuspulse-base:latest
WORKDIR /app

# Copy shared lib into node_modules as a real package
COPY libs/shared/src /app/node_modules/@campuspulse/shared/src
RUN echo '{"name":"@campuspulse/shared","main":"src/index.ts"}' > /app/node_modules/@campuspulse/shared/package.json

# Copy service source
COPY services/api-gateway/src ./src
COPY services/api-gateway/tsconfig.json ./tsconfig.json
COPY services/api-gateway/nest-cli.json ./nest-cli.json
COPY tsconfig.base.json ./tsconfig.base.json

EXPOSE 3000
CMD ["bun", "run", "src/main.ts"]
