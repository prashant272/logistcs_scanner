# Use official lightweight Node.js 20 image on Alpine Linux
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (only production to keep image size small)
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on (Port 5000 from backend config)
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
