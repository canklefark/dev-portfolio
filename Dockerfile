# syntax=docker/dockerfile:1
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.emdash ./.emdash
COPY package.json ./
# The database and uploads paths are baked relative to the working directory (/app),
# so the volume must be /app/data. The Node adapter writes its session store under node_modules/.astro.
RUN mkdir -p data node_modules/.astro && chown -R node:node data node_modules/.astro
USER node
VOLUME /app/data
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
