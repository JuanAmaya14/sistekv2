FROM node:20.8.1-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R appuser:appgroup /app

USER appuser

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
