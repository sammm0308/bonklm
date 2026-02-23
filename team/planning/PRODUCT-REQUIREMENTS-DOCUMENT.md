# BonkLM Product Requirements Document (PRD)

> **Product**: BonkLM (`@blackunicorn/bonklm`)
> **Code Name**: BonkLM
> **Version**: 1.0.0
> **Status**: Planning
> **Last Updated**: 2025-02-16

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Target Users](#target-users)
3. [Core Features](#core-features)
4. [Framework Integrations](#framework-integrations)
5. [Success Metrics](#success-metrics)
6. [Non-Requirements](#non-requirements)

---

## Product Overview

### Product Statement

`@blackunicorn/bonklm` is a **framework-agnostic LLM security package** for Node.js applications that provides production-ready validators for detecting prompt injection, jailbreaks, secrets, and other security risks in LLM inputs and outputs.

### Key Differentiators

| Aspect | BonkLM | Alternatives |
|--------|----------------|--------------|
| **Framework Lock-in** | None - works with any framework | Many are framework-specific |
| **Provider Lock-in** | None - works with any LLM provider | Often tied to specific provider |
| **Deployment** | Serverless, containers, edge, bare metal | Some require containerized deployment |
| **Integration** | Drop-in validators, middleware, or engine | Often require architectural changes |
| **Extensibility** | Hook system for custom validators | Limited extensibility |

### Value Proposition

- **5-minute setup** - Install npm package, import validators, start protecting
- **Zero vendor lock-in** - Switch LLM providers, keep your guardrails
- **Framework agnostic** - Express, Fastify, NestJS, vanilla Node.js, serverless
- **Production ready** - Battle-tested patterns from BMAD-CYBERSEC
- **Extensible** - Build custom validators with the Hook system

---

## Target Users

### Primary Users

| User Type | Description | Use Case |
|-----------|-------------|----------|
| **Backend Developers** | Building Node.js APIs with LLM features | Secure API endpoints that accept user input |
| **AI/ML Engineers** | Integrating LLMs into applications | Validate prompts before LLM API calls |
| **Full-Stack Developers** | Building AI-powered web apps | Protect both client and server side |
| **DevOps Engineers** | Deploying AI applications | Ensure security guardrails in production |

### Secondary Users

| User Type | Description | Use Case |
|-----------|-------------|----------|
| **Security Engineers** | Reviewing AI app security | Auditable validation logs |
| **Platform Teams** | Building internal AI platforms | Standardized guardrails across teams |
| **Startup Founders** | Shipping AI features fast | Quick security without dedicated security team |

---

## Core Features

### 1. Validators

Validators check content for specific security risks.

| Validator | Description | Status |
|-----------|-------------|--------|
| **PromptInjectionValidator** | 35+ pattern categories, multi-layer encoding detection | ✅ Implemented |
| **JailbreakValidator** | 44 patterns across 10 categories (DAN, roleplay, social engineering) | ✅ Implemented |
| **ReformulationDetector** | Code format injection, character encoding, context overload | ✅ Implemented |
| **BoundaryDetector** | Detects attempts to bypass system boundaries | ✅ Implemented |
| **MultilingualPatterns** | Pattern detection across multiple languages | ✅ Implemented |

### 2. Guards

Guards validate content with additional context (e.g., file paths).

| Guard | Description | Status |
|-------|-------------|--------|
| **SecretGuard** | 30+ types of API keys, tokens, credentials | ✅ Implemented |
| **PIIGuard** | PII detection (emails, phone numbers, SSN, etc.) | ✅ Implemented |
| **BashSafetyGuard** | Bash command injection detection | ✅ Implemented |
| **XSSSafetyGuard** | XSS pattern detection | ✅ Implemented |
| **ProductionGuard** | Environment-specific safety checks | ✅ Implemented |

### 3. GuardrailEngine

Orchestration layer for combining multiple validators/guards.

**Features:**
- Sequential or parallel execution
- Short-circuit on first detection
- Aggregated risk scoring
- Individual validator results
- Override token support
- Configurable sensitivity and action modes

**Status**: ✅ Implemented

### 4. Hook System

Extensible middleware for custom validation logic.

**Status**: ✅ Implemented

### 5. Session Tracking

Track validation state across requests.

**Status**: ✅ Implemented

---

## Framework Integrations

### Current Status

| Integration | Package | Status |
|-------------|---------|--------|
| **OpenClaw** | `@blackunicorn/bonklm-openclaw` | ✅ Released |
| **Express.js** | TBD | Planned |
| **Fastify** | TBD | Planned |
| **NestJS** | TBD | Planned |

### Planned Connector Roadmap

Based on the Top 20 Node.js AI Tools analysis:

#### Phase 1: Highest ROI (Core LLM Infrastructure)

| Tool | Package | Weekly Downloads | Integration Type |
|------|---------|------------------|------------------|
| **Vercel AI SDK** | `ai` | 7.9M | Middleware / Provider wrapper |
| **OpenAI Node SDK** | `openai` | 12.4M | Request/response wrapper |
| **MCP TypeScript SDK** | `@modelcontextprotocol/sdk` | 17.3M | Tool call validator |

**Rationale**: These three cover the vast majority of Node.js LLM traffic (37.6M combined weekly downloads).

#### Phase 2: Major Provider & Framework Coverage

| Tool | Package | Weekly Downloads | Integration Type |
|------|---------|------------------|------------------|
| **Anthropic SDK** | `@anthropic-ai/sdk` | 5.9M | Request/response wrapper |
| **LangChain.js** | `langchain` | 1.8M | Chain callback / middleware |
| **Ollama.js** | `ollama` | 609K | Request/response wrapper |

**Rationale**: Second most-used LLM provider, top agent framework, and local LLM safety gap.

#### Phase 3: Emerging Frameworks & Platforms

| Tool | Integration Type |
|------|------------------|
| **Mastra** | Agent hook / middleware |
| **Google Genkit** | Plugin / middleware |
| **CopilotKit** | Action validator / middleware |

#### Phase 4: RAG & Vector Pipeline Safety

| Tool | Integration Type |
|------|------------------|
| **LlamaIndex TS** | Retrieval / query validator |
| **Pinecone TS Client** | Content validator on upsert/query |
| **HuggingFace Inference** | Request/response wrapper |

---

## Success Metrics

### Adoption Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **npm weekly downloads** | 10,000/week | 6 months |
| **GitHub stars** | 500 | 6 months |
| **Public integrations** | 5 connectors | 12 months |

### Quality Metrics

| Metric | Target |
|--------|--------|
| **Test coverage** | >90% |
| **TypeScript strict mode** | 100% |
| **Security vulnerabilities** | 0 critical/high |
| **Performance** | <10ms per validation |

### Developer Experience

| Metric | Target |
|--------|--------|
| **Time to first protected endpoint** | <5 minutes |
| **Documentation completeness** | 100% API coverage |
| **Example code** | 10+ working examples |

---

## Non-Requirements

### Out of Scope

These features are explicitly **NOT** part of BonkLM:

| Feature | Why Not In Scope |
|---------|------------------|
| **LLM proxy/gateway server** | We're a library, not a service |
| **UI/dashboard** | Not part of core package (may be separate) |
| **Rate limiting** | Use existing middleware (express-rate-limit, etc.) |
| **Authentication** | Use existing auth libraries |
| **Content filtering (profanity, etc.)** | Focus on security, not content moderation |
| **LLM output quality checking** | Focus on security, not quality |
| **Model training/fine-tuning** | Not related to guardrails |
| **A/B testing** | Not related to guardrails |
| **Analytics/observability** | Integrate with existing tools |

### Related But Separate

These are related products that may exist separately:

| Product | Relationship |
|---------|--------------|
| **BMAD** | Development framework used to build BonkLM |
| **OpenClaw** | One of many potential integrations |
| **AI content moderation** | Complementary but different use case |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Application                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Express    │  │   Fastify    │  │   NestJS     │          │
│  │   Middleware │  │    Plugin    │  │    Module    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                       │
│                           ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              @blackunicorn/bonklm                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │            GuardrailEngine                       │    │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐  │    │   │
│  │  │  │Validators│ │  Guards │ │  Hooks  │ │Session│  │    │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └───────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│                           ▼                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  OpenAI SDK  │  │  Anthropic   │  │   Local LLM  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reference Implementation

See [README.md](../../README.md) for usage examples and [packages/examples/](../../packages/examples/) for working code.
