# Story 2.3: Terminal Capability Detection

Status: ready-for-dev

**Epic:** EPIC-2 - Core Infrastructure
**Priority:** P1
**Dependency:** EPIC-1
**Points:** 2
**File:** `src/utils/terminal.ts`

## Story

As a CLI developer,
I want to detect terminal capabilities (TTY, colors, width),
so that the wizard can adapt its output for different environments.

## Acceptance Criteria

1. Detect TTY availability (process.stdout.isTTY)
2. Detect color support
3. Detect terminal width
4. Return terminal capabilities object
5. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define TerminalCapabilities interface
  - [ ] isTTY: boolean
  - [ ] supportsColor: boolean
  - [ ] width: number
- [ ] Implement getTerminalCapabilities() function (AC: 1-4)
  - [ ] Check process.stdout.isTTY
  - [ ] Check env.FORCE_COLOR (if '0', disable colors)
  - [ ] Get process.stdout.columns (default to 80)
  - [ ] Return capabilities object
- [ ] Handle edge cases
  - [ ] CI/CD environments (no TTY)
  - [ ] Piped output (no TTY)
  - [ ] Windows terminal variations
- [ ] Create unit tests (AC: 5)
  - [ ] Test TTY detection
  - [ ] Test color detection
  - [ ] Test width detection
  - [ ] Test default values
  - [ ] Achieve 90% coverage

## Dev Notes

### TerminalCapabilities Interface

```typescript
export interface TerminalCapabilities {
  /** Terminal is interactive (not piped or CI) */
  isTTY: boolean;

  /** Terminal supports ANSI colors */
  supportsColor: boolean;

  /** Terminal width in characters */
  width: number;
}
```

### Implementation

```typescript
export function getTerminalCapabilities(): TerminalCapabilities {
  return {
    isTTY: Boolean(process.stdout.isTTY),
    supportsColor: process.env.FORCE_COLOR !== '0',
    width: process.stdout.columns || 80,
  };
}
```

### Usage Pattern

```typescript
import { getTerminalCapabilities } from './terminal.js';

const caps = getTerminalCapabilities();

if (caps.isTTY) {
  // Use interactive prompts (Clack)
} else {
  // Use non-interactive mode (parse args, output JSON)
}

if (caps.supportsColor) {
  // Use ANSI colors
  console.log('\x1b[32m✓ Success\x1b[0m');
} else {
  // Plain text
  console.log('✓ Success');
}

// Wrap text to terminal width
const wrapWidth = Math.min(caps.width, 120);
```

### Color Detection

`FORCE_COLOR` is a standard environment variable:
- `FORCE_COLOR=0` or `FORCE_COLOR=false`: Disable colors
- `FORCE_COLOR=1`, `FORCE_COLOR=2`, etc.: Enable colors
- Not set: Auto-detect via `process.stdout.isTTY`

### TTY Detection

`process.stdout.isTTY` is `false` when:
- Output is piped: `command | other-command`
- Output is redirected: `command > file.txt`
- Running in CI/CD (typically)
- Running in non-interactive scripts

### Width Detection

`process.stdout.columns` reports the terminal width. It's `undefined` in non-TTY contexts.

### CI/CD Considerations

In CI/CD:
- `isTTY` is typically `false`
- Use JSON output format
- Skip interactive prompts
- Use exit codes for status

### Clack Integration

Clack automatically respects TTY, but we need explicit checks for:
- Whether to show spinners vs simple logs
- Whether to use interactive prompts or just read from env
- Output format (colored vs plain)

### Project Context Reference

- Tech Stack: [working-document.md#L52-L85](../working-document.md#L52-L85)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
