
# ---- Build Stage ----
    FROM node:20-slim AS builder
    WORKDIR /app
    
    # Copy package.json and package-lock.json
    COPY package*.json ./
    # Install both production and development dependencies
    RUN npm install --force
    
    # Copy the rest of the application
    COPY . .
    
    # Generate Prisma client
    RUN npx prisma generate
    
    # Build the application
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:20-alpine AS production
    WORKDIR /app
    # Copy package.json and package-lock.json
    COPY package*.json ./
    # Install Prisma globally
    RUN npm install -g prisma
    # Install only production dependencies
    RUN npm install --only=production --force
    
    # Copy Prisma
    COPY --from=builder /app/schema.prisma .
    
    # Copy built application from builder stage
    COPY --from=builder /app/dist ./dist
    
    ENV NODE_ENV=production
    
    
    # Generate Prisma client
    RUN npx prisma generate
    
    # Debugging: Print MONGO_URL
    # RUN echo "MONGO_URL=$MONGO_URL"

    EXPOSE 12000
    
    CMD ["sh", "-c", "npx prisma db push && npx prisma generate && node dist/main"]