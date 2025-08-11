FROM oven/bun:1.0.35-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create cache directory
RUN mkdir -p src/cache/linkedin-profiles

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
