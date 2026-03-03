# Tasks: Debuggo v2 Modernization

**Input**: Design documents from `/specs/002-v2-modernization/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/public-api.md

**Tests**: Tests are MANDATORY per the project constitution (100% coverage for statements, branches, functions, lines). Tests are integrated into each user story phase.

**Organization**: Tasks are grouped by user story. US6 (dependency updates) and US4 (ESM config) are merged into Setup since they are infrastructure prerequisites. US5 (class-based architecture) and US1 (backward compatibility) are merged into one foundational phase since the class IS how backward compatibility is achieved. US8 (test coverage) is integrated into every phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Source**: `src/index.ts` (single entry point)
- **Tests**: `test/index.test.ts` (single test file)
- **Config**: `package.json`, `tsconfig.json`, `test/tsconfig.json`, `.husky/`

---

## Phase 1: Setup (US4 + US6 — Dependencies, ESM, CI Cleanup)

**Purpose**: Modernize project infrastructure — update all dependencies per research R5, configure ESM per R1/R2, remove legacy CI per spec FR-011, migrate Husky per R7.

- [x] T001 Remove legacy CI files: delete `.travis.yml` and `buildspec.yaml` from repository root
- [x] T002 Update `package.json`: set `"type": "module"`, update `"exports"` field with `"."` entry pointing to `./dist/index.js` (types + default), update `"main"` to `./dist/index.js`, update `"types"` to `./dist/index.d.ts`, remove `"typings"` and `"directories"` fields, remove `husky` config object from package.json
- [x] T003 Update dependencies in `package.json`: update `debug` to `^4.4.x`, move `@types/debug` to devDependencies at latest version, update `typescript` to `^5.8.x`, update `mocha` to `^11.x`, replace `chai` `^4.x` with `^6.x`, update `chai-as-promised` to `^8.x`, remove `chai-spies`, add `sinon` `^20.x` and `@types/sinon`, add `c8` `^11.x`, remove `nyc`, remove `coveralls`, update `husky` to `^9.x`, update `semantic-release` to `^25.x`, update `@commitlint/cli` and `@commitlint/config-conventional` to `^20.x`, update `commitizen` to `^4.3.x`, remove `rimraf`, remove `@types/chai`, `@types/chai-as-promised`, `@types/chai-spies`, update `@types/mocha` to latest, update `@types/node` to `^22.x`, add `tsx` `^4.x`
- [x] T004 Update npm scripts in `package.json`: change `"clean"` to use `rm -rf dist coverage` (no rimraf), change `"prebuild"` to `rm -rf dist`, change `"build"` to `tsc`, change `"test"` to `mocha --import tsx test/*.test.ts` with `DEBUG=test-*:*` env, change `"cover"` to `c8 --reporter=lcov --reporter=text npm t`, change `"check-coverage"` to `c8 check-coverage --statements 100 --branches 100 --functions 100 --lines 100`, remove `"report-coverage"` (coveralls removed), remove `nyc` config section from package.json
- [x] T005 Update `tsconfig.json`: set `"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"target": "ES2022"`, `"strict": true`, remove `"noImplicitAny": false` and `"allowJs": false`, keep `"declaration": true`, `"sourceMap": true`, `"outDir": "dist"`, add `"declarationMap": true`, `"esModuleInterop": true`, `"skipLibCheck": true`
- [x] T006 Remove `test/tsconfig.json` — tests will run directly via tsx loader, no separate compilation step needed
- [x] T007 Migrate Husky from v7 to v9: run `npx husky init`, create `.husky/pre-commit` with `npm run build && npm run cover && npm run check-coverage`, create `.husky/commit-msg` with `npx commitlint --edit $1`, update `commitlint.config.js` to use ESM export syntax (`export default { extends: ['@commitlint/config-conventional'] }`) and rename to `commitlint.config.mjs` if needed
- [x] T008 Run `npm install` and verify clean install with no errors, then run `npm run build` to confirm TypeScript compiles under new config (expect compilation errors in src/index.ts due to ESM import changes — this is expected and will be fixed in Phase 2)

**Checkpoint**: Infrastructure modernized. Dependencies current. ESM configured. Legacy CI removed. Husky v9 active.

---

## Phase 2: Foundational (US1 + US5 — Logger Class + Backward Compatibility) 🎯 MVP

**Goal**: Rewrite `src/index.ts` as a Logger class that preserves 100% backward compatibility with v1 API. This is the MVP — all existing consumers work without changes.

**Independent Test**: Create loggers using all v1 signatures (`getLogger(ns)`, `getLogger(ns, context)`, `getLogger(ns, context, cache)`, `getLogger({ns, context, cache})`), verify all 6 log methods exist and are functions, verify caching behavior, verify `cb()`, `promise()`, `namespaces()`, `enable`, `disable` work identically.

### Tests for US1 + US5 (MANDATORY — Constitution Requirement)

- [x] T009 [P] [US1] Write tests for backward-compatible logger creation in `test/index.test.ts`: test `getLogger(ns)` returns object with all 6 methods as functions, test `getLogger(ns, context)` prepends context to messages, test `getLogger({ns, context, cache})` options form works identically, test caching behavior (same ns+context returns same instance, cache=false returns new instance), test non-cached loggers are distinct instances
- [x] T010 [P] [US1] Write tests for utility functions in `test/index.test.ts`: test `namespaces()` returns registered namespaces, test `cb(ns)` returns a function that logs errors and data, test `promise(p, ns)` logs resolved/rejected values, test `enable` and `disable` are exported functions from debug
- [x] T011 [P] [US1] Write tests for browser console binding in `test/index.test.ts`: test that when `window.console` is available, log methods bind to appropriate console methods (console.log, console.info, console.warn, console.error, console.debug, console.trace)

### Implementation for US1 + US5

- [x] T012 [US5] Implement Logger class with types in `src/index.ts`: define `LogLevel` type union (`'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error'`), `LogMethodName` type, updated `Logger` interface (superset of v1 — adds `setLevel`, `pushContext`, `popContext`, `resetContext`), `LoggerOptions` interface (unchanged from v1). Implement Logger class with constructor accepting `LoggerOptions`, creating 6 debug instances (`ns:log`, `ns:info`, etc.), storing `_baseContext`, initializing `_contextStack: string[]` and `_level: undefined`. Create Proxy wrappers for each log method that dynamically inject current context (read from `_baseContext` + `_contextStack` on each call). Bind browser console methods when `window.console` available.
- [x] T013 [US1] Implement `getLogger` factory function in `src/index.ts`: overloaded signatures `getLogger(ns, context?, cache?)` and `getLogger(opts: LoggerOptions)`, normalize args to `LoggerOptions`, implement caching logic with `__loggers` map (key: `ns@@context` or `ns`), register namespace in `__namespaces`. Return Logger class instances.
- [x] T014 [US1] Implement utility functions and re-exports in `src/index.ts`: implement `namespaces()` returning `Object.keys(__namespaces)`, implement `cb(ns)` using `getLogger(ns)`, implement `promise(p, ns)` using `getLogger(ns)`. Update imports to ESM syntax per research R6: `import debug from 'debug'`, `import type { Debugger } from 'debug'`. Re-export `enable`, `disable` from debug. Re-export `Debugger as IDebugger` type for backward compat.
- [x] T015 [US1] Verify build passes (`npm run build`) and all v1 backward-compatibility tests pass (`npm test`), then run `npm run cover && npm run check-coverage` to verify 100% coverage of all implemented code

**Checkpoint**: v1 API fully functional. All existing consumers would work unchanged. Logger is now class-backed. 100% coverage on implemented code.

---

## Phase 3: User Story 2 — Runtime Log Level Change (Priority: P1)

**Goal**: Add `setLevel` method to Logger instances (severity hierarchy) and `setLevel` function at module level (debug pattern matching).

**Independent Test**: Create a logger, call `setLevel('warn')`, verify only warn+error methods emit output while trace/debug/log/info are suppressed. Call module-level `setLevel('*:error')`, verify global effect. Verify per-instance overrides take precedence over global settings.

### Tests for US2 (MANDATORY — Constitution Requirement)

- [x] T016 [P] [US2] Write tests for per-instance `setLevel` in `test/index.test.ts`: test `setLevel('warn')` enables warn+error and suppresses trace/debug/log/info (verify via debug instance `enabled` property), test `setLevel('error')` enables only error, test `setLevel('trace')` enables all levels, test changing level back restores original behavior, test default (no setLevel called) all methods active as v1, test `setLevel` with invalid level name throws Error, test cached logger level change persists for all references to same instance
- [x] T017 [P] [US2] Write tests for module-level `setLevel` in `test/index.test.ts`: test `setLevel('*:error')` enables error for all namespaces (delegates to `debug.enable()`), test `setLevel('test-*:*')` enables all levels for test- namespaces, test per-instance override takes precedence over global setLevel

### Implementation for US2

- [x] T018 [US2] Implement per-instance `setLevel(level: LogLevel)` method on Logger class in `src/index.ts`: define `LEVEL_HIERARCHY` map (`{trace: 0, debug: 1, log: 2, info: 3, warn: 4, error: 5}`), validate `level` is a valid `LogLevel` (throw Error if not), iterate over 6 `_debugInstances`, set each instance's `.enabled = true` if its severity >= requested level, `.enabled = false` otherwise. Store `_level` for reference. Handle special case: calling with no args or undefined removes overrides (set all `.enabled` back to their natural state by deleting the override — not possible with debug's API, so instead call `debug.enable(debug.disable())` to refresh, or set `enableOverride = null` if accessible).
- [x] T019 [US2] Implement module-level `setLevel(pattern: string)` function in `src/index.ts`: export function that calls `debug.enable(pattern)` directly, accepting full debug namespace pattern syntax
- [x] T020 [US2] Verify build passes and all setLevel tests pass with 100% coverage (`npm run build && npm run cover && npm run check-coverage`)

**Checkpoint**: Runtime log level control working at both per-instance and global granularity. All tests pass with 100% coverage.

---

## Phase 4: User Story 3 — Runtime Context Stack Management (Priority: P1)

**Goal**: Add `pushContext`, `popContext`, `resetContext` methods to Logger instances. Context stack entries are included in all log messages dynamically.

**Independent Test**: Create a logger, push context entries, verify log output includes accumulated context. Pop entries and verify removal. Reset and verify only base context remains.

### Tests for US3 (MANDATORY — Constitution Requirement)

- [x] T021 [P] [US3] Write tests for context stack in `test/index.test.ts`: test `pushContext('a')` adds entry — subsequent logs include 'a', test multiple pushes accumulate in order, test `popContext()` removes last entry and returns it, test `popContext()` on empty stack returns undefined (no-op), test `resetContext()` clears stack but preserves base context from `getLogger(ns, context)`, test `resetContext()` on logger created without context clears everything, test initial context from `getLogger(ns, context)` is preserved as base and new entries are appended after it, test `pushContext('')` with empty string behavior

### Implementation for US3

- [x] T022 [US3] Implement context stack methods on Logger class in `src/index.ts`: `pushContext(entry: string)` appends to `_contextStack` array, `popContext(): string | undefined` removes and returns last element (returns undefined if empty), `resetContext()` sets `_contextStack = []` (preserves `_baseContext`). The Proxy wrappers created in T012 already read context dynamically — verify this works by assembling context as `[this._baseContext, ...this._contextStack].filter(Boolean).join(' ')` in the Proxy apply handler.
- [x] T023 [US3] Verify build passes and all context stack tests pass with 100% coverage (`npm run build && npm run cover && npm run check-coverage`)

**Checkpoint**: Context stack management fully functional. All tests pass with 100% coverage.

---

## Phase 5: User Story 7 — Comprehensive Documentation (Priority: P3)

**Goal**: Write a comprehensive README.md with installation, basic usage, advanced usage (log levels, context stack), full API reference, and v1 migration notes.

**Independent Test**: Review README for completeness, accuracy, and clarity. All code examples should be syntactically valid.

- [x] T024 [US7] Write comprehensive `README.md` at repository root: include project description and badges (npm version), installation instructions (`npm install debuggo`), basic usage section (import, getLogger, enabling output via DEBUG env), advanced usage section covering runtime log level control (per-instance setLevel with severity hierarchy, module-level setLevel with debug patterns), advanced usage section covering context stack management (pushContext, popContext, resetContext with examples), complete API reference documenting all exports (getLogger, setLevel, namespaces, cb, promise, enable, disable, Logger interface, LoggerOptions, LogLevel, IDebugger type), v1 to v2 migration guide (what changed, what's new, backward compatibility guarantees), and license section

**Checkpoint**: Documentation complete. New users can understand and use all features.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, edge case coverage

- [x] T025 Run full quality gate: `npm run build && npm run cover && npm run check-coverage` — verify 100% coverage across statements, branches, functions, and lines for all code
- [x] T026 Run `npm audit` and verify no known vulnerabilities in dependency tree
- [x] T027 Verify all edge cases from spec are covered in tests: `setLevel` with invalid level throws, `popContext` on empty stack is no-op, `pushContext` with empty string, cached logger level/context changes persist for all references, `resetContext` preserves initial context, `getLogger` with same namespace but different options in cached mode
- [x] T028 Clean up any remaining v1 artifacts: remove `test/tsconfig.json` if still present, remove any stale compiled `.js` files in `test/` directory, verify `.gitignore` includes `dist/`, `coverage/`, `node_modules/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all feature work
- **US2 Log Levels (Phase 3)**: Depends on Phase 2 (needs Logger class)
- **US3 Context Stack (Phase 4)**: Depends on Phase 2 (needs Logger class). Can run in parallel with Phase 3.
- **US7 Documentation (Phase 5)**: Depends on Phases 3 + 4 (needs all features complete to document)
- **Polish (Phase 6)**: Depends on all previous phases

### User Story Dependencies

- **US1+US5 (Phase 2)**: Can start after Setup — No dependencies on other stories
- **US2 (Phase 3)**: Depends on US1+US5 (Phase 2) for Logger class. Independent of US3.
- **US3 (Phase 4)**: Depends on US1+US5 (Phase 2) for Logger class. Independent of US2.
- **US7 (Phase 5)**: Depends on US2 + US3 (all features must be implemented to document)
- **US8 (Test Coverage)**: Integrated into every phase — each phase must reach 100% coverage before proceeding

### Within Each User Story

- Tests written FIRST, verified to exist (TDD where practical)
- Implementation tasks complete the feature
- Coverage verification LAST in each phase
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can run in parallel (different files); T005 and T006 can run in parallel
- **Phase 2**: T009, T010, T011 (tests) can run in parallel with each other; T012, T013, T014 are sequential (same file)
- **Phase 3**: T016, T017 (tests) can run in parallel
- **Phase 4**: T021 (tests) can run in parallel with Phase 3 implementation
- **Phase 3 and Phase 4 can run in parallel** — they modify different parts of Logger class and are independent features

---

## Parallel Example: Phase 3 + Phase 4 (Independent Features)

```text
# These two phases can execute in parallel since they add independent methods to Logger class:

# Phase 3 (US2 - Log Levels):
T016: Write per-instance setLevel tests in test/index.test.ts
T017: Write module-level setLevel tests in test/index.test.ts
T018: Implement per-instance setLevel in src/index.ts
T019: Implement module-level setLevel in src/index.ts

# Phase 4 (US3 - Context Stack) — can run simultaneously:
T021: Write context stack tests in test/index.test.ts
T022: Implement pushContext/popContext/resetContext in src/index.ts
```

---

## Implementation Strategy

### MVP First (Phase 2 Only)

1. Complete Phase 1: Setup (dependencies, ESM, CI cleanup)
2. Complete Phase 2: Logger class + v1 backward compatibility
3. **STOP and VALIDATE**: All existing v1 API calls work. 100% coverage.
4. This alone delivers a modernized, class-backed library that all existing consumers can upgrade to.

### Incremental Delivery

1. Setup (Phase 1) → Infrastructure ready
2. US1+US5 (Phase 2) → MVP: Class-based, v1-compatible → **First viable release**
3. US2 (Phase 3) → Add runtime log levels → Deploy/Demo
4. US3 (Phase 4) → Add context stack → Deploy/Demo
5. US7 (Phase 5) → Documentation → Deploy/Demo
6. Polish (Phase 6) → Final validation → **Production release**

Each phase adds value without breaking previous phases.

---

## Notes

- All implementation tasks reference `src/index.ts` — this is a single-file library
- All test tasks reference `test/index.test.ts` — single test file
- [P] tasks = different files or independent code sections, no dependencies
- [Story] label maps task to specific user story for traceability
- Coverage is verified at the end of each phase, not just at the end
- Commit after each phase completes with all tests passing
- The pre-commit hook (`npm run build && npm run cover && npm run check-coverage`) automatically enforces quality gates
