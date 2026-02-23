# Story 4.2: OpenAI Connector

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/implementations/openai.ts`

## Story

As a connector developer,
I want to define the OpenAI connector with detection, testing, and code generation,
so that users can configure OpenAI for guardrails validation.

## Acceptance Criteria

1. ConnectorDefinition for OpenAI
2. Detection: OPENAI_API_KEY env var
3. Test: GET /v1/models endpoint
4. Generate snippet: connector usage code
5. Config schema: Zod validation
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create openaiConnector definition (AC: 1)
  - [ ] id: 'openai'
  - [ ] name: 'OpenAI'
  - [ ] category: 'llm'
- [ ] Define detection rules (AC: 2)
  - [ ] envVars: ['OPENAI_API_KEY']
  - [ ] packageJson: ['openai'] (optional)
- [ ] Implement test function (AC: 3)
  - [ ] Use validateApiKeySecure from utils/validation.ts
  - [ ] Configure for OpenAI endpoint
  - [ ] testEndpoint: 'https://api.openai.com/v1/models'
  - [ ] method: 'GET'
  - [ ] sendInHeader: true
  - [ ] timeout: 5000
  - [ ] Return TestResult
- [ ] Implement generateSnippet function (AC: 4)
  - [ ] Generate usage code snippet
  - [ ] Use @blackunicorn/llm-guardrays package syntax
  - [ ] Include apiKey parameter
- [ ] Define config schema (AC: 5)
  - [ ] Use Zod
  - [ ] apiKey: z.string().startsWith('sk-')
- [ ] Create unit tests (AC: 6)
  - [ ] Test connector definition structure
  - [ ] Test with mocked fetch
  - [ ] Test generateSnippet output
  - [ ] Test config schema validation
  - [ ] Achieve 90% coverage

## Dev Notes

### Connector Implementation

```typescript
import type { ConnectorDefinition } from '../base.js';
import { z } from 'zod';
import { validateApiKeySecure } from '../../utils/validation.js';

export const openaiConnector: ConnectorDefinition = {
  id: 'openai',
  name: 'OpenAI',
  category: 'llm',
  detection: {
    envVars: ['OPENAI_API_KEY'],
    packageJson: ['openai'],
  },

  test: async (config) => {
    const result = await validateApiKeySecure(config.apiKey, {
      method: 'GET',
      sendInHeader: true,
      testEndpoint: 'https://api.openai.com/v1/models',
      timeout: 5000,
      logLevel: 'none',
    });

    return {
      connection: result,
      validation: result,
    };
  },

  generateSnippet: (config) => `
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { openaiConnector } from '@blackunicorn/bonklm/openai-connector';

const engine = new GuardrailEngine({
  connectors: [
    openaiConnector({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
});
  `.trim(),

  configSchema: z.object({
    apiKey: z.string().startsWith('sk-'),
  }),
};
```

### Code Snippet Format

The generated snippet should:
1. Use the correct package import
2. Show the connector factory function
3. Reference environment variable for API key
4. Be copy-paste ready

### Detection Rules

| Source | Pattern | Purpose |
|--------|---------|---------|
| envVars | `OPENAI_API_KEY` | Pre-fill credential |
| packageJson | `openai` | Suggest if package installed |

### Test Endpoint

`https://api.openai.com/v1/models` is ideal because:
- Requires authentication (validates API key)
- Lightweight response (list of models)
- No side effects
- Public endpoint (no special access)

### Config Schema

```typescript
z.object({
  apiKey: z.string().startsWith('sk-'),
})
```

Validates:
- Type is string
- Starts with 'sk-' prefix
- Zod provides detailed error messages

### Usage Example

```typescript
import { getConnector } from '../registry.js';

const openai = getConnector('openai');

// Test the connector
const result = await openai.test({ apiKey: 'sk-...' });
console.log(result);
// { connection: true, validation: true }

// Generate code snippet
const snippet = openai.generateSnippet({ apiKey: 'sk-...' });
console.log(snippet);
// "import { GuardrailEngine } ..."
```

### Test Strategy

- Mock `fetch()` or `validateApiKeySecure()`
- Test successful connection
- Test failed connection (invalid key)
- Test timeout scenario
- Test snippet generation
- Test Zod schema validation

### Extensions for Future

OpenAI connector could be enhanced with:
- Organization ID support
- Base URL for Azure OpenAI
- Model selection (gpt-4, gpt-3.5-turbo)

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)
- Secure Validation: [working-document.md#L335-L414](../working-document.md#L335-L414)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
