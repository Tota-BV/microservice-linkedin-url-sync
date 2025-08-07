FROM oven/bun:1.2.19-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (excluding dev dependencies for production)
RUN bun install --production --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["bun", "start"]
