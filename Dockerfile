# Use the official Node.js image.
                        # https://hub.docker.com/_/node
                        FROM node:20

                        # Create and change to the app directory.
                        WORKDIR /usr/src/app

                        # Copy application dependency manifests to the container image.
                        COPY package*.json ./

                        # Install dependencies.
                        RUN npm install --production

                        # Copy the local code to the container image.
                        COPY . .

                        # Add environment variables file if needed
                        COPY .env .env

                        # Run `npm run build` if the app has a build step
                        #RUN npm run build

                        # Run the web service on container startup.
                        CMD [ "node", "app.js" ]

                        # Document that the service listens on port 6789.
                        EXPOSE 6789