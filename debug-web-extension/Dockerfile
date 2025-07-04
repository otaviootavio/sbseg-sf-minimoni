# ---------- Build stage ----------
FROM node:22-alpine AS builder

# Build arguments for environment variables
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_NODE_ENV=development
ARG VITE_DEBUG=true

# Set environment variables during the build process
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_DEBUG=$VITE_DEBUG

RUN corepack enable \
  && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .

# Build the static assets - ENV vars are now available
RUN pnpm build

# ---------- Runtime stage ----------
FROM nginx:1.25-alpine

# Copy compiled assets to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default Nginx configuration and reduce logs
RUN rm /etc/nginx/conf.d/default.conf

# Basic Nginx configuration for SPA
RUN printf "server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files \$uri \$uri/ /index.html;\n  }\n}\n" > /etc/nginx/conf.d/app.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 