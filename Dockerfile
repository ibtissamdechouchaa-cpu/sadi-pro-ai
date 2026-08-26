FROM node:18-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
