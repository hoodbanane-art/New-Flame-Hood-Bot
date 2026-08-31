# syntax=docker/dockerfile:1

FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:26-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/focalorrr/roblox-moderation-bot"
LABEL org.opencontainers.image.description="Discord moderation bot for Roblox Open Cloud"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

USER node

CMD ["node", "dist/index.js"]
