#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

EMOJI_START="🚀"
EMOJI_CHECK="✓"
EMOJI_ERROR="❌"
EMOJI_WARNING="⚠️"
EMOJI_INFO="ℹ️"
EMOJI_BUILD="🔨"
EMOJI_PACKAGE="📦"
EMOJI_CLEAN="🧹"
EMOJI_DONE="✅"
EMOJI_TIME="⏱️"
EMOJI_SIZE="📊"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

error_exit() {
    echo -e "${EMOJI_ERROR} ${RED}Error: $1${NC}" >&2
    exit 1
}

success_message() {
    echo -e "${EMOJI_CHECK} ${GREEN}$1${NC}"
}

info_message() {
    echo -e "${EMOJI_INFO} ${BLUE}$1${NC}"
}

warning_message() {
    echo -e "${EMOJI_WARNING} ${YELLOW}$1${NC}"
}

time_message() {
    echo -e "${EMOJI_TIME} ${CYAN}$1${NC}"
}

size_message() {
    echo -e "${EMOJI_SIZE} ${MAGENTA}$1${NC}"
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
    if [ -f "api/pyproject.toml" ]; then
        cat api/pyproject.toml | md5sum | cut -d ' ' -f 1
    else
        echo "fastapi[standard] pyinstaller" | md5sum | cut -d ' ' -f 1
    fi
}

format_time() {
    local ms=$1
    if [ "$ms" -lt 1000 ]; then
        echo "${ms}ms"
    else
        local seconds=$(echo "scale=2; $ms/1000" | bc)
        if [ $(echo "$seconds < 60" | bc) -eq 1 ]; then
            echo "${seconds}s"
        else
            local minutes=$(echo "scale=0; $seconds/60" | bc)
            local remaining_seconds=$(echo "scale=1; $seconds - $minutes*60" | bc)
            echo "${minutes}m ${remaining_seconds}s"
        fi
    fi
}

format_size() {
    local bytes=$1
    if [ "$bytes" -lt 1024 ]; then
        echo "${bytes} B"
    else
        local kb=$(echo "scale=2; $bytes/1024" | bc)
        if [ $(echo "$kb < 1024" | bc) -eq 1 ]; then
            echo "${kb} KB"
        else
            local mb=$(echo "scale=2; $kb/1024" | bc)
            if [ $(echo "$mb < 1024" | bc) -eq 1 ]; then
                echo "${mb} MB"
            else
                local gb=$(echo "scale=2; $mb/1024" | bc)
                echo "${gb} GB"
            fi
        fi
    fi
}

get_dir_size() {
    local dir_path=$1
    if [ -d "$dir_path" ]; then
        local size=$(du -sk "$dir_path" | cut -f1)
        echo $((size * 1024))
    else
        echo 0
    fi
}

run_timed_command() {
    local command=$1
    local description=$2
    local emoji=$3

    echo -e "\n${emoji} ${BOLD}${CYAN}${description}${NC}"
    echo -e "${YELLOW}$ ${command}${NC}"

    local start_time=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
    eval $command
    local exit_code=$?
    local end_time=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
    local time_taken=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        time_message "Completed in $(format_time $time_taken)"
        return $time_taken
    else
        error_exit "Command failed with exit code $exit_code"
        return 1
    fi
}

get_latest_versions() {
    info_message "Using dependencies from api/pyproject.toml"
}

setup_python() {
    info_message "Setting up Python environment..."

    get_latest_versions


    if [ ! -f "api/pyproject.toml" ]; then
        warning_message "api/pyproject.toml not found, creating a minimal one"
        mkdir -p api
        echo '[project]' > api/pyproject.toml
        echo 'name = "electron-fastapi-sidecar-api"' >> api/pyproject.toml
        echo 'version = "0.1.0"' >> api/pyproject.toml
        echo 'dependencies = ["fastapi[standard]", "pyinstaller"]' >> api/pyproject.toml
    fi

    PYTHON_HASH=$(calculate_python_hash)
    HASH_FILE="api/.deps_hash"

    if [ -f "$HASH_FILE" ] && [ "$(cat $HASH_FILE)" == "$PYTHON_HASH" ]; then
        success_message "Python dependencies are up to date."
    else
        info_message "Installing Python dependencies..."

        if [ ! -d "api/.venv" ]; then
            # Create a virtual environment with the Python version specified in pyproject.toml
            uv venv api/.venv || error_exit "Failed to create virtual environment"
            success_message "Created virtual environment at api/.venv"

            # Log the Python version in the virtual environment
            VENV_PYTHON_VERSION=$(api/.venv/bin/python --version 2>&1)
            info_message "Virtual environment Python version: ${VENV_PYTHON_VERSION}"
        fi

        if [ -f "api/pyproject.toml" ]; then
            cd api && VIRTUAL_ENV=venv uv pip install -e . || error_exit "Failed to install Python dependencies"
            cd ..
        else
            VIRTUAL_ENV=api/.venv uv pip install fastapi[standard] pyinstaller || error_exit "Failed to install Python dependencies"
        fi
        success_message "Installed Python dependencies"

        echo "$PYTHON_HASH" > "$HASH_FILE"
    fi


    if [ ! -f "api/.venv/bin/pyinstaller" ]; then
        info_message "Installing PyInstaller..."
        cd api && VIRTUAL_ENV=venv uv pip install pyinstaller || error_exit "Failed to install PyInstaller"
        cd ..
        success_message "Installed PyInstaller"
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

    (cd api && .venv/bin/pyi-makespec \
        --name api \
        --add-data "pyproject.toml:./" \
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
        (cd api && .venv/bin/pyinstaller api.spec) || error_exit "Failed to build FastAPI application"
        success_message "Built FastAPI application"
    fi
}

build_electron() {
    echo -e "\n${EMOJI_START} ${BOLD}${MAGENTA}Starting build process for Electron FastAPI Sidecar${NC}"

    local version=$(grep '"version":' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
    echo -e "${BOLD}Version:${NC} ${version}"

    local start_time=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
    local total_time=0

    run_timed_command "rm -rf dist dist-electron" "Cleaning previous builds" "${EMOJI_CLEAN}"
    total_time=$?

    run_timed_command "pnpm run build:vite" "Building Electron app with electron-vite" "${EMOJI_BUILD}"
    total_time=$((total_time + $?))

    local dist_electron_size=$(get_dir_size "dist-electron")
    size_message "dist-electron size: $(format_size $dist_electron_size)"

    run_timed_command "pnpm run build:electron" "Building installer with electron-builder" "${EMOJI_PACKAGE}"
    total_time=$((total_time + $?))

    local dist_size=$(get_dir_size "dist")
    size_message "dist size: $(format_size $dist_size)"

    if [ -d "dist" ]; then
        for file in dist/*.dmg dist/*.exe dist/*.AppImage dist/*.deb; do
            if [ -f "$file" ]; then
                local file_size=$(stat -f%z "$file")
                size_message "$(basename $file): $(format_size $file_size)"
            fi
        done
    fi

    local end_time=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
    local total_time_taken=$((end_time - start_time))

    echo -e "\n${EMOJI_DONE} ${BOLD}${GREEN}Build completed successfully in $(format_time $total_time_taken)${NC}"
    echo -e "${CYAN}Total build time: $(format_time $total_time)${NC}"
}

main() {
    echo -e "\n${EMOJI_START} ${BOLD}${MAGENTA}Starting setup for electron-fastapi-sidecar...${NC}"

    check_requirements

    setup_python

    setup_node

    build_fastapi

    if [ "$1" == "--build" ]; then
        build_electron
    fi
}

main "$@"
