# Story 5.1: Connection Test Framework

Status: ready-for-dev

**Epic:** EPIC-5 - Testing Framework
**Priority:** P2
**Dependency:** EPIC-2, EPIC-4
**Points:** 5
**File:** `src/testing/validator.ts`

## Story

As the testing framework validating connectors,
I want a testConnector function with timeout and two-tier testing,
so that I can validate both connection and guardrail execution.

## Acceptance Criteria

1. TestConnector function with timeout
2. Two-tier testing: connection + validation
3. Return TestResult with latency
4. Handle network errors gracefully
5. Integrate with SecureCredential
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create testConnector() function (AC: 1, 2, 5)
  - [ ] Accept ConnectorDefinition and config
  - [ ] Start timer for latency
  - [ ] Call connector.test() with SecureCredential wrapper
  - [ ] Calculate latency
  - [ ] Return TestResult
- [ ] Create testConnectorWithTimeout() wrapper (AC: 1)
  - [ ] Accept connector, config, timeout parameters
  - [ ] Create AbortController
  - [ ] Set timeout
  - [ ] Call testConnector()
  - [ ] Clear timeout on success
  - [ ] Throw WizardError on timeout
- [ ] Implement error handling (AC: 4)
  - [ ] Catch connector.test() errors
  - [ ] Return TestResult with connection=false
  - [ ] Include error message in result
  - [ ] Always include latency
- [ ] Integrate SecureCredential (AC: 5)
  - [ ] Wrap config values in SecureCredential before test
  - [ ] Dispose after test
  - [ ] Ensure no credentials leak in errors
- [ ] Create unit tests (AC: 6)
  - [ ] Test successful connection
  - [ ] Test failed connection
  - [ ] Test timeout handling
  - [ ] Test error handling
  - [ ] Test latency measurement
  - [ ] Test SecureCredential integration
  - [ ] Achieve 90% coverage

## Dev Notes

### Implementation

```typescript
import type { ConnectorDefinition, TestResult } from '../connectors/base.js';
import { SecureCredential } from '../utils/secure-credential.js';
import { WizardError } from '../utils/error.js';

export async function testConnector(
  connector: ConnectorDefinition,
  config: Record<string, string>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Wrap credentials for secure handling
    const secureConfig = wrapConfigSecurely(config);

    const result = await connector.test(secureConfig);

    // Clean up credentials
    cleanupConfig(secureConfig);

    return {
      ...result,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      connection: false,
      validation: false,
      error: (error as Error).message,
      latency: Date.now() - startTime,
    };
  }
}

export async function testConnectorWithTimeout(
  connector: ConnectorDefinition,
  config: Record<string, string>,
  timeout = 10000
): Promise<TestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // For connectors that support AbortSignal
    const result = await testConnector(connector, config);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new WizardError(
        'TEST_TIMEOUT',
        `Connector test timed out after ${timeout}ms`,
        'Check your network connection',
        error as Error,
        2
      );
    }
    throw error;
  }
}

// Helper to wrap config values in SecureCredential
function wrapConfigSecurely(config: Record<string, string>): Record<string, string> {
  // For now, return config as-is
  // The actual connector.test() should use SecureCredential internally
  return config;
}

// Helper to clean up config
function cleanupConfig(config: Record<string, string>): void {
  // Zero out sensitive values
  for (const key in config) {
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
      config[key] = ''; // Will be garbage collected
    }
  }
}
```

### TestResult Structure

```typescript
interface TestResult {
  connection: boolean;  // API/service reachable
  validation: boolean;  // Guardrail validation passed
  error?: string;       // Error message if failed
  latency?: number;     // Test duration in ms
}
```

### Two-Tier Testing

| Tier | Purpose | How |
|------|---------|-----|
| **Connection** | Can we reach the service? | HTTP request, port check |
| **Validation** | Does guardrail validation work? | Run sample guardrail check |

**Note:** For MVP, validation tier may be optional (depends on core package availability).

### Timeout Strategy

Default timeouts:
- LLM providers: 5000ms (cloud API)
- Local services: 2000ms (Ollama)
- Framework connectors: 0ms (no test needed)

### Error Handling

```typescript
try {
  const result = await connector.test(config);
  return { ...result, latency };
} catch (error) {
  return {
    connection: false,
    validation: false,
    error: sanitizeError(error),
    latency,
  };
}
```

### SecureCredential Integration

For connectors with API keys:

```typescript
// In connector.test()
const secureKey = new SecureCredential(config.apiKey);
try {
  return await secureKey.use(async (key) => {
    return await validateApiKey(key);
  });
} finally {
  secureKey.dispose();
}
```

### Usage Example

```typescript
import { getConnector } from '../connectors/registry.js';
import { testConnectorWithTimeout } from './validator.js';

const openai = getConnector('openai');
if (openai) {
  const result = await testConnectorWithTimeout(
    openai,
    { apiKey: 'sk-...' },
    5000
  );

  console.log(result);
  // { connection: true, validation: true, latency: 234 }
}
```

### Test Strategy

- Mock connector.test() for unit tests
- Test timeout with delayed promises
- Test error scenarios
- Test latency calculation
- Verify SecureCredential usage

### Project Context Reference

- Testing Framework: [working-document.md#L682-L770](../working-document.md#L682-L770)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
