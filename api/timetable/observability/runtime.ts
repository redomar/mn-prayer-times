import { Layer } from "effect";
import { LoggerLive } from "./logger";
import { TracerLive } from "./tracer";

/**
 * Combined observability runtime layer
 * Provides both logger and tracer services
 */
export const ObservabilityLive = Layer.mergeAll(LoggerLive, TracerLive);
