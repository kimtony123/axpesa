FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile && pnpm build

EXPOSE 8080

CMD ["node", "dist/index.js"]