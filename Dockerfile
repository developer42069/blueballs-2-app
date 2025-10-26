# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Copy .env file for build
COPY .env .env

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Expose port 3010
EXPOSE 3010

# Set environment variable for port
ENV PORT=3010
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Start the application
CMD ["node", "build"]
