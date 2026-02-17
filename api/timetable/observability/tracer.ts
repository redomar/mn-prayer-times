import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-node";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { Context as EffectContext, Effect, Layer } from "effect";

/**
 * Initialize OpenTelemetry SDK
 * This sets up automatic instrumentation for HTTP, fetch, pg, and more
 */
const initializeTracing = () => {
  const isDev = process.env.NODE_ENV !== "production";

  // Configure resource with service information
  const resource = defaultResource().merge(
    resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: "mn-prayer-times",
      environment: process.env.NODE_ENV || "development",
    })
  );

  // In development, export to console
  // In production, export to OTLP endpoint (Encore cloud should provide this)
  const traceExporter = isDev
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({
        // Encore cloud OTLP endpoint (if available)
        // You may need to configure this based on Encore's documentation
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
      });

  const sdk = new NodeSDK({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Automatically instrument common libraries
        "@opentelemetry/instrumentation-fs": {
          enabled: false, // Disable fs instrumentation to reduce noise
        },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.error("Error terminating tracing", error));
  });

  return sdk;
};

// Initialize tracing on module load
const tracingSdk = initializeTracing();

/**
 * Tracer interface for effect-based tracing
 */
export interface Tracer {
  /**
   * Create a new span and run an effect within it
   * Note: This is a simplified version that just adds span name as context
   * The actual instrumentation is handled automatically by OpenTelemetry
   */
  span: <A, E, R>(
    name: string,
    effect: Effect.Effect<A, E, R>,
    attributes?: Record<string, unknown>
  ) => Effect.Effect<A, E, R>;

  /**
   * Add an attribute to the current span
   */
  setAttribute: (
    key: string,
    value: string | number | boolean
  ) => Effect.Effect<void>;

  /**
   * Add an event to the current span
   */
  addEvent: (
    name: string,
    attributes?: Record<string, string | number | boolean>
  ) => Effect.Effect<void>;

  /**
   * Record an exception in the current span
   */
  recordException: (error: Error) => Effect.Effect<void>;
}

/**
 * Tracer service tag for Effect context
 */
export class TracerService extends EffectContext.Tag("TracerService")<
  TracerService,
  Tracer
>() {}

/**
 * Get the global tracer instance
 */
const getTracer = () => trace.getTracer("mn-prayer-times", "1.0.0");

/**
 * Create a tracer implementation
 *
 * Note: This is a simplified implementation. OpenTelemetry's auto-instrumentation
 * will handle most of the tracing automatically. We just provide Effect-friendly wrappers.
 */
const makeTracer = (): Tracer => {
  const tracer = getTracer();

  return {
    // Simplified span implementation - just passes through the effect
    // OpenTelemetry auto-instrumentation will handle the actual tracing
    span: <A, E, R>(
      name: string,
      effect: Effect.Effect<A, E, R>,
      _attributes?: Record<string, unknown>
    ) => {
      // Just return the effect as-is
      // The auto-instrumentation will track actual HTTP/DB calls
      return effect;
    },

    setAttribute: (key: string, value: string | number | boolean) =>
      Effect.sync(() => {
        const span = trace.getActiveSpan();
        if (span) {
          span.setAttribute(key, value);
        }
      }),

    addEvent: (
      name: string,
      attributes?: Record<string, string | number | boolean>
    ) =>
      Effect.sync(() => {
        const span = trace.getActiveSpan();
        if (span) {
          span.addEvent(name, attributes);
        }
      }),

    recordException: (error: Error) =>
      Effect.sync(() => {
        const span = trace.getActiveSpan();
        if (span) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
        }
      }),
  };
};

/**
 * Tracer Layer for providing tracer service to effects
 */
export const TracerLive = Layer.succeed(TracerService, makeTracer());

/**
 * Helper to get tracer from context
 */
export const getTracerService = TracerService;

/**
 * Export SDK for shutdown
 */
export { tracingSdk };
