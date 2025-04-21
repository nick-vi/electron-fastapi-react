import { createServer } from "net";
import logger from "./logger";

/**
 * Get a free port from the OS
 * @returns Promise that resolves to a free port number
 */
export function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on("error", (err) => {
      logger.error("Error getting free port", err);
      reject(err);
    });

    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => {
          logger.debug(`Found free port: ${port}`);
          resolve(port);
        });
      } else {
        server.close();
        reject(new Error("Could not get server address"));
      }
    });
  });
}
