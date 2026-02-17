/**
 * Effect-based wrappers for prayer time operations
 *
 * This module provides Effect wrappers that automatically:
 * - Add context to logs and traces
 * - Capture errors with full stack traces
 * - Measure performance
 * - Track retry attempts
 */

import { Effect, pipe } from "effect";
import { LoggerService } from "./logger";
import { TracerService } from "./tracer";

/**
 * Context that accumulates through the effect stack
 */
export interface OperationContext {
  location: string;
  locationId: number;
  operation: string;
  attempt?: number;
  month?: string;
  year?: string;
  [key: string]: unknown;
}

/**
 * Wrap an async operation with observability
 */
export function withObservability<A>(
  context: OperationContext,
  operation: () => Promise<A>
): Effect.Effect<A, Error, LoggerService | TracerService> {
  return Effect.gen(function* () {
    const logger = yield* LoggerService;
    const tracer = yield* TracerService;

    const spanName = `${context.location}.${context.operation}`;
    const startTime = Date.now();

    // Add initial log with context
    yield* logger.info(`Starting ${context.operation}`, context);

    // Run operation within span and handle errors
    const result = yield* pipe(
      tracer.span(
        spanName,
        Effect.tryPromise({
          try: () => operation(),
          catch: (error) => {
            if (error instanceof Error) {
              return error;
            }
            return new Error(String(error));
          },
        }),
        {
          ...context,
        }
      ),
      Effect.tap(() => {
        const duration = Date.now() - startTime;
        return pipe(
          logger.info(`Completed ${context.operation}`, {
            ...context,
            duration,
            success: true,
          }),
          Effect.zipRight(
            tracer.addEvent("operation.completed", {
              duration,
              success: "true",
            })
          )
        );
      }),
      Effect.tapError((error) => {
        const duration = Date.now() - startTime;
        return pipe(
          logger.error(`Failed ${context.operation}`, {
            ...context,
            duration,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }),
          Effect.zipRight(
            error instanceof Error
              ? tracer.recordException(error)
              : Effect.void
          )
        );
      })
    );

    return result;
  });
}

/**
 * Wrap a retry operation with observability
 */
export function withRetry<A>(
  context: OperationContext,
  attempts: Array<() => Promise<A>>,
  attemptNames: string[]
): Effect.Effect<A, Error, LoggerService | TracerService> {
  return Effect.gen(function* () {
    const logger = yield* LoggerService;

    for (let i = 0; i < attempts.length; i++) {
      const attemptContext = {
        ...context,
        attempt: i + 1,
        totalAttempts: attempts.length,
        attemptName: attemptNames[i],
      };

      yield* logger.debug(`Attempting ${attemptNames[i]}`, attemptContext);

      // Try this attempt
      const attemptResult = yield* pipe(
        withObservability(attemptContext, attempts[i]),
        Effect.either
      );

      if (attemptResult._tag === "Right") {
        // Success!
        yield* logger.info(`Retry succeeded on attempt ${i + 1}`, {
          ...attemptContext,
          success: true,
        });
        return attemptResult.right;
      } else {
        // Failed, log and continue
        const error = attemptResult.left;
        yield* logger.warn(
          `Attempt ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
          attemptContext
        );

        // If this was the last attempt, fail with error
        if (i === attempts.length - 1) {
          yield* logger.error(`All ${attempts.length} attempts failed`, {
            ...context,
            finalError: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return yield* Effect.fail(error);
        }
      }
    }

    // Should never reach here
    return yield* Effect.fail(new Error("All retry attempts failed"));
  });
}

/**
 * Wrap HTML parsing with observability
 */
export function withHtmlParsing<A>(
  context: OperationContext,
  htmlData: string,
  parser: (html: string) => A
): Effect.Effect<A, Error, LoggerService | TracerService> {
  return Effect.gen(function* () {
    const logger = yield* LoggerService;
    const tracer = yield* TracerService;

    const parseContext = {
      ...context,
      operation: "html.parse",
      htmlLength: htmlData.length,
    };

    yield* logger.debug("Parsing HTML", parseContext);

    const result = yield* pipe(
      tracer.span(
        `${context.location}.html.parse`,
        Effect.try({
          try: () => parser(htmlData),
          catch: (error) => {
            if (error instanceof Error) {
              return error;
            }
            return new Error(String(error));
          },
        }),
        parseContext
      ),
      Effect.tap(() =>
        logger.debug("HTML parsed successfully", {
          ...parseContext,
          success: true,
        })
      ),
      Effect.tapError((error) =>
        logger.error("HTML parsing failed", {
          ...parseContext,
          error: error instanceof Error ? error.message : String(error),
          htmlPreview: htmlData.substring(0, 200),
        })
      )
    );

    return result;
  });
}

/**
 * Wrap database operations with observability
 */
export function withDatabase<A>(
  context: OperationContext,
  operation: () => Promise<A>
): Effect.Effect<A, Error, LoggerService | TracerService> {
  return Effect.gen(function* () {
    const logger = yield* LoggerService;
    const tracer = yield* TracerService;

    const dbContext = {
      ...context,
      operation: "database.save",
    };

    yield* logger.debug("Database operation starting", dbContext);

    const startTime = Date.now();

    const result = yield* pipe(
      tracer.span(
        "database.operation",
        Effect.tryPromise({
          try: () => operation(),
          catch: (error) => {
            if (error instanceof Error) {
              return error;
            }
            return new Error(String(error));
          },
        }),
        dbContext
      ),
      Effect.tap(() => {
        const duration = Date.now() - startTime;
        return logger.info("Database operation completed", {
          ...dbContext,
          duration,
        });
      }),
      Effect.tapError((error) =>
        logger.error("Database operation failed", {
          ...dbContext,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    );

    return result;
  });
}
