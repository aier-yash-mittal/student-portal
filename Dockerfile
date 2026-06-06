# Multi-stage Dockerfile for Next.js 15 SecureCampus Portal
# 1. Install dependencies and upgrade OS libraries to patch CVEs
FROM node:20.14.0-alpine AS deps
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. Build the application
FROM node:20.14.0-alpine AS builder
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 3. Production runner
FROM node:20.14.0-alpine AS runner
RUN apk update && apk upgrade --no-cache
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a secure non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential build outputs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Grant permissions to the non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Container Healthcheck (Resolves Trivy Config Compliance Check flags)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { if (r.statusCode !== 200) process.exit(1); })"

CMD ["npm", "start"]
