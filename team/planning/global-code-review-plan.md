# Global Code Review Plan - BonkLM Repository

**Project**: BonkLM (`@blackunicorn/bonklm`)
**Date**: 2025-02-21
**Status**: Planning

---

## Executive Summary

This document outlines a comprehensive code review strategy for the entire BonkLM monorepo. The repository contains 25 packages with approximately 1,357 test files and a diverse set of TypeScript/JavaScript source files requiring systematic review.

**Repository Scope**:
- **Root Configuration**: ESLint, TypeScript, Vite configs, CI/CD
- **25 Packages**: Core (with embedded CLI), connectors (17), middleware (3), adapters, wizard (legacy?), logger, examples
- **Tools**: CLI tools, schema validators, migration scripts
- **Tests**: 1,357+ test files across all packages
- **Documentation**: User docs, API reference, guides

---

## IMPORTANT: Core + Wizard Merge Status

The `core` package now includes the **CLI/Wizard functionality**:

```json
// packages/core/package.json
{
  "name": "@blackunicorn/bonklm",
  "bin": {
    "bonklm": "./dist/bin/run.js"
  }
}
```

**New Structure**:
- `packages/core/src/bin/` - CLI entry point
- `packages/core/src/cli/` - Full CLI implementation (commands, connectors, detection, etc.)

**Existing Separate Packages**:
- `packages/wizard/` - May be legacy/duplicate (NEEDS VERIFICATION)
- `packages/logger/` - Separate logging utilities

**User-Facing Changes**:
- `npx @blackunicorn/bonklm` now works directly (no separate wizard package needed)
- CLI commands: `bonklm connector add/openai`, `bonklm status`, etc.

---

## Review Objectives

### Primary Goals
1. **Security Audit**: Identify security vulnerabilities, especially in guardrail logic
2. **Code Quality**: Ensure consistent patterns, proper TypeScript usage, and best practices
3. **Performance**: Identify bottlenecks in validation engines and connectors
4. **Maintainability**: Assess code organization, naming conventions, documentation
5. **Testing Coverage**: Verify test quality and coverage across all packages
6. **Dependencies**: Audit for outdated, duplicate, or vulnerable dependencies
7. **Merge Cleanup**: Verify core+wizard merge completeness, remove duplicates

### Success Criteria
- All critical security issues addressed
- Code quality score > 90%
- Test coverage > 80% for core packages
- No duplicate code patterns across connectors
- All TypeScript strict mode errors resolved
- **Core+Wizard merge verified complete** (no duplicate packages)

---

## Repository Structure Overview

```
LLM-Guardrails/
├── packages/
│   ├── core/                    # ⭐ Main library + Embedded CLI
│   │   ├── src/
│   │   │   ├── bin/            # CLI entry point (NEW in core)
│   │   │   ├── cli/            # Full CLI implementation (NEW in core)
│   │   │   │   ├── commands/   # All CLI commands
│   │   │   │   ├── connectors/ # Connector management
│   │   │   │   ├── detection/  # Detection logic
│   │   │   │   ├── config/     # CLI configuration
│   │   │   │   └── utils/      # CLI utilities
│   │   │   ├── validators/     # Security validators
│   │   │   ├── guards/         # Guards (secret, PII, etc.)
│   │   │   ├── engine/         # GuardrailEngine
│   │   │   ├── hooks/          # Hook system
│   │   │   └── ...
│   │   └── bin/                # Executable scripts
│   ├── wizard/                  # ⚠️ POSSIBLE DUPLICATE - verify if still needed
│   ├── logger/                  # Logging utilities
│   ├── adapters/                # OpenClaw adapter
│   ├── examples/                # Example implementations
│   ├── *-connector/             # 17 connector packages
│   │   ├── anthropic-connector
│   │   ├── chroma-connector
│   │   ├── copilotkit-connector
│   │   ├── genkit-connector
│   │   ├── huggingface-connector
│   │   ├── langchain-connector
│   │   ├── llamaindex-connector
│   │   ├── mastra-connector
│   │   ├── mcp-connector
│   │   ├── ollama-connector
│   │   ├── openai-connector
│   │   ├── pinecone-connector
│   │   ├── qdrant-connector
│   │   ├── vercel-connector
│   │   └── weaviate-connector
│   ├── *-middleware/            # 3 middleware packages
│   │   ├── express-middleware
│   │   ├── fastify-plugin
│   │   └── nestjs-module
│   └── (additional packages)
├── tools/                       # CLI tools and validators
├── tests/                       # Root-level tests
├── team/                        # Development files (gitignored)
├── docs/                        # Documentation
└── _bmad/                       # BMAD framework files
```

