# Frontend Dockerfile - build then run with Node server.cjs

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app
ENV CI=true

# Enable corepack (pnpm)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend ./
RUN pnpm build

# --- Runtime Stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=7998

# Copy only needed artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.cjs ./server.cjs

# Non-root user
RUN addgroup -S hmml && adduser -S hmml -G hmml && chown -R hmml:hmml /app
USER hmml

EXPOSE 7998

CMD ["node", "server.cjs"]

