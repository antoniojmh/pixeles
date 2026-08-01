# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build

# ============================================
# Stage 2: Nginx
# ============================================
FROM nginx:1.26-alpine

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static files built
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
