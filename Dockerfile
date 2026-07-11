# === PINCA NestJS — imagen de desarrollo ===
FROM node:22-alpine

WORKDIR /usr/src/app

# Instalar dependencias primero (mejor cache de capas)
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Dev con watch. Para prod: RUN npm run build && CMD ["node", "dist/main.js"]
CMD ["npm", "run", "start:dev"]
