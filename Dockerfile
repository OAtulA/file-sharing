# Note ⚠️ I am not using npm ci as in local I have the pnpm-lock.yaml file 
# If your code has the pnpm-lock.yaml file, 
# you can use npm ci instead of npm i
 
# Also 🚨 I am using the docker not docker-compose
# As my app has frontend being served by the backend as static files

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm i

COPY frontend ./
RUN npm run build

# Stage 2: Backend Build
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm i

COPY backend ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine AS production
WORKDIR /app

# Copy built frontend dist
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Copy built backend dist and node_modules
COPY --from=backend-build /app/backend/dist /app/backend/dist
COPY --from=backend-build /app/backend/node_modules /app/backend/node_modules
# Now removing the the dev dependencies
RUN npm prune --production

# Copy package.json for reference
COPY backend/package*.json ./

# Expose port from environment
EXPOSE ${PORT:-4000}

# Set working directory to backend
WORKDIR /app/backend

# Use environment variable for port
CMD ["node", "dist/index.js"]
