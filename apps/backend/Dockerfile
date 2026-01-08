FROM node:18-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy backend app
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend
COPY public ./public

# Install dependencies for all workspaces
RUN npm ci --workspaces

# Expose port
EXPOSE 3001

# Start backend
CMD ["npm", "run", "backend:dev"]
