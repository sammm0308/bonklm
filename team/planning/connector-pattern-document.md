# Connector Pattern Documentation

**Epic**: E004 - Connector Packages Review
**Story**: S004-001 - Connector Pattern Extraction & Validation
**Date**: 2026-02-21
**Status**: Complete

## Index

| Section | Description | Location |
|---------|-------------|----------|
| 1 | Overview | [#Overview](#overview) |
| 2 | Package Structure | [#Package-Structure](#package-structure) |
| 3 | Dependencies Pattern | [#Dependencies-Pattern](#dependencies-pattern) |
| 4 | Export Patterns | [#Export-Patterns](#export-patterns) |
| 5 | Adapter Implementation | [#Adapter-Implementation](#adapter-implementation) |
| 6 | Configuration Options | [#Configuration-Options](#configuration-options) |
| 7 | Validation Approach | [#Validation-Approach](#validation-approach) |
| 8 | Error Handling | [#Error-Handling](#error-handling) |
| 9 | Testing Patterns | [#Testing-Patterns](#testing-patterns) |
| 10 | Connector Template | [#Connector-Template](#connector-template) |
| 11 | Common Deviations | [#Common-Deviations](#common-deviations) |

---

## Overview

This document extracts and documents the common patterns used across BonkLM connector packages based on analysis of 5 representative connectors:
- **OpenAI** (`@blackunicorn/bonklm-openai`)
- **Anthropic** (`@blackunicorn/bonklm-anthropic`)
- **Ollama** (`@blackunicorn/bonklm-ollama`)
- **HuggingFace** (`@blackunicorn/bonklm-huggingface`)
- **LangChain** (`@blackunicorn/bonklm-langchain`)

All connectors follow a consistent **Wrapper Pattern** that adds security guardrails to existing SDKs without breaking API compatibility.

---

## Package Structure

### Standard Directory Layout

```
packages/{name}-connector/
├── package.json              # Package manifest
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Test configuration
├── src/
│   ├── index.ts              # Main entry point (re-exports)
│   ├── types.ts              # Type definitions
│   └── guarded-{name}.ts     # Core implementation
├── tests/
│   └── guarded-{name}.test.ts # Test suite
└── README.md                 # Documentation
```

### File Purposes

| File | Purpose |
|------|---------|
| `src/index.ts` | Barrel exports for public API |
| `src/types.ts` | All TypeScript interfaces, types, constants |
| `src/guarded-{name}.ts` | Main implementation with validation logic |
| `tests/` | Comprehensive test suite with Vitest |

---

## Dependencies Pattern

### Consistent Structure Across All Connectors

```json
{
  "name": "@blackunicorn/bonklm-{connector}",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@blackunicorn/bonklm": "workspace:*"
  },
  "peerDependencies": {
    "{sdk-package}": "^{version}"
  }
}
```

### Key Principles

1. **Single Core Dependency**: All connectors depend only on `@blackunicorn/bonklm`
2. **Peer Dependencies**: The wrapped SDK is always a peer dependency
3. **No Runtime Dependencies**: Connectors are pure wrappers with no additional runtime deps
4. **Dev Dependencies Only**: TypeScript, Vitest, and the SDK for testing

### Example Dependencies

| Connector | Peer Dependency | Version |
|-----------|-----------------|---------|
| OpenAI | `openai` | `^4.0.0` |
| Anthropic | `@anthropic-ai/sdk` | `^0.28.0` |
| Ollama | `ollama` | `^0.6.0` |
| HuggingFace | `@huggingface/inference` | `^2.0.0` |
| LangChain | `@langchain/core` | `^0.3.0` |

---

## Export Patterns

### Standard Export Structure

```typescript
// Main entry point (src/index.ts)

// Factory function
export { createGuarded{Name} } from './guarded-{name}.js';

// Utility function
export { messagesToText, inputToText } from './guarded-{name}.js';

// Types
export type {
  Guarded{Name}Options,
  Guarded{Method}Options,
  GuardedResult,
} from './types.js';

// Error classes
export { StreamValidationError, GuardrailViolationError } from './types.js';

// Constants
export {
  VALIDATION_INTERVAL,
  DEFAULT_MAX_BUFFER_SIZE,
  DEFAULT_VALIDATION_TIMEOUT,
} from './types.js';
```

### Export Principles

1. **Named exports only** - No default exports for better tree-shaking
2. **Type exports separate** - Types exported alongside implementations
3. **Utility functions exported** - Content extraction functions are public
4. **Constants exported** - Validation defaults are configurable
5. **Error classes exported** - Custom errors for type narrowing

---

## Adapter Implementation

### Wrapper Pattern (OpenAI, Anthropic, Ollama)

```typescript
export function createGuarded{Name}(
  client: OriginalClient,
  options: GuardedOptions = {},
): ModifiedClient {
  const engine = new GuardrailEngine({
    validators: options.validators ?? [],
    guards: options.guards ?? [],
    logger: options.logger ?? DEFAULT_LOGGER,
  });

  // Create wrapper using Object.create
  const guardedClient = Object.create(client);

  // Replace specific methods
  guardedClient.{api} = {
    ...client.{api},
    {method}: async (opts) => {
      // 1. Validate input
      await validateInput(opts);

      // 2. Call original API
      const response = await client.{api}.{method}(opts);

      // 3. Validate output
      return validateOutput(response);
    },
  };

  return guardedClient;
}
```

### Proxy Pattern (HuggingFace)

```typescript
export function createGuarded{Name}(client: OriginalClient, options = {}) {
  return new Proxy(client, {
    get(target, prop) {
      // Intercept specific methods
      if (['textGeneration', 'questionAnswer', 'summarization', 'translation'].includes(prop)) {
        return async (options) => {
          await validateInput(options);
          const result = await target[prop](options);
          return validateOutput(result);
        };
      }
      // Pass through other properties
      return Reflect.get(target, prop);
    },
  });
}
```

### Callback Handler Pattern (LangChain)

```typescript
export class GuardrailsCallbackHandler extends BaseCallbackHandler {
  name = 'guardrails_handler';
  awaitHandlers = true;

  constructor(options: GuardrailsCallbackHandlerOptions) {
    super();
    this.engine = new GuardrailEngine(options);
  }

  async handleLLMStart(params: { prompts: string[] }) {
    for (const prompt of params.prompts) {
      const results = await this.engine.validate(prompt, 'input');
      if (results.some(r => !r.allowed)) {
        throw new GuardrailViolationError('Input blocked');
      }
    }
  }

  async handleLLMEnd(output: { generations: any[] }) {
    // Validate outputs
  }
}
```

---

## Configuration Options

### Standard Options Interface

```typescript
interface Guarded{Name}Options {
  // Core validation
  validators?: Validator[];
  guards?: Guard[];

  // Logging
  logger?: Logger;

  // Streaming validation
  validateStreaming?: boolean;
  streamingMode?: 'incremental' | 'buffer';
  maxStreamBufferSize?: number;
  validationInterval?: number;

  // Error handling
  productionMode?: boolean;
  validationTimeout?: number;

  // Callbacks
  onBlocked?: (result: GuardrailResult) => void;
  onStreamBlocked?: (accumulated: string) => void;

  // Observability (Anthropic only)
  telemetry?: TelemetryService;
  circuitBreaker?: CircuitBreaker;

  // Retry (Anthropic only)
  enableRetry?: boolean;
  maxRetries?: number;
}
```

### Default Values

| Option | Default | Purpose |
|--------|---------|---------|
| `validators` | `[]` | No input/output validation by default |
| `guards` | `[]` | No content filtering by default |
| `logger` | `createLogger('console')` | Console logging |
| `validateStreaming` | `false` | Streaming validation disabled |
| `streamingMode` | `'incremental'` | Validate every N chunks |
| `maxStreamBufferSize` | `1048576` | 1MB buffer limit |
| `validationTimeout` | `30000` | 30 second timeout |
| `productionMode` | `process.env.NODE_ENV === 'production'` | Auto-detect |
| `validationInterval` | `10` | Validate every 10 chunks |

---

## Validation Approach

### Multi-Layer Strategy

#### 1. Input Validation (Blocking)
- **When**: Before API call
- **Behavior**: Throws error on violation
- **Rationale**: Prevent malicious content from reaching API

```typescript
const validateInput = async (content: string) => {
  const results = await engine.validate(content, 'input');
  const blocked = results.find(r => !r.allowed);
  if (blocked) {
    throw new Error(
      productionMode ? 'Content blocked' : `Content blocked: ${blocked.reason}`
    );
  }
};
```

#### 2. Output Validation (Filtering)
- **When**: After API response
- **Behavior**: Returns filtered content instead of throwing
- **Rationale**: API cost already incurred, provide partial result

```typescript
const validateOutput = async (content: string, original: Response) => {
  const results = await engine.validate(content, 'output');
  const blocked = results.find(r => !r.allowed);
  if (blocked) {
    return {
      ...original,
      content: productionMode
        ? '[Content filtered by guardrails]'
        : `[Content filtered: ${blocked.reason}]`,
      filtered: true,
      raw: original,
    };
  }
  return original;
};
```

#### 3. Streaming Validation (Early Termination)
- **When**: During stream generation
- **Behavior**: Terminates stream on violation
- **Features**:
  - Buffer size enforcement (DoS protection)
  - Incremental validation every N chunks
  - Final validation on completion

```typescript
async function* createIncrementalValidatedStream(stream, validateFn, maxSize) {
  let accumulated = '';
  let counter = 0;

  for await (const chunk of stream) {
    // Check buffer size BEFORE accumulating
    if (accumulated.length + chunk.length > maxSize) {
      throw new StreamValidationError('Buffer exceeded');
    }

    accumulated += chunk;
    counter++;

    // Validate every VALIDATION_INTERVAL chunks
    if (counter % VALIDATION_INTERVAL === 0) {
      const results = await validateFn(accumulated, 'output');
      if (results.some(r => !r.allowed)) {
        yield { done: true, reason: 'guardrail_blocked' };
        return;
      }
    }

    yield chunk;
  }

  // Final validation
  if (accumulated.length > 0) {
    const results = await validateFn(accumulated, 'output');
    if (results.some(r => !r.allowed)) {
      yield { warning: 'Post-stream validation failed' };
    }
  }
}
```

---

## Error Handling

### Production Mode Handling

```typescript
// Development mode: detailed errors
throw new Error(`Content blocked: ${blocked.reason} (${blocked.findings.map(f => f.category).join(', ')})`);

// Production mode: generic error
throw new Error('Content blocked');
```

### Timeout Protection

```typescript
const validateWithTimeout = async (content: string, context?: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), validationTimeout);

  try {
    const result = await engine.validate(content, context);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return [createResult(false, Severity.CRITICAL, [{ category: 'timeout' }])];
    }
    throw error;
  }
};
```

### Custom Error Classes

```typescript
export class StreamValidationError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly blocked: boolean = true,
  ) {
    super(message);
    this.name = 'StreamValidationError';
  }
}

export class GuardrailViolationError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly findings: Finding[] = [],
  ) {
    super(message);
    this.name = 'GuardrailViolationError';
  }
}
```

---

## Testing Patterns

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    timeout: 30000,
  },
});
```

### Test Categories

1. **Basic Functionality**
   - Wrapper creation
   - Method preservation
   - Configuration options

2. **Input Validation**
   - Blocking malicious content
   - Allowing safe content
   - Production vs development mode

3. **Output Validation**
   - Filtering responses
   - Preserving metadata
   - Raw result attachment

4. **Streaming Validation**
   - Incremental validation
   - Buffer size limits
   - Early termination
   - Final validation

5. **Edge Cases**
   - Empty inputs
   - Special characters
   - Unicode content
   - Large inputs

6. **Error Handling**
   - Timeouts
   - Network errors
   - Stream interruptions

### Mock Utilities Pattern

```typescript
function createMockClient(response: any) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(response),
      },
    },
  };
}

function createBlockingValidator(blockWord: string) {
  return {
    name: `${blockWord}Validator`,
    validate: vi.fn((content: string) => ({
      allowed: !content.toLowerCase().includes(blockWord),
      reason: blockWord ? `Contains "${blockWord}"` : 'Allowed',
      findings: [],
      risk_score: blockWord ? 100 : 0,
    })),
  };
}
```

---

## Connector Template

Below is a template for creating new connectors following the established patterns.

### src/types.ts

```typescript
import type { Logger, Validator, Guard, GuardrailResult } from '@blackunicorn/bonklm';

// Constants
export const VALIDATION_INTERVAL = 10;
export const DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024; // 1MB
export const DEFAULT_VALIDATION_TIMEOUT = 30000; // 30 seconds

// Options
export interface Guarded{Client}Options {
  validators?: Validator[];
  guards?: Guard[];
  logger?: Logger;
  validateStreaming?: boolean;
  streamingMode?: 'incremental' | 'buffer';
  maxStreamBufferSize?: number;
  productionMode?: boolean;
  validationTimeout?: number;
  onBlocked?: (result: GuardrailResult) => void;
  onStreamBlocked?: (accumulated: string) => void;
}

// Method options
export interface Guarded{Method}Options extends OriginalMethodOptions {
  // No additional options - use original types
}

// Results
export interface Guarded{Method}Result extends OriginalResult {
  filtered?: boolean;
  raw?: OriginalResult;
}

// Error
export class StreamValidationError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly blocked: boolean = true,
  ) {
    super(message);
    this.name = 'StreamValidationError';
  }
}
```

### src/guarded-{client}.ts

```typescript
import {
  GuardrailEngine,
  createLogger,
  Severity,
  createResult,
  type Logger,
  type EngineResult,
} from '@blackunicorn/bonklm';
import type { OriginalClient } from '{sdk}';
import type {
  Guarded{Client}Options,
  Guarded{Method}Options,
  Guarded{Method}Result,
} from './types.js';
import {
  VALIDATION_INTERVAL,
  DEFAULT_MAX_BUFFER_SIZE,
  DEFAULT_VALIDATION_TIMEOUT,
  StreamValidationError,
} from './types.js';

const DEFAULT_LOGGER: Logger = createLogger('console');

function validatePositiveNumber(value: number, optionName: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(
      `${optionName} must be a positive number. Received: ${value}`
    );
  }
}

export function createGuarded{Client}(
  client: OriginalClient,
  options: Guarded{Client}Options = {},
): OriginalClient {
  const {
    validators = [],
    guards = [],
    logger = DEFAULT_LOGGER,
    validateStreaming = false,
    streamingMode = 'incremental',
    maxStreamBufferSize = DEFAULT_MAX_BUFFER_SIZE,
    productionMode = process.env.NODE_ENV === 'production',
    validationTimeout = DEFAULT_VALIDATION_TIMEOUT,
    onBlocked,
    onStreamBlocked,
  } = options;

  validatePositiveNumber(maxStreamBufferSize, 'maxStreamBufferSize');
  validatePositiveNumber(validationTimeout, 'validationTimeout');

  const engine = new GuardrailEngine({ validators, guards, logger });

  const validateWithTimeout = async (
    content: string,
    context?: string,
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), validationTimeout);

    try {
      const engineResult = await engine.validate(content, context);
      clearTimeout(timeoutId);

      if ('results' in engineResult) {
        return (engineResult as EngineResult).results || [engineResult as any];
      }
      return [engineResult as any];
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('[Guardrails] Validation timeout');
        return [
          createResult(false, Severity.CRITICAL, [
            { category: 'timeout', description: 'Validation timeout', severity: Severity.CRITICAL, weight: 30 }
          ])
        ];
      }
      throw error;
    } finally {
      controller.signal.removeEventListener('abort', () => {});
    }
  };

  const validateInput = async (content: string): Promise<void> => {
    const results = await validateWithTimeout(content, 'input');
    const blocked = results.find((r: any) => !r.allowed);
    if (blocked) {
      logger.warn('[Guardrails] Input blocked', { reason: blocked.reason });
      if (onBlocked) onBlocked(blocked);

      if (productionMode) {
        throw new Error('Content blocked');
      }
      throw new Error(`Content blocked: ${blocked.reason}`);
    }
  };

  const guardedClient = Object.create(client);

  // Override the main method
  guardedClient.{method} = async (opts: Guarded{Method}Options) => {
    // Validate input
    await validateInput(extractContent(opts));

    // Call original API
    const response = await client.{method}(opts);

    // Validate output
    const outputContent = extractResponseContent(response);
    if (outputContent) {
      const results = await validateWithTimeout(outputContent, 'output');
      const blocked = results.find((r: any) => !r.allowed);

      if (blocked) {
        logger.warn('[Guardrails] Output blocked', { reason: blocked.reason });
        if (onBlocked) onBlocked(blocked);

        return {
          ...response,
          content: productionMode
            ? '[Content filtered by guardrails]'
            : `[Content filtered: ${blocked.reason}]`,
          filtered: true,
          raw: response,
        } as Guarded{Method}Result;
      }
    }

    return response;
  };

  return guardedClient;
}

