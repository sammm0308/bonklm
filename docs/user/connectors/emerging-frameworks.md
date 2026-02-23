# Emerging Framework Connectors

This guide covers integrating BonkLM with emerging AI frameworks and platforms.

## Available Connectors

| Connector | Package | Framework | Status |
|-----------|---------|-----------|--------|
| Mastra | `@blackunicorn/bonklm-mastra` | Mastra | ✅ |
| Genkit | `@blackunicorn/bonklm-genkit` | Google Genkit | ✅ |
| CopilotKit | `@blackunicorn/bonklm-copilotkit` | CopilotKit | ✅ |

---

## Mastra Connector

### Installation

```bash
npm install @blackunicorn/bonklm-mastra @mastra/core
```

### Hook-Based Integration

```typescript
import { createGuardedMastra } from '@blackunicorn/bonklm-mastra';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardrails = createGuardedMastra({
  validators: [new PromptInjectionValidator()],
  validateAgentInput: true,
  validateAgentOutput: true,
});

// Use with Mastra agent
const agent = new MyAgent({
  beforeAgentExecution: guardrails.beforeAgentExecution,
  afterAgentExecution: guardrails.afterAgentExecution,
});
```

### Using wrapAgent()

```typescript
import { wrapAgent } from '@blackunicorn/bonklm-mastra';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const guardedAgent = wrapAgent(myAgent, {
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator(),
  ],
  validateAgentInput: true,
  validateAgentOutput: true,
  validateToolCalls: true,
  validateToolResults: true,
});

// Use like normal agent
const response = await guardedAgent.execute({ input: userInput });
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateAgentInput` | `boolean` | `true` | Validate agent input |
| `validateAgentOutput` | `boolean` | `true` | Validate agent output |
| `validateToolCalls` | `boolean` | `true` | Validate tool calls |
| `validateToolResults` | `boolean` | `true` | Validate tool results |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onToolCallBlocked` | `Function` | - | Callback when tool call blocked |

---

## Genkit Connector

### Installation

```bash
npm install @blackunicorn/bonklm-genkit genkit
```

### Plugin-Based Integration

```typescript
import { createGenkitGuardrailsPlugin } from '@blackunicorn/bonklm-genkit';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';
import { configureGenkit } from 'genkit';

const guardrailsPlugin = createGenkitGuardrailsPlugin({
  validators: [new PromptInjectionValidator()],
  validateFlowInput: true,
  validateFlowOutput: true,
});

configureGenkit({
  plugins: [guardrailsPlugin],
});
```

### Using wrapFlow()

```typescript
import { wrapFlow } from '@blackunicorn/bonklm-genkit';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const myFlow = defineFlow({
  name: 'myFlow',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ response: z.string() }),
}, async (input) => {
  return { response: await processMessage(input.message) };
});

const guardedFlow = wrapFlow(myFlow, {
  validators: [new PromptInjectionValidator()],
  validateFlowInput: true,
  validateFlowOutput: true,
});

// Use like normal flow
const result = await guardedFlow({ message: userInput });
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateFlowInput` | `boolean` | `true` | Validate flow input |
| `validateFlowOutput` | `boolean` | `true` | Validate flow output |
| `validateToolCalls` | `boolean` | `true` | Validate tool calls |
| `validateToolResponses` | `boolean` | `true` | Validate tool responses |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onToolCallBlocked` | `Function` | - | Callback when tool call blocked |

---

## CopilotKit Connector

### Installation

```bash
npm install @blackunicorn/bonklm-copilotkit @copilotkit/react-core
```

### Basic Integration

```typescript
import { createGuardedCopilotKit } from '@blackunicorn/bonklm-copilotkit';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardrails = createGuardedCopilotKit({
  validators: [new PromptInjectionValidator()],
  validateUserMessages: true,
  validateAssistantMessages: true,
});

function App() {
  return (
    <CopilotKit guardrails={guardrails}>
      <MyChatComponent />
    </CopilotKit>
  );
}
```

### Action Validation

```typescript
const guardrails = createGuardedCopilotKit({
  validators: [new PromptInjectionValidator()],
  validateActionCalls: true,
  validateActionResults: true,
  onActionCallBlocked: (action, result) => {
    console.log(`Action ${action.name} blocked:`, result.reason);
  },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateUserMessages` | `boolean` | `true` | Validate user messages |
| `validateAssistantMessages` | `boolean` | `true` | Validate assistant messages |
| `validateActionCalls` | `boolean` | `true` | Validate action calls |
| `validateActionResults` | `boolean` | `true` | Validate action results |
| `validateStreaming` | `boolean` | `false` | Enable stream validation |
| `streamingMode` | `'incremental'\|'buffer'` | `'incremental'` | Stream validation mode |
| `maxStreamBufferSize` | `number` | `1048576` | Max buffer size (1MB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onBlocked` | `Function` | - | Callback when content blocked |
| `onActionCallBlocked` | `Function` | - | Callback when action blocked |

---

## Common Security Features

All emerging framework connectors include:

- **SEC-002**: Incremental stream validation with early termination
- **SEC-003**: Buffer overflow protection (configurable max buffer size)
- **SEC-005**: Tool/Action call injection protection
- **SEC-006**: Structured content handling (arrays, images, mixed content)
- **SEC-007**: Production mode with generic error messages
- **SEC-008**: Validation timeout with AbortController
- **SEC-010**: Request size limits

## Integration Patterns

| Framework | Integration Pattern | Wrapper Function |
|-----------|-------------------|------------------|
| Mastra | Hook-based + Agent wrapper | `wrapAgent()` |
| Genkit | Plugin-based + Flow wrapper | `wrapFlow()` |
| CopilotKit | Guardrail prop (React) | No wrapper needed |

## Next Steps

- [Framework Middleware](./framework-middleware.md) - Express, Fastify, NestJS
- [AI SDK Connectors](./ai-sdks.md) - OpenAI, Anthropic, Vercel AI SDK
- [RAG Connectors](./rag-vector-stores.md) - LlamaIndex, Pinecone, ChromaDB
