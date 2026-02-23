# Framework Middleware Connectors

This guide covers integrating BonkLM with popular Node.js frameworks using middleware/plugins.

## Available Connectors

| Connector | Package | Framework | Status |
|-----------|---------|-----------|--------|
| Express Middleware | `@blackunicorn/bonklm-express` | Express | ✅ |
| Fastify Plugin | `@blackunicorn/bonklm-fastify` | Fastify | ✅ |
| NestJS Module | `@blackunicorn/bonklm-nestjs` | NestJS | ✅ |

---

## Express Middleware

### Installation

```bash
npm install @blackunicorn/bonklm-express
```

### Basic Usage

```typescript
import express from 'express';
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const app = express();
app.use(express.json());

// Apply guardrails to specific routes
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator(),
  ],
  validateRequest: true,
  validateResponse: false, // Recommended for production
}));

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  const response = await callLLM(message);
  res.json({ response });
});

app.listen(3000);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to run on requests |
| `guards` | `Guard[]` | `[]` | Guards to run with context |
| `validateRequest` | `boolean` | `true` | Validate incoming requests |
| `validateResponse` | `boolean` | `false` | Validate outgoing responses |
| `paths` | `string[]` | `[]` | Only process these paths |
| `excludePaths` | `string[]` | `[]` | Exclude these paths |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `5000` | Timeout in milliseconds |
| `maxContentLength` | `number` | `1048576` | Max content length in bytes (1MB) |
| `bodyExtractor` | `Function` | Auto-extract | Custom body extractor |
| `onError` | `Function` | Default | Custom error handler |

### Custom Error Handling

```typescript
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()],
  onError: (result, req, res) => {
    res.status(400).json({
      error: 'Content blocked by safety guardrails',
      risk_level: result.risk_level,
    });
  },
}));
```

### Custom Body Extraction

```typescript
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()],
  bodyExtractor: (req) => {
    // Extract from custom request structure
    return req.body?.data?.prompt || req.body?.query || '';
  },
}));
```

---

## Fastify Plugin

### Installation

```bash
npm install @blackunicorn/bonklm-fastify
```

### Basic Usage

```typescript
import Fastify from 'fastify';
import guardrailsPlugin from '@blackunicorn/bonklm-fastify';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const fastify = Fastify();

await fastify.register(guardrailsPlugin, {
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator(),
  ],
  paths: ['/api/ai', '/api/chat'],
  excludePaths: ['/api/health'],
});

fastify.post('/api/ai/chat', async (request, reply) => {
  const { message } = request.body as { message: string };
  return { response: await callLLM(message) };
});

await fastify.listen({ port: 3000 });
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to run on requests |
| `guards` | `Guard[]` | `[]` | Guards to run with context |
| `validateRequest` | `boolean` | `true` | Validate incoming requests |
| `validateResponse` | `boolean` | `false` | Validate outgoing responses |
| `paths` | `string[]` | `[]` | Only validate these paths |
| `excludePaths` | `string[]` | `[]` | Exclude these paths |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `5000` | Timeout in milliseconds |
| `maxContentLength` | `number` | `1048576` | Max content length in bytes (1MB) |
| `responseExtractor` | `Function` | Auto-extract | Custom response extractor |
| `onError` | `Function` | Default | Custom error handler |

### Custom Error Handling

```typescript
await fastify.register(guardrailsPlugin, {
  validators: [new PromptInjectionValidator()],
  onError: async (result, req, reply) => {
    await reply.status(400).send({
      error: 'Content blocked',
      ...(process.env.NODE_ENV !== 'production' && {
        reason: result.reason,
      }),
    });
  },
});
```

---

## NestJS Module

### Installation

```bash
npm install @blackunicorn/bonklm-nestjs
```

### Module Setup

```typescript
import { Module } from '@nestjs/common';
import { GuardrailsModule } from '@blackunicorn/bonklm-nestjs';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

@Module({
  imports: [
    GuardrailsModule.forRoot({
      validators: [
        new PromptInjectionValidator(),
        new JailbreakValidator(),
      ],
      global: true,
      productionMode: process.env.NODE_ENV === 'production',
    }),
  ],
})
export class AppModule {}
```

### Controller Usage

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { UseGuardrails } from '@blackunicorn/bonklm-nestjs';

@Controller('api')
export class AppController {
  @Post('chat')
  @UseGuardrails()
  async chat(@Body() body: { message: string }) {
    return { response: await callLLM(body.message) };
  }

  @Post('generate')
  @UseGuardrails({
    bodyField: 'prompt',
    validateOutput: true,
    responseField: 'text',
  })
  async generate(@Body() body: { prompt: string }) {
    return { text: await generateText(body.prompt) };
  }
}
```

### Decorator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validateInput` | `boolean` | `true` | Validate request body |
| `validateOutput` | `boolean` | `false` | Validate response body |
| `bodyField` | `string` | Auto-detect | Request field to validate |
| `responseField` | `string` | Auto-detect | Response field to validate |
| `maxContentLength` | `number` | Module default | Per-endpoint size limit |
| `onError` | `Function` | Module default | Custom error handler |

### Using GuardrailsService

```typescript
import { Injectable } from '@nestjs/common';
import { GuardrailsService } from '@blackunicorn/bonklm-nestjs';

@Injectable()
export class MyService {
  constructor(private guardrails: GuardrailsService) {}

  async processInput(input: string) {
    const result = await this.guardrails.validate(input);
    if (!result.allowed) {
      throw new Error('Input blocked');
    }
    return await this.processSafeInput(input);
  }
}
```

---

## Common Security Features

All framework middleware connectors include:

- **SEC-001**: Path traversal protection via `path.normalize()`
- **SEC-007**: Production mode toggle for generic error messages
- **SEC-008**: Validation timeout with AbortController
- **SEC-010**: Request size limits to prevent DoS attacks

## Next Steps

- [AI SDK Connectors](./ai-sdks.md) - OpenAI, Anthropic, Vercel AI SDK
- [LLM Provider Connectors](./llm-providers.md) - LangChain, Ollama
- [RAG Connectors](./rag-vector-stores.md) - LlamaIndex, Pinecone, ChromaDB
