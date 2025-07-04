# syntax=docker/dockerfile:1.6

############################
# 0. Dependencies stage    #
############################
FROM node:20-alpine AS deps
# Install project dependencies using npm. If you prefer pnpm or yarn
# you can easily swap the next line (corepack is available in Node 20).
WORKDIR /app
COPY package.json yarn.lock pnpm-lock.yaml bun.lockb ./

# Install dependencies (dev deps included – we need them to build)
# If package-lock.json is absent npm falls back to `npm install`.
RUN npm install --no-fund --loglevel=warn --legacy-peer-deps

############################
# 1. Build Chrome bundle   #
############################
FROM deps AS build_chrome
WORKDIR /app
COPY . .
RUN npm run build:chrome
# Collect artefacts
RUN mkdir -p /output/dist_chrome \
    && cp -r dist_chrome/* /output/dist_chrome/

############################
# 2. Build Firefox bundle  #
############################
FROM deps AS build_firefox
WORKDIR /app
COPY . .
RUN npm run build:firefox
RUN mkdir -p /output/dist_firefox \
    && cp -r dist_firefox/* /output/dist_firefox/

############################
# 3. Export artefacts      #
############################
# The final stage contains nothing but the compiled extension files so
# that `docker build --output` (or a volume mount) can stream them back
# to the host.
FROM scratch AS export
COPY --from=build_chrome /output /output
COPY --from=build_firefox /output /output

# No CMD needed – this image is meant to be built, not run. 