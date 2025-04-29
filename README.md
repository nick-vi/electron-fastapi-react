# Electron FastAPI Sidecar

A modern Electron application with FastAPI backend sidecar.

## Requirements

- Node.js >= 18 (must be installed manually)

All other dependencies (Python, pnpm, uv, etc.) will be installed automatically.

## Development

```bash
# Install dependencies
pnpm dev-setup

# Start development
pnpm dev

# Build application
# Because we're using PyInstaller you can only build for the platform you're building on
pnpm build
```

## Architecture

The application consists of two main parts:

- Electron frontend (TypeScript + React)
- FastAPI backend sidecar (Python)

The FastAPI backend is bundled with the Electron application using PyInstaller.
