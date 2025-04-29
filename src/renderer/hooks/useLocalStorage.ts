import { logger } from "@renderer/logger";
import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook for handling local storage with real-time updates
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      // Only log debug for non-standard keys to reduce noise
      if (!key.startsWith("debug-console")) {
        logger.debug(`Reading ${key}`, { key, value: item || "not found" });
      }
      if (!item) return initialValue;

      try {
        return JSON.parse(item) as T;
      } catch (jsonError) {
        if (typeof initialValue === "string") {
          return item as unknown as T;
        }
        console.warn(`Error parsing JSON for localStorage key "${key}":`, jsonError);
        return initialValue;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === "undefined") return;

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Only log debug for non-standard keys to reduce noise
        if (!key.startsWith("debug-console")) {
          logger.debug(`Setting ${key}`, {
            key,
            oldValue: storedValue,
            newValue: valueToStore,
          });
        }

        setStoredValue(valueToStore);

        if (typeof valueToStore === "string") {
          window.localStorage.setItem(key, valueToStore);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }

        window.dispatchEvent(new CustomEvent("local-storage-change", { detail: { key } }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      if (e.type === "storage") {
        const storageEvent = e as StorageEvent;
        if (storageEvent.key === key || storageEvent.key === null) {
          const newValue = readValue();
          // Only log debug for non-standard keys to reduce noise
          if (!key.startsWith("debug-console")) {
            logger.debug(`Storage event for ${key}`, { key, newValue });
          }
          setStoredValue(newValue);
        }
        return;
      }

      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.key === key) {
        const newValue = readValue();
        // Only log debug for non-standard keys to reduce noise
        if (!key.startsWith("debug-console")) {
          logger.debug(`Custom event for ${key}`, { key, newValue });
        }
        setStoredValue(newValue);
      }
    };

    window.addEventListener("local-storage-change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("local-storage-change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
