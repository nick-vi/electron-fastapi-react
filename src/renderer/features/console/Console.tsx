import { cn } from "@renderer/utils/cn";
import { useEffect, useState } from "react";
import { useConsole } from "./ConsoleContext";
import {
  ConsoleFilters,
  ConsoleHeader,
  ConsoleLogList,
  ConsoleToolbar,
  MinimizedConsoleButton,
} from "./components";

export function Console() {
  const { isMinimized, isExpanded, showFilters, showMenu } = useConsole();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 850);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    window.isMobileState = isMobile;
  }, [isMobile]);

  if (!isMinimized) {
    return <MinimizedConsoleButton />;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-900/90 text-xs text-white transition-all duration-300 ease-in-out">
      <div
        className={cn(
          "flex flex-col border-b border-white/20",
          !isMobile && "flex-row items-center justify-between"
        )}
      >
        <ConsoleHeader />

        {(!isMobile || (isMobile && showMenu)) && <ConsoleToolbar />}
      </div>

      {showFilters && <ConsoleFilters />}

      {isExpanded && <ConsoleLogList />}
    </div>
  );
}
