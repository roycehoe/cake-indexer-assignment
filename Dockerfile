FROM node:alpine as build-stage
WORKDIR "/app"
COPY ./*package.json ./
RUN npm install
COPY . .
CMD ["node", "dist/main.js"]