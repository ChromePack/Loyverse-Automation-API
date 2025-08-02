# Use the official Puppeteer Docker image as base
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies using yarn
RUN yarn install --frozen-lockfile

# Copy application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOYVERSE_USERNAME=mostafasalehi796@gmail.com
ENV LOYVERSE_PASSWORD=4q$qH5F2uWMVQz.
ENV 8N8_WEBHOOK_URL=http://localhost:5678/webhook/eb25f31a-326c-4434-a327-eadd26183b51

# Start the application
CMD ["yarn", "start"] 