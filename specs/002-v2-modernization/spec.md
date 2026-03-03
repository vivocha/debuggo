# Feature Specification: Debuggo v2 Modernization

**Feature Branch**: `002-v2-modernization`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "New version of debuggo package: modernize to ESM module, update dependencies, remove legacy CI, add runtime log level and context management, evaluate class-based architecture, maintain backward compatibility, achieve full test coverage, write comprehensive documentation."

## Clarifications

### Session 2026-03-03

- Q: Is `setLevel` a per-instance method, module-level function, or both? → A: Both — per-instance for single-logger control + module-level for global patterns. `enable()`/`disable()` continue to be exported for backward compatibility.
- Q: For per-instance `setLevel('warn')`, severity hierarchy (warn + above) or single level only? → A: Severity hierarchy — `setLevel('warn')` enables warn + error, suppresses trace/debug/log/info.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Backward-Compatible Logger Creation (Priority: P1)

A developer currently using debuggo across multiple projects upgrades to v2. They continue to use `getLogger('my-app', 'myContext')` exactly as before and all existing code works without modification. The logger still provides `log`, `info`, `warn`, `error`, `debug`, and `trace` methods. The `namespaces()`, `cb()`, `promise()`, `enable`, and `disable` re-exports all continue to function identically.

**Why this priority**: This is the most critical story. Debuggo is used across many projects — breaking the existing API would cause widespread migration effort and regression risk. All new features are additive on top of this foundation.

**Independent Test**: Can be fully tested by creating loggers using the existing API signatures and verifying all returned methods, caching behavior, and utility functions behave identically to v1.

**Acceptance Scenarios**:

1. **Given** a project using debuggo v1 with `getLogger(ns)`, **When** upgrading to v2, **Then** the same call returns a logger with identical `log`, `info`, `warn`, `error`, `debug`, `trace` methods.
2. **Given** a project using `getLogger(ns, context)`, **When** upgrading to v2, **Then** the context is prepended to messages exactly as before.
3. **Given** a project using `getLogger({ ns, context, cache })` options form, **When** upgrading to v2, **Then** it works identically.
4. **Given** a project using `cb()`, `promise()`, `namespaces()`, `enable`, or `disable`, **When** upgrading to v2, **Then** all functions work identically.
5. **Given** a project importing debuggo as CommonJS (`require('debuggo')`), **When** upgrading to v2, **Then** the import still works (dual CJS/ESM support).

---

### User Story 2 - Runtime Log Level Change (Priority: P1)

A developer needs to control log verbosity at runtime at two granularities: (1) per-instance — changing which levels a specific logger emits, and (2) globally — changing which namespace:level combinations are active across all loggers. The mechanism uses debug's namespace pattern syntax (e.g., `*:error,vvc-*:info,test-*:*`), leveraging the fact that each debuggo logger creates debug instances with `ns:level` suffixed namespaces. The existing `enable()`/`disable()` exports continue to work for backward compatibility.

**Why this priority**: Runtime log level control is a fundamental operational need. Without it, developers must restart services or recreate loggers to change verbosity, which is impractical in production environments. Both per-instance and global granularity are needed for different operational scenarios.

**Independent Test**: Can be fully tested by creating loggers, changing levels both per-instance and globally, and verifying that only the expected messages are emitted.

**Acceptance Scenarios**:

1. **Given** a logger instance, **When** calling `setLevel(level)` on it, **Then** only messages at the specified severity and above are emitted from that logger going forward (hierarchy: `trace` < `debug` < `log` < `info` < `warn` < `error`).
2. **Given** a logger with level set to `error`, **When** calling `info()`, **Then** the message is suppressed.
3. **Given** a logger with level changed at runtime, **When** changing the level back, **Then** the original behavior is restored.
4. **Given** a logger created without specifying a level, **When** used with default settings, **Then** all log methods behave as in v1 (no filtering — level filtering is opt-in).
5. **Given** the module-level `setLevel` function, **When** called with a debug-style pattern (e.g., `'*:error,vvc-*:info'`), **Then** all matching namespace:level combinations are enabled/disabled globally.
6. **Given** both per-instance and global level controls, **When** used together, **Then** per-instance overrides take precedence over global settings for that logger.

