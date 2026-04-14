FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite in host mode
CMD ["npm", "run", "dev", "--", "--host"]