---

## Review Phases

### Phase 1: Foundation & Configuration (Days 1-2)

**Scope**: Root-level configuration and infrastructure

**Areas to Review**:
1. **TypeScript Configuration**
   - [ ] `tsconfig.json` - Check strict mode settings
   - [ ] Package-level tsconfig files for consistency
   - [ ] Type resolution paths and aliases

2. **Linting & Formatting**
   - [ ] `eslint.config.mjs` - Rule coverage and consistency
   - [ ] `.prettierrc.cjs` - Code formatting standards
   - [ ] `.markdownlint-cli2.yaml` - Documentation linting

3. **Build & Tooling**
   - [ ] `vitest.config.ts` - Test configuration
   - [ ] `package.json` - Scripts, dependencies, workspaces
   - [ ] Build scripts in `scripts/` directory

4. **CI/CD & Quality Gates**
   - [ ] `.github/workflows/` - GitHub Actions
   - [ ] Pre-commit hooks in `.githooks/`
   - [ ] `.gitignore` and `.npmignore` completeness

**Deliverables**:
- Configuration audit report
- Recommendations for tooling improvements
- Updated configurations if needed

---

### Phase 2: Core Package Deep Dive (Days 3-6)

**Scope**: `packages/core/` - The heart of BonkLM (NOW INCLUDES CLI)

**NEW: Core+Wizard Merge Verification**
- [ ] Verify `packages/core/src/cli/` contains complete CLI implementation
- [ ] Compare `packages/core/src/cli/` vs `packages/wizard/src/` for differences
- [ ] Determine if `packages/wizard/` should be deprecated/removed
- [ ] Verify CLI works via `npx @blackunicorn/bonklm`
- [ ] Check for duplicate code between core/cli and wizard

**Areas to Review**:

#### 2.1 Security Validators
- [ ] `src/validators/prompt-injection.ts` - Pattern matching logic
- [ ] `src/validators/jailbreak.ts` - Jailbreak detection
- [ ] `src/validators/reformulation-detector.ts` - Encoding tricks
- [ ] `src/validators/text-normalizer.ts` - Unicode handling
- [ ] `src/validators/pattern-engine.ts` - 35+ pattern categories
- [ ] `src/validators/multilingual-patterns.ts` - i18n patterns

#### 2.2 Guards
- [ ] `src/guards/` - Secret guard, PII guard, Bash safety, XSS safety

#### 2.3 Engine & Core Logic
- [ ] `src/index.ts` - Main exports and GuardrailEngine
- [ ] `src/engine/` - GuardrailEngine implementation
- [ ] `src/hooks/` - Hook system and sandbox
- [ ] `src/fault-tolerance/` - Circuit breaker, retry policy

#### 2.4 CLI Implementation (NEW in Core)
- [ ] `src/bin/run.ts` - CLI entry point
- [ ] `src/cli/index.ts` - CLI orchestration
- [ ] `src/cli/commands/` - All CLI commands
  - [ ] `init.ts` - Initialization command
  - [ ] `connector/` - Connector management commands
  - [ ] Other commands
- [ ] `src/cli/connectors/` - Connector detection and management
- [ ] `src/cli/detection/` - Framework/provider detection
- [ ] `src/cli/config/` - Configuration management
- [ ] `src/cli/utils/` - CLI utilities

#### 2.5 Types & Interfaces
- [ ] `src/adapters/types.ts` - Adapter type definitions
- [ ] `src/base/` - Base types and interfaces
- [ ] Consistency across all type definitions

#### 2.6 Common Utilities
- [ ] `src/common/` - Shared utilities
- [ ] Code duplication, performance, naming

**Deliverables**:
- Detailed security audit report
- Performance profiling results
- Refactoring recommendations
- **Core+Wizard merge verification report**

---

### Phase 3: Wizard Package Review (Day 7)

**Scope**: `packages/wizard/` - Determine future of this package

**Review Questions**:
1. Is this package still needed, or is it superseded by core's embedded CLI?
2. Are there features in wizard that are NOT in core/cli?
3. Should this be deprecated?
4. Are dependencies duplicated?

**Areas to Review**:
- [ ] `packages/wizard/src/` - All source files
- [ ] `packages/wizard/package.json` - Dependencies and exports
- [ ] Compare feature parity with `packages/core/src/cli/`

**Decision Required**:
- [ ] Keep wizard as separate package (justify why)
- [ ] Deprecate and remove wizard package
- [ ] Merge remaining features from wizard into core

**Deliverables**:
- Wizard package disposition report
- Migration plan if deprecating

