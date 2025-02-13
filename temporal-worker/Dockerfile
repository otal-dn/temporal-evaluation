# Use Node.js base image
FROM node:20.11.1-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./

# Install dependencies, including TypeScript
RUN npm install && npm install -g typescript

# Copy the rest of the worker code
COPY . .

# Build TypeScript code
RUN npx tsc

# Set default Temporal Server address (can be overridden via environment variable)
ENV TEMPORAL_ADDRESS=localhost:7233

# Inject version dynamically from build args
ARG VERSION
LABEL version=$VERSION

# Command to start the worker with a configurable Temporal address
CMD ["sh", "-c", "exec node dist/worker.js"]
