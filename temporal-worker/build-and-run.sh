#!/bin/bash

# Set the version (Modify this variable to change the version)
VERSION="1.1.0"

# Extract the major version (first number) to determine workflow version
MAJOR_VERSION=$(echo "$VERSION" | cut -d. -f1)

# Check if the image exists
if [[ "$(docker images -q temporal-worker:$VERSION 2> /dev/null)" == "" ]]; then
  echo "🚀 Image not found. Building Docker image with version $VERSION..."
  docker build --build-arg VERSION=$VERSION -t temporal-worker:$VERSION .
else
  echo "✅ Image temporal-worker:$VERSION already exists, skipping build..."
fi

# Generate a unique worker name using UUID
WORKER_UUID=$(uuidgen | cut -c1-8)  # Get the first 8 characters of a UUID
WORKER_NAME="temporal-worker-$WORKER_UUID"

# Start the worker in detached mode (-d) with a unique name and pass WORKER_VERSION
echo "🚀 Starting Temporal worker container with version $VERSION..."
docker run -d --name $WORKER_NAME \
  -e TEMPORAL_ADDRESS=host.docker.internal:7233 \
  -e WORKER_VERSION=$MAJOR_VERSION \
  temporal-worker:$VERSION

echo "✅ Temporal worker is now running in the background."
echo "📌 Worker Name: $WORKER_NAME"
echo "📌 Using Workflow Version: $MAJOR_VERSION"
echo "📌 Use 'docker logs -f $WORKER_NAME' to view logs."
