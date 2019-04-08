FROM node:10 as base
RUN mkdir -p /app
WORKDIR /app
EXPOSE 3000

ENV NODE_ENV development
COPY package.json package-lock.json ./
RUN npm ci
COPY index-docker.js ./index.js
COPY .babelrc routes.js yarn.lock ./
COPY controllers ./controllers
COPY models ./models
COPY services ./services

CMD ["npm","start"]