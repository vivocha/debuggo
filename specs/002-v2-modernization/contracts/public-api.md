# Public API Contract: Debuggo v2

**Branch**: `002-v2-modernization` | **Date**: 2026-03-03

This document defines the complete public API surface of debuggo v2. All exports listed here constitute the library's contract with consumers. Changes to these signatures require a MAJOR version bump per the constitution.

## Exported Types

### Logger (interface — backward compatible with v1)

```typescript
export interface Logger {
  // v1 methods (preserved)
  log: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  debug: Debugger;
  trace: Debugger;

  // v2 additions
  setLevel(level: LogLevel): void;
  pushContext(entry: string): void;
  popContext(): string | undefined;
  resetContext(): void;
}
```

**Backward compatibility**: The v2 `Logger` type is a strict superset of v1. Any code typed against `{ log: Debugger; info: Debugger; warn: Debugger; error: Debugger; debug: Debugger; trace: Debugger }` will compile without changes.

### LoggerOptions

```typescript
export interface LoggerOptions {
  ns: string;
  context?: string;
  cache?: boolean;
}
```

No changes from v1.

### LogLevel

```typescript
export type LogLevel = 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error';
```

New in v2.

### Re-exports from debug

```typescript
export type { Debugger as IDebugger } from 'debug';  // IDebugger alias preserved for v1 compat
export { enable, disable } from 'debug';
```

## Exported Functions

### getLogger (factory — v1 signature preserved)

```typescript
export function getLogger(ns: string, context?: string, cache?: boolean): Logger;
export function getLogger(opts: LoggerOptions): Logger;
```

**Behavior**:
- Returns a `Logger` instance (class-backed in v2, was plain object in v1)
- Caching: when `cache !== false`, same `ns`+`context` returns the same instance
- Cache key: `context ? \`${ns}@@${context}\` : ns`
- Registers namespace in internal `__namespaces` registry

**v1 → v2 change**: Return type gains new methods (`setLevel`, `pushContext`, `popContext`, `resetContext`). Existing properties unchanged.

### setLevel (module-level — new in v2)

```typescript
export function setLevel(pattern: string): void;
```

**Behavior**:
- Accepts debug-style namespace patterns (e.g., `'*:error,vvc-*:info,test-*:*'`)
- Delegates to `debug.enable(pattern)` for global effect
- Affects all existing and future debug instances via debug's getter cache invalidation

### namespaces (v1 — preserved)

```typescript
export function namespaces(): string[];
```

**Behavior**: Returns array of all registered namespace strings.

### cb (v1 — preserved)

```typescript
export function cb(ns?: string): (err: any, data?: any) => void;
```

**Behavior**: Returns a Node-style callback that logs errors via `logger.error()` and data via `logger.info()`.

### promise (v1 — preserved)

```typescript
export function promise(p: PromiseLike<any>, ns?: string): PromiseLike<any>;
```

**Behavior**: Wraps a promise — logs resolved values via `logger.info()`, rejections via `logger.error()`.

## Instance Methods (new in v2)

### logger.setLevel(level)

```typescript
setLevel(level: LogLevel): void;
```

**Behavior**:
- Accepts a level name from the severity hierarchy: `trace < debug < log < info < warn < error`
- Enables the specified level and all higher severities
- Suppresses all lower severities
- Uses debug's `enabled` property setter (per-instance override) — does not affect other loggers
- Throws `Error` if `level` is not a valid `LogLevel` value
- Per-instance overrides take precedence over global `setLevel(pattern)` / `enable()` settings

**Special behavior**: Calling with no arguments or `undefined` removes the per-instance override, reverting to global pattern behavior.

### logger.pushContext(entry)

```typescript
pushContext(entry: string): void;
```

**Behavior**:
- Appends `entry` to the internal context stack
- Subsequent log messages include all stack entries in order
- Context prefix assembly: `[baseContext, ...contextStack].filter(Boolean).join(' ')`

### logger.popContext()

```typescript
popContext(): string | undefined;
```

**Behavior**:
- Removes and returns the most recently pushed context entry
- Returns `undefined` if stack is empty (no-op, no error)

### logger.resetContext()

```typescript
resetContext(): void;
```

**Behavior**:
- Clears the context stack to empty
- Preserves the base context set at creation time (`getLogger(ns, context)`)

## Severity Hierarchy

| Level | Numeric | Per-instance `setLevel('X')` enables |
|-------|---------|--------------------------------------|
| trace | 0       | trace, debug, log, info, warn, error |
| debug | 1       | debug, log, info, warn, error        |
| log   | 2       | log, info, warn, error               |
| info  | 3       | info, warn, error                    |
| warn  | 4       | warn, error                          |
| error | 5       | error                                |

## Module-Level Pattern Syntax

The module-level `setLevel(pattern)` function accepts debug's namespace pattern syntax:

| Pattern | Effect |
|---------|--------|
| `*:error` | Enable error level for all namespaces |
| `*:error,*:warn` | Enable error and warn for all namespaces |
| `vvc-*:info` | Enable info level for all `vvc-` prefixed namespaces |
| `test-*:*` | Enable all levels for `test-` prefixed namespaces |
| `*:error,vvc-*:info,test-*:*` | Combined: error everywhere, info for vvc-*, all for test-* |
| `-vvc-bus:*` | Exclude all levels for `vvc-bus` specifically |
