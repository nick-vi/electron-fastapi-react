import { MaximizeIcon } from "@renderer/components/icons";
import { useConsole } from "../ConsoleContext";

/**
 * Button shown when console is minimized
 */
export function MinimizedConsoleButton() {
  const { toggleMinimize } = useConsole();
  return (
    <button
      className="fixed bottom-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-900/90 text-white hover:bg-indigo-800/90"
      onClick={toggleMinimize}
    >
      <MaximizeIcon />
    </button>
  );
}
