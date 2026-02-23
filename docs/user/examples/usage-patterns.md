# Usage Examples and Patterns

This guide provides practical examples for common BonkLM usage patterns.

## Table of Contents

1. [Basic Validation](#basic-validation)
2. [Express Middleware](#express-middleware)
3. [Streaming LLM Responses](#streaming-llm-responses)
4. [RAG Applications](#rag-applications)
5. [Tool/Function Calling](#toolfunction-calling)
6. [Multi-Validator Setup](#multi-validator-setup)
7. [Custom Error Handling](#custom-error-handling)
8. [Production Deployment](#production-deployment)

---

## Basic Validation

### Single Validator

```typescript
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const validator = new PromptInjectionValidator();
const result = validator.validate(userInput);

if (!result.allowed) {
  console.log('Blocked:', result.reason);
  return;
}

// Process safe input
processInput(userInput);
```

### Quick Validation Function

```typescript
import { validatePromptInjection } from '@blackunicorn/bonklm';

const result = validatePromptInjection(userInput);

if (!result.allowed) {
  return { error: 'Invalid input', reason: result.reason };
}

return { success: true };
```

---

## Express Middleware

### AI Endpoint Protection

```typescript
import express from 'express';
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const app = express();
app.use(express.json());

// Protect AI endpoints
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [
    new PromptInjectionValidator({ sensitivity: 'strict' }),
    new JailbreakValidator(),
  ],
  validateRequest: true,
  validateResponse: false,
  productionMode: process.env.NODE_ENV === 'production',
  validationTimeout: 5000,
  maxContentLength: 1024 * 1024,  // 1MB
  onError: (result, req, res) => {
    res.status(400).json({
      error: 'Content blocked by safety guardrails',
    });
  },
}));

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  const response = await callLLM(message);
  res.json({ response });
});

app.listen(3000);
```

### Path-Specific Protection

```typescript
// Only protect specific paths
app.use('/api/sensitive', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()],
}));

// Exclude health endpoints
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()],
  excludePaths: ['/api/ai/health', '/api/ai/status'],
}));
```

---

## Streaming LLM Responses

### OpenAI Streaming

```typescript
import OpenAI from 'openai';
import { createGuardedOpenAI } from '@blackunicorn/bonklm-openai';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const openai = new OpenAI();
const guardedOpenAI = createGuardedOpenAI(openai, {
  validators: [new PromptInjectionValidator()],
  validateStreaming: true,
  streamingMode: 'incremental',
  onStreamBlocked: (accumulated) => {
    console.log('Stream blocked after:', accumulated.length, 'chars');
  },
});

async function chatWithStreaming(userInput: string) {
  try {
    const stream = await guardedOpenAI.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: userInput }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
    }
  } catch (error) {
    if (error instanceof StreamValidationError) {
      console.error('Stream blocked:', error.message);
    }
  }
}
```

### Custom Streaming Validator

```typescript
import { StreamingValidator } from '@blackunicorn/bonklm/examples/streaming';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const validator = new StreamingValidator(
  [
    new PromptInjectionValidator(),
    new JailbreakValidator(),
  ],
  [],
  {
    validateEveryNChunks: 5,
    streamingMode: 'incremental',
  }
);

async function processStream(stream: AsyncIterable<string>) {
  const chunks: string[] = [];

  for await (const chunk of stream) {
    const { shouldTerminate, result } = await validator.processChunk(chunk);

    if (shouldTerminate) {
      console.log('Stream terminated:', result?.reason);
      break;
    }

    chunks.push(chunk);
    process.stdout.write(chunk);
  }

  return chunks.join('');
}
```

---

## RAG Applications

### LlamaIndex Query Engine

```typescript
import { createGuardedQueryEngine } from '@blackunicorn/bonklm-llamaindex';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardedEngine = createGuardedQueryEngine(queryEngine, {
  validators: [new PromptInjectionValidator()],
  validateQueryInput: true,
  validateQueryOutput: true,
  onQueryBlocked: (result) => {
    console.log('Query blocked:', result.reason);
  },
});

async function askQuestion(question: string) {
  const response = await guardedEngine.query({ query: question });
  return response;
}
```

### Vector Store with Pinecone

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { createGuardedIndex } from '@blackunicorn/bonklm-pinecone';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const pinecone = new Pinecone();
const index = pinecone.index('documents');

const guardedIndex = createGuardedIndex(index, {
  validators: [new PromptInjectionValidator()],
  allowedNamespaces: ['public', 'verified'],
  validateFilters: true,
});

async function searchDocuments(queryVector: number[]) {
  const results = await guardedIndex.query({
    vector: queryVector,
    topK: 10,
    filter: { category: { $eq: 'article' } },
  });
  return results;
}
```

---

## Tool/Function Calling

### OpenAI Tool Calls

```typescript
import { createGuardedOpenAI } from '@blackunicorn/bonklm-openai';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardedOpenAI = createGuardedOpenAI(openai, {
  validators: [new PromptInjectionValidator()],
  allowedTools: ['search', 'calculator', 'weather'],
  maxToolArgumentSize: 100 * 1024,  // 100KB
});

async function callTool(userInput: string) {
  const response = await guardedOpenAI.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: userInput }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'search',
          description: 'Search the web',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
          },
        },
      },
    ],
  });

  // Tool calls are validated before execution
  const toolCalls = response.choices[0]?.message.tool_calls;
  return toolCalls;
}
```

---

## Multi-Validator Setup

### Comprehensive Protection

```typescript
import {
  GuardrailEngine,
  PromptInjectionValidator,
  JailbreakValidator,
  ReformulationDetector,
  BoundaryDetector,
} from '@blackunicorn/bonklm';
import { SecretGuard, PIIGuard, BashSafetyGuard } from '@blackunicorn/bonklm';

const engine = new GuardrailEngine({
  validators: [
    new PromptInjectionValidator({
      sensitivity: 'strict',
      detectMultiLayerEncoding: true,
    }),
    new JailbreakValidator(),
    new ReformulationDetector(),
    new BoundaryDetector({
      detectPromptLeakage: true,
      detectInstructionLeakage: true,
    }),
  ],
  guards: [
    new SecretGuard(),
    new PIIGuard(),
    new BashSafetyGuard(),
  ],
  shortCircuit: true,  // Stop on first detection
});

async function validateContent(content: string) {
  const result = await engine.validate(content);

  if (!result.allowed) {
    console.log('Blocked:', result.reason);
    console.log('Risk Level:', result.risk_level);
    console.log('Findings:', result.findings?.length);
    return false;
  }

  return true;
}
```

### Context-Aware Validation

```typescript
import { SecretGuard, PIIGuard } from '@blackunicorn/bonklm';

const engine = new GuardrailEngine({
  validators: [new PromptInjectionValidator()],
  guards: [
    new SecretGuard(),
    new PIIGuard(),
  ],
});

// Provide context for better validation
const result = await engine.validate(userInput, {
  context: {
    userId: 'user123',
    endpoint: '/chat',
    metadata: { conversationId: 'abc123' },
  },
});

// Guards can use context to make decisions
```

---

## Custom Error Handling

### Express Error Handler

```typescript
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';

app.use('/api/ai', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()],
  onError: (result, req, res) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    res.status(400).json({
      error: 'Content blocked by safety guardrails',
      ...(isDevelopment && {
        reason: result.reason,
        risk_level: result.risk_level,
        findings: result.findings?.map(f => ({
          type: f.type,
          severity: f.severity,
        })),
      }),
    });
  },
}));
```

### Async Error Handling

```typescript
async function safeValidate(content: string) {
  try {
    const result = await engine.validate(content);
    return result;
  } catch (error) {
    if (error instanceof GuardrailValidationError) {
      console.error('Validation error:', error.message);
      return { allowed: false, reason: 'Validation failed' };
    }
    throw error;
  }
}
```

---

## Production Deployment

### Environment-Based Configuration

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const engine = new GuardrailEngine({
  validators: [
    new PromptInjectionValidator({
      sensitivity: isProduction ? 'standard' : 'strict',
    }),
  ],
  productionMode: isProduction,
  validationTimeout: 5000,
  logger: isProduction
    ? createLogger('file', { filename: 'guardrails.log' })
    : createLogger('console'),
});
```

