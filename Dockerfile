# Use the official Node.js image for version 20.10.0
FROM node:20.10.0-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies. This will install discord.js and other dependencies.
RUN npm install --production

# Copy the local code to the container image
COPY . .

COPY .env .env

# Expose the port the bot will use, if necessary
EXPOSE 6789

# Run the bot on container startup
CMD ["node", "bot.js"]
