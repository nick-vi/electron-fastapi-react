#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

success_message() {
    echo -e "${GREEN}$1${NC}"
}

info_message() {
    echo -e "${BLUE}$1${NC}"
}

warning_message() {
    echo -e "${YELLOW}$1${NC}"
}

check_requirements() {
    info_message "Checking for required tools..."


    if ! command_exists node; then
        error_exit "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    else
        success_message "Node.js is installed: $(node --version)"
    fi


    if ! command_exists pnpm; then
        error_exit "pnpm is not installed. Please install pnpm using 'npm install -g pnpm'"
    else
        success_message "pnpm is installed: $(pnpm --version)"
    fi


    if ! command_exists python3; then
        error_exit "Python 3 is not installed. Please install Python 3 from https://www.python.org/downloads/"
    else
        success_message "Python is installed: $(python3 --version)"
    fi


    if ! command_exists uv; then
        warning_message "uv is not installed. Please install uv using one of the following methods:"
        echo "  - curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo "  - pip install uv"
        error_exit "uv is required for Python dependency management"
    else
        success_message "uv is installed: $(uv --version)"
    fi
}

calculate_python_hash() {
    if [ -f "api/requirements.txt" ]; then
        cat api/requirements.txt | md5sum | cut -d ' ' -f 1
    else
        echo "fastapi uvicorn pyinstaller" | md5sum | cut -d ' ' -f 1
    fi
}

get_latest_versions() {
    info_message "Checking for latest package versions..."


    FASTAPI_VERSION="0.115.12"
    UVICORN_VERSION="0.34.2"
    PYINSTALLER_VERSION="6.13.0"


    if command_exists uv; then
    
        FASTAPI_VERSION=$(uv pip search fastapi --no-cache 2>/dev/null | grep -m 1 "^fastapi " | awk '{print $2}' || echo "0.115.12")
        UVICORN_VERSION=$(uv pip search uvicorn --no-cache 2>/dev/null | grep -m 1 "^uvicorn " | awk '{print $2}' || echo "0.34.2")
        PYINSTALLER_VERSION=$(uv pip search pyinstaller --no-cache 2>/dev/null | grep -m 1 "^pyinstaller " | awk '{print $2}' || echo "6.13.0")
    fi

    success_message "Using package versions: FastAPI $FASTAPI_VERSION, Uvicorn $UVICORN_VERSION, PyInstaller $PYINSTALLER_VERSION"
}

setup_python() {
    info_message "Setting up Python environment..."

    get_latest_versions

    if [ ! -f "api/requirements.txt" ]; then
        echo "fastapi==$FASTAPI_VERSION" > api/requirements.txt
        echo "uvicorn==$UVICORN_VERSION" >> api/requirements.txt
        echo "pyinstaller==$PYINSTALLER_VERSION" >> api/requirements.txt
    fi

    PYTHON_HASH=$(calculate_python_hash)
    HASH_FILE="api/.deps_hash"

    if [ -f "$HASH_FILE" ] && [ "$(cat $HASH_FILE)" == "$PYTHON_HASH" ]; then
        success_message "Python dependencies are up to date."
    else
        info_message "Installing Python dependencies..."
    
        if [ ! -d "api/venv" ]; then
            uv venv api/venv || error_exit "Failed to create virtual environment"
            success_message "Created virtual environment at api/venv"
        fi
    
        VIRTUAL_ENV=api/venv uv pip install -r api/requirements.txt || error_exit "Failed to install Python dependencies"
        success_message "Installed Python dependencies"
    
        echo "$PYTHON_HASH" > "$HASH_FILE"
    fi
}

setup_node() {
    info_message "Setting up Node.js dependencies..."

    if [ ! -d "node_modules" ]; then
        pnpm install || error_exit "Failed to install Node.js dependencies"
        success_message "Installed Node.js dependencies"
    else
        success_message "Node.js dependencies are already installed"
    fi
}

generate_spec_file() {
    info_message "Generating PyInstaller spec file..."

    (cd api && ../api/venv/bin/pyi-makespec \
        --name api \
        --add-data "../api/requirements.txt:./" \
        --hidden-import uvicorn.logging \
        --hidden-import uvicorn.protocols \
        --hidden-import uvicorn.protocols.http \
        --hidden-import uvicorn.protocols.http.auto \
        --hidden-import uvicorn.protocols.websockets \
        --hidden-import uvicorn.protocols.websockets.auto \
        --hidden-import uvicorn.lifespan \
        --hidden-import uvicorn.lifespan.on \
        --hidden-import uvicorn.lifespan.off \
        run.py) || error_exit "Failed to generate PyInstaller spec file"

    success_message "Generated PyInstaller spec file"
}

build_fastapi() {
    info_message "Building FastAPI application..."

    if [ -d "api/dist/api" ]; then
        success_message "FastAPI application is already built"
    else
        if [ ! -f "api/api.spec" ]; then
            generate_spec_file
        fi
        (cd api && ../api/venv/bin/pyinstaller api.spec) || error_exit "Failed to build FastAPI application"
        success_message "Built FastAPI application"
    fi
}

main() {
    info_message "Starting setup for electron-fastapi-sidecar..."

    check_requirements

    setup_python

    setup_node

    build_fastapi

    success_message "Setup completed successfully!"
    info_message "You can now run the application with: pnpm start"
}

main