### Monitoring

```typescript
import { MonitoringLogger } from '@blackunicorn/bonklm';

const monitoring = new MonitoringLogger({
  logLevel: 'info',
  enableMetrics: true,
  enableAuditTrail: true,
});

const engine = new GuardrailEngine({
  validators: [new PromptInjectionValidator()],
  logger: monitoring,
});

// Get metrics
setInterval(() => {
  const metrics = monitoring.getMetrics();
  console.log('Validation stats:', metrics);
}, 60000);
```

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@blackunicorn/bonklm';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000,
  halfOpenMaxCalls: 3,
});

const engine = new GuardrailEngine({
  validators: [new PromptInjectionValidator()],
  circuitBreaker,
});
```

---

## Additional Examples

See the [examples/](../examples/) directory for complete, runnable examples:

- [Express](../examples/express/) - Full Express application
- [Fastify](../examples/fastify/) - Full Fastify application
- [NestJS](../examples/nestjs/) - Full NestJS application
- [Streaming](../examples/streaming/) - Streaming validation
- [RAG](../examples/rag/) - RAG application with LlamaIndex

---

## Next Steps

- [Security Guide](./security-guide.md) - Security best practices
- [API Reference](../api-reference.md) - Complete API documentation
- [Connector Guides](../connectors/) - Framework-specific guides
