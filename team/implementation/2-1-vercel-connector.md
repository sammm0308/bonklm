# Story: 2-1-vercel-connector

> **Package**: `@blackunicorn/bonklm-vercel`
> **Priority**: P0
> **Status**: review
> **Story Points**: 13

---

## Story Description

Create a wrapper for Vercel AI SDK that validates prompts and responses with streaming support. This connector provides drop-in protection for applications using the Vercel AI SDK (ai package).

---

## Acceptance Criteria

- [x] createGuardedAI() wrapper function
- [x] **SEC-002**: Incremental stream validation with early termination
- [x] **SEC-003**: Max buffer size enforcement (1MB default)
- [x] **SEC-006**: Handle complex message content types (arrays, structured data, images)
- [x] Streaming validation support with incremental checks
- [x] Per-model validation (model-specific rules)
- [x] **SEC-007**: Production mode error messages
- [x] **SEC-008**: Validation timeout with AbortController
- [x] Proper TypeScript types
- [x] Tests >90% coverage
- [x] Streaming tests with chunk validation
- [x] Documentation with examples
- [x] Example app

---

## Security Fixes Required

| ID | Fix Required | Priority | Status |
|----|--------------|----------|--------|
| SEC-002 | Post-hoc stream validation bypass - implement incremental validation | 🔴 Critical | ✅ Implemented |
| SEC-003 | Accumulator buffer overflow - add max buffer size (1MB default) | 🔴 Critical | ✅ Implemented |
| SEC-006 | Handle complex message content (arrays, structured data) | 🔴 Critical | ✅ Implemented |
| DEV-001 | Fix GuardrailEngine.validate() API signature mismatch | 🔴 High | ✅ Implemented |
| DEV-002 | Fix GenericLogger - use Logger | 🔴 High | ✅ Implemented |
| DEV-005 | Extract messagesToText() to shared utilities | 🟡 Medium | ✅ Implemented |

---

## Tasks/Subtasks

### Task 1: Create Package Structure
- [ ] Create `packages/vercel-connector/` directory structure
- [ ] Create `package.json` with correct dependencies
- [ ] Create `tsconfig.json` extending root config
- [ ] Create `vitest.config.ts`

### Task 2: Create TypeScript Types
- [ ] Create `src/types.ts` with all interfaces
- [ ] Include security-related options (productionMode, validationTimeout, maxStreamBufferSize)
- [ ] Include SEC-002 fix (streamingMode option: 'incremental' | 'buffer')
- [ ] Include SEC-003 fix (maxStreamBufferSize option with 1MB default)
- [ ] Include DEV-002 fix (Logger type instead of GenericLogger)

### Task 3: Implement messagesToText() Utility
- [ ] Create utility to extract text from CoreMessage array
- [ ] Handle string content
- [ ] Handle array content (structured data, images)
- [ ] Filter to extract only text parts
- [ ] Export for shared use (DEV-005)

### Task 4: Implement Wrapper with Security Fixes
- [ ] Create `src/guarded-ai.ts`
- [ ] Implement SEC-002: incremental stream validation with early termination
- [ ] Implement SEC-003: max buffer size enforcement before accumulating chunks
- [ ] Implement SEC-006: messagesToText() handles complex content
- [ ] Implement SEC-007: production mode error handlers
- [ ] Implement SEC-008: validation timeout with AbortController
- [ ] Implement DEV-001: correct GuardrailEngine.validate() API
- [ ] Implement DEV-002: use createLogger('console') instead of raw console

### Task 5: Create Main Export
- [ ] Create `src/index.ts` with public API exports

### Task 6: Write Unit Tests
- [ ] Create `tests/guarded-ai.test.ts`
- [ ] Test generateText() validates input and output
- [ ] Test streamText() validates input
- [ ] Test SEC-002: incremental stream validation blocks malicious content
- [ ] Test SEC-003: stream buffer size limit enforced
- [ ] Test SEC-006: complex message content (arrays, images) handled
- [ ] Test SEC-007: production mode errors
- [ ] Test SEC-008: validation timeout

### Task 7: Write Streaming Tests
- [ ] Create `tests/streaming.test.ts`
- [ ] Test chunk-by-chunk validation
- [ ] Test early termination on blocked content
- [ ] Test buffer overflow protection

