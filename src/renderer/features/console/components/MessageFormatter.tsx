import { CopyIcon } from "@renderer/components/icons";

/**
 * Formats and renders different types of log messages with syntax highlighting
 */
export function MessageFormatter({ message }: { message: string | object }) {
  if (typeof message === "string") {
    if (message.includes("\n") && message.includes(" at ")) {
      return <StackTraceFormatter message={message} />;
    }
    return <span className="whitespace-pre-wrap">{message}</span>;
  }

  return <JsonFormatter object={message} />;
}

/**
 * Formats stack traces with syntax highlighting
 */
function StackTraceFormatter({ message }: { message: string }) {
  return (
    <div className="relative group">
      <pre className="whitespace-pre-wrap text-white/80 font-mono text-xs overflow-x-auto bg-black/20 p-2 rounded overflow-y-auto">
        {message.split("\n").map((line, i) => {
          if (line.includes(" at ")) {
            const [beforeAt, afterAt] = line.split(/ at (.+)/);
            return (
              <div
                key={i}
                className="animate-[fadeIn_0.3s_ease-in-out]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {beforeAt && <span className="text-red-400 font-semibold">{beforeAt} </span>}
                {afterAt && (
                  <>
                    <span className="text-gray-400">at </span>
                    <span className="text-yellow-300">{afterAt}</span>
                  </>
                )}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="animate-[fadeIn_0.3s_ease-in-out]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {line}
            </div>
          );
        })}
      </pre>
      <div className="absolute top-0 right-0 bg-red-500/20 text-white/90 px-2 py-0.5 text-xs rounded-bl">
        Stack Trace
      </div>
    </div>
  );
}

/**
 * Formats JSON objects with syntax highlighting and copy button
 */
function JsonFormatter({ object }: { object: object }) {
  try {
    const formattedJson = JSON.stringify(object, null, 2);
    return (
      <div className="relative group py-1">
        <pre className="whitespace-pre-wrap text-white/80 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto bg-black/20 p-2 rounded scrollbar-thin scrollbar-thumb-indigo-300/50 hover:scrollbar-thumb-indigo-300/70 scrollbar-track-indigo-900/50">
          {formattedJson.split("\n").map((line, i) => {
            if (line.includes(":")) {
              const [key, ...rest] = line.split(":");
              return (
                <div key={i}>
                  <span className="text-blue-300">{key}</span>:<span>{rest.join(":")}</span>
                </div>
              );
            }
            return <div key={i}>{line}</div>;
          })}
        </pre>
        <button
          className="cursor-pointer absolute top-3 right-2 bg-indigo-900 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (typeof window.navigator !== "undefined" && window.navigator.clipboard) {
              window.navigator.clipboard.writeText(formattedJson);
            }
          }}
          title="Copy to clipboard"
        >
          <CopyIcon className="h-4 w-4 text-white/70" />
        </button>
      </div>
    );
  } catch {
    return <span className="text-red-300">{String(object)}</span>;
  }
}
