# Electron FastAPI Sidecar

A modern Electron application with FastAPI backend sidecar.

## Requirements

- Node.js >= 18 (must be installed manually)

All other dependencies (Python, pnpm, uv, etc.) will be installed automatically.

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build application
pnpm build:mac  # For macOS
pnpm build:win  # For Windows
pnpm build:linux  # For Linux
```

## Architecture

The application consists of two main parts:

- Electron frontend (TypeScript + React)
- FastAPI backend sidecar (Python)

The FastAPI backend is bundled with the Electron application using PyInstaller.