---

### Phase 4: Connector Packages Review (Days 8-12)

**Scope**: All 17 connector packages

**Review Strategy**:
Given the structural similarity across connectors, use a **pattern-based review**:

1. **Review 3 Connectors In-Depth** (representative sample):
   - `openai-connector` (Most complex, popular)
   - `anthropic-connector` (Streaming support)
   - `ollama-connector` (Local models)

2. **Pattern Extraction**:
   - Document common patterns across all connectors
   - Identify code duplication opportunities
   - Create a connector template/checklist

3. **Apply Pattern Review to Remaining 14**:
   - `chroma-connector`
   - `copilotkit-connector`
   - `genkit-connector`
   - `huggingface-connector`
   - `langchain-connector`
   - `llamaindex-connector`
   - `mastra-connector`
   - `mcp-connector`
   - `pinecone-connector`
   - `qdrant-connector`
   - `vercel-connector`
   - `weaviate-connector`
   - (and any additional connectors)

**Connector Review Checklist** (per package):
- [ ] Package.json - Dependencies, exports, peer dependencies
- [ ] TypeScript exports and types
- [ ] Guarded client implementation
- [ ] Message-to-text conversion (if applicable)
- [ ] Test coverage and quality
- [ ] Example code quality
- [ ] README accuracy

**Deliverables**:
- Connector pattern document
- Standardized connector template
- Individual connector review summaries

---

### Phase 5: Middleware & Framework Integration (Days 13-14)

**Scope**: Express, Fastify, NestJS integrations

**Areas to Review**:
- [ ] `express-middleware/` - Express integration
- [ ] `fastify-plugin/` - Fastify plugin
- [ ] `nestjs-module/` - NestJS module

**Focus Areas**:
- Framework-specific best practices
- Middleware execution order
- Error handling consistency
- TypeScript decorator usage (NestJS)
- Async middleware patterns

**Deliverables**:
- Middleware integration audit
- Framework-specific recommendations

---

### Phase 6: Logger Package Review (Day 15)

**Scope**: `packages/logger/`

**Areas to Review**:
- [ ] Logger implementation quality
- [ ] Integration with core package
- [ ] Duplicate functionality with core's logging
- [ ] Whether this should be merged into core

**Deliverables**:
- Logger package review report
- Integration/merge recommendations

---

### Phase 7: Testing & Quality Assurance (Days 16-17)

**Scope**: All test files and testing infrastructure

**Review Strategy**:
1. **Test Infrastructure**
   - [ ] Vitest configuration
   - [ ] Test setup and teardown patterns
   - [ ] Mocking strategy consistency
   - [ ] Coverage tool configuration

2. **Test Quality Analysis** (sample across packages)
   - [ ] Test clarity and maintainability
   - [ ] Edge case coverage
   - [ ] Integration vs unit test balance
   - [ ] Test data management

3. **Performance Testing**
   - [ ] Benchmark suite quality (`team/performance/benchmark.bench.ts`)
   - [ ] Load testing for validation engine
   - [ ] Memory leak testing

4. **Security Testing**
   - [ ] Attack pattern test coverage
   - [ ] Adversarial input testing
   - [ ] Boundary condition testing

**Deliverables**:
- Test quality report
- Coverage analysis
- Security test recommendations

---

### Phase 8: Dependencies & Security Audit (Days 18-19)

**Scope**: All package dependencies

**Review Strategy**:
1. **Dependency Analysis**
   - [ ] `npm audit` results across all packages
   - [ ] Duplicate dependency detection (esp. core vs wizard)
   - [ ] Transitive dependency analysis
   - [ ] License compliance check

2. **Supply Chain Security**
   - [ ] Check for compromised packages
   - [ ] Verify checksums where applicable
   - [ ] Review auto-update configurations

3. **Bundle Size Analysis**
   - [ ] Core package bundle size (including new CLI)
   - [ ] Connector bundle sizes
   - [ ] Tree-shaking effectiveness

**Deliverables**:
- Dependency audit report
- Security vulnerability report
- Bundle size optimization recommendations

---

### Phase 9: Documentation Review (Days 20-21)

**Scope**: All documentation

**Areas to Review**:
- [ ] `README.md` - Accuracy of CLI commands (updated for merge)
- [ ] `docs/user/` - User-facing documentation
- [ ] `docs/getting-started.md` - Onboarding flow
- [ ] `docs/api-reference.md` - API documentation
- [ ] Package-specific READMEs
- [ ] Code comments and JSDoc
- [ ] CLI help text accuracy

