# Observability Documentation

## Overview

This project now has comprehensive observability built on Effect-TS, Pino, and OpenTelemetry. This provides full context propagation through the call stack, structured logging with sampling, and distributed tracing.

## Architecture

### Effect-Based Context Propagation

The observability system uses Effect-TS to build up context as operations progress through the stack. Each operation adds context that's automatically included in logs and traces:

```typescript
const context = {
  location: "London",
  locationId: 1,
  operation: "fetch_prayer_times",
  month: "December",
  year: "2025",
};

// This context is automatically propagated through all nested operations
const result = yield* withObservability(context, () => fetchPrayerTimes());
```

### Components

1. **Logger** (`api/timetable/observability/logger.ts`)
   - Structured JSON logging with Pino
   - Debug logs sampled at 10% to reduce volume
   - Errors and warnings always logged (no sampling)
   - Pretty printing in development, JSON in production

2. **Tracer** (`api/timetable/observability/tracer.ts`)
   - OpenTelemetry distributed tracing
   - Automatic instrumentation for HTTP, fetch, pg, etc.
   - Console export in development
   - OTLP export in production (configured via `OTEL_EXPORTER_OTLP_ENDPOINT`)

3. **Effect Wrappers** (`api/timetable/observability/effects.ts`)
   - `withObservability`: Wraps async operations with logging and tracing
   - `withRetry`: Tracks retry attempts with full context
   - `withHtmlParsing`: Monitors HTML parsing operations
   - `withDatabase`: Wraps database operations with performance tracking

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production logging (JSON format)
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OpenTelemetry collector endpoint (optional)

### Log Sampling

Debug and info logs are sampled at 10% to reduce volume while maintaining visibility:

```typescript
const DEBUG_SAMPLE_RATE = 0.1; // 10% of debug logs
```

**Errors and warnings are NEVER sampled** - all errors are logged with full context.

## Usage Examples

### Basic Operation Logging

```typescript
const program = Effect.gen(function* () {
  const context = {
    location: "Birmingham",
    locationId: 2,
    operation: "fetch_prayer_times",
  };

  const data = yield* withObservability(context, async () => {
    // Your async operation here
    return await fetchData();
  });

  return data;
});

// Run with observability layer
const result = await Effect.runPromise(
  Effect.provide(program, ObservabilityLive)
);
```

### Retry Operations

```typescript
const data = yield* withRetry(
  context,
  [
    () => fetchWithLongMonth(),
    () => fetchWithShortMonth(),
    () => fetchWith3CharMonth(),
  ],
  ["long month", "short month", "3-char month"]
);
```

### Database Operations

```typescript
const saved = yield* withDatabase(
  { ...context, operation: "save", count: items.length },
  () => db.insert(table).values(items).returning()
);
```

## What Gets Logged

### Successful Operations

```json
{
  "level": "INFO",
  "message": "Completed fetch_prayer_times",
  "location": "London",
  "locationId": 1,
  "operation": "fetch_prayer_times",
  "month": "December",
  "year": "2025",
  "duration": 234,
  "success": true
}
```

### Failed Operations

```json
{
  "level": "ERROR",
  "message": "Failed fetch_prayer_times",
  "location": "Birmingham",
  "locationId": 2,
  "operation": "fetch_prayer_times",
  "duration": 456,
  "error": "Failed to parse table rows",
  "stack": "Error: Failed to parse...\n  at ..."
}
```

### Retry Attempts

```json
{
  "level": "WARN",
  "message": "Attempt 2 failed: No data returned",
  "location": "Manchester",
  "locationId": 3,
  "operation": "fetch_prayer_times",
  "attempt": 2,
  "totalAttempts": 3,
  "attemptName": "short month"
}
```

## Viewing Logs

### Development

Logs are pretty-printed to the console with colors:

```
[12:34:56] INFO: Starting fetch_prayer_times
    location: "London"
    locationId: 1
    operation: "fetch_prayer_times"
```

### Production (Encore Cloud)

Logs are output as JSON and captured by Encore's logging infrastructure. View them in:

1. **Encore Dashboard**: https://app.encore.dev
2. **Log aggregation**: Configure Encore to send logs to your preferred service

## Distributed Tracing

### Trace Hierarchy

```
London.fetch_prayer_times (span)
├── http.fetch (auto-instrumented)
├── operation.completed (event)
└── database.operation (span)
    └── pg.query (auto-instrumented)
```

### Viewing Traces

In development, traces are logged to console. In production:

1. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to your collector
2. View traces in Jaeger, Zipkin, or your APM tool

### Encore Cloud Integration

Check Encore's documentation for built-in tracing support:
- https://encore.dev/docs/observability/tracing

## Debugging Failures

### Full Context in Errors

Every error includes the full operation context:

```typescript
{
  "error": "Failed to parse table cells",
  "location": "Birmingham",
  "locationId": 2,
  "operation": "html.parse",
  "htmlLength": 15234,
  "htmlPreview": "<table><tr><td>1</td>...",
  "stack": "Error: Failed to parse...",
  "attempt": 2,
  "totalAttempts": 3
}
```

### Common Issues and Context

1. **API fetch failures**: Check `location`, `month`, `year`, `attempt`
2. **HTML parsing failures**: Check `htmlPreview`, `rowLength`, `rowPreview`
3. **Database failures**: Check `count`, `operation`, `dateRange`

## Performance Monitoring

All operations include duration in milliseconds:

```json
{
  "operation": "fetch_prayer_times",
  "duration": 234,
  "location": "London"
}
```

Track slow operations by filtering for high duration values.

## Migration from Old Code

The original `timetable.ts` is backed up as `timetable.ts.backup`. The new implementation:

- ✅ Maintains identical API contracts
- ✅ Preserves all existing functionality
- ✅ Adds comprehensive observability
- ✅ No breaking changes to consumers

## Further Configuration

### Adjust Sampling Rate

Edit `api/timetable/observability/logger.ts`:

```typescript
const DEBUG_SAMPLE_RATE = 0.1; // Change to 0.2 for 20%, 1.0 for 100%
```

### Add Custom Context

```typescript
const context = {
  location: "MyLocation",
  customField: "myValue",
  userId: "123",
  // Any additional context you want in logs
};
```

### Custom Trace Attributes

```typescript
yield* tracer.setAttribute("custom.attribute", "value");
yield* tracer.addEvent("custom.event", { detail: "info" });
```

## Support

For issues with observability:
1. Check logs for the full error context
2. Verify `ObservabilityLive` is provided to all effects
3. Check Encore dashboard for system-level issues
4. Review OpenTelemetry configuration
