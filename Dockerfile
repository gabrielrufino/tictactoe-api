# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install all dependencies (including devDependencies) to build the app
RUN npm ci

# Copy the rest of the application source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile the TypeScript application
RUN npm run build


# Stage 2: Create the minimal production image
FROM node:22-alpine AS runner

# Use production environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install only production dependencies (excluding devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copy the compiled production assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Run as a non-root user for security
USER node

# Expose the application port (defaults to 3000)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
