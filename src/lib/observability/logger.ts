import "server-only";
import * as Sentry from "@sentry/nextjs";

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

  if (level === "error" && process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("event", event);
      scope.setFingerprint([event, String(context.errorCode || "unknown")]);
      scope.setContext("operation", context);
      Sentry.captureMessage(event);
    });
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
};
