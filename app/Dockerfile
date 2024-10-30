# Use the Node.js 20 image as the base
FROM node:20-alpine AS dev

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app
# RUN npm run build

# Production stage
# FROM node:20-alpine AS production
# WORKDIR /app

# Copy only the necessary files from the builder stage
# COPY --from=builder /app ./

# Expose the desired port
EXPOSE "${APP_PORT}"

# Start the Next.js app
CMD ["npm", "run", "dev"]