# Connector Files Git History Analysis - Issues Found

## Executive Summary

Review of git history and blame for 5 connector files reveals **CRITICAL ISSUES** with the uncommitted changes that break backward compatibility and introduce inconsistencies.

## Files Analyzed

1. `/packages/mcp-connector/src/guarded-mcp.ts`
2. `/packages/pinecone-connector/src/guarded-pinecone.ts`
3. `/packages/huggingface-connector/src/guarded-inference.ts`
4. `/packages/mastra-connector/src/mastra-guardrail.ts`
5. `/packages/vercel-connector/src/guarded-ai.ts`

---

## CRITICAL ISSUES

### Issue #1: Breaking Type System Changes

**Severity: CRITICAL**
**Affected Files:**
- `pinecone-connector/src/guarded-pinecone.ts`
- `vercel-connector/src/guarded-ai.ts`
- `huggingface-connector/src/guarded-inference.ts`
- `mastra-connector/src/mastra-guardrail.ts`
- `mcp-connector/src/guarded-mcp.ts`

**Problem:**
The uncommitted changes change the return type of `validateWithTimeout` from `GuardrailResult` or `GuardrailResult[]` to `EngineResult`.

**Historical Context:**
- Initial commit (3ab91bf): `pinecone` returned `GuardrailResult` (single result)
- Initial commit (3ab91bf): `vercel` returned `GuardrailResult[]` (array with complex conversion logic)
- New changes: All return `EngineResult`

**Why This Is a Problem:**
1. The code that uses these connectors may expect the old return types
2. The type `GuardrailResult[]` in vercel-connector had special handling that's now lost
3. There's no migration path or version bump
4. The changes are uncommitted, meaning the repo is in an inconsistent state

**Evidence from Git History:**
```typescript
// Original pinecone (3ab91bf):
): Promise<GuardrailResult> => {
  // ...
  return createResult(false, Severity.CRITICAL, [...]);
}

// Original vercel (3ab91bf):
): Promise<GuardrailResult[]> => {
  // Complex conversion logic:
  if ('allowed' in engineResult) {
    return [engineResult as GuardrailResult];
  }
  return (engineResult as any).results || [engineResult as GuardrailResult];
}

// New uncommitted changes:
): Promise<EngineResult> => {
  // Returns full EngineResult object
}
```

### Issue #2: Introduction of New Dependencies Without Version Bump

**Severity: HIGH**
**Affected Files:**
- All 5 connector files

**Problem:**
The uncommitted changes introduce imports from a new `connector-utils` module that:
1. Didn't exist in the initial commit
2. Is currently untracked (`git status` shows it as untracked)
3. Changes the API surface significantly

**New Imports Added:**
```typescript
import {
  ConnectorValidationError,
  logTimeout,
  logValidationFailure,
  // ... more
} from '@blackunicorn/bonklm/core/connector-utils';
```

**Historical Context:**
- Initial commit (3ab91bf): Used `createResult` from core package
- New changes: Uses `ConnectorValidationError` and utility functions from `connector-utils`

**Why This Is a Problem:**
1. The `connector-utils` directory is untracked (new feature)
2. Changes error handling from generic `Error` to specific `ConnectorValidationError`
3. No migration guide or documentation
4. Package version hasn't been bumped

### Issue #3: Inconsistent Error Handling Evolution

**Severity: MEDIUM**
**Affected Files:**
- `mcp-connector/src/guarded-mcp.ts`
- `pinecone-connector/src/guarded-pinecone.ts`
- `huggingface-connector/src/guarded-inference.ts`
- `vercel-connector/src/guarded-ai.ts`

**Problem:**
The error handling pattern has changed significantly:

**Before (Initial Commit):**
```typescript
throw new Error('Invalid filter');
throw new Error('Vector must be an array');
```

**After (Uncommitted Changes):**
```typescript
throw new ConnectorValidationError(
  'Vector must be an array of numbers',
  'invalid_format'
);
```

**Why This Is a Problem:**
1. Breaks existing error handling code that catches `Error`
2. Changes error signatures without semver major version bump
3. Inconsistent across different connectors (some still use `Error`)

### Issue #4: Missing Connector Files Analysis

**Severity: LOW**
**Missing Files:**
The analysis was requested for 5 files, but 2 are JavaScript files, not TypeScript:
- `/packages/pinecone-connector/src/guarded-pinecone.js` (not analyzed)
- `/packages/huggingface-connector/src/guarded-inference.js` (not analyzed)
- `/packages/vercel-connector/src/guarded-ai.js` (not analyzed)

**Why This Matters:**
The repository has both `.ts` and `.js` files. The `.js` files appear to be compiled outputs, but they were also modified. This suggests:
1. The build process may have been run
2. Both source and compiled files have uncommitted changes
3. Potential for source/dist mismatch

---

## ISSUES BY CONNECTOR

### MCP Connector (`/packages/mcp-connector/src/guarded-mcp.ts`)

**Changes:**
1. Added imports from `connector-utils` (lines 27-32)
2. Changed error handling from `Error` to `ConnectorValidationError` (lines 97-100, 105-108, 111-113)
3. Added `extractContentFromResponse` utility usage (lines 389-393)
4. Updated logging to use `logValidationFailure` and `logTimeout` (lines 260, 314)

**Historical Issues:**
- Initially had `GuardrailResult` return type (correct for EngineResult)
- Now properly uses `EngineResult`
- However, this is an uncommitted breaking change