function extractContent(opts: Guarded{Method}Options): string {
  // Extract text from request options
  return '';
}

function extractResponseContent(response: any): string {
  // Extract text from response
  return response?.content || '';
}
```

### src/index.ts

```typescript
export { createGuarded{Client} } from './guarded-{client}.js';
export type {
  Guarded{Client}Options,
  Guarded{Method}Options,
  Guarded{Method}Result,
} from './types.js';
export { StreamValidationError } from './types.js';
export {
  VALIDATION_INTERVAL,
  DEFAULT_MAX_BUFFER_SIZE,
  DEFAULT_VALIDATION_TIMEOUT,
} from './types.js';
```

---

## Common Deviations

### Identified Deviations Across Connectors

| Connector | Deviation | Notes |
|-----------|-----------|-------|
| **Anthropic** | Extended options: `telemetry`, `circuitBreaker`, `enableRetry`, `maxRetries` | Advanced observability features |
| **LangChain** | Class-based handler extending `BaseCallbackHandler` | Framework-specific pattern |
| **HuggingFace** | Proxy pattern instead of Object.create | Clean method interception |
| **HuggingFace** | `allowedModels` whitelist option | Model validation feature |
| **Ollama** | Wraps two methods: `chat` and `generate` | Multi-method support |
| **Ollama** | Separate stream generators for chat/generate | Method-specific streaming |
| **OpenAI** | Minimal options | Reference implementation |

### Validation of Remaining Connectors

The following 10 connectors need validation against these patterns:
1. chroma-connector
2. copilotkit-connector
3. genkit-connector
4. llamaindex-connector
5. mastra-connector
6. mcp-connector
7. pinecone-connector
8. qdrant-connector
9. vercel-connector
10. weaviate-connector

---

## Next Steps

1. **Story 4.2**: Review Group 1 connectors (chroma, copilotkit, genkit, huggingface, langchain)
2. **Story 4.3**: Review Group 2 connectors (llamaindex, mastra, mcp, ollama, pinecone)
3. **Story 4.4**: Review Group 3 connectors (qdrant, vercel, weaviate, anthropic, openai)
4. **Story 4.5**: Verify connector test coverage

---

*End of Connector Pattern Documentation*
