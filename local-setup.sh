#!/bin/bash

# Local Development Setup Script

# Source environment variables
source ./backend/.env

# Validate critical environment variables
required_vars=(
    "PORT"
    "VITE_DOMAIN_NAME"
    "AWS_BUCKET_NAME"
    "AWS_BUCKET_REGION"
    "AWS_ACCESS_KEY"
    "AWS_SECRET_ACCESS_KEY"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "Error: $var is not set in .env file"
        exit 1
    fi
done

# Docker build and run
docker build --build-arg CLIENT_ENV="frontend/.env.demo" -t file-upload-app .

# docker build --build-arg  CLIENT_ENV="frontend/.env.demo" \
#   -t file-upload-app .

docker run -d \
    --name file-up \
    -p ${PORT}:${PORT} \
    -e PORT=${PORT} \
    -e VITE_DOMAIN_NAME=${VITE_DOMAIN_NAME} \
    -e AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
    -e AWS_BUCKET_REGION=${AWS_BUCKET_REGION} \
    -e AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
    -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
    file-upload-app

echo "Local development environment is up and running on http://localhost:${PORT}"