import { App } from "@renderer/App";
import { ConsoleProvider } from "@renderer/features/console/ConsoleContext";
import { initLogger, logger } from "@renderer/features/console/logger";
import React from "react";
import ReactDOM from "react-dom/client";
import "./app.css";

initLogger();
logger.info("Renderer process starting");

const root = document.getElementById("root");
if (!root) {
  logger.error("Root element not found");
  throw new Error("Root element not found");
}

logger.info("Rendering React application");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ConsoleProvider>
      <App />
    </ConsoleProvider>
  </React.StrictMode>
);

logger.info("React application rendered");
