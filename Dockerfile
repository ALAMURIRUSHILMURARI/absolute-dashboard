# Production Dockerfile for ABSOLUTE Personal Command Center
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --only=production

# Copy dist and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/.env ./.env

EXPOSE 5000

CMD ["npx", "tsx", "server/index.ts"]