---

### User Story 3 - Runtime Context Stack Management (Priority: P1)

A developer wants to progressively add context as a request passes through different layers of their application (e.g., adding request ID, then user ID, then operation name). The context should be a stack that can be pushed onto and popped from or fully reset at runtime. All log messages include the accumulated context.

**Why this priority**: Dynamic context is essential for tracing and debugging in layered applications. A stack model naturally mirrors the call-depth pattern of middleware and nested operations.

**Independent Test**: Can be fully tested by creating a logger, pushing context entries, verifying log output includes accumulated context, popping entries, and resetting the stack.

**Acceptance Scenarios**:

1. **Given** a logger instance, **When** pushing a context entry (e.g., `pushContext('requestId=abc')`), **Then** subsequent log messages include that context.
2. **Given** a logger with multiple context entries pushed, **When** logging a message, **Then** all context entries are included in order.
3. **Given** a logger with context entries, **When** popping the most recent entry, **Then** subsequent log messages no longer include that entry but retain earlier ones.
4. **Given** a logger with context entries, **When** resetting the context stack, **Then** subsequent log messages have no additional context (beyond the original creation context, if any).
5. **Given** a logger created with an initial context string (v1 style), **When** pushing additional context, **Then** the initial context is preserved as the base and new entries are appended.

---

### User Story 4 - Modern ESM Module Package (Priority: P2)

A developer wants to import debuggo using modern ES module syntax (`import { getLogger } from 'debuggo'`). The package is configured as an ESM module with proper `exports` field, while still supporting CommonJS consumers for backward compatibility.

**Why this priority**: ESM is the modern standard for JavaScript modules. Modernizing the package ensures compatibility with current tooling and Node.js versions, but existing CJS consumers must not break.

**Independent Test**: Can be fully tested by importing the package via both ESM and CJS in test environments and verifying all exports are accessible.

**Acceptance Scenarios**:

1. **Given** a Node.js project using ESM, **When** importing debuggo with `import { getLogger } from 'debuggo'`, **Then** all exports are available.
2. **Given** a Node.js project using CommonJS, **When** importing debuggo with `require('debuggo')`, **Then** all exports are available.
3. **Given** the package.json, **When** inspected, **Then** it uses proper dual-package configuration with `exports` field.

---

### User Story 5 - Class-Based Architecture with getLogger Factory (Priority: P2)

A developer benefits from a class-based logger implementation that encapsulates state (level, context stack) while the public API remains the familiar `getLogger()` factory function. The class provides the new instance methods (`setLevel`, `pushContext`, `popContext`, `resetContext`) alongside the existing logger methods.

**Why this priority**: A class is the natural fit for managing per-instance state (level, context stack). Using a class internally while keeping `getLogger` as the entry point preserves backward compatibility while enabling the new features.

**Independent Test**: Can be fully tested by verifying that `getLogger` returns an object that satisfies the existing `Logger` interface and also exposes the new methods, and that `instanceof` checks work for type narrowing.

**Acceptance Scenarios**:

1. **Given** a call to `getLogger(ns)`, **When** the result is inspected, **Then** it has all existing properties (`log`, `info`, `warn`, `error`, `debug`, `trace`) plus new methods (`setLevel`, `pushContext`, `popContext`, `resetContext`).
2. **Given** the `Logger` type/interface, **When** checked for backward compatibility, **Then** the new type is a superset of the old one (existing code compiles without changes).
3. **Given** logger caching is enabled, **When** `getLogger` is called multiple times with the same namespace/context, **Then** the same instance is returned.

---

### User Story 6 - Updated Dependencies and Removed Legacy CI (Priority: P2)

A maintainer updates debuggo to use current, non-deprecated dependencies and removes legacy CI configuration files (`.travis.yml`, `buildspec.yaml`). All dependencies are at their latest stable versions compatible with the project.

