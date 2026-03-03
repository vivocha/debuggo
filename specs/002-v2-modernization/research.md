# Research: Debuggo v2 Modernization

**Branch**: `002-v2-modernization` | **Date**: 2026-03-03

## R1: ESM Module Strategy

**Decision**: ESM-only with `"type": "module"` in package.json (Option A)

**Rationale**:
- Debuggo is a small single-file library — dual-build adds unnecessary complexity
- Node.js 22+ (current LTS in 2026) supports `require()` of ESM modules natively
- The dual-package hazard (two module instances with divergent logger cache state) is a real risk for a stateful library like debuggo
- Key dependencies are ESM-only: Chai 6, semantic-release 25
- The `debug` package is CJS-only but Node's ESM-CJS interop handles it transparently

**Alternatives considered**:
- Dual ESM/CJS via tsup: Higher complexity, dual-package hazard risk, no meaningful benefit for 2026 consumers
- Dual emit via two tsconfigs: Highest complexity, same hazard, no advantage over tsup
- CJS-only: Blocks adoption of modern dependencies (Chai 6, semantic-release 25)

## R2: TypeScript Configuration

**Decision**: `"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"target": "ES2022"`, `strict: true`

**Rationale**:
- `nodenext` enforces correct ESM semantics (file extensions in imports, proper `exports` field handling)
- `ES2022` matches Node.js 20+ capabilities (top-level await, `Array.at()`, etc.)
- `strict: true` aligns with constitution principle II (TypeScript-First)
- Current `noImplicitAny: false` will be changed to `strict: true` for full type safety

**Alternatives considered**:
- `"module": "esnext"` with `"moduleResolution": "bundler"`: Only appropriate with a bundler (tsup), not needed for Option A
- `"target": "ES2017"` (current): Too conservative, misses useful ES2020-2022 features

## R3: Test Stack Modernization

**Decision**: Keep Mocha + Chai stack, modernize versions. Mocha 11 + Chai 6 + c8 (replaces nyc)

