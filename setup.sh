#!/bin/bash

# Function to check environment variables
check_env_vars() {
    local required_vars=("AWS_BUCKET_NAME" "AWS_BUCKET_REGION" "AWS_ACCESS_KEY" "AWS_SECRET_ACCESS_KEY" "PORT" "VITE_DOMAIN_NAME")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "Error: Missing environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    fi
    return 0
}

install_and_configure_nginx() {
    # Install gettext for envsubst
    if ! command -v envsubst &> /dev/null; then
        echo "Installing gettext for envsubst..."
        sudo yum install -y gettext || sudo apt-get install -y gettext-base
    fi

    # Verify envsubst is installed
    if ! command -v envsubst &> /dev/null; then
        echo "Error: Failed to install envsubst"
        return 1
    fi

    # Check required environment variables
    local required_vars=("PORT")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "Error: Missing environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    fi

    # Install Nginx
    sudo yum install -y nginx || sudo apt-get install -y nginx

    # Generate Nginx configuration using envsubst
    if [[ -f ./nginx.conf ]]; then
        sudo chmod 666 /etc/nginx/conf.d/default.conf
        envsubst '$PORT,$VITE_DOMAIN_NAME' < nginx.conf | sudo tee /etc/nginx/conf.d/default.conf

        # envsubst < ./nginx.conf | sudo tee /etc/nginx/conf.d/default.conf > /dev/null
    else
        echo "Error: nginx.conf not found in current directory"
        return 1
    fi

    # Test Nginx configuration
    sudo nginx -t

    # Restart Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx

    echo "Nginx installed and configured successfully!"
    return 0
}

# Function to build and run Docker containers
build_and_run_docker() {
    # Extensive error checking and logging
    set -x  # Enable verbose output

    # Validate critical environment variables
    local required_vars=(
        "PORT" 
        "VITE_DOMAIN_NAME" 
        "AWS_BUCKET_NAME" 
        "AWS_BUCKET_REGION" 
        "AWS_ACCESS_KEY" 
        "AWS_SECRET_ACCESS_KEY"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "Error: $var is not set"
            return 1
        fi
    done

    # Ensure Dockerfile exists
    if [[ ! -f Dockerfile ]]; then
        echo "Error: Dockerfile not found"
        return 1
    fi

    # Docker setup and permissions
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER

    # Verbose Docker build
    docker build \
        --build-arg CLIENT_ENV="~/app/.env.client" \
        -t file-share-img \
        --progress=plain \
        . || {
            echo "Docker build failed"
            return 1
        }

    # Stop and remove existing container
    docker stop file-share-container 2>/dev/null
    docker rm file-share-container 2>/dev/null

    # Run Docker container with comprehensive logging
    docker run -d \
        --name file-share-container \
        -p ${PORT}:${PORT} \
        -e PORT=${PORT} \
        -e VITE_DOMAIN_NAME=${VITE_DOMAIN_NAME} \
        -e AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
        -e AWS_BUCKET_REGION=${AWS_BUCKET_REGION} \
        -e AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
        -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
        file-share-img || {
            echo "Container start failed"
            docker logs file-share-container
            return 1
        }

    # Verify container status
    docker ps | grep my-app-container
    
    set +x  # Disable verbose output
    return 0
}


# Function to install and configure SSL with Certbot
install_ssl_certificate() {
    local domain="${VITE_DOMAIN_NAME}"
    local email="${EMAIL}"

    if [[ -z "$domain" ]]; then
        echo "Error: No domain provided for SSL certificate"
        exit 1  # Use exit instead of return
    fi

    echo "Stopping Nginx to free up port 80..."
    sudo systemctl stop nginx

    echo "Installing Certbot..."
    if command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    else
        echo "Unsupported package manager. Please install Certbot manually."
        exit 1
    fi

    echo "Obtaining SSL certificate for $domain..."
    certbot_cmd="sudo certbot certonly --standalone --non-interactive --agree-tos -d \"$domain\""

    if [[ -n "$email" ]]; then
    certbot_cmd+=" --email \"$email\""
    fi

    eval "$certbot_cmd" || exit 1

    echo "Testing SSL renewal..."
    sudo certbot renew --dry-run

    echo "Restarting Nginx..."
    sudo systemctl start nginx

    echo "SSL certificate for $domain installed successfully!"
}

# Flags to track completed steps
nginx_done=false
docker_done=false
ssl_done=false

setup_project() {
    echo "Welcome to the project setup script!"

    # Check environment variables
    if ! check_env_vars; then
        echo "Error: Please set all required environment variables before proceeding."
        exit 1
    fi

    while true; do
        if ! $nginx_done; then
            read -p "Do you want to configure Nginx? (y/n) " nginx_setup
            case ${nginx_setup,,} in
            [y])
                echo "Configuring Nginx..."
                if install_and_configure_nginx; then
                    echo "Nginx setup completed successfully!"
                    nginx_done=true
                else
                    echo "Error: Failed to configure Nginx."
                    read -p "Retry Nginx setup? (y/n) " retry
                    [[ ${retry,,} != "y" ]] && nginx_done=true
                fi
                ;;
            [n]) nginx_done=true ;;
            esac
        fi

        if ! $docker_done; then
            read -p "Do you want to build and run Docker containers? (y/n) " docker_setup
            case ${docker_setup,,} in
            [y])
                echo "Setting up Docker containers..."
                if build_and_run_docker; then
                    echo "Docker setup completed successfully!"
                    docker_done=true
                else
                    echo "Error: Failed to build or run Docker containers."
                    read -p "Retry Docker setup? (y/n) " retry
                    [[ ${retry,,} != "y" ]] && docker_done=true
                fi
                ;;
            [n]) docker_done=true ;;
            esac
        fi

        if ! $ssl_done; then
            read -p "Do you want to install SSL certificate for $VITE_DOMAIN_NAME? (y/n) " ssl_setup
            case ${ssl_setup,,} in
            [y])
                echo "Setting up SSL certificate..."
                if install_ssl_certificate "$VITE_DOMAIN_NAME"; then
                    echo "SSL certificate setup completed successfully!"
                    ssl_done=true
                else
                    echo "Error: Failed to install SSL certificate."
                    read -p "Retry SSL setup? (y/n) " retry
                    [[ ${retry,,} != "y" ]] && ssl_done=true
                fi
                ;;
            [n]) ssl_done=true ;;
            esac
        fi

        # Exit the loop if all steps are done
        if $nginx_done && $docker_done && $ssl_done; then
            echo "All setup stages are completed successfully!"
            exit 0
        fi
    done
}

# Call the main function
setup_project


echo "Setup process completed successfully!"