**Focus Areas**:
- Documentation accuracy (matches code)
- Clarity for target audience
- Example code quality
- Consistency in terminology
- Missing documentation areas
- **Documentation reflects core+wizard merge**

**Deliverables**:
- Documentation audit report
- Update recommendations
- New documentation requirements

---

## Review Methods

### Automated Analysis
1. **Static Analysis Tools**
   - ESLint with custom rules
   - TypeScript compiler strict mode
   - SonarQube (if available)
   - CodeQL queries

2. **Security Scanners**
   - npm audit
   - Snyk (if available)
   - OWASP dependency check
   - Custom security linting

3. **Code Metrics**
   - Cyclomatic complexity
   - Code duplication (copy-paste detection)
   - Maintainability index
   - Test coverage reports

### Manual Review
1. **Pair Programming Sessions** (for critical paths)
2. **Security-Focused Code Reading**
3. **Cross-Package Pattern Analysis**
4. **User Journey Testing**

---

## Critical Review Areas (Security Focus)

### High Priority (Security-Critical)
1. **Input Validation** - All user input paths (especially CLI)
2. **Sanitization** - Output encoding and escaping
3. **Authentication** - Any auth-related code
4. **Authorization** - Permission checks
5. **Cryptography** - Encryption, hashing, tokens
6. **Injection Vulnerabilities** - SQL, NoSQL, command, LDAP
7. **XSS Prevention** - Output encoding
8. **CSRF Protection** - Token validation
9. **Security Headers** - HTTP security
10. **Error Handling** - Information disclosure

### Medium Priority (Quality)
1. Error handling completeness
2. Resource cleanup (memory, file handles)
3. Async/await error propagation
4. Type safety gaps
5. Performance bottlenecks

### Low Priority (Style)
1. Naming conventions
2. Code formatting
3. Comment quality
4. File organization

---

## Risk-Based Prioritization

| Priority | Component | Justification |
|----------|-----------|---------------|
| P0 | Core validators | Security-critical, main product value |
| P0 | Pattern engine | Attack detection logic |
| P0 | CLI file operations | User input handling, file system access |
| P1 | GuardrailEngine | Central orchestration |
| P1 | Input/output handling | Injection vulnerability surface |
| P2 | Connectors | Integration points, third-party deps |
| P2 | Middleware | Framework integration |
| P3 | Wizard package | May be deprecated |
| P3 | Examples | Documentation code |

---

## Team Organization

### Review Teams (Recommended)

**Team Alpha: Security & Core**
- Focus: Core package, validators, guards, CLI security
- Skills: Security review, TypeScript, algorithms
- **NEW ADDITION**: CLI file operations security

**Team Beta: Connectors & Integration**
- Focus: All connector packages, middleware
- Skills: Third-party APIs, framework patterns

**Team Gamma: Tooling & Quality**
- Focus: CLI UX, tests, infrastructure, documentation
- Skills: UX, testing, DevOps, documentation
- **NEW ADDITION**: Core+Wizard merge verification

---

## Timeline Summary

| Phase | Duration | Focus Area |
|-------|----------|------------|
| 1 | Days 1-2 | Foundation & Configuration |
| 2 | Days 3-6 | Core Package (includes CLI) - EXPANDED |
| 3 | Day 7 | Wizard Package Review - NEW |
| 4 | Days 8-12 | Connector Packages (17) |
| 5 | Days 13-14 | Middleware & Frameworks |
| 6 | Day 15 | Logger Package Review - NEW |
| 7 | Days 16-17 | Testing & Quality |
| 8 | Days 18-19 | Dependencies & Security |
| 9 | Days 20-21 | Documentation |
| Buffer | Days 22-23 | Issue resolution & final report |

**Total Estimated Time**: 23 working days (~4.5 weeks)

---

## Deliverables Summary

1. **Configuration Audit Report** (Phase 1)
2. **Core Security Audit Report** (Phase 2)
3. **Core+Wizard Merge Verification Report** (Phase 2) - NEW
4. **Wizard Package Disposition Report** (Phase 3) - NEW
5. **Connector Pattern Document** (Phase 4)
6. **Connector Review Summaries** (Phase 4)
7. **Middleware Integration Audit** (Phase 5)
8. **Logger Package Review Report** (Phase 6) - NEW
9. **Test Quality Report** (Phase 7)
10. **Dependency Audit Report** (Phase 8)
11. **Bundle Size Analysis** (Phase 8)
12. **Documentation Audit Report** (Phase 9)
13. **Final Executive Summary** (Final)

---

## Issue Tracking & Severity Classification

### Severity Levels

