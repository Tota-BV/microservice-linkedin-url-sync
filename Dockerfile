FROM oven/bun:1.0.35-alpine

# Set working directory
WORKDIR /app

# Copy ALL source code first
COPY . .

# Install dependencies (after copying everything)
RUN bun install

# Create cache directory
RUN mkdir -p src/cache/linkedin-profiles

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
