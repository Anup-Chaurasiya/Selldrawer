FROM node:24-alpine

# Install required system dependencies
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies after build
RUN npm prune --production

# Remove CLI packages since we don't need them in production
RUN npm remove @shopify/cli || true

# Start the application
CMD ["npm", "run", "docker-start"]
