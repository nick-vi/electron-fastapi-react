import { LogEntry } from "@common/logger-types";
import { LogList } from "./LogList";
import React, { useState, useEffect } from "react";
import useLocalStorage from "@renderer/hooks/useLocalStorage";
import { useLogging } from "./LoggingContext";

type ConsoleState = "expanded" | "collapsed" | "minimized";

type ConsoleProps = {
  logs: LogEntry[];
};

export function Console({ logs }: ConsoleProps) {
  const { clearLogs } = useLogging();
  const [consoleState, setConsoleState] = useLocalStorage<ConsoleState>(
    "console-state",
    "collapsed"
  );
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useLocalStorage<{ x: number; y: number }>(
    "console-position",
    { x: window.innerWidth - 80, y: window.innerHeight - 80 }
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const toggleConsole = () => {
    if (consoleState === "expanded") {
      setConsoleState("collapsed");
    } else if (consoleState === "collapsed") {
      setConsoleState("expanded");
    } else {
      setConsoleState("collapsed");
    }
  };

  const minimizeConsole = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConsoleState("minimized");
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (consoleState !== "minimized") return;

    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Update position when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (consoleState === "minimized" && !isDragging) {
        setPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 80,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [consoleState, isDragging, setPosition]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, setPosition]);

  if (consoleState === "minimized") {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 cursor-move items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700"
        style={isDragging ? { left: `${position.x}px`, top: `${position.y}px` } : {}}
        onClick={() => setConsoleState("collapsed")}
        onMouseDown={handleDragStart}
      >
        <div className="relative">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {logs.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
              {logs.length > 99 ? "99+" : logs.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Console Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-200 px-4 py-2"
        onClick={toggleConsole}
      >
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <h3 className="font-medium text-gray-700">Console</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {logs.length} logs
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            title="Clear logs"
            disabled={logs.length === 0}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={minimizeConsole}
            title="Minimize to corner"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 3h6v6M14 10L21 3M9 21H3v-6M10 14L3 21"
              />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <svg
              className={`h-5 w-5 transform transition-transform ${
                consoleState === "expanded" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Console Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          consoleState === "expanded" ? "max-h-128" : "max-h-0"
        }`}
      >
        <LogList logs={logs} />
      </div>
    </div>
  );
}
