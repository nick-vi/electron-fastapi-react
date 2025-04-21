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

get_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*) echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

install_homebrew() {
    info_message "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || error_exit "Failed to install Homebrew"
    success_message "Homebrew installed successfully"
}

install_chocolatey() {
    info_message "Installing Chocolatey..."
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" || error_exit "Failed to install Chocolatey"
    success_message "Chocolatey installed successfully"
}

install_python() {
    info_message "Installing Python 3.12..."

    OS=$(get_os)
    case "$OS" in
        macos)
            if ! command_exists brew; then
                install_homebrew
            fi
            brew install python@3.12 || error_exit "Failed to install Python 3.12"
            brew link python@3.12 || warning_message "Failed to link Python 3.12"
            ;;
        windows)
            if ! command_exists choco; then
                install_chocolatey
            fi
            choco install python312 -y || error_exit "Failed to install Python 3.12"
            ;;
        linux)
            warning_message "Automatic Python installation on Linux is not supported"
            warning_message "Please install Python 3.12 manually using your distribution's package manager"
            error_exit "Python 3.12 is required"
            ;;
        *)
            error_exit "Unsupported operating system"
            ;;
    esac

    success_message "Python 3.12 installed successfully"
}

install_node() {
    info_message "Installing Node.js..."

    OS=$(get_os)
    case "$OS" in
        macos)
            if ! command_exists brew; then
                install_homebrew
            fi
            brew install node || error_exit "Failed to install Node.js"
            ;;
        windows)
            if ! command_exists choco; then
                install_chocolatey
            fi
            choco install nodejs -y || error_exit "Failed to install Node.js"
            ;;
        linux)
            warning_message "Automatic Node.js installation on Linux is not supported"
            warning_message "Please install Node.js manually using your distribution's package manager"
            error_exit "Node.js is required"
            ;;
        *)
            error_exit "Unsupported operating system"
            ;;
    esac

    success_message "Node.js installed successfully"
}

install_pnpm() {
    info_message "Installing pnpm..."

    if command_exists npm; then
        npm install -g pnpm || error_exit "Failed to install pnpm"
    else
        OS=$(get_os)
        case "$OS" in
            macos|linux)
                curl -fsSL https://get.pnpm.io/install.sh | sh - || error_exit "Failed to install pnpm"
                ;;
            windows)
                powershell -Command "iwr https://get.pnpm.io/install.ps1 -useb | iex" || error_exit "Failed to install pnpm"
                ;;
            *)
                error_exit "Unsupported operating system"
                ;;
        esac
    fi

    success_message "pnpm installed successfully"
}

install_uv() {
    info_message "Installing uv..."

    if command_exists pip || command_exists pip3; then
        PIP_CMD="pip"
        if ! command_exists pip && command_exists pip3; then
            PIP_CMD="pip3"
        fi

        $PIP_CMD install uv || error_exit "Failed to install uv"
    else
        OS=$(get_os)
        case "$OS" in
            macos|linux)
                curl -LsSf https://astral.sh/uv/install.sh | sh || error_exit "Failed to install uv"
                ;;
            windows)
                powershell -Command "irm https://astral.sh/uv/install.ps1 | iex" || error_exit "Failed to install uv"
                ;;
            *)
                error_exit "Unsupported operating system"
                ;;
        esac
    fi

    success_message "uv installed successfully"
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

# Global variables
PYTHON_FOUND=false
PYTHON_VERSION=""
PYTHON_CMD=""

check_requirements() {
    info_message "Checking for required tools..."

    # Check for Python 3.12

    for py_cmd in "python3.12" "python3" "python"; do
        if command_exists $py_cmd; then
            PYTHON_CMD=$py_cmd
            PYTHON_VERSION=$($py_cmd --version 2>&1)
            PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d' ' -f2 | cut -d'.' -f1)
            PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d' ' -f2 | cut -d'.' -f2)

            if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 12 ]; then
                PYTHON_FOUND=true
                success_message "Python 3.12+ is installed: $PYTHON_VERSION"
                break
            fi
        fi
    done

    if [ "$PYTHON_FOUND" = false ]; then
        warning_message "Python 3.12 or higher is not installed"
        install_python
    fi

    # Check for Node.js
    if ! command_exists node; then
        warning_message "Node.js is not installed"
        install_node
    else
        success_message "Node.js is installed: $(node --version)"
    fi

    # Check for pnpm
    if ! command_exists pnpm; then
        warning_message "pnpm is not installed"
        install_pnpm
    else
        success_message "pnpm is installed: $(pnpm --version)"
    fi

    # Check for uv
    if ! command_exists uv; then
        warning_message "uv is not installed"
        install_uv
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
            # Use the Python 3.12+ that we found in check_requirements
            if [ "$PYTHON_FOUND" = true ] && [ -n "$PYTHON_CMD" ]; then
                info_message "Creating virtual environment with $PYTHON_CMD ($PYTHON_VERSION)"
                PYTHON_PATH=$(which $PYTHON_CMD)
                uv venv --python $PYTHON_PATH api/.venv || error_exit "Failed to create virtual environment"
            else
                # Try to find Python 3.12 or higher again
                PYTHON_PATH=""
                for py_cmd in "python3.12" "python3.13" "python3.14" "python3"; do
                    if command_exists $py_cmd; then
                        PY_VERSION=$($py_cmd --version 2>&1)
                        info_message "Found $py_cmd: $PY_VERSION"
                        PYTHON_PATH=$(which $py_cmd)
                        break
                    fi
                done

                if [ -z "$PYTHON_PATH" ]; then
                    warning_message "Could not find Python 3.12 or higher. Using system Python."
                    warning_message "This may cause issues if your system Python is older than 3.12."
                    warning_message "Consider installing Python 3.12 or higher."
                    uv venv api/.venv || error_exit "Failed to create virtual environment"
                else
                    info_message "Creating virtual environment with $PYTHON_PATH"
                    uv venv --python $PYTHON_PATH api/.venv || error_exit "Failed to create virtual environment"
                fi
            fi

            success_message "Created virtual environment at api/.venv"

            # Log the Python version in the virtual environment
            VENV_PYTHON_VERSION=$(api/.venv/bin/python --version 2>&1)
            info_message "Virtual environment Python version: ${VENV_PYTHON_VERSION}"
        fi

        if [ -f "api/pyproject.toml" ]; then
            cd api && VIRTUAL_ENV=.venv uv pip install -e . || error_exit "Failed to install Python dependencies"
            cd ..
        else
            VIRTUAL_ENV=api/.venv uv pip install fastapi[standard] pyinstaller || error_exit "Failed to install Python dependencies"
        fi
        success_message "Installed Python dependencies"

        echo "$PYTHON_HASH" > "$HASH_FILE"
    fi


    if [ ! -f "api/.venv/bin/pyinstaller" ]; then
        info_message "Installing PyInstaller..."
        cd api && VIRTUAL_ENV=.venv uv pip install pyinstaller || error_exit "Failed to install PyInstaller"
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

    (cd api && ./.venv/bin/pyi-makespec \
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
        (cd api && ./.venv/bin/pyinstaller api.spec) || error_exit "Failed to build FastAPI application"
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
