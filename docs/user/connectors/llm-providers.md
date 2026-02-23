# LLM Provider Connectors

This guide covers integrating BonkLM with popular LLM providers and frameworks.

## Available Connectors

| Connector | Package | Provider | Status |
|-----------|---------|----------|--------|
| LangChain | `@blackunicorn/bonklm-langchain` | LangChain | ✅ |
| Ollama | `@blackunicorn/bonklm-ollama` | Ollama | ✅ |

---

## LangChain Connector

### Installation

```bash
npm install @blackunicorn/bonklm-langchain @langchain/openai
```

### Basic Usage

```typescript
import { GuardrailsCallbackHandler } from '@blackunicorn/bonklm-langchain';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';
import { ChatOpenAI } from '@langchain/openai';

const handler = new GuardrailsCallbackHandler({
  validators: [new PromptInjectionValidator()],
  validateStreaming: true,
});

const llm = new ChatOpenAI({
  model: 'gpt-4',
  callbacks: [handler],
});

const response = await llm.invoke([
  { role: 'user', content: userInput }
]);

console.log(response.content);
```

### Using with Chains

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { GuardrailsCallbackHandler } from '@blackunicorn/bonklm-langchain';

const handler = new GuardrailsCallbackHandler({
  validators: [new PromptInjectionValidator()],
});

const prompt = ChatPromptTemplate.fromTemplate(
  'Tell me a joke about {topic}'
);

const chain = prompt.pipe(llm);

const response = await chain.invoke(
  { topic: 'programming' },
  { callbacks: [handler] }
);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `streamingValidationInterval` | `number` | `10` | Tokens between validations |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onStreamBlocked` | `Function` | - | Callback when stream blocked |
| `onValidationError` | `Function` | - | Callback on validation error |

### Tool Call Validation

```typescript
const handler = new GuardrailsCallbackHandler({
  validators: [new PromptInjectionValidator()],
  validateToolCalls: true,
  validateToolOutputs: true,
});

const llmWithTools = new ChatOpenAI({
  model: 'gpt-4',
  callbacks: [handler],
  tools: [searchTool, calculatorTool],
});
```

### Error Type Guards

```typescript
import {
  isGuardrailsViolationError,
  isStreamValidationError,
  GuardrailsViolationError,
  StreamValidationError,
} from '@blackunicorn/bonklm-langchain';

try {
  const response = await chain.invoke({ topic: userInput });
} catch (error) {
  if (isGuardrailsViolationError(error)) {
    console.error('Guardrails violation:', error.reason);
    console.error('Findings:', error.findings);
  } else if (isStreamValidationError(error)) {
    console.error('Stream validation failed:', error.message);
  }
}
```

---

## Ollama Connector

### Installation

```bash
npm install @blackunicorn/bonklm-ollama ollama
```

### Basic Usage

```typescript
import { Ollama } from 'ollama';
import { createGuardedOllama } from '@blackunicorn/bonklm-ollama';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const ollama = new Ollama({ host: 'http://localhost:11434' });
const guardedOllama = createGuardedOllama(ollama, {
  validators: [new PromptInjectionValidator()],
});

// Chat API
const response = await guardedOllama.chat({
  model: 'llama3.1',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.message.content);
```

### Generate API

```typescript
const result = await guardedOllama.generate({
  model: 'llama3.1',
  prompt: 'Write a short poem about programming',
});

console.log(result.response);
```

### Streaming

```typescript
const stream = await guardedOllama.chat({
  model: 'llama3.1',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.message.content);
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
| `enableRetry` | `boolean` | `true` | Enable retries |
| `maxRetries` | `number` | `3` | Max retry attempts |

### Multimodal Content

```typescript
const response = await guardedOllama.chat({
  model: 'llava',
  messages: [
    {
      role: 'user',
      content: 'What do you see in this image?',
      images: ['https://example.com/image.jpg'],
    },
  ],
});
```

### Custom Model Options

```typescript
const response = await guardedOllama.chat({
  model: 'llama3.1',
  messages: [{ role: 'user', content: 'Hello!' }],
  format: 'json', // Request JSON output
  options: {
    temperature: 0.7,
    num_predict: 500,
    top_k: 40,
    top_p: 0.9,
  },
  keep_alive: '5m', // Keep model loaded
});
```

---

## Common Security Features

All LLM provider connectors include:

- **SEC-002**: Incremental stream validation with early termination
- **SEC-003**: Buffer size limits to prevent DoS attacks
- **SEC-006**: Complex message content handling (arrays, images, mixed content)
- **SEC-007**: Production mode for generic error messages
- **SEC-008**: Validation timeout with AbortController

## Next Steps

- [Framework Middleware](./framework-middleware.md) - Express, Fastify, NestJS
- [AI SDK Connectors](./ai-sdks.md) - OpenAI, Anthropic, Vercel AI SDK
- [RAG Connectors](./rag-vector-stores.md) - LlamaIndex, Pinecone, ChromaDB
