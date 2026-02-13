# ---------- 1️⃣ Base Image ----------
FROM node:20-alpine AS base

# Enable pnpm
RUN corepack enable

WORKDIR /app

# ---------- 2️⃣ Dependencies ----------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- 3️⃣ Builder ----------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN pnpm build

# ---------- 4️⃣ Production ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Enable pnpm again
RUN corepack enable

# Copy only necessary files
COPY --from=builder /app ./

EXPOSE 3002

CMD ["pnpm", "start", "-p", "3001"]