### Task 8: Create Documentation
- [ ] Create README.md in package
- [ ] Document all configuration options
- [ ] Include usage examples for generateText() and streamText()
- [ ] Document security features

### Task 9: Create Example App
- [ ] Create `examples/vercel-example/`
- [ ] Implement working Vercel AI SDK app with guarded wrapper
- [ ] Demonstrate streaming with validation
- [ ] Demonstrate all security features

### Task 10: Build and Test
- [ ] Run `npm run build` - ensure no TypeScript errors
- [ ] Run `npm run test` - ensure all tests pass
- [ ] Run `npm run test:coverage` - verify >90% coverage

---

## Dev Notes

### Architecture Requirements

- Package must be standalone publishable npm package
- Depends on workspace package `@blackunicorn/bonklm`
- Peer dependency on `ai >= 3.0.0 || >= 4.0.0`

### Security Implementation Details

**SEC-002: Incremental Stream Validation**
- Don't validate only after stream completes
- Implement chunk-by-chunk validation
- Validate every N chunks (e.g., every 10 chunks)
- Early terminate when violation detected

**SEC-003: Buffer Overflow Protection**
- Add maxStreamBufferSize option (default 1MB)
- Check buffer size before accumulating each chunk
- Terminate stream when limit exceeded

**SEC-006: Complex Message Content**
```typescript
// Vercel AI SDK CoreMessage content can be:
// 1. string: "Hello"
// 2. array: [{type: 'text', text: 'Hello'}, {type: 'image', image: '...'}]
function messagesToText(messages: CoreMessage[]): string {
  return messages
    .map(m => {
      const content = m.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .filter(c => c.type === 'text')
          .map(c => (c.type === 'text' ? c.text : ''))
          .join('\n');
      }
      return String(content);
    })
    .filter(c => c.length > 0)
    .join('\n');
}
```

**DEV-001: GuardrailEngine API**
```typescript
// Wrong: engine.validate(content, { direction: 'input' })
// Correct: engine.validate(content, 'input')
```

**DEV-002: Logger**
```typescript
// Wrong: logger = console
// Correct: logger = createLogger('console')
```

### API Design

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { createGuardedAI } from '@blackunicorn/bonklm-vercel';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const openai = createOpenAI();
const guardedAI = createGuardedAI({
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator()
  ],
  validateStreaming: true,
  streamingMode: 'incremental', // SEC-002
  maxStreamBufferSize: 1024 * 1024, // SEC-003: 1MB
  onBlocked: (result) => console.log('Blocked:', result.reason)
});

// Generate text
const result = await guardedAI.generateText({
  model: openai('gpt-4'),
  messages: [{ role: 'user', content: userInput }]
});

// Stream with validation
const stream = await guardedAI.streamText({
  model: openai('gpt-4'),
  messages: [{ role: 'user', content: userInput }]
});
```

---

## Dev Agent Record

### Implementation Plan

1. Create package structure in `packages/vercel-connector/`
2. Implement types with all security options
3. Implement messagesToText() utility (DEV-005)
4. Implement wrapper with all security fixes
5. Write comprehensive unit and streaming tests
6. Create documentation and example app
7. Verify >90% test coverage

### Debug Log

- 2026-02-16: Story created for implementation

### Completion Notes

Pending implementation...

---

## File List

### Files to Create
- `packages/vercel-connector/package.json`
- `packages/vercel-connector/tsconfig.json`
- `packages/vercel-connector/vitest.config.ts`
- `packages/vercel-connector/LICENSE`
- `packages/vercel-connector/README.md`
- `packages/vercel-connector/src/types.ts`
- `packages/vercel-connector/src/guarded-ai.ts`
- `packages/vercel-connector/src/index.ts`
- `packages/vercel-connector/tests/guarded-ai.test.ts`
- `packages/vercel-connector/tests/streaming.test.ts`
- `packages/vercel-connector/examples/vercel-example/package.json`
- `packages/vercel-connector/examples/vercel-example/src/index.ts`

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-16 | Story created | System |

---

## Status

**Current**: ready-for-dev
**Last Updated**: 2026-02-16
