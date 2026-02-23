# Story 5.3: Test Result Display

Status: ready-for-dev

**Epic:** EPIC-5 - Testing Framework
**Priority:** P2
**Dependency:** EPIC-2, EPIC-4
**Points:** 2
**File:** `src/testing/display.ts`

## Story

As a CLI displaying test results,
I want formatted output with color-coded indicators,
so that users can quickly understand connector test status.

## Acceptance Criteria

1. Display test results in table format
2. Color-coded indicators (✓/✗)
3. Show latency information
4. Support JSON output mode
5. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define TestDisplay interface
  - [ ] connectorId: string
  - [ ] result: TestResult
- [ ] Implement displayTestResults() function (AC: 1, 2, 4)
  - [ ] Accept array of TestDisplay
  - [ ] Accept jsonMode boolean parameter
  - [ ] If jsonMode: output JSON format
  - [ ] Otherwise: format as table with colors
- [ ] Implement colored indicators (AC: 2)
  - [ ] Check terminal capabilities
  - [ ] Use ANSI colors if supported
  - [ ] ✓ Green for success
  - [ ] ✗ Red for failure
  - [ ] Plain text fallback
- [ ] Implement latency display (AC: 3)
  - [ ] Show latency in milliseconds
  - [ ] Format: "Latency: 234ms"
- [ ] Implement error display
  - [ ] Show error message if present
  - [ ] Format: "Error: [message]"
- [ ] Create unit tests (AC: 5)
  - [ ] Test JSON output
  - [ ] Test colored output
  - [ ] Test plain text output
  - [ ] Test with various result states
  - [ ] Achieve 90% coverage

## Dev Notes

### Implementation

```typescript
import type { TestResult } from '../connectors/base.js';
import { getTerminalCapabilities } from '../utils/terminal.js';

export interface TestDisplay {
  connectorId: string;
  result: TestResult;
}

export interface JsonOutput {
  success: boolean;
  exitCode: 0 | 1 | 2;
  data: {
    connectorId: string;
    connection: boolean;
    validation: boolean;
    error?: string;
    latency?: number;
  }[];
  timing: {
    total: number;
  };
}

export function displayTestResults(
  tests: TestDisplay[],
  jsonMode = false
): void {
  if (jsonMode) {
    const output: JsonOutput = {
      success: tests.every(t => t.result.connection && t.result.validation),
      exitCode: tests.every(t => t.result.connection && t.result.validation) ? 0 : 2,
      data: tests.map(t => ({
        connectorId: t.connectorId,
        connection: t.result.connection,
        validation: t.result.validation,
        error: t.result.error,
        latency: t.result.latency,
      })),
      timing: {
        total: tests.reduce((sum, t) => sum + (t.result.latency || 0), 0),
      },
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  const { supportsColor } = getTerminalCapabilities();

  for (const test of tests) {
    const isSuccess = test.result.connection && test.result.validation;
    const symbol = isSuccess
      ? (supportsColor ? '\x1b[32m✓\x1b[0m' : '✓')
      : (supportsColor ? '\x1b[31m✗\x1b[0m' : '✗');

    console.log(`${symbol} ${test.connectorId}`);

    if (test.result.latency !== undefined) {
      console.log(`  Latency: ${test.result.latency}ms`);
    }

    if (test.result.error) {
      console.log(`  Error: ${test.result.error}`);
    }
  }
}
```

### ANSI Color Codes

| Color | Code | Usage |
|-------|------|-------|
| Green | `\x1b[32m...\x1b[0m` | Success (✓) |
| Red | `\x1b[31m...\x1b[0m` | Failure (✗) |
| Yellow | `\x1b[33m...\x1b[0m` | Warning |
| Blue | `\x1b[34m...\x1b[0m` | Info |
| Reset | `\x1b[0m` | Reset to default |

### Output Formats

**Interactive (default):**
```
✓ openai
  Latency: 234ms
✗ anthropic
  Error: Invalid API key
✓ ollama
  Latency: 12ms
```

**JSON mode:**
```json
{
  "success": false,
  "exitCode": 2,
  "data": [
    {
      "connectorId": "openai",
      "connection": true,
      "validation": true,
      "latency": 234
    },
    {
      "connectorId": "anthropic",
      "connection": false,
      "validation": false,
      "error": "Invalid API key"
    }
  ],
  "timing": {
    "total": 246
  }
}
```

### Terminal Capabilities Check

```typescript
import { getTerminalCapabilities } from '../utils/terminal.js';

const { supportsColor } = getTerminalCapabilities();
```

If `supportsColor` is false, use plain text symbols only.

### Usage Example

```typescript
import { displayTestResults } from './display.js';

const results = [
  { connectorId: 'openai', result: { connection: true, validation: true, latency: 234 } },
  { connectorId: 'anthropic', result: { connection: false, validation: false, error: 'Invalid key' } },
];

// Interactive output
displayTestResults(results);
// ✓ openai
//   Latency: 234ms
// ✗ anthropic
//   Error: Invalid key

// JSON output
displayTestResults(results, true);
// {"success":false,"exitCode":2,"data":[...],"timing":{...}}
```

### Exit Codes

| Scenario | Exit Code |
|----------|-----------|
| All tests pass | 0 (SUCCESS) |
| Some tests fail | 2 (PARTIAL) |
| All tests fail | 1 (ERROR) |

### Test Strategy

- Test JSON output format
- Test colored output
- Test plain text output (no color)
- Test with mixed success/failure
- Test latency display
- Test error message display

### Project Context Reference

- Testing Framework: [working-document.md#L682-L770](../working-document.md#L682-L770)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