**Rationale**:
- Minimizes migration risk — same test patterns, same assertion style
- c8 uses Node.js built-in V8 coverage (simpler, faster than nyc's Istanbul instrumentation)
- Chai 6 is ESM-only, which aligns with the ESM-only project decision
- Mocha 11 supports ESM test files natively

**Changes required**:
- Chai 6 is ESM-only: test imports change from `import * as chai from 'chai'` to `import { expect } from 'chai'`
- `chai-spies` is likely broken with Chai 6: replace with `sinon` for spying/stubbing
- `@types/chai` no longer needed (Chai 6 ships own types)
- nyc → c8: simpler config, same lcov output for coverage reporting
- Test compilation step (`tsc -p test`) may be replaced by running TypeScript tests directly via tsx or mocha's TypeScript loader

**Alternatives considered**:
- Vitest: All-in-one replacement (test runner + assertions + coverage + mocking). Excellent DX but represents a larger migration and diverges from the current test patterns. Could be considered for a future iteration.

## R4: debug Module Integration for setLevel

**Decision**: Per-instance `setLevel` uses debug's `enabled` property setter; module-level `setLevel` wraps `debug.enable()`

**Rationale** (based on deep reading of debug v4.4.x source code):

**Per-instance mechanism**: Each debuggo logger creates 6 debug instances (`ns:log`, `ns:info`, `ns:warn`, `ns:error`, `ns:debug`, `ns:trace`). The debug module exposes an `enabled` property with a setter that sets an internal `enableOverride` variable. When `enableOverride !== null`, it takes precedence over global pattern matching. This allows per-instance control without affecting the global `debug.enable()` state.

```
debug instance `enabled` getter priority:
1. enableOverride (set via .enabled = true/false) — per-instance
2. namespacesCache comparison → enabled(namespace) — global patterns
3. Default: false
```

**Per-instance `setLevel('warn')` implementation**:
- Severity hierarchy: `trace(0) < debug(1) < log(2) < info(3) < warn(4) < error(5)`
- For each of the 6 debug instances backing the logger, set `.enabled = true` if the method's severity >= requested level, `.enabled = false` otherwise
- Special case: `setLevel('trace')` or no level set → remove override (set all to their global-pattern-determined state)

**Module-level `setLevel(pattern)` implementation**:
- Directly calls `debug.enable(pattern)` — the standard debug mechanism
- Accepts the full debug pattern syntax: `'*:error,vvc-*:info,test-*:*'`
- Affects all existing and future debug instances via the getter cache invalidation mechanism

**Precedence**: Per-instance overrides (via `enableOverride`) take precedence over global patterns. This is built into debug's getter logic — no custom code needed.

**Alternatives considered**:
- Recreating debug instances on level change: Expensive, breaks references, unnecessary since `enabled` setter exists
- Proxy-based filtering: Would work but adds overhead on every log call; using `enabled` property is zero-overhead (debug already checks `enabled` before formatting)

## R5: Dependency Update Plan

**Decision**: Update all dependencies to latest stable versions, replace deprecated packages

| Package | Current | Target | Action |
|---------|---------|--------|--------|
| `debug` | ^4.3.2 | ^4.4.x | Update (runtime dep) |
| `@types/debug` | 4.1.7 (dep) | latest (devDep) | Move to devDependencies, update |
| `typescript` | ^4.4.4 | ^5.8.x | Update |
| `mocha` | ^9.1.3 | ^11.x | Update |
| `chai` | ^4.3.4 | ^6.x | Update (ESM-only, breaking) |
| `chai-as-promised` | ^7.1.1 | ^8.x | Update |
| `chai-spies` | ^1.0.0 | — | **Remove** (broken with Chai 6) |
| `sinon` | — | ^20.x | **Add** (replaces chai-spies) |
| `@types/sinon` | — | latest | **Add** |
| `c8` | — | ^11.x | **Add** (replaces nyc) |
| `nyc` | ^15.1.0 | — | **Remove** (replaced by c8) |
| `coveralls` | ^3.1.1 | — | **Remove** (abandoned, 4+ years stale) |
| `husky` | ^7.0.4 | ^9.x | Update (breaking config change) |
| `semantic-release` | ^18.0.0 | ^25.x | Update (ESM-only) |
| `@commitlint/cli` | ^13.2.1 | ^20.x | Update |
| `@commitlint/config-conventional` | ^13.2.0 | ^20.x | Update |
| `commitizen` | ^4.2.4 | ^4.3.x | Update |
| `rimraf` | ^3.0.2 | — | **Remove** (use `rm -rf` in scripts, Node 20+ has `fs.rm`) |
| `@types/chai` | ^4.2.22 | — | **Remove** (Chai 6 ships own types) |
| `@types/chai-as-promised` | 7.1.4 | — | **Remove** (if chai-as-promised 8 ships types) |
| `@types/chai-spies` | 1.0.3 | — | **Remove** (chai-spies removed) |
| `@types/mocha` | ^9.0.0 | latest | Update |
| `@types/node` | ^14.14.10 | ^22.x | Update |
| `tsx` | — | ^4.x | **Add** (run TypeScript tests directly, no separate tsc step) |

**Alternatives considered**:
- Keeping nyc: c8 is simpler (V8-native coverage), produces same lcov output, requires no instrumentation
- Keeping coveralls npm package: Abandoned, use GitHub Action instead or remove entirely
- Vitest replacing everything: Too large a migration for this iteration

## R6: Import Syntax Changes for ESM

**Decision**: Update import syntax for ESM compatibility with CJS dependencies

**Current** (CJS-style):
```typescript
import * as debug from 'debug';
import { IDebugger } from 'debug';
export { disable, enable, IDebugger } from 'debug';
```

**New** (ESM-compatible):
```typescript
import debug from 'debug';
import type { Debugger } from 'debug';  // IDebugger renamed to Debugger in newer @types/debug
export { disable, enable } from 'debug';
export type { Debugger as IDebugger } from 'debug';  // Re-export under old name for backward compat
```

**Rationale**: CJS modules loaded via ESM interop expose `module.exports` as the default export. The `import * as debug from 'debug'` pattern may behave differently under `"module": "nodenext"`. Using `import debug from 'debug'` is the correct ESM form. The type `IDebugger` is re-exported under its old name for backward compatibility.

## R7: Husky v9 Migration

**Decision**: Migrate from Husky v7 (package.json config) to Husky v9 (`.husky/` directory)

**Current** (v7, in package.json):
```json
"husky": {
  "hooks": {
    "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
    "pre-commit": "npm run build && npm run cover && npm run check-coverage"
  }
}
```

**New** (v9, file-based):
```
.husky/
├── pre-commit     # npm run build && npm run cover && npm run check-coverage
└── commit-msg     # npx commitlint --edit $1
```

**Rationale**: Husky v9 uses `.husky/` directory with plain shell scripts. The `HUSKY_GIT_PARAMS` environment variable was replaced with `$1` argument. The `husky` config in `package.json` is no longer read.

## R8: Context Stack Design

**Decision**: Context stored as `string[]` array on the Logger class instance. Initial context (from v1 `getLogger(ns, context)`) is stored separately and always preserved.

**Implementation approach**:
- `_baseContext: string | undefined` — the v1 initial context, immutable after construction
- `_contextStack: string[]` — mutable stack, managed by push/pop/reset
- `pushContext(entry: string)`: appends to `_contextStack`
- `popContext(): string | undefined`: removes and returns last entry, no-op if empty
- `resetContext()`: clears `_contextStack` to `[]`, preserves `_baseContext`
- Context prefix assembly: `[_baseContext, ..._contextStack].filter(Boolean).join(' ')`

The Proxy-based context injection (current v1 approach) is preserved but updated to read from the assembled context dynamically rather than capturing context at creation time. This means the Proxy's `apply` handler reads the current context on each log call, enabling runtime context changes.

**Alternatives considered**:
- Recreating debug instances on context change: Expensive, breaks references
- String concatenation on push (eager): Would require full rebuild on pop/reset
- Linked list: Overkill for typically small stacks (2-5 entries)
