FROM node:20-alpine

WORKDIR /app

# Copy dependency files first for layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Next.js dev server
CMD ["npm", "run", "dev"]
