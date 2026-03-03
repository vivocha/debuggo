# Quickstart: Debuggo v2 Development

**Branch**: `002-v2-modernization` | **Date**: 2026-03-03

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+

## Setup

```bash
git checkout 002-v2-modernization
npm install
```

## Build

```bash
npm run build          # TypeScript → dist/
npm run clean          # Remove dist/, coverage/, .nyc_output
```

## Test

```bash
npm test               # Build tests + run with DEBUG=test-*:*
npm run cover          # Run tests with c8 coverage
npm run check-coverage # Verify 100% thresholds
```

## Development Cycle

```bash
# 1. Make changes in src/index.ts
# 2. Build and test
npm run build && npm run cover && npm run check-coverage

# 3. Commit (pre-commit hook runs build + cover + check-coverage automatically)
npm run commit         # Interactive conventional commit via commitizen
# — or —
git commit -m "feat: add setLevel method"  # Manual conventional commit
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | All source code — Logger class, getLogger factory, utilities |
| `test/index.test.ts` | All tests — Mocha + Chai |
| `tsconfig.json` | TypeScript config — ESM, strict, ES2022 target |
| `package.json` | ESM module config, scripts, dependencies |
| `.husky/pre-commit` | Quality gate: build → cover → check-coverage |
| `.husky/commit-msg` | Conventional commit validation |

## Architecture Overview

```
getLogger('myapp', 'ctx')
    │
    ▼
Logger class instance
    ├── .log    → Proxy → debug('myapp:log')    → enabled by setLevel/enable
    ├── .info   → Proxy → debug('myapp:info')   → context injected on each call
    ├── .warn   → Proxy → debug('myapp:warn')
    ├── .error  → Proxy → debug('myapp:error')
    ├── .debug  → Proxy → debug('myapp:debug')
    └── .trace  → Proxy → debug('myapp:trace')

    + .setLevel('warn')     → sets debug.enabled on each instance
    + .pushContext('req=1')  → appends to _contextStack
    + .popContext()          → removes last from _contextStack
    + .resetContext()        → clears _contextStack, keeps _baseContext
```

## Debugging Tips

```bash
# Enable all debuggo output
DEBUG=*:* npm test

# Enable only errors
DEBUG=*:error npm test

# Enable specific namespace at all levels
DEBUG=test-1:* npm test

# Combine patterns
DEBUG="test-*:*,myapp:error" npm test
```
