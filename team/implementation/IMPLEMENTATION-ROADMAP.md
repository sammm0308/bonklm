# BonkLM Implementation Roadmap

> **Product**: `@blackunicorn/bonklm`
> **Version**: 1.0.0
> **Status**: Planning
> **Last Updated**: 2025-02-16

---

## Table of Contents

1. [Current Status](#current-status)
2. [Implementation Phases](#implementation-phases)
3. [Detailed Task Breakdown](#detailed-task-breakdown)
4. [Milestones](#milestones)

---

## Current Status

### Completed ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **Base Types** | ✅ Complete | `GuardrailResult`, `GenericLogger`, `ValidatorConfig` |
| **PatternEngine** | ✅ Complete | 35+ pattern categories |
| **TextNormalizer** | ✅ Complete | Unicode normalization, confusable detection |
| **PromptInjectionValidator** | ✅ Complete | Multi-layer encoding detection |
| **JailbreakValidator** | ✅ Complete | 44 patterns across 10 categories |
| **ReformulationDetector** | ✅ Complete | Code format, encoding, context overload |
| **BoundaryDetector** | ✅ Complete | Boundary violation detection |
| **MultilingualPatterns** | ✅ Complete | Multi-language support |
| **SecretGuard** | ✅ Complete | 30+ types of credentials |
| **PIIGuard** | ✅ Complete | PII detection |
| **BashSafetyGuard** | ✅ Complete | Bash injection detection |
| **XSSSafetyGuard** | ✅ Complete | XSS pattern detection |
| **ProductionGuard** | ✅ Complete | Environment checks |
| **GuardrailEngine** | ✅ Complete | Orchestration with parallel/sequential modes |
| **Hook System** | ✅ Complete | `HookManager`, `HookSandbox` |
| **Session Tracking** | ✅ Complete | `SessionTracker` |
| **OpenClaw Adapter** | ✅ Complete | First integration released |

### In Progress 🚧

| Component | Status | Notes |
|-----------|--------|-------|
| **Comprehensive Tests** | 🚧 Partial | Need >90% coverage |
| **Documentation** | 🚧 Partial | API reference incomplete |
| **Examples** | 🚧 Partial | Need more working examples |

### Not Started 📋

| Component | Priority | Notes |
|-----------|----------|-------|
| **Express Middleware** | P0 | Listed in README as "coming soon" |
| **Fastify Plugin** | P0 | Listed in README as "coming soon" |
| **NestJS Module** | P1 | Listed in README as "coming soon" |
| **Vercel AI SDK Connector** | P0 | Phase 1 connector |
| **OpenAI SDK Connector** | P0 | Phase 1 connector |
| **MCP SDK Connector** | P0 | Phase 1 connector |
| **Anthropic SDK Connector** | P1 | Phase 2 connector |
| **LangChain Connector** | P1 | Phase 2 connector |
| **Ollama Connector** | P1 | Phase 2 connector |

---

## Implementation Phases

### Phase 0: Foundation Complete ✅

**Goal**: Core library with all validators, guards, and engine.

**Completed**:
- ✅ All base types and interfaces
- ✅ All validators (6 total)
- ✅ All guards (5 total)
- ✅ GuardrailEngine orchestration
- ✅ Hook system
- ✅ Session tracking
- ✅ OpenClaw adapter

### Phase 1: Framework Connectors (P0)

**Goal**: First-class support for popular web frameworks.

**Duration**: 4 weeks

| Connector | Package | Status |
|-----------|---------|--------|
| Express Middleware | `@blackunicorn/bonklm-express` | 📋 Not Started |
| Fastify Plugin | `@blackunicorn/bonklm-fastify` | 📋 Not Started |
| NestJS Module | `@blackunicorn/bonklm-nestjs` | 📋 Not Started |

**Acceptance Criteria**:
- [ ] Middleware/plugin intercepts requests
- [ ] Validates request body before LLM calls
- [ ] Validates response body after LLM calls
- [ ] Configurable validator/guard selection
- [ ] Proper TypeScript types
- [ ] Comprehensive tests
- [ ] Documentation with examples

### Phase 2: LLM Provider Connectors (P0)

**Goal**: Drop-in wrappers for major LLM provider SDKs.

**Duration**: 6 weeks

| Connector | Package | Weekly Downloads | Status |
|-----------|---------|------------------|--------|
| Vercel AI SDK | `@blackunicorn/bonklm-vercel` | 7.9M | 📋 Not Started |
| OpenAI SDK | `@blackunicorn/bonklm-openai` | 12.4M | 📋 Not Started |
| MCP SDK | `@blackunicorn/bonklm-mcp` | 17.3M | 📋 Not Started |

**Acceptance Criteria**:
- [ ] Wrapper intercepts all API calls
- [ ] Validates prompts before sending
- [ ] Validates responses after receiving
- [ ] Streaming support where applicable
- [ ] Preserves original SDK interface
- [ ] TypeScript types
- [ ] Tests and docs

### Phase 3: Additional Provider Connectors (P1)

**Goal**: Expand coverage to other popular providers.

**Duration**: 6 weeks

| Connector | Package | Weekly Downloads | Status |
|-----------|---------|------------------|--------|
| Anthropic SDK | `@blackunicorn/bonklm-anthropic` | 5.9M | 📋 Not Started |
| LangChain | `@blackunicorn/bonklm-langchain` | 1.8M | 📋 Not Started |
| Ollama | `@blackunicorn/bonklm-ollama` | 609K | 📋 Not Started |

### Phase 4: Emerging Frameworks (P2)

**Goal**: Support fast-growing AI frameworks.

**Duration**: 4 weeks

| Connector | Package | Status |
|-----------|---------|--------|
| Mastra | `@blackunicorn/bonklm-mastra` | 📋 Not Started |
| Google Genkit | `@blackunicorn/bonklm-genkit` | 📋 Not Started |
| CopilotKit | `@blackunicorn/bonklm-copilotkit` | 📋 Not Started |

### Phase 5: RAG & Vector Safety (P2)

**Goal**: Content validation for RAG pipelines.

**Duration**: 4 weeks

| Connector | Package | Status |
|-----------|---------|--------|
| LlamaIndex TS | `@blackunicorn/bonklm-llamaindex` | 📋 Not Started |
| Pinecone | `@blackunicorn/bonklm-pinecone` | 📋 Not Started |
| HuggingFace Inference | `@blackunicorn/bonklm-huggingface` | 📋 Not Started |

---

## Detailed Task Breakdown

### Phase 1: Framework Connectors

#### 1.1 Express Middleware

**Location**: `packages/express-middleware/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement `createGuardrailsMiddleware()` factory
- [ ] Request validation middleware
- [ ] Response validation middleware
- [ ] Error handling
- [ ] TypeScript types
- [ ] Unit tests (>90% coverage)
- [ ] Integration tests with Express app
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import express from 'express';
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const app = express();

app.use(express.json());

app.use('/api/chat', createGuardrailsMiddleware({
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator()
  ],
  validateRequest: true,
  validateResponse: true,
  onError: (result, req, res) => {
    res.status(400).json({ error: result.reason });
  }
}));

app.post('/api/chat', async (req, res) => {
  // Content is pre-validated
  const response = await llm.call(req.body.message);
  // Response will be post-validated
  res.json(response);
});
```

#### 1.2 Fastify Plugin

**Location**: `packages/fastify-plugin/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement Fastify plugin
- [ ] onRequest hook for request validation
- [ ] onSend hook for response validation
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { guardrailsPlugin } from '@blackunicorn/bonklm-fastify';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const fastify = Fastify();

await fastify.register(fp(guardrailsPlugin), {
  validators: [new PromptInjectionValidator()],
  validateRequest: true,
  validateResponse: true
});

fastify.post('/api/chat', async (request, reply) => {
  // Content is validated
  return await llm.call(request.body.message);
});
```

#### 1.3 NestJS Module

**Location**: `packages/nestjs-module/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement NestJS module
- [ ] Guardrails service
- [ ] Guardrails interceptor
- [ ] Guardrails decorator
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import { Module, Controller, Post, Body } from '@nestjs/common';
import { GuardrailsModule, UseGuardrails } from '@blackunicorn/bonklm-nestjs';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

@Module({
  imports: [
    GuardrailsModule.forRoot({
      validators: [new PromptInjectionValidator()]
    })
  ]
})
export class AppModule {}

@Controller('chat')
export class ChatController {
  @Post()
  @UseGuardrails()
  async chat(@Body() body: { message: string }) {
    return await llm.call(body.message);
  }
}
```

### Phase 2: LLM Provider Connectors

#### 2.1 Vercel AI SDK Connector

**Location**: `packages/vercel-connector/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement `createGuardedAI()` wrapper
- [ ] Stream validation support
- [ ] Per-model validation
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { createGuardedAI } from '@blackunicorn/bonklm-vercel';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const openai = createOpenAI();
const guardedAI = createGuardedAI(openai, {
  validators: [new PromptInjectionValidator()],
  validateStreaming: true
});

const result = await guardedAI.generateText({
  model: openai('gpt-4'),
  prompt: userInput
});
```

#### 2.2 OpenAI SDK Connector

**Location**: `packages/openai-connector/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement `createGuardedOpenAI()` wrapper
- [ ] Chat completions validation
- [ ] Streaming validation
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import OpenAI from 'openai';
import { createGuardedOpenAI } from '@blackunicorn/bonklm-openai';
import { PromptInjectionValidator, JailbreakValidator } from '@blackunicorn/bonklm';

const openai = new OpenAI();
const guardedOpenAI = createGuardedOpenAI(openai, {
  validators: [
    new PromptInjectionValidator(),
    new JailbreakValidator()
  ]
});

const response = await guardedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: userInput }]
});
```

#### 2.3 MCP SDK Connector

**Location**: `packages/mcp-connector/`

**Tasks**:
- [ ] Create package structure
- [ ] Implement tool call validation
- [ ] Tool result validation
- [ ] MCP server integration
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation
- [ ] Example app

**API Design**:
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createGuardedMCP } from '@blackunicorn/bonklm-mcp';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const mcpClient = new Client();
const guardedMCP = createGuardedMCP(mcpClient, {
  validators: [new PromptInjectionValidator()],
  validateToolCalls: true,
  validateToolResults: true
});

await guardedMCP.callTool({
  name: 'search',
  arguments: { query: userInput }
});
```

---

## Milestones

### Milestone 1: Framework Support Complete

**Target**: 4 weeks

**Deliverables**:
- ✅ Express Middleware package
- ✅ Fastify Plugin package
- ✅ NestJS Module package
- ✅ All packages tested and documented
- ✅ Example applications

**Success Criteria**:
- All three packages published to npm
- Each package has >90% test coverage
- Documentation complete with examples
- No critical bugs reported

### Milestone 2: Core Provider Support

**Target**: 10 weeks (4 + 6)

**Deliverables**:
- ✅ Vercel AI SDK connector
- ✅ OpenAI SDK connector
- ✅ MCP SDK connector
- ✅ All packages tested and documented
- ✅ Example applications

**Success Criteria**:
- All three packages published to npm
- Streaming validation working
- Each package has >90% test coverage
- Documentation complete with examples

### Milestone 3: Expanded Provider Support

**Target**: 16 weeks (10 + 6)

**Deliverables**:
- ✅ Anthropic SDK connector
- ✅ LangChain connector
- ✅ Ollama connector
- ✅ All packages tested and documented

**Success Criteria**:
- All three packages published to npm
- Each package has >90% test coverage
- Documentation complete with examples

### Milestone 4: Ecosystem Coverage

**Target**: 24 weeks (16 + 4 + 4)

**Deliverables**:
- ✅ Mastra connector
- ✅ Google Genkit connector
- ✅ CopilotKit connector
- ✅ LlamaIndex connector
- ✅ Pinecone connector
- ✅ HuggingFace connector

**Success Criteria**:
- All packages published to npm
- Total connector count: 15+
- Documentation complete
- Community adoption

---

## Dependency Graph

```
Phase 0 (Core) ──┬──► Phase 1 (Frameworks)
                 │
                 ├──► Phase 2 (Core Providers)
                 │
                 ├──► Phase 3 (Additional Providers)
                 │
                 ├──► Phase 4 (Emerging Frameworks)
                 │
                 └──► Phase 5 (RAG Safety)
```

**Note**: Phases 2-5 can be developed in parallel after Phase 1 is complete.

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **API changes in provider SDKs** | Medium | Medium | Version-specific adapters, semver |
| **Performance overhead** | Low | High | Benchmarking, optimization |
| **False positives** | Medium | Medium | Tunable sensitivity levels |
| **Package maintenance burden** | High | High | Shared utilities, automated testing |
| **Community adoption low** | Low | High | Documentation, examples, outreach |

---

## Reference

- [Product Requirements Document](../planning/PRODUCT-REQUIREMENTS-DOCUMENT.md)
- [Technical Architecture](../planning/TECHNICAL-ARCHITECTURE.md)
