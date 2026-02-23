# Story 4.3: Anthropic Connector

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/implementations/anthropic.ts`

## Story

As a connector developer,
I want to define the Anthropic connector with detection, testing, and code generation,
so that users can configure Anthropic Claude for guardrails validation.

## Acceptance Criteria

1. ConnectorDefinition for Anthropic
2. Detection: ANTHROPIC_API_KEY env var
3. Test: GET /v1/models endpoint
4. Generate snippet: connector usage code
5. Config schema: Zod validation (sk-ant- prefix)
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create anthropicConnector definition (AC: 1)
  - [ ] id: 'anthropic'
  - [ ] name: 'Anthropic'
  - [ ] category: 'llm'
- [ ] Define detection rules (AC: 2)
  - [ ] envVars: ['ANTHROPIC_API_KEY']
  - [ ] packageJson: ['@anthropic-ai/sdk'] (optional)
- [ ] Implement test function (AC: 3)
  - [ ] Use validateApiKeySecure from utils/validation.ts
  - [ ] Configure for Anthropic endpoint
  - [ ] testEndpoint: 'https://api.anthropic.com/v1/models'
  - [ ] method: 'GET' or 'HEAD' (check API docs)
  - [ ] sendInHeader: true (x-api-key header)
  - [ ] timeout: 5000
  - [ ] Return TestResult
- [ ] Implement generateSnippet function (AC: 4)
  - [ ] Generate usage code snippet
  - [ ] Use @blackunicorn/bonklm package syntax
  - [ ] Include apiKey parameter
- [ ] Define config schema (AC: 5)
  - [ ] Use Zod
  - [ ] apiKey: z.string().startsWith('sk-ant-')
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

export const anthropicConnector: ConnectorDefinition = {
  id: 'anthropic',
  name: 'Anthropic',
  category: 'llm',
  detection: {
    envVars: ['ANTHROPIC_API_KEY'],
    packageJson: ['@anthropic-ai/sdk'],
  },

  test: async (config) => {
    const result = await validateApiKeySecure(config.apiKey, {
      method: 'GET',
      sendInHeader: true,
      testEndpoint: 'https://api.anthropic.com/v1/models',
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
import { anthropicConnector } from '@blackunicorn/bonklm/anthropic-connector';

const engine = new GuardrailEngine({
  connectors: [
    anthropicConnector({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
  ],
});
  `.trim(),

  configSchema: z.object({
    apiKey: z.string().startsWith('sk-ant-'),
  }),
};
```

### Anthropic API Key Format

Anthropic API keys use the `sk-ant-` prefix:
- Format: `sk-ant-api03-{...}`

**Note:** The exact key format may vary - check current Anthropic documentation.

### Authentication Header

Anthropic uses a custom header instead of Authorization:
```typescript
{
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01'
}
```

**For validation simplicity**, we may use a standard GET request with Authorization header and check for 401/403 vs 200.

### Test Endpoint

`https://api.anthropic.com/v1/models` - Lists available models.

Alternative: Use a minimal API call that validates the key.

### Code Snippet

```typescript
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { anthropicConnector } from '@blackunicorn/bonklm/anthropic-connector';

const engine = new GuardrailEngine({
  connectors: [
    anthropicConnector({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
  ],
});
```

### Config Schema

```typescript
z.object({
  apiKey: z.string().startsWith('sk-ant-'),
})
```

### Detection Rules

| Source | Pattern | Purpose |
|--------|---------|---------|
| envVars | `ANTHROPIC_API_KEY` | Pre-fill credential |
| packageJson | `@anthropic-ai/sdk` | Suggest if SDK installed |

### Test Strategy

- Mock fetch for successful/failed responses
- Test key format validation (sk-ant- prefix)
- Test snippet generation
- Verify no credential leakage

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
