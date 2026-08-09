# node:24-alpine, pinned 2026-08-09
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_PUBLIC_BASE_PATH=/
ENV VITE_PUBLIC_BASE_PATH=${VITE_PUBLIC_BASE_PATH}
RUN npm run build

# caddy:2-alpine, pinned 2026-08-09
FROM caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN addgroup -S salida && adduser -S -G salida salida \
  && chown -R salida:salida /srv /config /data
USER salida
EXPOSE 8080
