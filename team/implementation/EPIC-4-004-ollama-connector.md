# Story 4.4: Ollama Connector

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/implementations/ollama.ts`

## Story

As a connector developer,
I want to define the Ollama connector with detection, testing, and code generation,
so that users can configure local Ollama for guardrails validation.

## Acceptance Criteria

1. ConnectorDefinition for Ollama
2. Detection: localhost:11434 port
3. Test: GET /api/tags endpoint
4. Generate snippet: connector usage code
5. Config schema: Zod validation
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create ollamaConnector definition (AC: 1)
  - [ ] id: 'ollama'
  - [ ] name: 'Ollama'
  - [ ] category: 'llm'
- [ ] Define detection rules (AC: 2)
  - [ ] ports: [11434]
  - [ ] No API key needed (local service)
- [ ] Implement test function (AC: 3)
  - [ ] Test Ollama API endpoint
  - [ ] testEndpoint: 'http://localhost:11434/api/tags'
  - [ ] method: 'GET'
  - [ ] sendInHeader: false
  - [ ] timeout: 2000 (local, should be fast)
  - [ ] Return TestResult
  - [ ] Handle connection refused (Ollama not running)
- [ ] Implement generateSnippet function (AC: 4)
  - [ ] Generate usage code snippet
  - [ ] Use @blackunicorn/bonklm package syntax
  - [ ] Include baseUrl parameter (default: localhost:11434)
- [ ] Define config schema (AC: 5)
  - [ ] Use Zod
  - [ ] baseUrl: z.string().url().optional()
  - [ ] Default: 'http://localhost:11434'
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

export const ollamaConnector: ConnectorDefinition = {
  id: 'ollama',
  name: 'Ollama',
  category: 'llm',
  detection: {
    ports: [11434],
  },

  test: async (config) => {
    const baseUrl = config.baseUrl || 'http://localhost:11434';

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      return {
        connection: response.ok,
        validation: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        connection: false,
        validation: false,
        error: (error as Error).message,
      };
    }
  },

  generateSnippet: (config) => `
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { ollamaConnector } from '@blackunicorn/bonklm/ollama-connector';

const engine = new GuardrailEngine({
  connectors: [
    ollamaConnector({
      baseUrl: '${config.baseUrl || 'http://localhost:11434'}',
    }),
  ],
});
  `.trim(),

  configSchema: z.object({
    baseUrl: z.string().url().optional(),
  }),
};
```

### Ollama API

Ollama exposes a REST API on `http://localhost:11434`:
- `/api/tags` - List available models
- `/api/generate` - Generate completion
- `/api/chat` - Chat completion

**Why `/api/tags`?**
- Lightweight endpoint
- No side effects
- Validates Ollama is running
- Returns model list (useful for user feedback)

### Detection Strategy

Ollama is detected by port checking (from EPIC-3-002):
- Port 11434 open → Ollama is running
- Port 11434 closed → Ollama not available

### Config Schema

```typescript
z.object({
  baseUrl: z.string().url().optional(),
})
```

The `baseUrl` is optional because:
- Default is `http://localhost:11434`
- Custom URLs for remote Ollama instances

### Code Snippet

```typescript
import { ollamaConnector } from '@blackunicorn/bonklm/ollama-connector';

const connector = ollamaConnector({
  baseUrl: 'http://localhost:11434', // Optional
});
```

### No API Key

Ollama is a local service and doesn't require authentication:
- No `envVars` in detection
- No credential collection needed
- Simplified UX for users

### Error Handling

Common Ollama errors:
- `ECONNREFUSED` - Ollama not running
- Timeout - Ollama not responding
- Invalid URL - Misconfigured baseUrl

### Test Strategy

- Mock fetch for successful response
- Mock fetch for connection refused
- Test with custom baseUrl
- Test snippet generation
- Verify default baseUrl is used

### Extensions for Future

- Model selection (llama2, mistral, etc.)
- Timeout configuration
- SSL/TLS for remote Ollama

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)
- Service Detection: [working-document.md#L482-L580](../working-document.md#L482-L580)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
