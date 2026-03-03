# debuggo

General purpose debug library based on [debug](https://github.com/visionmedia/debug)

[![npm version](https://img.shields.io/npm/v/debuggo.svg)](https://www.npmjs.com/package/debuggo)

## Installation

```bash
npm install debuggo
```

## Basic Usage

```typescript
import { getLogger } from 'debuggo';

const logger = getLogger('myapp');

logger.info('application started');
logger.warn('low memory');
logger.error('something went wrong');
```

Enable output via the `DEBUG` environment variable (same as [debug](https://github.com/visionmedia/debug)):

```bash
# Enable all levels for myapp
DEBUG=myapp:* node app.js

# Enable only errors
DEBUG=myapp:error node app.js

# Enable all namespaces, all levels
DEBUG=*:* node app.js
```

### Logger with Context

```typescript
const logger = getLogger('myapp', 'RequestHandler');
logger.info('processing request'); // output includes "RequestHandler" prefix
```

### Logger with Options Object

```typescript
const logger = getLogger({ ns: 'myapp', context: 'Worker', cache: false });
```

## Advanced Usage

### Runtime Log Level Control

Control which log levels are active per-instance using the severity hierarchy:

`trace` < `debug` < `log` < `info` < `warn` < `error`

```typescript
const logger = getLogger('myapp');

// Only emit warn and error
logger.setLevel('warn');
logger.info('ignored');
logger.warn('this is shown');
logger.error('this is shown');

// Enable all levels
logger.setLevel('trace');
```

Calling `setLevel` with an invalid level throws an `Error`.

#### Module-Level setLevel

Control log levels globally using debug namespace patterns:

```typescript
import { setLevel } from 'debuggo';

// Enable only error level for all namespaces
setLevel('*:error');

// Enable all levels for a specific prefix
setLevel('myapp-*:*');

// Combine patterns
setLevel('*:error,myapp-*:info');
```

Per-instance `setLevel()` overrides take precedence over module-level patterns.

### Context Stack Management

Dynamically manage context that is prepended to log messages:

```typescript
const logger = getLogger('myapp');

logger.pushContext('reqId=abc123');
logger.info('processing'); // output: "reqId=abc123 processing"

logger.pushContext('userId=42');
logger.info('fetching'); // output: "reqId=abc123 userId=42 fetching"

logger.popContext(); // returns 'userId=42'
logger.info('done'); // output: "reqId=abc123 done"

logger.resetContext(); // clears stack, preserves base context from getLogger
```

## API Reference

### `getLogger(ns, context?, cache?): Logger`

### `getLogger(opts: LoggerOptions): Logger`

Creates or retrieves a cached Logger instance.

- **ns** (`string`) — Namespace passed to debug
- **context** (`string`, optional) — Base context string prepended to all messages
- **cache** (`boolean`, default `true`) — When `true`, same `ns`+`context` returns the same instance

### `setLevel(pattern: string): void`

Module-level log level control. Delegates to `debug.enable(pattern)`.

### `namespaces(): string[]`

Returns all registered namespace strings.

### `cb(ns?: string): (err: any, data?: any) => void`

Returns a Node-style callback that logs errors via `error()` and data via `info()`.

### `promise(p: PromiseLike<any>, ns?: string): PromiseLike<any>`

Wraps a promise — logs resolved values via `info()`, rejections via `error()`.

### `enable(namespaces: string): void`

Re-export of `debug.enable()`.

### `disable(): string`

Re-export of `debug.disable()`.

### Logger Instance

| Method | Description |
|--------|-------------|
| `log(formatter, ...args)` | Log level message (debug `ns:log`) |
| `info(formatter, ...args)` | Info level message (debug `ns:info`) |
| `warn(formatter, ...args)` | Warning level message (debug `ns:warn`) |
| `error(formatter, ...args)` | Error level message (debug `ns:error`) |
| `debug(formatter, ...args)` | Debug level message (debug `ns:debug`) |
| `trace(formatter, ...args)` | Trace level message (debug `ns:trace`) |
| `setLevel(level: LogLevel)` | Set minimum severity level |
| `pushContext(entry: string)` | Push context entry onto stack |
| `popContext(): string \| undefined` | Pop and return last context entry |
| `resetContext()` | Clear context stack (preserves base context) |

### Types

```typescript
type LogLevel = 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  ns: string;
  context?: string;
  cache?: boolean;
}

interface Logger {
  log: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  debug: Debugger;
  trace: Debugger;
  setLevel(level: LogLevel): void;
  pushContext(entry: string): void;
  popContext(): string | undefined;
  resetContext(): void;
}

// Re-exported from debug for backward compatibility
type IDebugger = Debugger;
```

## v1 to v2 Migration

### What Changed

- **ESM-only**: v2 uses `"type": "module"`. Node.js 20+ supports `require()` of ESM modules.
- **Class-backed loggers**: Logger instances are now class instances (transparent to consumers).
- **TypeScript strict mode**: Compiled with `strict: true`.

### What's New

- `logger.setLevel(level)` — per-instance runtime log level control
- `logger.pushContext(entry)` / `popContext()` / `resetContext()` — runtime context stack
- `setLevel(pattern)` — module-level log level control via debug patterns
- `LogLevel` type export

### Backward Compatibility

All v1 API surfaces are preserved:

- `getLogger(ns)`, `getLogger(ns, context)`, `getLogger(ns, context, cache)`, `getLogger(opts)` — same signatures
- `namespaces()`, `cb()`, `promise()` — same behavior
- `enable`, `disable`, `IDebugger` — same re-exports
- Logger caching behavior — identical

No breaking changes to the public API. Existing consumers work without modification.

## License

MIT
