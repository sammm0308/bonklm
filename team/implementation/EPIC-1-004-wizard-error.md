# Story 1.4: WizardError with Sanitization

Status: completed

**Epic:** EPIC-1 - Security Foundation
**Priority:** P0 (Blocking)
**Points:** 3
**File:** `src/utils/error.ts`

## Story

As a security-focused developer,
I want a WizardError class that sanitizes credentials from error messages,
so that credentials never leak in logs, stack traces, or error output.

## Acceptance Criteria

1. WizardError class with code, message, suggestion, cause, exitCode
2. Sanitize cause errors for credential patterns
3. Credential patterns cover: OpenAI, Anthropic, Bearer tokens, api_key variants
4. **Enhanced patterns detect base64-encoded credentials (C-3 fix)**
5. **Entropy detection for high-entropy strings (C-3 fix)**
6. toString() format without stack trace
7. All tests pass with 90% coverage

## Tasks / Subtasks

- [x] Define credential patterns (AC: 3, 4, 5)
  - [x] OpenAI: `/sk-[a-zA-Z0-9\-_\.+/]{10,}/gi` (case-insensitive, min 10 chars)
  - [x] Anthropic: covered by sk- pattern above
  - [x] Bearer tokens: `/Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi`
  - [x] API keys: `/api[_-]?key["\s:=]+[^\s"'`<>]+/gi` with entropy check
  - [x] Base64 high-entropy: `/[A-Za-z0-9+/]{32,}={0,2}/` with entropy check
  - [x] Long high-entropy strings: `/[a-zA-Z0-9_\-\.+/=]{40,}/` with entropy check
- [x] Create isHighEntropy() helper function (AC: 5)
  - [x] Calculate Shannon entropy ratio
  - [x] Return true if >60% unique characters AND length >= 20
- [x] Create sanitizeError() function (AC: 2)
  - [x] Accept Error object
  - [x] Sanitize error.message with all patterns
  - [x] Sanitize error.stack with all patterns (if exists)
  - [x] Return new Error with sanitized content
- [x] Create WizardError class (AC: 1)
  - [x] Constructor: code, message, suggestion?, cause?, exitCode?
  - [x] Set this.name = 'WizardError'
  - [x] Sanitize cause error if provided
  - [x] Store all properties as public readonly
- [x] Implement toString() method (AC: 6)
  - [x] Format: "{code}: {message}"
  - [x] Append suggestion if present: "\nSuggestion: {suggestion}"
  - [x] Do NOT include stack trace
- [x] Define ExitCode constants (AC: 1)
  - [x] SUCCESS: 0
  - [x] ERROR: 1
  - [x] PARTIAL: 2
- [x] Export SecureCredentialError constants (BONUS)
  - [x] TOO_LARGE, DISPOSED, IN_USE error codes
- [x] Create unit tests (AC: 7)
  - [x] Test WizardError construction
  - [x] Test credential pattern redaction (all patterns)
  - [x] Test stack trace sanitization
  - [x] Test toString() format
  - [x] Test cause sanitization
  - [x] Test entropy detection edge cases
  - [x] Test low-entropy strings are NOT redacted
  - [x] Achieve 90%+ code coverage

## Dev Notes

### Why Credential Sanitization Matters

Errors often contain credentials in their messages or stack traces. Without sanitization:
- Console.error() would log API keys
- Error logs would expose secrets
- Stack traces might contain sensitive data

### WizardError Structure

```typescript
class WizardError extends Error {
  constructor(
    public code: string,              // e.g., 'ENV_READ_FAILED', 'API_KEY_INVALID'
    message: string,
    public suggestion?: string,       // Actionable next step
    public cause?: Error,             // Original error (will be sanitized)
    public exitCode?: 0 | 1 | 2       // CLI exit code
  ) {
    super(message);
    this.name = 'WizardError';

    if (cause) {
      this.cause = sanitizeError(cause);
    }
  }

  override toString(): string {
    let output = `${this.code}: ${this.message}`;
    if (this.suggestion) {
      output += `\nSuggestion: ${this.suggestion}`;
    }
    return output;
  }
}
```

### Usage Pattern

```typescript
throw new WizardError(
  'API_KEY_INVALID',
  'OpenAI API key validation failed',
  'Verify your API key is valid and has not expired',
  originalError,
  1 // Error exit code
);
```

### Exit Code Convention

| Code | Constant | Meaning |
|------|----------|---------|
| 0 | SUCCESS | All operations completed |
| 1 | ERROR | Operation failed |
| 2 | PARTIAL | Some operations succeeded, some failed |

### Sanitization Approach

1. **Regex Patterns:** Match common credential formats
2. **Replacement:** Replace with `'***REDACTED***'`
3. **Both Message and Stack:** Sanitize both error.message and error.stack
4. **Non-destructive:** Return new Error, don't modify original

### Test Cases

Must cover all credential patterns:
- `sk-1234...48` (OpenAI)
- `sk-ant-api123...95` (Anthropic)
- `Bearer eyJhbGc...` (Bearer token)
- `api_key=abc123` (various formats)

### Project Context Reference

- Security Rules: [working-document.md#L265-L333](../working-document.md#L265-L333)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Completed: 2026-02-18
- All tests passing (34 tests for error, 44 for mask)
- Code coverage: 100% statement/function/line/branch
- Entropy threshold: 60% unique characters, min 20 chars length
- Enhanced patterns beyond original spec:
  - Case-insensitive sk- pattern matching
  - Special characters: `-._.+/=`
  - Entropy-based detection for base64 and long strings
  - Prevents over-redaction of common phrases

### File List

- `packages/wizard/src/utils/error.ts` (created)
- `packages/wizard/src/utils/error.test.ts` (created)
- `packages/wizard/src/utils/index.ts` (updated - added exports)
