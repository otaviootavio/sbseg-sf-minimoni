# Stage 0 — base image
FROM node:22-alpine AS base

# Install ffmpeg for HLS video conversion
RUN apk add --no-cache ffmpeg

# Enable pnpm via Corepack
RUN corepack enable \
  && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy the rest of the application source
COPY . .
# Ensure an (possibly empty) HLS data directory exists so later COPY succeeds
RUN mkdir -p data

# Copy and run the video initialization script
COPY init_video.sh ./
RUN chmod +x ./init_video.sh && ./init_video.sh

# Generate Prisma client and build TypeScript sources
RUN npx prisma generate \
  && pnpm build

# Final image
FROM node:22-alpine
WORKDIR /app

# Enable pnpm runtime (not strictly necessary for production but keeps parity)
RUN corepack enable \
  && corepack prepare pnpm@latest --activate

# Copy built artefacts & production dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/data ./data
COPY package.json ./

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV PORT=3000
EXPOSE 3000

CMD ["./start.sh"] 