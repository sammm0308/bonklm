# Story: 3.1 Anthropic SDK Connector

## Status: `review` ✅

## Acceptance Criteria

- [x] Middleware/plugin intercepts API calls
- [x] Validates request prompts before sending
- [x] Validates response content after receiving
- [x] Streaming validation with early termination
- [x] Configurable validator/guard selection
- [x] Proper TypeScript types
- [x] Comprehensive tests (>90% coverage)
- [x] Documentation with examples

## Tasks/Subtasks

- [x] Create package structure (package.json, tsconfig.json, vitest.config.ts)
- [x] Implement `createGuardedAnthropic()` wrapper function
- [x] Add input validation with `messagesToText()` helper
- [x] Add output validation with content filtering
- [x] Implement streaming validation with incremental checks
- [x] Add max buffer size enforcement (DoS protection)
- [x] Add validation timeout with AbortController
- [x] Add production mode for generic error messages
- [x] Create comprehensive unit tests (62 tests, all passing)
- [x] Create example application
- [x] Write README documentation
- [x] Code review completed - 3 Medium, 2 Low issues identified and fixed

## Dev Agent Record

### File List

**Created:**
- `packages/anthropic-connector/package.json`
- `packages/anthropic-connector/tsconfig.json`
- `packages/anthropic-connector/vitest.config.ts`
- `packages/anthropic-connector/LICENSE`
- `packages/anthropic-connector/src/guarded-anthropic.ts`
- `packages/anthropic-connector/src/types.ts`
- `packages/anthropic-connector/src/index.ts`
- `packages/anthropic-connector/tests/guarded-anthropic.test.ts`
- `packages/anthropic-connector/tests/messagesToText.test.ts`
- `packages/anthropic-connector/examples/anthropic-example/package.json`
- `packages/anthropic-connector/examples/anthropic-example/src/index.ts`
- `packages/anthropic-connector/README.md`

### Change Log

**Implementation Summary:**
- Built Anthropic SDK connector with full security feature parity with OpenAI connector
- Implemented SEC-002 through SEC-008 security features
- 62 unit tests created with 100% pass rate
- Full TypeScript support with proper types from Anthropic SDK
- Example application demonstrating usage patterns

**Code Review Findings (Auto-Fixed):**
- [FIXED] Stream buffer error now yields warning events before ending
- [FIXED] Final stream validation now yields warning content blocks
- [FIXED] Added tool_use block handling for validation
- [FIXED] Proper event types for stream termination

## API Design

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createGuardedAnthropic } from '@blackunicorn/bonklm-anthropic';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const anthropic = new Anthropic();
const guarded = createGuardedAnthropic(anthropic, {
  validators: [new PromptInjectionValidator()],
  validateStreaming: true,
  streamingMode: 'incremental',
});

const response = await guarded.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: userInput }],
  max_tokens: 1024,
});
```
