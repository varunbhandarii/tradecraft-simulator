# ---- Build Stage ----
# Use a Node base image matching your development environment
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
# Copy package.json AND lock file (package-lock.json or yarn.lock)
COPY package*.json ./
# Use npm ci for cleaner installs based on lock file
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set the build-time environment variable (if needed by 'next build')
# This ARG can be overridden during docker compose build if necessary
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN echo "Using API Base URL for build: ${NEXT_PUBLIC_API_BASE_URL}"

# Build the Next.js application
RUN npm run build

# ---- Runtime Stage ----
# Use a minimal Node image for running the server
FROM node:18-alpine

WORKDIR /app

# Set environment variable for Node.js environment
ENV NODE_ENV=production
# Set default port (can be overridden)
ENV PORT=3000

# Copy necessary artifacts from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./standalone
COPY --from=build /app/.next/static ./standalone/.next/static

# Change ownership to node user (good practice)
# RUN chown -R node:node /app
# USER node # Switch to non-root user - might cause issues if not configured correctly in base image

EXPOSE 3000

# Define the command to run the production server
# Use the standalone server entry point
CMD ["node", "standalone/server.js"]