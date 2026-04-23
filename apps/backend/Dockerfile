FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .

RUN pnpm install --frozen-lockfile && pnpm build

EXPOSE 8080

CMD ["node", "dist/index.js"]