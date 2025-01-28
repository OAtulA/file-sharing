#!/bin/bash

# Path to your .env file
ENV_FILE=".env"

# Check if the .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE not found!"
    exit 1
fi

# Read the .env file and export each variable
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^# ]]; then
        continue
    fi
    
    # Remove quotes from values if present
    value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
    
    # Export the variable
    export "$key=$value"
done < "$ENV_FILE"

echo "Environment variables set from $ENV_FILE."
