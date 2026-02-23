# Story 2.2: ConnectorDefinition Interface

Status: ready-for-dev

**Epic:** EPIC-2 - Core Infrastructure
**Priority:** P1
**Dependency:** EPIC-1
**Points:** 3
**File:** `src/connectors/base.ts`

## Story

As a developer building the connector system,
I want well-defined TypeScript interfaces and types for connectors,
so that all connector implementations follow a consistent contract.

## Acceptance Criteria

1. ConnectorDefinition interface with all required fields
2. TestResult interface
3. ConnectorCategory type union
4. Zod schema export for validation
5. All tests pass with 100% coverage

## Tasks / Subtasks

- [ ] Define ConnectorCategory type (AC: 3)
  - [ ] Union type: 'llm' | 'framework' | 'vector-db'
  - [ ] Export as const
- [ ] Define DetectionRules interface (AC: 1)
  - [ ] packageJson?: string[]
  - [ ] envVars?: string[]
  - [ ] ports?: number[]
  - [ ] dockerContainers?: string[]
- [ ] Define TestResult interface (AC: 2)
  - [ ] connection: boolean
  - [ ] validation: boolean
  - [ ] error?: string
  - [ ] latency?: number
- [ ] Define ConnectorDefinition interface (AC: 1)
  - [ ] id: string
  - [ ] name: string
  - [ ] category: ConnectorCategory
  - [ ] detection: DetectionRules
  - [ ] test: (config) => Promise<TestResult>
  - [ ] generateSnippet: (config) => string
  - [ ] configSchema: z.ZodSchema
- [ ] Export Zod schemas (AC: 4)
  - [ ] ConnectorDefinitionSchema for validation
  - [ ] TestResultSchema
  - [ ] DetectionRulesSchema
- [ ] Create unit tests (AC: 5)
  - [ ] Test type validation
  - [ ] Test Zod schema validation
  - [ ] Test type exports
  - [ ] Achieve 100% coverage

## Dev Notes

### Interface Design

```typescript
// src/connectors/base.ts
import type { z } from 'zod';

export type ConnectorCategory = 'llm' | 'framework' | 'vector-db';

export interface DetectionRules {
  /** Dependencies to check in package.json */
  packageJson?: string[];

  /** Environment variables to check */
  envVars?: string[];

  /** Ports to check for running services */
  ports?: number[];

  /** Docker container names to check */
  dockerContainers?: string[];
}

export interface TestResult {
  /** API/service connection successful */
  connection: boolean;

  /** Guardrail validation successful */
  validation: boolean;

  /** Error message if failed */
  error?: string;

  /** Test duration in milliseconds */
  latency?: number;
}

export interface ConnectorDefinition {
  /** Unique identifier (e.g., 'openai', 'anthropic') */
  id: string;

  /** Display name (e.g., 'OpenAI', 'Anthropic') */
  name: string;

  /** Connector category */
  category: ConnectorCategory;

  /** Detection rules */
  detection: DetectionRules;

  /** Test connector configuration */
  test: (config: Record<string, string>) => Promise<TestResult>;

  /** Generate usage code snippet */
  generateSnippet: (config: Record<string, string>) => string;

  /** Zod schema for configuration validation */
  configSchema: z.ZodSchema;
}
```

### Zod Schemas

```typescript
import { z } from 'zod';

export const DetectionRulesSchema = z.object({
  packageJson: z.array(z.string()).optional(),
  envVars: z.array(z.string()).optional(),
  ports: z.array(z.number()).optional(),
  dockerContainers: z.array(z.string()).optional(),
});

export const TestResultSchema = z.object({
  connection: z.boolean(),
  validation: z.boolean(),
  error: z.string().optional(),
  latency: z.number().optional(),
});

export const ConnectorCategorySchema = z.enum(['llm', 'framework', 'vector-db']);

export const ConnectorDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ConnectorCategorySchema,
  detection: DetectionRulesSchema,
  test: z.function(),
  generateSnippet: z.function(),
  configSchema: z.any(),
});
```

### Usage Example

```typescript
// src/connectors/implementations/openai.ts
import type { ConnectorDefinition } from '../base.js';
import { z } from 'zod';

export const openaiConnector: ConnectorDefinition = {
  id: 'openai',
  name: 'OpenAI',
  category: 'llm',
  detection: {
    envVars: ['OPENAI_API_KEY'],
    packageJson: ['openai'],
  },
  test: async (config) => {
    // Validation logic
    return {
      connection: true,
      validation: true,
    };
  },
  generateSnippet: (config) => `
import { openaiConnector } from '@blackunicorn/bonklm/openai-connector';

const connector = openaiConnector({
  apiKey: process.env.OPENAI_API_KEY,
});
  `.trim(),
  configSchema: z.object({
    apiKey: z.string().startsWith('sk-'),
  }),
};
```

### Type-Only Imports

For type definitions, use type-only imports to avoid runtime imports:

```typescript
import type { ConnectorDefinition } from './base.js';
import type { z } from 'zod';
```

### File Location

```
packages/wizard/src/connectors/
├── base.ts                    # Interfaces and types
├── registry.ts                # Connector registry (next story)
└── implementations/           # Connector implementations
    ├── openai.ts
    ├── anthropic.ts
    └── ...
```

### Export Strategy

```typescript
// src/connectors/base.ts
export type { ConnectorDefinition, DetectionRules, TestResult };
export type { ConnectorCategory };

// Also export Zod schemas for validation
export { DetectionRulesSchema, TestResultSchema, ConnectorCategorySchema };
```

### Project Context Reference

- Architecture: [architecture.md#L310-L360](../planning-artifacts/architecture.md#L310-L360)
- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
