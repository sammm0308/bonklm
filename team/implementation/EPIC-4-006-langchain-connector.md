# Story 4.6: LangChain Connector

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/implementations/langchain.ts`

## Story

As a connector developer,
I want to define the LangChain connector with detection and code generation,
so that users can integrate guardrails with LangChain applications.

## Acceptance Criteria

1. ConnectorDefinition for LangChain
2. Detection: langchain in package.json
3. Test: No external test (framework detection only)
4. Generate snippet: LangChain integration code
5. Config schema: Zod validation
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create langchainConnector definition (AC: 1)
  - [ ] id: 'langchain'
  - [ ] name: 'LangChain'
  - [ ] category: 'framework'
- [ ] Define detection rules (AC: 2)
  - [ ] packageJson: ['langchain', '@langchain/core']
  - [ ] No envVars (framework connector)
- [ ] Implement test function (AC: 3)
  - [ ] Return pre-determined success
  - [ ] TestResult: { connection: true, validation: true }
- [ ] Implement generateSnippet function (AC: 4)
  - [ ] Generate LangChain integration code
  - [ ] Show custom chain/validator integration
  - [ ] Include GuardrailEngine setup
- [ ] Define config schema (AC: 5)
  - [ ] Use Zod
  - [ ] Optional configuration for chain behavior
- [ ] Create unit tests (AC: 6)
  - [ ] Test connector definition structure
  - [ ] Test generateSnippet output
  - [ ] Test config schema validation
  - [ ] Achieve 90% coverage

## Dev Notes

### Connector Implementation

```typescript
import type { ConnectorDefinition } from '../base.js';
import { z } from 'zod';

export const langchainConnector: ConnectorDefinition = {
  id: 'langchain',
  name: 'LangChain',
  category: 'framework',
  detection: {
    packageJson: ['langchain', '@langchain/core'],
  },

  test: async (_config) => {
    // Framework connectors don't need external testing
    return {
      connection: true,
      validation: true,
    };
  },

  generateSnippet: (config) => `
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

const guardrails = new GuardrailEngine({
  validators: [
    // ... your validators
  ],
});

// Create a LangChain callback handler
class GuardrailCallbackHandler extends BaseCallbackHandler {
  name = 'guardrail-handler';

  async handleLLMStart(llm: string, prompts: string[]) {
    for (const prompt of prompts) {
      const result = await guardrails.validate(prompt);
      if (result.flagged) {
        throw new Error(\`Content flagged: \${result.reason}\`);
      }
    }
  }
}

// Use with your LangChain chain
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from '@langchain/chains';

const llm = new ChatOpenAI({
  callbacks: [new GuardrailCallbackHandler()],
});

const chain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate('Tell me a joke about {topic}'),
});
  `.trim(),

  configSchema: z.object({
    blockOnFlag: z.boolean().optional(),
  }),
};
```

### LangChain Integration Pattern

LangChain integration uses **Callback Handlers**:
- Extend `BaseCallbackHandler`
- Override lifecycle methods
- Call guardrails in appropriate methods

### Callback Handler Hooks

| Hook | Use Case |
|------|----------|
| `handleLLMStart` | Validate prompts before sending to LLM |
| `handleLLMEnd` | Validate LLM responses |
| `handleLLMError` | Handle errors |
| `handleChainStart` | Validate chain inputs |
| `handleChainEnd` | Validate chain outputs |

### Code Snippet Components

1. **GuardrailEngine setup** - Configure validators
2. **Callback handler class** - Extend BaseCallbackHandler
3. **Integration example** - Show usage with Chain/LLM
4. **Error handling** - Show how flagged content is handled

### Detection Strategy

Detect both legacy and new LangChain packages:
- `langchain` - Legacy package (Python-style)
- `@langchain/core` - New modular package

### Config Schema

```typescript
z.object({
  blockOnFlag: z.boolean().optional(),
})
```

Options:
- `blockOnFlag` - Throw error when content is flagged (optional)

### Alternative Integration: Runnable

LangChain also supports the `Runnable` interface:

```typescript
import { RunnableLambda } from '@langchain/core/runnables';

const guardrailLambda = RunnableLambda.from(async (input: string) => {
  const result = await guardrails.validate(input);
  if (result.flagged) {
    throw new Error(\`Flagged: \${result.reason}\`);
  }
  return input;
});

const chain = guardrailLambda.pipe(llm).chain(parser);
```

### Test Strategy

- Test snippet generation produces valid LangChain code
- Test config schema validation
- Test detection rules match package.json
- No external API mocking needed

### Extensions for Future

- Streaming support
- Multiple validators per hook
- Custom error messages
- Metrics/logging integration

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
