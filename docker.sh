#!/bin/bash

# Configuration
APP_NAME="smokebot"
DOCKER_TAG="latest"
DOCKER_IMAGE="$APP_NAME:$DOCKER_TAG"
DOCKER_PORT=6789
HOST_PORT=6789

# Step 2: Build the Docker Image
echo "Building Docker image..."
docker build -t $DOCKER_IMAGE .

if [[ $? -ne 0 ]]; then
  echo "Failed to build Docker image."
  exit 1
fi

# Step 3: Remove any existing container with the same name
echo "Stopping and removing any existing containers with the same name..."
docker ps -a -q --filter "name=$APP_NAME" | grep -q . && docker stop $APP_NAME && docker rm $APP_NAME

# Step 4: Run the Docker Container in Detached Mode
echo "Running Docker container in detached mode..."
docker run -d -p $HOST_PORT:$DOCKER_PORT --name $APP_NAME $DOCKER_IMAGE

if [[ $? -ne 0 ]]; then
  echo "Failed to run Docker container."
  exit 1
fi

echo "Success! Your Docker container is running headlessly on port $HOST_PORT."