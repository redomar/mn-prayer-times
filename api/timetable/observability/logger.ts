import pino from "pino";
import { Context, Effect, Layer } from "effect";

/**
 * Logger configuration with sampling
 * - Debug logs are sampled at 10% to reduce volume
 * - Errors and warnings are never sampled (100% capture)
 */
const createPinoLogger = () => {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    level: "debug",
    // Pretty print in development, JSON in production
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
    // Base context that appears in every log
    base: {
      env: process.env.NODE_ENV || "development",
      service: "timetable",
    },
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  });
};

const pinoInstance = createPinoLogger();

/**
 * Sampling rate for debug logs (10% = 0.1)
 * Errors and warnings are never sampled
 */
const DEBUG_SAMPLE_RATE = 0.1;

/**
 * Determines if a log should be emitted based on sampling rules
 */
function shouldLog(level: string): boolean {
  // Always log errors and warnings (no sampling)
  if (level === "error" || level === "warn") {
    return true;
  }

  // Sample debug and info logs
  if (level === "debug" || level === "info") {
    return Math.random() < DEBUG_SAMPLE_RATE;
  }

  // Default: log it
  return true;
}

/**
 * Logger interface for effect-based logging
 */
export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  info: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  warn: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  error: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  child: (bindings: Record<string, unknown>) => Logger;
}

/**
 * Logger service tag for Effect context
 */
export class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  Logger
>() {}

/**
 * Create a logger implementation
 */
const makeLogger = (childLogger = pinoInstance): Logger => ({
  debug: (message: string, context?: Record<string, unknown>) =>
    Effect.sync(() => {
      if (shouldLog("debug")) {
        childLogger.debug(context || {}, message);
      }
    }),

  info: (message: string, context?: Record<string, unknown>) =>
    Effect.sync(() => {
      if (shouldLog("info")) {
        childLogger.info(context || {}, message);
      }
    }),

  warn: (message: string, context?: Record<string, unknown>) =>
    Effect.sync(() => {
      // Always log warnings (no sampling)
      childLogger.warn(context || {}, message);
    }),

  error: (message: string, context?: Record<string, unknown>) =>
    Effect.sync(() => {
      // Always log errors (no sampling)
      childLogger.error(context || {}, message);
    }),

  child: (bindings: Record<string, unknown>) =>
    makeLogger(childLogger.child(bindings)),
});

/**
 * Logger Layer for providing logger service to effects
 */
export const LoggerLive = Layer.succeed(LoggerService, makeLogger());

/**
 * Helper to get logger from context
 */
export const getLogger = LoggerService;

/**
 * Direct access to the base pino logger (for non-Effect code)
 */
export const logger = pinoInstance;
