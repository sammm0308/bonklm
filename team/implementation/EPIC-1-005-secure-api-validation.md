# Story 1.5: Secure API Validation Protocol

Status: ready-for-dev

**Epic:** EPIC-1 - Security Foundation
**Priority:** P0 (Blocking)
**Points:** 3
**File:** `src/utils/validation.ts`

## Story

As a security-focused developer,
I want a secure API validation function that never leaks credentials in logs or error messages,
so that API key validation is safe from credential exposure.

## Acceptance Criteria

1. SecureValidationConfig interface (method, sendInHeader, testEndpoint, timeout, logLevel)
2. validateApiKeySecure function with AbortController timeout
3. Uses SecureCredential for memory safety
4. Throws WizardError on timeout
5. Never logs request/response bodies
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define SecureValidationConfig interface (AC: 1)
  - [ ] method: 'HEAD' | 'OPTIONS' | 'GET'
  - [ ] sendInHeader: boolean
  - [ ] testEndpoint: string
  - [ ] timeout: number
  - [ ] logLevel: 'none'
- [ ] Create validateApiKeySecure function (AC: 2, 3, 5)
  - [ ] Accept apiKey and SecureValidationConfig
  - [ ] Wrap apiKey in SecureCredential
  - [ ] Use secureCredential.use() for automatic cleanup
  - [ ] Create AbortController for timeout
  - [ ] Set timeout with setTimeout()
  - [ ] Execute fetch with config
  - [ ] Clear timeout after fetch
  - [ ] Return response.ok
  - [ ] Finally: dispose SecureCredential
- [ ] Implement timeout handling (AC: 4)
  - [ ] Catch AbortError from fetch
  - [ ] Throw WizardError with:
    - code: 'VALIDATION_TIMEOUT'
    - message about timeout
    - suggestion about network
    - exitCode: 2 (partial)
- [ ] Implement secure header handling (AC: 1, 5)
  - [ ] If sendInHeader: use Authorization header
  - [ ] Never send credentials in URL parameters
  - [ ] Never log request/response bodies
- [ ] Create unit tests (AC: 6)
  - [ ] Test successful validation (mock fetch)
  - [ ] Test timeout handling
  - [ ] Test credential wrapping in SecureCredential
  - [ ] Test credential disposal (verify buffer cleared)
  - [ ] Test header vs no-header modes
  - [ ] Verify no logging of sensitive data
  - [ ] Achieve 90% code coverage

## Dev Notes

### Why Secure Validation?

**Problems this solves:**
1. API keys in error messages
2. API keys in debug logs
3. API keys remaining in memory after validation
4. Hanging validation requests

### SecureValidationConfig Design

```typescript
interface SecureValidationConfig {
  // Use HEAD/OPTIONS when possible (no request body)
  method: 'HEAD' | 'OPTIONS' | 'GET';

  // Send in header (never in URL)
  sendInHeader: boolean;

  // Minimal test endpoint
  testEndpoint: string;

  // Prevent hanging
  timeout: number;

  // Never log request/response
  logLevel: 'none';
}
```

### Memory Safety with SecureCredential

```typescript
const secureKey = new SecureCredential(apiKey);

try {
  return await secureKey.use(async (key) => {
    // Make API call with key
    return await fetch(config.testEndpoint, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
  });
} finally {
  // Memory automatically zeroed via use() finally block
}
```

### AbortController Pattern

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), config.timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  return response.ok;
} catch (error) {
  clearTimeout(timeout);
  if (error.name === 'AbortError') {
    throw new WizardError('VALIDATION_TIMEOUT', ...);
  }
  throw error;
}
```

### Connector-Specific Configurations

Each connector will provide its own validation config:

```typescript
// OpenAI
{
  method: 'GET',
  sendInHeader: true,
  testEndpoint: 'https://api.openai.com/v1/models',
  timeout: 5000,
  logLevel: 'none',
}

// Anthropic
{
  method: 'GET',
  sendInHeader: true,
  testEndpoint: 'https://api.anthropic.com/v1/models',
  timeout: 5000,
  logLevel: 'none',
}

// Ollama (local, no header needed)
{
  method: 'GET',
  sendInHeader: false,
  testEndpoint: 'http://localhost:11434/api/tags',
  timeout: 2000,
  logLevel: 'none',
}
```

### Testing Strategy

- Use `vi.mock('node-fetch')` or similar for fetch mocking
- Test that SecureCredential.dispose() is called
- Test timeout with delayed mock + AbortController
- Verify no credential leakage in error messages

### Project Context Reference

- Security Rules: [working-document.md#L335-L414](../working-document.md#L335-L414)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
