# AI SDK Connectors

This guide covers integrating BonkLM with popular AI SDKs and platforms.

## Available Connectors

| Connector | Package | SDK | Status |
|-----------|---------|-----|--------|
| OpenAI SDK | `@blackunicorn/bonklm-openai` | OpenAI Node.js SDK | ✅ |
| Anthropic SDK | `@blackunicorn/bonklm-anthropic` | Anthropic TypeScript SDK | ✅ |
| Vercel AI SDK | `@blackunicorn/bonklm-vercel` | Vercel AI SDK | ✅ |
| MCP SDK | `@blackunicorn/bonklm-mcp` | Model Context Protocol | ✅ |

---

## OpenAI SDK Connector

### Installation

```bash
npm install @blackunicorn/bonklm-openai openai
```

### Basic Usage

```typescript
import OpenAI from 'openai';
import { createGuardedOpenAI } from '@blackunicorn/bonklm-openai';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const guardedOpenAI = createGuardedOpenAI(openai, {
  validators: [new PromptInjectionValidator()],
});

// Use like normal OpenAI client
const response = await guardedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: userInput }],
});

console.log(response.choices[0].message.content);
```

### Streaming

```typescript
const stream = await guardedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: userInput }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onStreamBlocked` | `Function` | - | Callback when stream blocked |

### Tool Call Validation

```typescript
const guardedOpenAI = createGuardedOpenAI(openai, {
  validators: [new PromptInjectionValidator()],
  allowedTools: ['search', 'calculator'],
  maxToolArgumentSize: 100 * 1024, // 100KB
});

const response = await guardedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Search for news' }],
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
```

---

## Anthropic SDK Connector

### Installation

```bash
npm install @blackunicorn/bonklm-anthropic @anthropic-ai/sdk
```

### Basic Usage

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createGuardedAnthropic } from '@blackunicorn/bonklm-anthropic';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const guarded = createGuardedAnthropic(anthropic, {
  validators: [new PromptInjectionValidator()],
});

const response = await guarded.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: userInput }],
  max_tokens: 1024,
});

console.log(response.content[0].text);
```

### Streaming

```typescript
const stream = await guarded.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: userInput }],
  stream: true,
  max_tokens: 1024,
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text);
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `enableRetry` | `boolean` | `true` | Enable retries |
| `maxRetries` | `number` | `3` | Max retry attempts |
| `telemetry` | `TelemetryService` | - | Optional telemetry |
| `circuitBreaker` | `CircuitBreaker` | - | Optional circuit breaker |

---

## Vercel AI SDK Connector

### Installation

```bash
npm install @blackunicorn/bonklm-vercel ai
```

### Basic Usage

```typescript
import { createGuardedAI } from '@blackunicorn/bonklm-vercel';
import { openai } from '@ai-sdk/openai';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardedAI = createGuardedAI({
  validators: [new PromptInjectionValidator()],
  validateStreaming: true,
});

// Generate text
const result = await guardedAI.generateText({
  model: openai('gpt-4'),
  messages: [{ role: 'user', content: userInput }],
});

console.log(result.text);
```

### Streaming

```typescript
const stream = await guardedAI.streamText({
  model: openai('gpt-4'),
  messages: [{ role: 'user', content: userInput }],
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onStreamBlocked` | `Function` | - | Callback when stream blocked |

---

## MCP SDK Connector

### Installation

```bash
npm install @blackunicorn/bonklm-mcp @modelcontextprotocol/sdk
```

### Basic Usage

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createGuardedMCP } from '@blackunicorn/bonklm-mcp';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const mcpClient = new Client({
  name: 'my-client',
  version: '1.0.0',
});

const guardedMCP = createGuardedMCP(mcpClient, {
  validators: [new PromptInjectionValidator()],
  allowedTools: ['calculator', 'weather'],
});

// Call tool with validation
const result = await guardedMCP.callTool({
  name: 'calculator',
  arguments: { operation: 'add', a: 5, b: 10 },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateToolCalls` | `boolean` | `true` | Validate tool call arguments |
| `validateToolResults` | `boolean` | `true` | Validate tool results |
| `allowedTools` | `string[]` | `[]` | Tool name allowlist |
| `maxArgumentSize` | `number` | `102400` | Max argument size (100KB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `5000` | Timeout in milliseconds |
| `onToolCallBlocked` | `Function` | - | Callback when tool call blocked |
| `onToolResultBlocked` | `Function` | - | Callback when result blocked |

### Tool Allowlisting

```typescript
const guardedMCP = createGuardedMCP(mcpClient, {
  validators: [new PromptInjectionValidator()],
  allowedTools: ['calculator', 'weather', 'search'],
  validateToolCalls: true,
  validateToolResults: true,
  onToolCallBlocked: (result, toolName) => {
    console.log(`Tool ${toolName} blocked:`, result.reason);
  },
});
```

---

## Common Security Features

All AI SDK connectors include:

- **SEC-002**: Incremental stream validation with early termination
- **SEC-003**: Buffer size limits to prevent DoS attacks
- **SEC-006**: Complex message content handling (arrays, images, mixed content)
- **SEC-007**: Production mode for generic error messages
- **SEC-008**: Validation timeout with AbortController

## Next Steps

- [Framework Middleware](./framework-middleware.md) - Express, Fastify, NestJS
- [LLM Provider Connectors](./llm-providers.md) - LangChain, Ollama
- [RAG Connectors](./rag-vector-stores.md) - LlamaIndex, Pinecone, ChromaDB
