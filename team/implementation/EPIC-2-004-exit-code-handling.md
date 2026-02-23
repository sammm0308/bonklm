# Story 2.4: Exit Code Handling

Status: ready-for-dev

**Epic:** EPIC-2 - Core Infrastructure
**Priority:** P1
**Dependency:** EPIC-1
**Points:** 2
**File:** `src/utils/exit.ts`

## Story

As a CLI developer,
I want standardized exit code handling with logging,
so that scripts can reliably detect wizard success/failure.

## Acceptance Criteria

1. Process.exit() wrapper with logging
2. Support for ExitCode constants
3. Graceful shutdown handling
4. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Import ExitCode from error.ts (AC: 2)
- [ ] Create exit() function (AC: 1)
  - [ ] Accept exit code key: 'SUCCESS' | 'ERROR' | 'PARTIAL'
  - [ ] Map to numeric value: 0 | 1 | 2
  - [ ] Call process.exit(code)
  - [ ] Mark return type as `never`
- [ ] Create exitWithError() function (AC: 3)
  - [ ] Accept Error object
  - [ ] Check if WizardError
  - [ ] Extract and display error message
  - [ ] Use exit code from WizardError or default to ERROR
  - [ ] Call exit()
- [ ] Create shutdown handler (AC: 3)
  - [ ] Register process.on('SIGINT') handler
  - [ ] Register process.on('SIGTERM') handler
  - [ ] Log shutdown message
  - [ ] Exit with PARTIAL code
- [ ] Create unit tests (AC: 4)
  - [ ] Test exit() mapping
  - [ ] Test exitWithError() with WizardError
  - [ ] Test exitWithError() with generic Error
  - [ ] Test signal handlers
  - [ ] Achieve 90% coverage

## Dev Notes

### Exit Code Constants (from EPIC-1-004)

```typescript
export const ExitCode = {
  SUCCESS: 0,    // All operations completed
  ERROR: 1,      // Operation failed
  PARTIAL: 2,    // Some operations succeeded, some failed
} as const;
```

### Implementation

```typescript
import { WizardError } from './error.js';
import { ExitCode } from './error.js';
import type { WizardError as WizardErrorType } from './error.js';

export function exit(code: keyof typeof ExitCode = 'SUCCESS'): never {
  const exitCode = ExitCode[code];
  process.exit(exitCode);
}

export function exitWithError(error: Error): never {
  if (error instanceof WizardError) {
    console.error(error.toString());
    exit(error.exitCode ?? 'ERROR');
  }

  // Generic error
  console.error('Unexpected error:', error.message);
  exit('ERROR');
}

export function setupShutdownHandlers(): void {
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    process.exit(ExitCode.PARTIAL);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
```

### Usage Pattern

```typescript
// In commands
import { exit, exitWithError, setupShutdownHandlers } from './exit.js';

export const wizardCommand = new Command('wizard')
  .action(async (options) => {
    setupShutdownHandlers();

    try {
      // ... command logic
      exit('SUCCESS');
    } catch (error) {
      exitWithError(error as Error);
    }
  });
```

### Exit Code Convention

| Code | Meaning | Use Case |
|------|---------|----------|
| 0 | SUCCESS | Everything completed successfully |
| 1 | ERROR | Operation failed completely |
| 2 | PARTIAL | Partial success (e.g., some connectors failed) |

### Script Integration

Scripts can check exit codes:

```bash
# Check if wizard succeeded
bonklm wizard --yes
if [ $? -eq 0 ]; then
  echo "Setup successful"
else
  echo "Setup failed"
fi
```

```bash
# Exit on error
bonklm wizard || exit 1
```

### Graceful Shutdown

The signal handlers ensure:
- Ctrl+C (SIGINT) exits cleanly
- Kill commands (SIGTERM) exit cleanly
- Resources are released where possible
- Exit code 2 indicates partial completion

### Testing Considerations

- Tests should NOT call `process.exit()` (it terminates the test runner)
- Mock `process.exit()` in tests
- Test that correct exit code value is passed
- Test error message formatting

### Project Context Reference

- Exit Code Convention: [working-document.md#L324-L333](../working-document.md#L324-L333)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
