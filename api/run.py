import importlib.util
from pathlib import Path
import sys

import uvicorn

from logger import get_logger, log_error, log_info, log_warning


logger = get_logger("runner")


def start_server(port: int = 8000, app_args: list[str] | None = None) -> None:
    """
    Start the FastAPI server with the given port and arguments.

    Args:
        port: The port to run the server on
        app_args: Additional arguments to pass to the FastAPI application
    """
    log_info(f"Starting FastAPI server on port {port}")
    if app_args:
        log_info(f"With arguments: {app_args}")

    try:
        cwd = Path.cwd()
        log_info(f"Current working directory: {cwd}")

        # Check if we're running in a PyInstaller bundle
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            log_info(f"Running in PyInstaller bundle: {sys._MEIPASS}")
            # Try to import main module directly
            try:
                # First, try to import from current directory
                spec = importlib.util.spec_from_file_location("main", cwd / "main.py")
                if spec and spec.loader:
                    main_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(main_module)
                    log_info("Successfully imported main module from current directory")
                    uvicorn.run(
                        main_module.app,
                        host="127.0.0.1",
                        port=port,
                        reload=False,
                        log_level="info",
                    )
                    return
            except Exception as e:
                log_warning(
                    f"Failed to import main module from current directory: {str(e)}"
                )
                # Continue to standard import

        # Standard import approach
        log_info("Using standard import for main:app")
        uvicorn.run(
            "main:app", host="127.0.0.1", port=port, reload=False, log_level="info"
        )
    except Exception as e:
        log_error(f"Failed to start server: {str(e)}", exc_info=True)


if __name__ == "__main__":
    port = 8000
    app_path = "Unknown"

    if len(sys.argv) > 1:
        app_path = sys.argv[1]
        log_info(f"Received app_path: {app_path}")
    else:
        log_warning("No app_path provided, using default value")

    log_info(f"Python version: {sys.version}")
    log_info(f"Platform: {sys.platform}")

    log_info("Starting FastAPI server")
    start_server(port=port, app_args=[app_path])
