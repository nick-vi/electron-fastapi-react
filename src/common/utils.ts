/**
 * Check if the application is running in development mode
 * @returns True if the application is running in development mode, false otherwise
 */
export const isDevelopment = (): boolean => process.env.NODE_ENV === "development";
