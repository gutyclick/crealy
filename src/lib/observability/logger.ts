import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogContext = {
  correlationId?: string;
  jobId?: string;
  userId?: string;
  resourceId?: string;
  attempt?: number;
  durationMs?: number;
  errorCode?: string;
  [key: string]: string | number | boolean | null | undefined;
};

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "crealy-web",
    event,
    ...context,
  });

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
};
