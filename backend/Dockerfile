FROM node:26.8.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compilamos inicialmente
RUN npm run build
EXPOSE 4000
# Ejecutamos el script de inicio de tu package.json (que usualmente corre nodemon o ts-node)
CMD ["npm", "start"]
