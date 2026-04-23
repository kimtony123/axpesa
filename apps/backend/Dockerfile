FROM node:20-bullseye

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV CI=true

COPY package.json pnpm-lock.yaml prisma/ ./
RUN pnpm install --frozen-lockfile

# Generate Prisma client after dependencies are installed
RUN pnpm prisma generate

# Copy source code - this changes often, rebuilds fast
COPY . .
RUN pnpm build

EXPOSE 8080

CMD ["node", "dist/index.js"]