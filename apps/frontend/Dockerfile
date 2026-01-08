FROM node:18-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy apps
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend
COPY public ./public

# Install dependencies for all workspaces
RUN npm ci --workspaces

# Expose port
EXPOSE 3000

# Start frontend
CMD ["npm", "run", "frontend:dev"]
