# Story 6.4: Progress Indicators

Status: ready-for-dev

**Epic:** EPIC-6 - Wizard UX
**Priority:** P2
**Dependency:** EPIC-3, EPIC-5
**Points:** 2
**File:** `src/utils/progress.ts`

## Story

As a CLI showing progress during long operations,
I want spinner and progress bar wrappers,
so that users know the wizard hasn't frozen.

## Acceptance Criteria

1. Wrap detection phases with Clack spinners
2. Show progress bars for long operations
3. Handle non-TTY environments gracefully

## Tasks / Subtasks

- [ ] Create withSpinner() helper function (AC: 1)
  - [ ] Accept message and async function
  - [ ] Check TTY availability
  - [ ] If TTY: use Clack spinner
  - [ ] If not TTY: simple console.log
  - [ ] Execute function within spinner context
  - [ ] Return function result
  - [ ] Handle errors with proper spinner cleanup
- [ ] Create withProgress() helper function (AC: 2)
  - [ ] Accept message, total items, and async function
  - [ ] Use Clack's progress bar if available
  - [ ] Update progress as items complete
  - [ ] Show percentage complete
- [ ] Handle non-TTY environments (AC: 3)
  - [ ] Check isTTY from getTerminalCapabilities()
  - [ ] Fall back to simple log messages
  - [ ] Don't use spinners or progress bars
- [ ] Create unit tests
  - [ ] Test spinner wrapper
  - [ ] Test progress wrapper
  - [ ] Test TTY vs non-TTY behavior
  - [ ] Test error handling

## Dev Notes

### Implementation

```typescript
import * as p from '@clack/prompts';
import { getTerminalCapabilities } from './terminal.js';

export interface SpinnerOptions {
  message: string;
}

export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const { isTTY } = getTerminalCapabilities();

  if (!isTTY) {
    console.log(message);
    return await fn();
  }

  const spin = p.spinner();
  spin.start(message);

  try {
    const result = await fn();
    spin.stop(`${message} ✓`);
    return result;
  } catch (error) {
    spin.stop(`${message} ✗`);
    throw error;
  }
}

export interface ProgressOptions {
  message: string;
  total: number;
}

export async function withProgress<T>(
  options: ProgressOptions,
  fn: (update: (current: number) => void) => Promise<T>
): Promise<T> {
  const { isTTY } = getTerminalCapabilities();

  if (!isTTY) {
    console.log(options.message);
    return await fn((current) => {
      console.log(`Progress: ${current}/${options.total}`);
    });
  }

  // Use Clack's progress if available
  const progress = p.progress();
  const start = performance.now();

  const result = await fn((current) => {
    const percent = Math.round((current / options.total) * 100);
    progress.update(percent, {
      message: options.message,
      value: current,
      max: options.total,
    });
  });

  progress.done();
  return result;
}
```

### Usage Examples

```typescript
import { withSpinner, withProgress } from './progress.js';

// Simple spinner
const frameworks = await withSpinner(
  'Detecting frameworks...',
  () => detectFrameworks()
);

// Progress bar for multiple items
const results = await withProgress(
  { message: 'Testing connectors...', total: connectors.length },
  async (update) => {
    const results = [];
    for (let i = 0; i < connectors.length; i++) {
      const result = await testConnector(connectors[i]);
      results.push(result);
      update(i + 1); // Update progress
    }
    return results;
  }
);
```

### Clack Integration

```typescript
import { spinner, progress } from '@clack/prompts';

// Spinner
const spin = spinner();
spin.start('Loading...');
// ... do work
spin.stop('Done ✓');

// Progress bar
const bar = progress();
bar.start(100, 0, { message: 'Processing...' });
// ... update
bar.update(50, { message: 'Halfway...' });
bar.finish();
```

### Non-TTY Fallback

When not in a TTY (piped output, CI/CD):
- Show simple log messages
- No spinners or progress bars
- Still show progress updates

```typescript
if (!isTTY) {
  console.log('Processing...');
  console.log('1/5 complete');
  console.log('2/5 complete');
  // ...
}
```

### TTY Detection

```typescript
import { getTerminalCapabilities } from './terminal.js';

const { isTTY } = getTerminalCapabilities();
```

### Error Handling in Spinners

```typescript
try {
  const result = await fn();
  spin.stop(`✓ ${message}`);
  return result;
} catch (error) {
  spin.stop(`✗ ${message}`);
  throw error; // Re-throw for caller to handle
}
```

### Use Cases

| Operation | Indicator Type |
|-----------|----------------|
| Framework detection | Spinner |
| Service detection | Spinner |
| Credential detection | Spinner |
| Testing multiple connectors | Progress bar |
| Installing packages | Progress bar |

### Test Strategy

- Mock getTerminalCapabilities()
- Test TTY mode (with spinners)
- Test non-TTY mode (plain logs)
- Test error handling and cleanup
- Test progress updates

### Project Context Reference

- Wizard UX: [working-document.md#L772-L860](../working-document.md#L772-L860)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
