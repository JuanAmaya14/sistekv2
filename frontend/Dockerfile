# 1. Etapa de compilación
FROM node:26.8.1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# 2. Etapa de producción con Nginx
FROM nginx:1.25-alpine
# Copiamos la compilación pura de Vite al directorio público de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
