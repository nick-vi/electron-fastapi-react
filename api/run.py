from pathlib import Path
import sys
import argparse

import uvicorn

from logger import get_logger, log_error, log_info, log_warning


logger = get_logger("runner")


def start_server(port: int, reload: bool = False, log_level: str = "info", app_args: list[str] | None = None) -> None:
    """
    Start the FastAPI server with the given port and arguments.

    Args:
        port: The port to run the server on
        reload: Whether to enable auto-reload
        log_level: Log level for uvicorn
        app_args: Additional arguments to pass to the FastAPI application
    """
    log_info(f"Starting FastAPI server on port {port}")
    if app_args:
        log_info(f"With arguments: {app_args}")

    try:
        cwd = Path.cwd()
        log_info(f"Current working directory: {cwd}")

        # Standard import approach
        log_info("Using standard import for main:app")
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=port,
            reload=reload,
            log_level=log_level,
        )
    except Exception as e:
        log_error(f"Failed to start server: {str(e)}", exc_info=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start the FastAPI server")
    parser.add_argument("--app-path", default="Unknown", help="Path to the application")
    parser.add_argument("--port", type=int, required=True, help="Port to run the server on")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"], help="Log level")
    args = parser.parse_args()

    app_path = args.app_path
    port = args.port
    reload = args.reload
    log_level = args.log_level

    log_info(f"Received app_path: {app_path}")
    log_info(f"Using port: {port}")
    log_info(f"Reload enabled: {reload}")
    log_info(f"Log level: {log_level}")
    log_info(f"Python version: {sys.version}")
    log_info(f"Platform: {sys.platform}")

    log_info("Starting FastAPI server")
    start_server(port=port, reload=reload, log_level=log_level, app_args=[app_path])
