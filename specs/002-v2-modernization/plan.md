# Implementation Plan: Debuggo v2 Modernization

**Branch**: `002-v2-modernization` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-v2-modernization/spec.md`

## Summary

Modernize debuggo from a CJS/function-based library to an ESM-first/class-based TypeScript library. The core change is replacing the plain object `Logger` with a `Logger` class that encapsulates per-instance state (level filtering, context stack) while preserving the `getLogger()` factory and all v1 exports. Additionally: update all dependencies to latest, remove legacy CI files (`.travis.yml`, `buildspec.yaml`), add runtime log level control (per-instance via severity hierarchy + module-level via debug patterns), add context stack management (`pushContext`/`popContext`/`resetContext`), achieve 100% test coverage, and write comprehensive README documentation.

## Technical Context

**Language/Version**: TypeScript 5.x → ES2022, targeting Node.js 20+
**Primary Dependencies**: `debug` ^4.4.x (sole runtime dependency)
**Storage**: N/A (in-memory logger cache only)
**Testing**: Mocha 11 + Chai 6 + c8 (replaces nyc) for V8-native coverage. Alternatively: vitest 4 as all-in-one replacement.
**Target Platform**: Node.js 20+ (LTS), browser support preserved via debug's existing browser adapter
**Project Type**: Library (npm package)
**Performance Goals**: Negligible overhead over raw `debug` calls; logger creation < 1ms
**Constraints**: Backward compatible with all v1 API surfaces; 100% test coverage enforced by pre-commit hooks
**Scale/Scope**: Single-file library (~200 lines), single entry point, 18 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with Core Principles from `.specify/memory/constitution.md`:

- [x] **Test Coverage Excellence**: 100% coverage plan — all new code (Logger class, setLevel, context stack) will have dedicated test suites covering every branch. Pre-commit hooks enforce thresholds.
- [x] **TypeScript-First**: All new code in TypeScript with `strict: true`. Logger class and all new methods will have explicit type annotations. Exported types are a superset of v1 `Logger` interface.
- [x] **Semantic Versioning**: This is a MINOR version bump (new features, backward compatible). No breaking changes to the public API. `getLogger` signature unchanged. New methods are additive only.
- [x] **Pre-Commit Gates**: Build → Test → Coverage pipeline preserved. Husky updated to v9 with `.husky/` directory scripts. Same gates: `npm run build && npm run cover && npm run check-coverage`.
- [x] **Library Design**: Single responsibility maintained (debug logging wrapper). Minimal dependencies (only `debug`). Full backward compatibility with v1 API. `@types/debug` moved to devDependencies.

## Project Structure

### Documentation (this feature)

```text
specs/002-v2-modernization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── public-api.md    # Library public API contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── index.ts             # Single entry point — Logger class + all exports

test/
└── index.test.ts        # Single test file — all test suites

dist/                    # Compiled output (ESM .js + .d.ts + .js.map)
└── index.js
└── index.d.ts
└── index.js.map

.husky/                  # Husky v9 hooks (replaces package.json config)
├── pre-commit           # npm run build && npm run cover && npm run check-coverage
└── commit-msg           # npx commitlint --edit $1
```

**Structure Decision**: Single-project structure preserved. The library is a single `src/index.ts` file compiled to `dist/`. No sub-directories needed — the codebase is small enough to remain in a single module. The `test/` directory contains a single test file that mirrors the source. Legacy CI files (`.travis.yml`, `buildspec.yaml`) are deleted, not replaced.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

- [x] **Test Coverage Excellence**: data-model.md defines every field and method — all branches identifiable for test planning. The Logger class, setLevel (valid/invalid), pushContext, popContext (empty/non-empty), resetContext (with/without baseContext), and module-level setLevel all have clear testable paths.
- [x] **TypeScript-First**: public-api.md contract uses explicit TypeScript types throughout. `LogLevel` type union, `Logger` interface superset, `LoggerOptions` — all typed. `strict: true` in tsconfig research (R2).
- [x] **Semantic Versioning**: API contract confirms v2 `Logger` is a strict superset of v1. No breaking changes. New exports (`setLevel` module-level, `LogLevel` type) are additive. `IDebugger` re-exported under old name for compat.
- [x] **Pre-Commit Gates**: Husky v9 migration researched (R7). Same gates preserved in `.husky/pre-commit`. c8 replaces nyc but produces same lcov output for coverage checking.
- [x] **Library Design**: Single `debug` runtime dependency preserved. `@types/debug` moved to devDependencies (research R5). Context stack and level filtering are internal state — no new external dependencies.

**Verdict**: All 5 constitution principles pass post-design. No violations to track.

## Complexity Tracking

No constitution violations. All principles pass.
