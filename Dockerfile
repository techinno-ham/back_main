
# ---- Build Stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Define build arguments
ARG CALLBACK_URL
ARG BACKEND_URL
ARG CDN_URL
ARG DB_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG HOST
ARG JWT_SECRET 
ARG SALT_BCRYPT
ARG FRONT_URL
ARG S3_HOST
ARG S3_USER
ARG S3_PASSWORD
ARG KAFKA_BROKER
ARG KAFKA_GROUP_ID
ARG KAFKA_PASS
ARG KAFKA_SASL_MECH
ARG KAFKA_USERNAME

# Set environment variables from build arguments
ENV CALLBACK_URL=$CALLBACK_URL
ENV DB_URL=$DB_URL
ENV BACKEND_URL=$BACKEND_URL
ENV CDN_URL=$CDN_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV HOST=$HOST
ENV JWT_SECRET=$JWT_SECRET
ENV SALT_BCRYPT=$SALT_BCRYPT
ENV FRONT_URL=$FRONT_URL
ENV S3_HOST=$S3_HOST
ENV S3_USER=$S3_USER
ENV S3_PASSWORD=$S3_PASSWORD
ENV KAFKA_BROKER=$KAFKA_BROKER
ENV KAFKA_GROUP_ID=$KAFKA_GROUP_ID
ENV KAFKA_PASS=$KAFKA_PASS
ENV KAFKA_SASL_MECH=$KAFKA_SASL_MECH
ENV KAFKA_USERNAME=$KAFKA_USERNAME






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
FROM node:20-slim AS production
WORKDIR /app

# Install OpenSSL and other necessary dependencies
RUN apt-get update -y && apt-get install -y openssl

# Define build arguments
ARG CALLBACK_URL
ARG BACKEND_URL
ARG CDN_URL
ARG DB_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG HOST
ARG JWT_SECRET 
ARG SALT_BCRYPT
ARG FRONT_URL
ARG S3_HOST
ARG S3_USER
ARG S3_PASSWORD
ARG KAFKA_BROKER
ARG KAFKA_GROUP_ID
ARG KAFKA_PASS
ARG KAFKA_SASL_MECH
ARG KAFKA_USERNAME

# Set environment variables from build arguments
ENV CALLBACK_URL=$CALLBACK_URL
ENV DB_URL=$DB_URL
ENV BACKEND_URL=$BACKEND_URL
ENV CDN_URL=$CDN_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV HOST=$HOST
ENV JWT_SECRET=$JWT_SECRET
ENV SALT_BCRYPT=$SALT_BCRYPT
ENV FRONT_URL=$FRONT_URL
ENV S3_HOST=$S3_HOST
ENV S3_USER=$S3_USER
ENV S3_PASSWORD=$S3_PASSWORD
ENV KAFKA_BROKER=$KAFKA_BROKER
ENV KAFKA_GROUP_ID=$KAFKA_GROUP_ID
ENV KAFKA_PASS=$KAFKA_PASS
ENV KAFKA_SASL_MECH=$KAFKA_SASL_MECH
ENV KAFKA_USERNAME=$KAFKA_USERNAME

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

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/chatbotAsset ./chatbotAsset

ENV NODE_ENV=production


# Generate Prisma client
RUN npx prisma generate

# RUN echo "MONGO_URL=$MONGO_URL"

EXPOSE 12000

CMD ["sh", "-c", "npx prisma db push && npx prisma generate && node dist/main"]