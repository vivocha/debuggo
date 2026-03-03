# Data Model: Debuggo v2

**Branch**: `002-v2-modernization` | **Date**: 2026-03-03

## Entities

### Logger (class)

The core entity. Replaces the v1 plain object with a class that encapsulates per-instance state.

| Field | Type | Description | Mutable |
|-------|------|-------------|---------|
| `ns` | `string` | Namespace passed to `getLogger` | No |
| `_baseContext` | `string \| undefined` | Initial context from `getLogger(ns, context)` — preserved across `resetContext()` | No |
| `_contextStack` | `string[]` | Runtime context entries managed by push/pop/reset | Yes |
| `_level` | `LogLevel \| undefined` | Per-instance severity threshold; `undefined` = no filtering (v1 behavior) | Yes |
| `_debugInstances` | `Record<LogMethodName, Debugger>` | The 6 underlying debug instances (`ns:log`, `ns:info`, etc.) | No |
| `log` | `Debugger` | Proxy over `_debugInstances.log` — injects current context on each call | Read-only |
| `info` | `Debugger` | Proxy over `_debugInstances.info` | Read-only |
| `warn` | `Debugger` | Proxy over `_debugInstances.warn` | Read-only |
| `error` | `Debugger` | Proxy over `_debugInstances.error` | Read-only |
| `debug` | `Debugger` | Proxy over `_debugInstances.debug` | Read-only |
| `trace` | `Debugger` | Proxy over `_debugInstances.trace` | Read-only |

**Methods**:
- `setLevel(level: LogLevel): void` — Sets severity threshold using hierarchy. Throws on invalid level.
- `pushContext(entry: string): void` — Appends to `_contextStack`.
- `popContext(): string | undefined` — Removes and returns last entry; no-op if empty.
- `resetContext(): void` — Clears `_contextStack` to `[]`; preserves `_baseContext`.

**Validation rules**:
- `ns` must be a non-empty string
- `setLevel` only accepts values in the `LogLevel` type union
- `pushContext` with empty string is a no-op (or accepted — edge case documented in spec)

### LoggerOptions

Configuration object for `getLogger()`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ns` | `string` | Yes | — | Namespace for the logger |
| `context` | `string` | No | `undefined` | Initial context string (becomes `_baseContext`) |
| `cache` | `boolean` | No | `true` | Whether to cache and reuse the logger instance |

### LogLevel (type union)

```
'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error'
```

**Severity hierarchy** (ascending):

| Level | Numeric | Enables |
|-------|---------|---------|
| `trace` | 0 | trace, debug, log, info, warn, error |
| `debug` | 1 | debug, log, info, warn, error |
| `log` | 2 | log, info, warn, error |
| `info` | 3 | info, warn, error |
| `warn` | 4 | warn, error |
| `error` | 5 | error only |

### LogMethodName (type union)

```
'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace'
```

Same values as `LogLevel` — used to type the 6 log method properties on Logger.

## Module-Level State

| State | Type | Description |
|-------|------|-------------|
| `__namespaces` | `Record<string, boolean>` | Registry of all namespaces created (for `namespaces()` function) |
| `__loggers` | `Record<string, Logger>` | Logger instance cache, keyed by `ns@@context` or `ns` |

## Relationships

```
getLogger(ns, context?, cache?)
       │
       ▼
   LoggerOptions ──────► Logger (class instance)
                            │
                            ├── 6 × debug(ns:level) instances
                            │      (stored in _debugInstances)
                            │
                            ├── 6 × Proxy wrappers
                            │      (inject current context on each call)
                            │
                            ├── _contextStack: string[]
                            │      (managed by push/pop/reset)
                            │
                            └── _level: LogLevel | undefined
                                   (controls which debug instances are enabled)

Module-level setLevel(pattern)
       │
       ▼
   debug.enable(pattern)  ──► affects all debug instances globally
                               (via getter cache invalidation)
```

## State Transitions

### Logger Level State

```
                    ┌──────────────────────┐
                    │   No Level Set       │
                    │   (_level = undefined)│
                    │   All methods active  │
                    │   (v1 behavior)       │
                    └───────┬──────────────┘
                            │ setLevel(level)
                            ▼
                    ┌──────────────────────┐
                    │   Level Set          │
                    │   (_level = 'warn')  │
                    │   Only warn+error    │
                    │   active             │
                    └───────┬──────────────┘
                            │ setLevel(different_level)
                            │ or setLevel(undefined/null)
                            ▼
                    ┌──────────────────────┐
                    │   Level Changed      │
                    │   New filtering      │
                    │   applies            │
                    └──────────────────────┘
```

### Context Stack State

```
Initial: _baseContext = context | undefined, _contextStack = []

pushContext('a') → _contextStack = ['a']
pushContext('b') → _contextStack = ['a', 'b']
popContext()     → _contextStack = ['a'], returns 'b'
pushContext('c') → _contextStack = ['a', 'c']
resetContext()   → _contextStack = [], _baseContext unchanged
popContext()     → _contextStack = [] (no-op), returns undefined
```
