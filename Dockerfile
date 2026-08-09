FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_PUBLIC_BASE_PATH=/
ENV VITE_PUBLIC_BASE_PATH=${VITE_PUBLIC_BASE_PATH}
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN addgroup -S salida && adduser -S -G salida salida \
  && chown -R salida:salida /srv /config /data
USER salida
EXPOSE 8080
