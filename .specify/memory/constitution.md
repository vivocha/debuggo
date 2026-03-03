<!--
Sync Impact Report:
Version: 1.0.0 (initial ratification from template)
Modified principles: All principles filled from template
Added sections:
  - I. Test Coverage Excellence (100% coverage mandate)
  - II. TypeScript-First Development
  - III. Semantic Versioning & Conventional Commits
  - IV. Pre-Commit Quality Gates
  - V. Library Design Principles
  - Quality Standards
  - Development Workflow
  - Governance
Removed sections: None (template placeholders replaced)
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section references constitution gates
  ✅ spec-template.md - User scenarios and requirements align with testing principles
  ✅ tasks-template.md - Test tasks align with coverage requirements
Follow-up TODOs: None
-->

# Debuggo Constitution

## Core Principles

### I. Test Coverage Excellence (NON-NEGOTIABLE)

All code MUST maintain 100% test coverage across all metrics:

- **Statements**: 100% coverage required
- **Branches**: 100% coverage required
- **Functions**: 100% coverage required
- **Lines**: 100% coverage required

**Enforcement**: Pre-commit hooks automatically verify coverage via `npm run check-coverage`.
Commits are BLOCKED if coverage falls below 100% for any metric.

**Rationale**: As a foundational debug library, debuggo must be completely reliable.
100% coverage ensures every code path is tested, preventing regressions and maintaining
the high quality standards expected by downstream consumers.

### II. TypeScript-First Development

All source code MUST be written in TypeScript with strict type checking enabled:

- Type definitions are first-class citizens
- No implicit `any` types permitted
- Exported APIs MUST have explicit type annotations
- Type definitions distributed alongside compiled JavaScript

**Rationale**: TypeScript provides compile-time safety and excellent developer experience
for library consumers through IntelliSense and type checking.

### III. Semantic Versioning & Conventional Commits

All releases MUST follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to public API
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes, backward-compatible

All commits MUST follow conventional commit format:

- `feat:` for new features (triggers MINOR bump)
- `fix:` for bug fixes (triggers PATCH bump)
- `BREAKING CHANGE:` in footer (triggers MAJOR bump)
- `ci:`, `docs:`, `test:`, `chore:` for other changes

**Enforcement**:
- Commitlint validates commit messages
- Semantic-release automates version bumps and changelog generation
- Commitizen CLI guides proper commit formatting

**Rationale**: Automated versioning eliminates human error and provides predictable,
transparent release management for library consumers.

### IV. Pre-Commit Quality Gates

All commits MUST pass comprehensive quality gates:

1. **Build**: TypeScript compilation must succeed (`npm run build`)
2. **Coverage**: All tests must pass with 100% coverage (`npm run cover`)
3. **Coverage Check**: Coverage thresholds verified (`npm run check-coverage`)

**Enforcement**: Husky pre-commit hooks run all gates. Commits are BLOCKED on failure.

**Rationale**: Quality gates prevent broken or untested code from entering the repository,
maintaining a consistently stable codebase. Every commit is production-ready.

### V. Library Design Principles

The library MUST adhere to these design principles:

- **Single Responsibility**: Based on visionmedia/debug, focused on debug logging
- **Zero Breaking Changes**: Maintain backward compatibility unless MAJOR version
- **Minimal Dependencies**: Only essential dependencies (`debug`, `@types/debug`)
- **Node.js Focused**: Primary target is Node.js runtime environments
- **TypeScript Native**: Source in TypeScript, distribute .js + .d.ts files

**Rationale**: As a foundational library, debuggo must be stable, predictable, and
easy to integrate. Minimal dependencies reduce supply chain risk and bundle size.

## Quality Standards

### Code Quality

- TypeScript strict mode enabled
- ESLint/linting rules enforced (as configured)
- Formatting via automated tools (as configured)
- No compiler warnings permitted

### Test Quality

- Tests use Mocha framework
- Assertions via Chai (with chai-as-promised, chai-spies)
- Tests must be deterministic and isolated
- Test files organized in `test/` directory
- Coverage measured via nyc (Istanbul)

### Documentation Quality

- README.md with badges (build, coverage, npm version)
- TypeScript types serve as API documentation
- CHANGELOG.md generated automatically by semantic-release
- Breaking changes documented in commit footer

## Development Workflow

### Commit Process

1. Make code changes
2. Run `npm run build` (TypeScript compilation)
3. Run `npm run cover` (test with coverage)
4. Run `npm run check-coverage` (verify 100% thresholds)
5. Stage changes: `git add <files>`
6. Commit with conventional format: `npm run commit` (Commitizen) or `git commit`
   - Pre-commit hook runs: build → cover → check-coverage
   - Commit blocked if any gate fails
   - Commit-msg hook validates conventional commit format

### Release Process

- Automated via semantic-release on CI/CD
- Version bump determined from commit messages
- CHANGELOG.md generated automatically
- NPM package published automatically
- Git tags created automatically

### CI/CD Pipeline

- Build verification on all branches
- Coverage reporting to Coveralls
- Automated releases from master branch
- All quality gates must pass before merge

## Governance

This constitution supersedes all other development practices and guidelines.

### Amendment Process

1. Proposed changes documented with rationale
2. Impact analysis on existing codebase
3. Update constitution with new version number
4. Update dependent templates and documentation
5. Communicate changes to all contributors

### Versioning Policy

Constitution versions follow semantic versioning:

- **MAJOR**: Backward-incompatible principle changes or removals
- **MINOR**: New principles added or material guidance expansions
- **PATCH**: Clarifications, wording improvements, non-semantic fixes

### Compliance

- All pull requests MUST verify compliance with constitution principles
- Pre-commit hooks enforce non-negotiable principles automatically
- Code reviews verify adherence to design principles
- Any deviation from principles requires explicit justification and approval

### Guidance for AI Agents

When working with this project, AI agents MUST:

- Verify 100% test coverage before committing
- Write TypeScript with explicit types
- Follow conventional commit format
- Never bypass pre-commit hooks (--no-verify)
- Maintain backward compatibility unless explicit permission for breaking changes
- Consult this constitution before making architectural decisions

**Version**: 1.0.0 | **Ratified**: 2026-03-03 | **Last Amended**: 2026-03-03
