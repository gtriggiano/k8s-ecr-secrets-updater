FROM node:10.15-alpine as build-step
WORKDIR /app
COPY src src
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
RUN npm install && npm run build && npm prune --production

FROM node:10.15-alpine
LABEL MAINTAINER Giacomo Triggiano <giacomotriggiano@gmail.com>
WORKDIR /app
COPY --from=build-step /app/node_modules /app/node_modules
COPY --from=build-step /app/dist /app/dist

ENV NODE_ENV=production

CMD [ "node", "/app/dist/index" ]
