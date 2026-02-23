# BonkLM Planning Index

> **Last Updated**: 2025-02-16

---

## Planning Artifacts

| Document | Description | Status |
|----------|-------------|--------|
| [Product Requirements Document](./PRODUCT-REQUIREMENTS-DOCUMENT.md) | Complete PRD with features, users, success metrics | ✅ Complete |
| [Technical Architecture](./TECHNICAL-ARCHITECTURE.md) | System design, components, data flow | ✅ Complete |
| [Connector Roadmap](./CONNECTOR-ROADMAP.md) | All 20 planned connectors with phases | 📋 Pending |

---

## Implementation Artifacts

| Document | Description | Status |
|----------|-------------|--------|
| [Implementation Roadmap](../implementation/IMPLEMENTATION-ROADMAP.md) | Phased implementation plan with milestones | ✅ Complete |
| [Task Breakdown](../implementation/TASK-BREAKDOWN.md) | Detailed task list for current sprint | 📋 Pending |

---

## QA Artifacts

| Document | Description | Status |
|----------|-------------|--------|
| [Testing Strategy](../qa/TESTING-STRATEGY.md) | Unit, integration, E2E testing approach | 📋 Pending |
| [Test Coverage Report](../qa/COVERAGE.md) | Current test coverage metrics | 📋 Pending |

---

## Security Artifacts

| Document | Description | Status |
|----------|-------------|--------|
| [Security Model](../security/SECURITY-MODEL.md) | Threat model, security considerations | 📋 Pending |
| [Audit Report](../security/AUDIT-REPORT.md) | Security audit findings | 📋 Pending |

---

## Quick Reference

### Product Overview

- **Name**: `@blackunicorn/bonklm`
- **Purpose**: Framework-agnostic LLM security guardrails for Node.js
- **Package**: Core + 20+ connectors

### Current Status

- **Core Library**: ✅ Complete (6 validators, 5 guards, engine, hooks)
- **OpenClaw Adapter**: ✅ Complete
- **Framework Connectors**: 📋 Planned (Express, Fastify, NestJS)
- **Provider Connectors**: 📋 Planned (Vercel AI SDK, OpenAI, MCP, etc.)

### Next Steps

1. **Immediate**: Express Middleware (Phase 1)
2. **Week 2-4**: Fastify Plugin, NestJS Module
3. **Week 5-10**: Vercel AI SDK, OpenAI SDK, MCP SDK connectors

---

## Documents by Phase

### Phase 0: Foundation ✅

- Core package with all validators, guards, engine
- OpenClaw adapter
- Basic documentation

### Phase 1: Framework Connectors (4 weeks)

- Express Middleware
- Fastify Plugin
- NestJS Module

### Phase 2: Core Providers (6 weeks)

- Vercel AI SDK
- OpenAI SDK
- MCP SDK

### Phase 3: Additional Providers (6 weeks)

- Anthropic SDK
- LangChain
- Ollama

### Phase 4: Emerging Frameworks (4 weeks)

- Mastra
- Google Genkit
- CopilotKit

### Phase 5: RAG Safety (4 weeks)

- LlamaIndex TS
- Pinecone
- HuggingFace Inference