**Critical** (P0)
- Security vulnerabilities exploitable in production
- Data loss or corruption potential
- Complete feature failure
- **Core+Wizard merge inconsistencies**

**High** (P1)
- Security issues requiring specific conditions
- Significant performance degradation
- Feature partially broken

**Medium** (P2)
- Code quality issues
- Minor performance concerns
- Inconsistent patterns

**Low** (P3)
- Style issues
- Documentation gaps
- Nice-to-have improvements

---

## Tools & Commands Reference

```bash
# Repository Analysis
find . -name "*.ts" -o -name "*.js" | grep -v node_modules | wc -l
find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules | wc -l

# Type Checking
npm run build                    # Build all packages
cd packages/core && npx tsc --noEmit

# Linting
npm run lint                     # Lint all packages

# Testing
npm test                         # Run all tests
npm run test -- --coverage       # With coverage

# Security
npm audit                        # Check for vulnerabilities
npm audit --audit-level=moderate # Moderate and above

# Dependency Analysis
npm ls --all                     # Full dependency tree
npm ls --depth=0                 # Top-level only

# Bundle Size (requires additional tools)
npx size-limit                   # If configured

# CLI Testing (NEW)
npx @blackunicorn/bonklm --help
bonklm connector add --help
```

---

## Lessons Learned Reference

Before starting, review `team/lessonslearned.md`:
- BMAD vs BonkLM confusion (ensure product context)
- Documentation location rules (use `team/` for dev docs)
- Test hangs due to DNS timeout (use localhost for failure tests)
- Workspace dependencies issues
- **NEW**: Core+Wizard merge - verify completeness, remove duplicates

---

## Next Steps

1. **Approve this plan** - Confirm scope, timeline, and approach
2. **Create backup** - `cp -r /path/to/repo team/backups/before-code-review-$(date +%s)`
3. **Set up tracking** - Create issue tracker or spreadsheet for findings
4. **Begin Phase 1** - Start with foundation review
5. **Daily standups** - Review progress and blockers
6. **NEW**: Verify core+wizard merge status early in Phase 2

---

## Appendix A: Package Inventory

**Core Package** (1):
1. `core/` - Main library + Embedded CLI ⭐

**Possibly Redundant** (1):
1. `wizard/` - ⚠️ Verify if still needed (duplicate of core/cli?)

**Supporting Packages** (2):
1. `logger/` - Logging utilities
2. `adapters/` - Legacy adapters

**Connector Packages** (17):
1. `anthropic-connector/`
2. `chroma-connector/`
3. `copilotkit-connector/`
4. `genkit-connector/`
5. `huggingface-connector/`
6. `langchain-connector/`
7. `llamaindex-connector/`
8. `mastra-connector/`
9. `mcp-connector/`
10. `ollama-connector/`
11. `openai-connector/`
12. `pinecone-connector/`
13. `qdrant-connector/`
14. `vercel-connector/`
15. `weaviate-connector/`

**Middleware Packages** (3):
16. `express-middleware/`
17. `fastify-plugin/`
18. `nestjs-module/`

**Other**:
- `examples/`

**Total**: 25 packages (if wizard kept) or 24 packages (if wizard deprecated)

---

## Appendix B: File Type Statistics

| Category | Extension | Count (estimated) |
|----------|-----------|-------------------|
| Source | .ts | ~600 (includes CLI) |
| Source | .js | ~100 |
| Tests | .test.ts | ~1357 |
| Types | .d.ts | ~400 |
| Config | .json | ~50 |
| Docs | .md | ~30 |

---

## Appendix C: Core+Wizard Merge Verification Checklist

Use this checklist during Phase 2 to verify the merge is complete:

### Feature Parity
- [ ] All wizard commands exist in core/cli/commands/
- [ ] All wizard connectors exist in core/cli/connectors/
- [ ] All wizard detection logic exists in core/cli/detection/
- [ ] All wizard config logic exists in core/cli/config/
- [ ] All wizard utilities exist in core/cli/utils/

### Package Configuration
- [ ] core/package.json has correct `bin` entry
- [ ] core/package.json exports CLI subpaths if needed
- [ ] core/package.json includes all CLI dependencies

### Build & Distribution
- [ ] core build includes CLI files
- [ ] CLI entry point is executable
- [ ] `npx @blackunicorn/bonklm` works

### Documentation
- [ ] README.md references correct package name
- [ ] CLI commands are documented
- [ ] No references to installing separate wizard package

### Deprecation (if applicable)
- [ ] wizard/package.json marked deprecated
- [ ] wizard README updated with deprecation notice
- [ ] Migration guide from wizard to core

---

*End of Global Code Review Plan*
