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
        --build-arg PORT=${PORT} \
        --build-arg VITE_DOMAIN_NAME=${VITE_DOMAIN_NAME} \
        --build-arg AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
        --build-arg AWS_BUCKET_REGION=${AWS_BUCKET_REGION} \
        --build-arg AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
        --build-arg AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
        -t my-app \
        --progress=plain \
        . || {
            echo "Docker build failed"
            return 1
        }

    # Stop and remove existing container
    docker stop my-app-container 2>/dev/null
    docker rm my-app-container 2>/dev/null

    # Run Docker container with comprehensive logging
    docker run -d \
        --name my-app-container \
        -p ${PORT}:${PORT} \
        -e PORT=${PORT} \
        -e VITE_DOMAIN_NAME=${VITE_DOMAIN_NAME} \
        -e AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
        -e AWS_BUCKET_REGION=${AWS_BUCKET_REGION} \
        -e AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
        -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
        my-app || {
            echo "Container start failed"
            docker logs my-app-container
            return 1
        }

    # Verify container status
    docker ps | grep my-app-container
    
    set +x  # Disable verbose output
    return 0
}


# Function to install and configure SSL with Certbot
install_ssl_certificate() {
    local domain="$1"

    # Check if domain is provided
    if [[ -z "$domain" ]]; then
        echo "Error: No domain provided for SSL certificate"
        return 1
    fi

    # Install Certbot dependencies
    if command -v yum &> /dev/null; then
        # Amazon Linux / RHEL based
        sudo amazon-linux-extras enable epel
        sudo yum clean metadata
        sudo yum install -y certbot python3-certbot-nginx
    elif command -v apt-get &> /dev/null; then
        # Ubuntu/Debian based
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    else
        echo "Unsupported package manager. Please install Certbot manually."
        return 1
    fi

    # Obtain SSL Certificate
    echo "Obtaining SSL certificate for $domain..."
   # Use email from environment variable if available
    if [[ -n "$EMAIL" ]]; then
        sudo certbot --nginx -d "$domain" --non-interactive --agree-tos \
            --email "$EMAIL" || return 1
    else
        # If no email is provided, use the --register-unsafely-without-email flag
        sudo certbot --nginx -d "$domain" --non-interactive --agree-tos \
            --register-unsafely-without-email || return 1
    fi

    # Test automatic renewal
    sudo certbot renew --dry-run

    # Restart Nginx to ensure new SSL configuration is loaded
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx reloaded successfully"
    else
        echo "Error: Nginx config test failed. Not reloading." 
        return 1
    fi

    echo "SSL certificate for $domain installed successfully!"
    return 0
}


# Main script
while true; do
    echo "Welcome to the project setup script!"
    echo "Are you done with the Environment variables setup?"
    read -p "Do you want to proceed with project setup? (y/n) " yn

    case ${yn,,} in
    [y])  
        # Check environment variables
        if ! check_env_vars; then
            echo "Please set all required environment variables before proceeding."
            continue
        fi

        # Nginx setup confirmation
        read -p "Do you want to configure Nginx? (y/n) " nginx_setup

        case ${nginx_setup,,} in
        [y])
            echo "Configuring Nginx..."
            if ! install_and_configure_nginx; then
                echo "Error: Failed to configure Nginx"
                continue 
            fi
            echo "Nginx setup completed successfully!"
            ;;
        [n])
            echo "Skipping Nginx setup."
            ;;
        *)
            echo "Invalid response. Please answer y or n."
            continue
            ;;
        esac

        # Docker setup confirmation
        read -p "Do you want to build and run Docker containers? (y/n) " docker_setup

        case ${docker_setup,,} in
        [y])
            echo "Setting up Docker containers..."
            if ! build_and_run_docker; then
                echo "Error: Failed to build or run Docker containers"
                continue 
            fi
            echo "Docker setup completed successfully!"
            ;;
        [n])
            echo "Skipping Docker setup."
            ;;
        *)
            echo "Invalid response. Please answer y or n."
            continue
            ;;
        esac

        # SSL Certificate setup confirmation
        read -p "Do you want to install SSL certificate for $VITE_DOMAIN_NAME? (y/n) " ssl_setup

        case ${ssl_setup,,} in
        [y])
            echo "Setting up SSL certificate..."
            if ! install_ssl_certificate "$VITE_DOMAIN_NAME"; then
                echo "Error: Failed to install SSL certificate"
                continue 
            fi
            echo "SSL certificate setup completed successfully!"
            ;;
        [n])
            echo "Skipping SSL certificate setup."
            ;;
        *)
            echo "Invalid response. Please answer y or n."
            continue
            ;;
        esac
        ;;
    [n])
        echo "Project setup cancelled."
        exit 0
        ;;
    *)
        echo "Invalid response. Please answer y or n."
        ;;
    esac
done

echo "Setup completed successfully!"