**Why this priority**: Keeping dependencies current prevents security vulnerabilities and ensures compatibility with modern Node.js. Removing dead CI config reduces confusion and maintenance burden.

**Independent Test**: Can be fully tested by verifying that no deprecated packages are present, all dependencies resolve cleanly, and removed files no longer exist.

**Acceptance Scenarios**:

1. **Given** the updated package, **When** running `npm audit`, **Then** no known vulnerabilities are reported.
2. **Given** the repository, **When** checking for `.travis.yml` and `buildspec.yaml`, **Then** neither file exists.
3. **Given** the package.json, **When** reviewed for deprecated packages, **Then** no deprecated packages are listed.

---

### User Story 7 - Comprehensive Documentation (Priority: P3)

A developer new to debuggo reads the README and can understand how to install, configure, and use all features — including the new v2 capabilities — with clear examples and API reference.

**Why this priority**: Good documentation reduces onboarding time and support burden, but the library must work correctly first.

**Independent Test**: Can be fully tested by reviewing the README for completeness, accuracy, and clarity. All code examples should be syntactically valid and functionally correct.

**Acceptance Scenarios**:

1. **Given** the README, **When** a developer reads it, **Then** they find installation instructions, basic usage, advanced usage (log levels, context stack), API reference, and migration notes from v1.
2. **Given** the code examples in the README, **When** executed, **Then** they produce the described output.

---

### User Story 8 - Full Test Coverage (Priority: P1)

All new and existing functionality is covered by tests achieving 100% coverage across statements, branches, functions, and lines, consistent with the project's constitution and pre-commit hooks.

**Why this priority**: 100% coverage is a constitutional requirement enforced by pre-commit hooks. Any code that doesn't meet this threshold cannot be committed.

**Independent Test**: Can be verified by running the coverage tool and confirming all metrics are at 100%.

**Acceptance Scenarios**:

1. **Given** the complete test suite, **When** running coverage checks, **Then** all coverage metrics pass at 100%.
2. **Given** the new features (level change, context stack), **When** tested, **Then** all code paths including edge cases are covered.

---

### Edge Cases

- What happens when `setLevel` is called with an invalid level name?
- What happens when `popContext` is called on an empty context stack?
- What happens when `pushContext` is called with an empty string?
- What happens when a cached logger has its level changed — does the change persist for all references to that cached instance?
- What happens when `resetContext` is called on a logger that was created with an initial context — does the initial context survive the reset?
- What happens when the package is imported via both ESM and CJS in the same application?
- What happens when `getLogger` is called with the same namespace but different options in cached mode?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST export `getLogger(ns, context?, cache?)` and `getLogger(opts: LoggerOptions)` with identical behavior to v1.
- **FR-002**: The package MUST export `namespaces()`, `cb()`, `promise()`, `enable`, `disable`, and `IDebugger` with identical behavior to v1.
- **FR-003**: Logger instances MUST provide a `setLevel(level)` method that accepts a level name and enables that level and all higher severities using the hierarchy: `trace` < `debug` < `log` < `info` < `warn` < `error`. The package MUST also export a module-level `setLevel(pattern)` function that accepts debug-style namespace patterns (e.g., `'*:error,vvc-*:info,test-*:*'`) for global control.
- **FR-004**: The underlying mechanism MUST use debug's namespace pattern system, where each logger creates debug instances with `ns:level` suffixed namespaces (`ns:log`, `ns:info`, `ns:warn`, `ns:error`, `ns:debug`, `ns:trace`). Per-instance `setLevel` uses severity hierarchy; module-level `setLevel` uses debug pattern matching.
- **FR-005**: Logger instances MUST provide a `pushContext(entry)` method that adds a context entry to the context stack.
- **FR-006**: Logger instances MUST provide a `popContext()` method that removes the most recently pushed context entry.
- **FR-007**: Logger instances MUST provide a `resetContext()` method that clears the context stack back to the initial creation context (if any).
- **FR-008**: Log messages MUST include all current context stack entries, formatted as a readable prefix.
- **FR-009**: When no log level is explicitly set, all log methods MUST function as in v1 (no filtering).
- **FR-010**: The package MUST be configured as an ES module with proper support for CommonJS consumers.
- **FR-011**: The `.travis.yml` and `buildspec.yaml` files MUST be removed from the repository.
- **FR-012**: All dependencies MUST be updated to their latest stable versions with no deprecated packages.
- **FR-013**: The `Logger` type MUST be a superset of the v1 `Logger` interface (new methods are additive only).
- **FR-014**: Logger caching MUST continue to work — same namespace+context returns the same instance.
- **FR-015**: Per-instance `setLevel` called with an unrecognized level name MUST throw an error. Module-level `setLevel` accepts any valid debug pattern string.
- **FR-016**: The `popContext` method called on an empty context stack MUST be a no-op (no error thrown).
- **FR-017**: The README MUST include installation instructions, basic usage, advanced usage with examples, API reference, and v1 migration notes.
- **FR-018**: Test coverage MUST achieve 100% across statements, branches, functions, and lines.

