# Updated for Node.js - Railway deployment fix
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create cache directory
RUN mkdir -p src/cache/linkedin-profiles

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
