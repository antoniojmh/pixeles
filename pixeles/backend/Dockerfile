FROM node:20-alpine

WORKDIR /app

# Dependencias primero (caching)
COPY package.json ./
RUN npm install --production --no-fund --no-audit

# Código fuente
COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
