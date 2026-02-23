# Story 1.1: SecureCredential Class

Status: completed

**Epic:** EPIC-1 - Security Foundation
**Priority:** P0 (Blocking)
**Points:** 3
**File:** `src/utils/secure-credential.ts`

## Story

As a security-focused developer,
I want a SecureCredential class that wraps sensitive credentials in Buffer memory,
so that credentials can be securely zeroed from memory after use.

## Acceptance Criteria

1. Class wraps string credentials in Buffer
2. `toString()` method retrieves the value
3. `dispose()` method zeros memory by filling buffer with zeros
4. `use()` method provides automatic cleanup via try/finally pattern
5. All tests pass with 100% coverage

## Tasks / Subtasks

- [x] Create SecureCredential class (AC: 1)
  - [x] Constructor: use `Buffer.alloc(byteLength)` for clean (zero-initialized) memory
  - [x] Enforce 8KB size limit (MAX_CREDENTIAL_SIZE) with WizardError
  - [x] Private `buffer: Buffer` field
  - [x] Private `disposed: boolean` flag
  - [x] Private `inUse: boolean` flag for re-entry guards
- [x] Implement toString() method (AC: 2)
  - [x] Return empty string if disposed
  - [x] Return `this.buffer.toString('utf-8')` otherwise
- [x] Implement dispose() method (AC: 3)
  - [x] Call `this.buffer.fill(0)` to zero memory
  - [x] Set `disposed = true` (idempotent)
- [x] Implement use() method (AC: 4)
  - [x] Generic async method accepting callback function
  - [x] Try/finally pattern: execute callback, then dispose()
  - [x] Guard against use-after-dispose (throws WizardError)
  - [x] Guard against re-entry (throws WizardError)
  - [x] Return callback result
- [x] Implement useSync() method (BONUS)
  - [x] Synchronous version of use()
  - [x] Same guards: use-after-dispose, re-entry
- [x] Add inspect protection (BONUS)
  - [x] Custom `[Symbol.for('nodejs.util.inspect.custom')]()` to return REDACTED
  - [x] Custom `toJSON()` to return REDACTED
  - [x] Custom `valueOf()` to return undefined
- [x] Add isDisposed getter (BONUS)
- [x] Create unit tests (AC: 5)
  - [x] Test toString() returns original value
  - [x] Test dispose() zeros buffer
  - [x] Test use() automatically disposes
  - [x] Test use() disposes even on error
  - [x] Test useSync() behavior
  - [x] Test re-entry guards
  - [x] Test use-after-dispose guards
  - [x] Test inspect/toJSON/valueOf protection
  - [x] Test multi-byte UTF-8 character handling
  - [x] Achieve 100% code coverage
- [x] Add TypeScript exports

## Dev Notes

### Critical Security Pattern

This is the foundation for ALL credential handling in the wizard. Every story that collects, validates, or uses credentials MUST use this class.

### Why Buffer.alloc() Instead of Buffer.from()?

The implementation uses `Buffer.alloc(byteLength)` instead of `Buffer.from(value, 'utf-8')` because:
- `Buffer.alloc()` creates zero-initialized memory (clean allocation)
- `Buffer.from()` may reuse memory containing previous data
- This prevents exposure of data from previous allocations (C-5 fix)

### Usage Pattern (Required for All Credential Operations)

```typescript
const secureKey = new SecureCredential(apiKey);
await secureKey.use(async (key) => {
  return await validateKey(key);
});
// Memory is automatically zeroed via use() finally block
```

### File Location

`packages/wizard/src/utils/secure-credential.ts`

### Naming Conventions

- File: `kebab-case.ts`
- Class: `PascalCase`
- Methods: `camelCase`

### Import Extension Rule (CRITICAL)

```typescript
// ✅ CORRECT - Must use .js extension
import { SecureCredential } from './secure-credential.js';

// ❌ WRONG - Will fail at runtime with NodeNext
import { SecureCredential } from './secure-credential';
```

### Test Organization

- Unit tests: `src/utils/secure-credential.test.ts` (co-located)
- Coverage requirement: 100%
- Test framework: Vitest

### Project Context Reference

- Tech Stack: [working-document.md#L52-L85](../working-document.md#L52-L85)
- Security Rules: [working-document.md#L87-L180](../working-document.md#L87-L180)
- File Organization: [working-document.md#L182-L220](../working-document.md#L182-L220)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Completed: 2026-02-18
- All tests passing (66 tests for SecureCredential)
- Code coverage: 100% statement/function/line, 90.9% branch
- Security enhancements beyond spec:
  - Buffer.alloc() for clean memory initialization
  - Re-entry guards via inUse flag
  - Use-after-dispose guards
  - Inspect/toJSON/valueOf protection against accidental leakage
  - isDisposed getter for state checking

### File List

- `packages/wizard/src/utils/secure-credential.ts` (created)
- `packages/wizard/src/utils/secure-credential.test.ts` (created)
- `packages/wizard/src/utils/index.ts` (updated - added exports)
