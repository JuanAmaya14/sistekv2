FROM node:20.8.1-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

RUN chown -R appuser:appgroup /app

USER appuser

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
