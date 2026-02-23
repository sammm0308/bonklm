# Bundle Size Analysis Report
## Epic 8: Dependencies & Security Audit
**Story ID**: S008-003
**Date**: 2026-02-21
**Status**: Complete - Research Phase

---

## INDEX

| Section | Description | Location |
|---------|-------------|----------|
| 1 | Executive Summary | [#Executive-Summary](#executive-summary) |
| 2 | Core Package Bundle | [#Core-Package-Bundle](#core-package-bundle) |
| 3 | Connector Packages | [#Connector-Packages](#connector-packages) |
| 4 | Middleware Packages | [#Middleware-Packages](#middleware-packages) |
| 5 | Dependency Impact | [#Dependency-Impact](#dependency-impact) |
| 6 | Tree-Shaking Analysis | [#Tree-Shaking-Analysis](#tree-shaking-analysis) |
| 7 | Recommendations | [#Recommendations](#recommendations) |

---

## Executive Summary

### Overall Bundle Size Grade: B- (Good with Optimization Opportunities)

**Key Findings**:
- **Core package**: 1.8MB total, 42% is CLI code
- **Connectors**: 8KB to 23KB each, ~30% optimization potential
- **Middleware**: 25KB to 62KB each, significant code duplication
- **Tree-shaking**: Basic ESM support, missing `sideEffects` annotations
- **Dependencies**: Zod is largest at 6MB, actively used
- **No minification**: Bundles are unminified TypeScript output

### Bundle Size Breakdown

| Package | Size | Notes |
|---------|------|-------|
| Core (@blackunicorn/bonklm) | 1.8 MB | 42% CLI code |
| LangChain connector | 23 KB | Largest connector |
| Ollama connector | 21 KB | Large for simple provider |
| Anthropic connector | 17 KB | Well optimized |
| OpenAI connector | 13 KB | Well optimized |
| Express middleware | 25 KB | Good size |
| Fastify plugin | 30 KB | Good size |
| NestJS module | 62 KB | 2.5x larger (framework complexity) |

---

## Core Package Bundle

### Total Distribution: 1.8 MB

| Component | Size | Percentage |
|-----------|------|------------|
| CLI | 760 KB | 41.9% |
| Validators | 312 KB | 17.3% |
| Guards | 232 KB | 12.9% |
| Fault Tolerance | 72 KB | 4.0% |
| Hooks | 68 KB | 3.8% |
| Base | 68 KB | 3.8% |
| Session | 60 KB | 3.3% |
| Engine | 56 KB | 3.1% |
| Telemetry | 52 KB | 2.9% |
| Validation | 44 KB | 2.4% |
| Logging | 40 KB | 2.2% |
| Adapters | 40 KB | 2.2% |
| Common | 16 KB | 0.9% |
| Bin | 16 KB | 0.9% |

### Build Configuration

- **Compiler**: TypeScript (tsc)
- **Target**: ES2022
- **Module**: NodeNext with NodeNext resolution
- **Format**: ESM (`"type": "module"`)
- **No minification**: Unminified output
- **No bundler**: Native TypeScript compilation
- **Source maps**: Included (adds ~4KB per file)

### Key Findings

1. **CLI dominates bundle size**: 42% of core package is CLI code
   - Consider separating to `@blackunicorn/bonklm-cli`
   - CLI features could be lazy-loaded

2. **No minification**: 30-50% size reduction possible
   - Add terser or esbuild for minification

3. **Large PII patterns**: 289-line pattern file
   - Could be compressed or dynamically loaded

4. **No code splitting**: All validators bundled together
   - Dynamic imports for specific validator types

---

## Connector Packages

### Connector Sizes (Sorted by Compiled Bundle)

| Rank | Connector | Size | Source Lines |
|------|-----------|------|-------------|
| 1 | LangChain | 23 KB | 2,425 |
| 2 | Ollama | 21 KB | 2,225 |
| 3 | Anthropic | 17 KB | 2,001 |
| 4 | Mastra | 19.5 KB | 2,084 |
| 5 | Genkit | 17.5 KB | 1,917 |
| 6 | CopilotKit | 14.6 KB | 1,703 |
| 7 | OpenAI | 13 KB | 1,405 |
| 8 | MCP | 13 KB | 1,383 |
| 9 | Chroma | 12 KB | 1,382 |
| 10 | Vercel | 12 KB | 1,199 |
| 11 | LlamaIndex | 11 KB | 1,147 |
| 12 | HuggingFace | 9.3 KB | 952 |
| 13 | Weaviate | 10 KB | 1,301 |
| 14 | Qdrant | 9.1 KB | 1,269 |
| 15 | Pinecone | 8.0 KB | 959 |

### Common Code Patterns

**Duplicated Functionality**:
1. **Messages-to-text helper**: Present in 4 connectors
   - LangChain: 5.5 KB
   - Mastra: 5.5 KB
   - CopilotKit: 3.6 KB
   - Genkit: 4.5 KB
   - **Total waste**: ~19 KB

2. **Security documentation**: SEC-XXX annotations in all connectors
   - Could be generated programmatically

3. **Guardrail factory pattern**: Similar structure across all
   - `createGuarded{Provider}` functions

### Optimization Potential

**High Impact**:
- Extract messages-to-text utility: ~15 KB savings
- Consolidate validation patterns: ~5-10 KB savings
- Remove duplicate documentation: ~2 KB savings

**Total estimated savings**: 30-40% reduction

---

## Middleware Packages

### Middleware Sizes

| Package | Size | Source Lines | Notes |
|---------|------|-------------|-------|
| Express | 25 KB | 721 | Well optimized |
| Fastify | 30 KB | 754 | Well optimized |
| NestJS | 62 KB | 1,746 | 2.5x larger (framework complexity) |

### Code Duplication Analysis

**Significant Shared Patterns** (150-200 lines duplicated):

1. **Path Normalization**: Both Express and Fastify have identical `compilePathMatcher`
2. **Error Handlers**: Production/development error handlers duplicated
3. **Validation Timeout**: `validateWithTimeout` using AbortController
4. **Content Extractors**: Similar content extraction logic
5. **Security Checks**: maxContentLength validation

### Duplication Impact

| Duplicated Component | Lines | Affected Packages |
|---------------------|-------|-------------------|
| Path matching | ~50 | Express, Fastify |
| Error handlers | ~60 | Express, Fastify |
| Validation timeout | ~30 | Express, Fastify |
| Content extractors | ~40 | All 3 middlewares |

### Optimization Opportunity

Create `@blackunicorn/bonklm-middleware-utils`:
- Path matcher utilities
- Error handlers (production/dev)
- Validation timeout wrapper
- Content extractors

**Estimated savings**: 20-30% reduction in middleware bundles

---

## Dependency Impact

### Production Dependencies

| Package | Size | Usage | Optimization Potential |
|---------|------|-------|----------------------|
| **zod** | 6.0 MB | Schema validation | Low - actively used |
| **lru-cache** | 868 KB | Caching (1 file) | Medium - could replace |
| **@clack/prompts** | 248 KB | CLI prompts | High - move to dev |
| **commander** | 240 KB | CLI framework | High - move to dev |
| **secure-json-parse** | 104 KB | JSON parsing | Low - security-critical |
| **which** | 24 KB | Binary detection | Low - minimal |
| **dotenv** | 24 KB | Env loading | Low - minimal |

### Key Findings

1. **Zod dominates (6MB)**: Actively used in 9 files across connectors
   - Consider valibot (220 KB) if full feature set not needed
   - Current usage justified by schema validation needs

2. **CLI dependencies should be devDependencies**:
   - @clack/prompts (248 KB)
   - commander (240 KB)
   - Only used in CLI, not library code

3. **lru-cache opportunity**: Used in only 1 file
   - Could implement simple Map cache
   - 868 KB savings possible

---

## Tree-Shaking Analysis

### Module Configuration

✅ **Strong Points**:
- All packages use `"type": "module"` (native ESM)
- Target: ES2022 with NodeNext resolution
- Proper `exports` field in all package.json
- Named exports instead of default where appropriate

❌ **Weak Points**:
- **No `sideEffects` field** in any package.json
- Wildcard exports (`export *`) in index files
- Large main index exports (32 lines in core)

### Tree-Shaking Support

| Feature | Status | Impact |
|---------|--------|--------|
| ESM modules | ✅ Yes | Good |
| sideEffects field | ❌ No | Prevents optimal tree-shaking |
| Named exports | ⚠️ Partial | Some default exports |
| Export granularity | ⚠️ Medium | Could be more granular |

### Current Tree-Shaking Capability

**Without sideEffects field**:
- Bundlers must assume all modules have side effects
- Unused code may not be eliminated
- Particularly impacts:
  - Validator initialization
  - Guard registration
  - Hook setup

---

## Recommendations

### P0 - High Impact

1. **Add `sideEffects` field** to all package.json:
   ```json
   "sideEffects": false
   ```
   - Enables proper tree-shaking
   - Zero runtime cost
   - 10-20% bundle reduction for consumers

2. **Separate CLI package**:
   - Create `@blackunicorn/bonklm-cli`
   - Remove 760 KB (42%) from core package
   - Use peerDependency for CLI tools

3. **Move CLI dependencies to devDependencies**:
   - commander (240 KB)
   - @clack/prompts (248 KB)
   - Build CLI separately

### P1 - Medium Impact

4. **Extract shared utilities**:
   - `@blackunicorn/bonklm-middleware-utils` (150-200 lines)
   - `@blackunicorn/bonklm-messages` (19 KB savings)
   - Reduce duplication by 20-30%

5. **Implement minification**:
   - Add terser or esbuild
   - 30-50% size reduction
   - Create separate minified builds

6. **Dynamic imports for validators**:
   - Load validator types on demand
   - Reduce initial bundle size
   - Faster load time

### P2 - Lower Priority

7. **Consider Zod alternatives**:
   - valibot (220 KB vs 6 MB)
   - Only if full Zod feature set not needed
   - Evaluate API compatibility

8. **Replace lru-cache**:
   - Implement simple Map-based cache
   - Save 868 KB
   - Only if performance acceptable

9. **Bundle analyzer integration**:
   - Add webpack-bundle-analyzer
   - Track bundle composition over time
   - Set size budgets

10. **Programmatic documentation**:
    - Generate SEC-XXX annotations
    - Remove duplicate documentation
    - Build-time generation

---

## Test Results

**Tests**: 1846/1846 passing
**Bundle Analysis**: Complete (research phase)
**No implementation changes**: Research-only phase

---

## Summary

**Current State**:
- Core package: 1.8 MB (42% CLI code)
- Connectors: 8-23 KB each with 30% optimization potential
- Middleware: 25-62 KB with significant code duplication
- Tree-shaking: Basic ESM support, missing key optimizations

**Quick Wins** (P0):
1. Add `sideEffects: false` - 10-20% reduction
2. Separate CLI package - 760 KB savings (42% of core)
3. Move CLI deps to dev - 500 KB savings

**Overall Grade**: B- (Good with Optimization Opportunities)

---

*Report generated: 2026-02-21*
*Story: S008-003 - Bundle Size Analysis*