### Pinecone Connector (`/packages/pinecone-connector/src/guarded-pinecone.ts`)

**Changes:**
1. Added imports from `connector-utils` (lines 17-24)
2. Changed return type from `GuardrailResult` to `EngineResult` (line 115)
3. Changed error handling to `ConnectorValidationError` throughout
4. Added dimension validation (lines 201-203)
5. Added finite number validation (lines 206-208)
6. Updated timeout result structure (lines 129-147)

**Historical Issues:**
- Original code used `createResult()` which returns `GuardrailResult`
- New code manually constructs `EngineResult` object
- This is a behavior change - `EngineResult` has more fields than `GuardrailResult`

### HuggingFace Connector (`/packages/huggingface-connector/src/guarded-inference.ts`)

**Changes:**
1. Added imports from `connector-utils` (lines 17-30)
2. Added extensive method lists and output field mappings (lines 47-96)
3. Changed return type to `EngineResult`
4. Updated error handling throughout

**Historical Issues:**
- Added significant new functionality (method lists, field mappings)
- This should be a minor version bump at minimum

### Mastra Connector (`/packages/mastra-connector/src/mastra-guardrail.ts`)

**Changes:**
1. Added imports from `connector-utils` (lines 29-36)
2. Added circuit breaker pattern implementation (lines 73-115, 167-233)
3. Changed return type to `EngineResult`
4. Updated error handling throughout

**Historical Issues:**
- Added entirely new circuit breaker feature
- This is a significant feature addition requiring version bump

### Vercel Connector (`/packages/vercel-connector/src/guarded-ai.ts`)

**Changes:**
1. Added imports from `connector-utils` (lines 20-31)
2. Changed return type from `GuardrailResult[]` to `EngineResult` (line 161)
3. Removed complex conversion logic that was in original code
4. Updated error handling to throw instead of returning filtered results (lines 258-265)
5. Changed blocking behavior from returning filtered content to throwing errors

**Historical Issues:**
- **MOST SIGNIFICANT CHANGE**: Original code returned filtered content on block:
  ```typescript
  // Original behavior
  return {
    text: '[Content filtered by guardrails]',
    usage: result.usage,
    finishReason: 'filtered',
    filtered: true,
    raw: result,
  };
  ```
- New code throws exception:
  ```typescript
  // New behavior
  throw new ConnectorValidationError(
    productionMode ? 'Content blocked' : `Content blocked: ${outputResult.reason}`,
    'validation_failed',
  );
  ```
- This is a MAJOR breaking change in behavior

---

## COMPATIBILITY ISSUES

### With EngineResult Type System

The `EngineResult` interface extends `GuardrailResult` and adds:
- `results: GuardrailResult[]`
- `validatorCount: number`
- `guardCount: number`
- `executionTime: number`

**Problem:** Code expecting `GuardrailResult` or `GuardrailResult[]` will break.

### With Error Handling

Code that catches generic `Error` will now miss `ConnectorValidationError`:
```typescript
// Old code that works:
try {
  await guardedIndex.query(options);
} catch (error) {
  if (error instanceof Error) {
    // This worked
  }
}

// New code issue:
try {
  await guardedIndex.query(options);
} catch (error) {
  if (error instanceof ConnectorValidationError) {
    // Needs this check now
  }
}
```

---

## RECOMMENDATIONS

### Immediate Actions Required:

1. **DO NOT COMMIT** these changes without:
   - Semver major version bump (0.1.0 → 1.0.0 or 0.2.0)
   - Migration guide for users
   - Update to all documentation
   - Deprecation period for old API

2. **Revert uncommitted changes** and:
   - Create a feature branch for the refactoring
   - Write proper migration guide
   - Add deprecation warnings
   - Update package versions

3. **Version Bumping Strategy:**
   - Current: 0.1.0
   - With these changes: Should be 1.0.0 (major) or 0.2.0 (minor with breaking changes label)

4. **Missing Work:**
   - No tests for new `ConnectorValidationError` paths
   - No documentation for new `connector-utils` module
   - No CHANGELOG entry
   - No migration guide

### Alternative: Rollback Strategy

Consider reverting all uncommitted changes and:
1. Keep the old API (`GuardrailResult` / `GuardrailResult[]`)
2. Add new API alongside old (deprecated)
3. Provide migration path
4. Remove old API in next major version

---

## GIT STATUS SUMMARY

```
Untracked files:
  packages/core/src/connector-utils/  (entire new module)

Modified files (uncommitted):
  packages/core/src/index.ts         (exports connector-utils)
  packages/mcp-connector/src/guarded-mcp.ts
  packages/pinecone-connector/src/guarded-pinecone.ts
  packages/huggingface-connector/src/guarded-inference.ts
  packages/mastra-connector/src/mastra-guardrail.ts
  packages/vercel-connector/src/guarded-ai.ts
```

All changes are uncommitted and in an inconsistent state.

---

## CONCLUSION

The uncommitted changes represent a **MAJOR BREAKING CHANGE** to the connector API:

1. Changes return types from `GuardrailResult`/`GuardrailResult[]` to `EngineResult`
2. Introduces new error types that existing code won't catch
3. Changes blocking behavior from returning filtered content to throwing errors
4. Adds new untracked module (`connector-utils`)
5. No version bump, migration guide, or deprecation period

**Recommendation: These changes should not be committed in their current state without proper version management and migration support.**
