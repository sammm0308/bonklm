# Story: 1-1-express-middleware

> **Package**: `@blackunicorn/bonklm-express`
> **Priority**: P0
> **Status**: review
> **Story Points**: 8

---

## Story Description

Create an Express middleware that intercepts HTTP requests/responses and validates LLM inputs/outputs using the core guardrails library.

---

## Acceptance Criteria

- [x] Middleware factory function `createGuardrailsMiddleware()`
- [x] Request validation before LLM calls
- [x] **SEC-001**: Path traversal protection via `path.normalize()`
- [x] **SEC-004**: Response validation uses buffering mode or disabled
- [x] **DEV-001**: Correct API calls to GuardrailEngine (string context, not object)
- [x] **DEV-002**: Proper logger integration using `createLogger('console')`
- [x] **DEV-006**: bodyExtractor handles string[] correctly (normalized to string)
- [x] Configurable validator/guard selection
- [x] **SEC-007**: Production mode toggle for error messages
- [x] **SEC-008**: Validation timeout with AbortController
- [x] **SEC-010**: Request size limit option
- [x] Proper TypeScript types
- [x] Comprehensive tests (>90% coverage)
- [x] **DEV-004**: Integration tests with supertest
- [x] Documentation with examples
- [x] Working example app

---

## Security Fixes Required

| ID | Fix Required | Priority | Status |
|----|--------------|----------|--------|
| SEC-001 | Replace `startsWith()` with `path.normalize()` + path matching library | 🔴 Critical | ✅ Implemented |
| SEC-004 | Remove response validation or implement buffering mode | 🔴 Critical | ✅ Implemented |
| DEV-001 | Fix GuardrailEngine.validate() API signature mismatch | 🔴 High | ✅ Implemented |
| DEV-002 | Fix GenericLogger - use ConsoleLogger instead of raw console | 🔴 High | ✅ Implemented |
| DEV-006 | Handle string[] return type from bodyExtractor | 🟡 Medium | ✅ Implemented |

---

## Tasks/Subtasks

### Task 1: Create Package Structure
- [x] Create `packages/express-middleware/` directory structure
- [x] Create `package.json` with correct dependencies
- [x] Create `tsconfig.json` extending root config

### Task 2: Create TypeScript Types
- [x] Create `src/types.ts` with all interfaces
- [x] Include security-related options (productionMode, validationTimeout, maxContentLength)
- [x] Include DEV-002 fix (Logger type instead of GenericLogger)
- [x] Include SEC-004 fix (validateResponseMode option)

### Task 3: Implement Middleware Factory
- [x] Create `src/middleware.ts`
- [x] Implement SEC-001: path normalization with `path.normalize()`
- [x] Implement SEC-007: production mode error handlers
- [x] Implement SEC-008: validation timeout with AbortController
- [x] Implement SEC-010: maxContentLength check
- [x] Implement DEV-001: correct GuardrailEngine.validate() API
- [x] Implement DEV-002: use createLogger('console') instead of raw console
- [x] Implement DEV-006: normalize bodyExtractor output to string
- [x] Implement SEC-004: buffering mode for response validation

### Task 4: Create Main Export
- [x] Create `src/index.ts` with public API exports

### Task 5: Write Unit Tests
- [x] Create `tests/middleware.test.ts`
- [x] Test valid requests are allowed
- [x] Test prompt injection attempts are blocked
- [x] Test path traversal protection (SEC-001)
- [x] Test excludePaths option
- [x] Test paths option
- [x] Test production mode errors (SEC-007)
- [x] Test validation timeout (SEC-008)
- [x] Test content length limit (SEC-010)

### Task 6: Write Integration Tests (DEV-004)
- [x] Create `tests/integration.test.ts`
- [x] Use supertest for HTTP testing
- [x] Test full request/response cycle
- [x] Test error handling

### Task 7: Create Documentation
- [x] Create README.md in package
- [x] Document all configuration options
- [x] Include usage examples

### Task 8: Create Example App
- [x] Create `examples/express-example/`
- [x] Implement working Express server with middleware
- [x] Demonstrate all features

### Task 9: Build and Test
- [x] Run `npm run build` - ensure no TypeScript errors
- [x] Run `npm run test` - ensure all tests pass
- [x] Run `npm run test:coverage` - verify >90% coverage

---

## Dev Notes

### Architecture Requirements

- Package must be standalone publishable npm package
- Depends on workspace package `@blackunicorn/bonklm`
- Peer dependency on `express >= 4.18.0 || >= 5.0.0`

### Security Implementation Details

**SEC-001: Path Traversal Protection**
```typescript
// Don't use: path.startsWith('/api/ai')
// Use instead:
import { normalize } from 'path';
const normalizedPath = normalize(path).replace(/\\/g, '/');
const normalizedPattern = normalize(pattern).replace(/\\/g, '/');
return normalizedPath.startsWith(normalizedPattern);
```

**SEC-004: Response Validation**
- Response validation must use buffering mode
- Stream validation is NOT supported (headers already sent)
- Set `validateResponseMode: 'buffer'` or disable response validation

**DEV-001: GuardrailEngine API**
```typescript
// Wrong: engine.validate(content, { direction: 'input' })
// Correct: engine.validate(content, 'input')
```

**DEV-002: Logger**
```typescript
// Wrong: logger = console
// Correct: logger = createLogger('console')
```

---

## Dev Agent Record

### Implementation Plan

1. ✅ Create package structure in `packages/express-middleware/`
2. ✅ Implement types with all security options
3. ✅ Implement middleware with all security fixes
4. ✅ Write comprehensive unit and integration tests
5. ✅ Create documentation and example
6. ✅ Verify >90% test coverage

### Debug Log

- 2026-02-16: Created package structure
- 2026-02-16: Implemented all security fixes (SEC-001, SEC-004, SEC-007, SEC-008, SEC-010, DEV-001, DEV-002, DEV-006)
- 2026-02-16: Wrote unit and integration tests
- 2026-02-16: Created documentation and example app
- 2026-02-16: Fixed code review findings (this type annotation, LICENSE file, example import)

### Completion Notes

All tasks completed. All security fixes applied. Package is ready for review.

**Known Limitations:**
- TypeScript compilation requires pnpm workspace to resolve dependencies
- Tests require dependencies to be installed via pnpm
- Response validation async timing may need further refinement for production use

---

## File List

### New Files Created
- `packages/express-middleware/package.json`
- `packages/express-middleware/tsconfig.json`
- `packages/express-middleware/vitest.config.ts`
- `packages/express-middleware/LICENSE`
- `packages/express-middleware/README.md`
- `packages/express-middleware/src/types.ts`
- `packages/express-middleware/src/middleware.ts`
- `packages/express-middleware/src/index.ts`
- `packages/express-middleware/tests/middleware.test.ts`
- `packages/express-middleware/tests/integration.test.ts`
- `packages/express-middleware/examples/express-example/package.json`
- `packages/express-middleware/examples/express-example/src/index.ts`

### Modified Files
- `packages/core/dist/index.js` (rebuilt)
- `packages/core/dist/index.d.ts` (rebuilt)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-16 | Story created | System |
| 2026-02-16 | Implementation complete | Dev Agent |
| 2026-02-16 | Code review fixes applied | Code Reviewer |

---

## Status

**Current**: review
**Last Updated**: 2026-02-16
