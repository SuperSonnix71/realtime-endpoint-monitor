FROM node:20-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/frontend/package.json apps/frontend/package-lock.json* apps/frontend/next.config.js apps/frontend/tsconfig.json apps/frontend/tailwind.config.ts apps/frontend/postcss.config.js apps/frontend/next-env.d.ts ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm install
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
ARG NEXT_PUBLIC_API_URL=http://localhost:7070
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Standalone output preserves monorepo structure: server.js is at apps/frontend/
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
