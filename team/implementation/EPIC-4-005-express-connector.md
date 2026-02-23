# Story 4.5: Express Framework Connector

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/implementations/express.ts`

## Story

As a connector developer,
I want to define the Express framework connector with detection and code generation,
so that users can add guardrails middleware to their Express apps.

## Acceptance Criteria

1. ConnectorDefinition for Express framework
2. Detection: express in package.json
3. Test: No external test (framework detection only)
4. Generate snippet: middleware usage code
5. Config schema: Zod validation
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Create expressConnector definition (AC: 1)
  - [ ] id: 'express'
  - [ ] name: 'Express'
  - [ ] category: 'framework'
- [ ] Define detection rules (AC: 2)
  - [ ] packageJson: ['express']
  - [ ] No envVars (framework connector)
  - [ ] No ports (framework connector)
- [ ] Implement test function (AC: 3)
  - [ ] Return pre-determined success (framework is detected)
  - [ ] Or skip test entirely for framework connectors
  - [ ] TestResult: { connection: true, validation: true }
- [ ] Implement generateSnippet function (AC: 4)
  - [ ] Generate middleware usage code
  - [ ] Show app.use() pattern
  - [ ] Include GuardrailEngine setup
  - [ ] Include error handler example
- [ ] Define config schema (AC: 5)
  - [ ] Use Zod
  - [ ] Optional configuration for middleware options
  - [ ] validateOnRequest: z.boolean().optional()
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

export const expressConnector: ConnectorDefinition = {
  id: 'express',
  name: 'Express',
  category: 'framework',
  detection: {
    packageJson: ['express'],
  },

  test: async (_config) => {
    // Framework connectors don't need external testing
    // If express is in package.json, it's available
    return {
      connection: true,
      validation: true,
    };
  },

  generateSnippet: (config) => `
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { expressMiddleware } from '@blackunicorn/bonklm/express-middleware';
import express from 'express';

const app = express();
const guardrails = new GuardrailEngine({
  // ... your configuration
});

// Add guardrails middleware
app.use(express.json());
app.use(expressMiddleware(guardrails));

// Your routes
app.post('/api/chat', async (req, res) => {
  const result = await guardrails.validate(req.body.message);
  if (result.flagged) {
    return res.status(400).json({ error: 'Content flagged' });
  }
  // ... handle request
});

app.listen(3000);
  `.trim(),

  configSchema: z.object({
    validateOnRequest: z.boolean().optional(),
  }),
};
```

### Framework Connector Pattern

Framework connectors differ from LLM connectors:
- **Detection:** Via package.json only
- **Testing:** No external API calls
- **Configuration:** Middleware options
- **Output:** Code snippets for integration

### Code Snippet

The generated snippet should:
1. Show Express app setup
2. Import guardrails middleware
3. Demonstrate middleware usage
4. Show a protected route example
5. Include error handling

### Config Schema

```typescript
z.object({
  validateOnRequest: z.boolean().optional(),
})
```

Options:
- `validateOnRequest` - Auto-validate every request (optional)

### Detection Strategy

From EPIC-3-001 (Framework Detection):
```typescript
if (pkg.dependencies?.express || pkg.devDependencies?.express) {
  detected.push({ name: 'express', version: pkg.dependencies.express });
}
```

### Middleware Pattern

```typescript
app.use(expressMiddleware(guardrails));

// Or with options
app.use(expressMiddleware(guardrails, {
  validateOnRequest: true,
}));
```

### Integration Example

```typescript
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { expressMiddleware } from '@blackunicorn/bonklm/express-middleware';

const guardrails = new GuardrailEngine({
  validators: [
    new PromptInjectionValidator(),
    new PIIGuard(),
  ],
});

app.use('/api', expressMiddleware(guardrails));
```

### Test Strategy

- Test snippet generation produces valid code
- Test config schema validation
- Test detection rules match package.json
- No need for external API mocking

### Extensions for Future

- Route-specific middleware
- Custom error responses
- Request/response logging
- Validation result headers

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
