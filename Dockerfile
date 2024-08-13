
# ---- Build Stage ----
    FROM node:20-slim AS builder
    WORKDIR /app

    # Define build arguments
ARG CALLBACK_URL
ARG DB_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG HOST
ARG JWT_SECRET
ARG KAFKA_BROKER
ARG SALT_BCRYPT

# Set environment variables from build arguments
ENV CALLBACK_URL=$CALLBACK_URL
ENV DB_URL=$DB_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV HOST=$HOST
ENV JWT_SECRET=$JWT_SECRET
ENV KAFKA_BROKER=$KAFKA_BROKER
ENV SALT_BCRYPT=$SALT_BCRYPT
    
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

# Define build arguments
ARG CALLBACK_URL
ARG DB_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG HOST
ARG JWT_SECRET
ARG KAFKA_BROKER
ARG SALT_BCRYPT

# Set environment variables from build arguments
ENV CALLBACK_URL=$CALLBACK_URL
ENV DB_URL=$DB_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV HOST=$HOST
ENV JWT_SECRET=$JWT_SECRET
ENV KAFKA_BROKER=$KAFKA_BROKER
ENV SALT_BCRYPT=$SALT_BCRYPT

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
    
    # RUN echo "MONGO_URL=$MONGO_URL"

    EXPOSE 12000
    
    CMD ["sh", "-c", "npx prisma db push && npx prisma generate && node dist/main"]