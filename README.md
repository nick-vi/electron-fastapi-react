# Electron FastAPI Sidecar

A template for Electron applications with a FastAPI Python backend.

## Features

- **Electron + React Frontend**: TypeScript, React, and Tailwind CSS
- **FastAPI Python Backend**: Runs as a sidecar process
- **Custom Console**: Built-in log viewer with source classification
- **Auto-Reloading**: Hot reload for both React and Python code during development
- **API Lifecycle Management**: Start, stop, and restart the API from the UI
- **Production Ready**: PyInstaller bundling for distribution

## Quick Start

```bash
# Install dependencies
pnpm dev-setup

# Start development
pnpm dev

# Build application
pnpm build
```

## Key Components

### Logging System

```typescript
// In renderer process
import { logger } from "@renderer/features/console/logger";
logger.info("This is a log message");

// In main process
import logger from "@main/logger";
logger.info("This is a log message");

// In Python code
from logger import get_logger, log_debug, log_error, log_info
log_info("This is a log message")
```

Logs from all sources (main process, renderer, Python) are captured and displayed in the custom console.

### useSidecar Hook

```typescript
const {
  // Status indicators
  isOk, // Whether API is running and ready
  isStarting, // Whether API is starting
  isError, // Whether API is in error state

  // API information
  port, // Current port number or null
  error, // Error message or null
  statusDisplay, // Human-readable status message

  // Actions
  start, // Start the API
  stop, // Stop the API
  restart, // Restart the API
} = useSidecar();
```

Example usage:

```tsx
function ApiControls() {
  const { isOk, isStarting, error, statusDisplay, start, stop } = useSidecar();

  return (
    <div>
      <p>Status: {statusDisplay}</p>
      {error && <p className="error">Error: {error}</p>}

      <button onClick={start} disabled={isOk || isStarting}>
        Start API
      </button>

      <button onClick={stop} disabled={!isOk}>
        Stop API
      </button>
    </div>
  );
}
```

## Development Notes

- Python code auto-reloads when files change
- The API sidecar is automatically terminated when the window is closed
