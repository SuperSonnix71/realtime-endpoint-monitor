FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/backend/package.json apps/backend/package-lock.json* apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
RUN npm install
COPY apps/backend/src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./

EXPOSE 3000
CMD ["node", "dist/server/index.js"]