### Key Entities

- **Logger**: The core object returned by `getLogger`. Contains log methods (`log`, `info`, `warn`, `error`, `debug`, `trace`), level management (`setLevel`), and context management (`pushContext`, `popContext`, `resetContext`). Internally backed by a class.
- **LoggerOptions**: Configuration object with `ns` (namespace), optional `context` (initial context string), and optional `cache` (boolean for caching behavior).
- **Log Level**: A named severity (`trace`, `debug`, `log`, `info`, `warn`, `error`) corresponding to debug namespace suffixes. Controlled per-instance via `setLevel()` or globally via module-level `setLevel(pattern)`.
- **Context Stack**: An ordered collection of context strings. The full context is the concatenation of the initial context (if any) and all pushed entries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing v1 API calls work without modification after upgrading to v2 — zero breaking changes for current consumers.
- **SC-002**: Developers can change log verbosity at runtime without restarting the process or recreating the logger.
- **SC-003**: Developers can build up and tear down contextual information as a request flows through application layers, with all active context visible in log output.
- **SC-004**: Test suite achieves 100% coverage across statements, branches, functions, and lines.
- **SC-005**: No deprecated dependencies remain in the package.
- **SC-006**: Package can be consumed via both ESM `import` and CommonJS `require`.
- **SC-007**: A developer new to the library can understand and start using it within 5 minutes by reading the README.

## Assumptions

- The `debug` package (visionmedia/debug) will remain as the underlying logging engine since it is the foundation of debuggo and is actively maintained.
- Log level filtering is opt-in — loggers with no explicit level set behave exactly as v1 (all methods active, subject to `DEBUG` env / `enable()` patterns).
- `setLevel` exists at both per-instance and module-level. Per-instance overrides take precedence over global settings for that logger.
- The initial context provided at logger creation time (v1-style `getLogger(ns, context)`) is treated as the base of the context stack and is preserved across `resetContext()` calls.
- The class-based implementation is an internal detail — `getLogger` remains the primary public API. Consumers do not need to use `new` directly.
- Dual CJS/ESM support will be achieved through appropriate TypeScript and package.json configuration (e.g., `exports` field with conditional exports, or bundling both formats).
- Dependencies like `coveralls` may be replaced with modern alternatives if deprecated.

## Scope Boundaries

**In scope**:
- ESM module modernization
- Runtime log level management
- Runtime context stack management
- Class-based internal architecture
- Dependency updates
- Legacy CI removal (.travis.yml, buildspec.yaml)
- 100% test coverage
- Comprehensive README documentation

**Out of scope**:
- Structured/JSON log output
- Log transport or destination management (file, remote, etc.)
- Log rotation or persistence
- Custom log formatters
- New CI/CD pipeline setup (only removal of legacy)
- Web/browser-specific features beyond what v1 already supports
