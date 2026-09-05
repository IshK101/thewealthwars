FROM node:22-alpine AS build

WORKDIR /app

COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm ci --prefix backend && npm ci --prefix frontend

COPY backend backend
COPY frontend frontend
RUN npm run build --prefix frontend && npm run build --prefix backend
RUN npm prune --omit=dev --prefix backend

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

COPY --from=build /app/backend/package*.json backend/
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist

EXPOSE 3002
CMD ["npm", "start", "--prefix", "backend"]
