FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -omit=dev

RUN mkdir ./data
COPY ./config ./config
COPY ./build ./

EXPOSE 3000
CMD [ "node", "index.js" ]