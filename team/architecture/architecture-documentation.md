# BonkLM Architecture Documentation

**Project**: BonkLM (`@blackunicorn/bonklm`)
**Version**: 2.0.0
**Last Updated**: 2026-02-21
**Status**: Comprehensive architecture overview

---

## INDEX

| Section | Description | Location |
|---------|-------------|----------|
| 1 | System Overview | [#System-Overview](#system-overview) |
| 2 | Package Inventory | [#Package-Inventory](#package-inventory) |
| 3 | Dependency Matrix | [#Dependency-Matrix](#dependency-matrix) |
| 4 | Data Flows | [#Data-Flows](#data-flows) |
| 5 | Security Boundaries | [#Security-Boundaries](#security-boundaries) |
| 6 | Architectural Patterns | [#Architectural-Patterns](#architectural-patterns) |
| 7 | Key Interfaces | [#Key-Interfaces](#key-interfaces) |
| 8 | Architecture Decision Records | [#ADRs](#architecture-decision-records-adrs) |

---

## System Overview

BonkLM is a framework-agnostic LLM security guardrails system designed to protect against prompt injection, jailbreaks, and other adversarial attacks. The architecture follows a modular plugin pattern with clear separation between validation logic, integration adapters, and observability features.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER APPLICATIONS                               │
│                   (Express, Fastify, NestJS, LangChain, etc.)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONNECTOR LAYER                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │    OpenAI   │ │  Anthropic  │ │   Ollama    │ │  Framework          │  │
│  │  Connector  │ │  Connector  │ │  Connector  │ │  Connectors         │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ │ (Express, Fastify,  │  │
│                                             ┌───┐  │  NestJS, LangChain) │  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │   │  └─────────────────────┘  │
│  │   Chroma    │ │  Pinecone   │ │ Qdrant  │ │   │                            │
│  │  Connector  │ │  Connector  │ │Connector│ │Weaviate│                           │
│  └─────────────┘ └─────────────┘ └─────────┘ └──────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADAPTER LAYER                                   │
│                    GuardrailAdapter Interface + BaseAdapter                   │
│                              AdapterRegistry                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENGINE LAYER                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         GuardrailEngine                               │  │
│  │  ┌──────────┐  ┌─────────┐  ┌───────┐  ┌────────┐  ┌────────────┐   │  │
│  │  │Validator │  │  Guard  │  │ Hooks │  │Session │  │ Telemetry  │   │  │
│  │  │ Chain    │  │ Chain   │  │       │  │Tracker │  │   Service  │   │  │
│  │  └──────────┘  └─────────┘  └───────┘  └────────┘  └────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Hook Sandbox (VM Isolation)                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VALIDATORS LAYER                                │
│  ┌───────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────────┐  │
│  │ Prompt        │ │  Jailbreak  │ │  Reformul-  │ │  Boundary         │  │
│  │ Injection     │ │  Detector   │ │  ation      │ │  Detector         │  │
│  └───────────────┘ └─────────────┘ └─────────────┘ └───────────────────┘  │
│  ┌───────────────┐ ┌─────────────┐                                          │  │
│  │  Multilingual │ │Text Normali-│                                          │  │
│  │   Patterns   │ │   zation    │                                          │  │
│  └───────────────┘ └─────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 GUARDS LAYER                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Secret    │ │     PII     │ │    XSS      │ │      Production      │  │
│  │   Guard     │ │   Guard     │ │   Guard     │ │       Guard          │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Bash Safety Guard                                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY LAYER                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        AttackLogger (Separate Package)                  │  │
│  │                   TelemetryService + MonitoringLogger                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Inventory

### Core Package

| Package | Purpose | Files | Status |
|---------|---------|-------|--------|
| `@blackunicorn/bonklm` | Main LLM security guardrails engine | 180 TS files | Active |

### LLM Provider Connectors

| Package | Purpose | Peer Dependency | Status |
|---------|---------|-----------------|--------|
| `@blackunicorn/bonklm-openai` | OpenAI SDK connector | `openai` | Active |
| `@blackunicorn/bonklm-anthropic` | Anthropic connector | `@anthropic-ai/sdk` | Active |
| `@blackunicorn/bonklm-ollama` | Ollama connector | `ollama` | Active |
| `@blackunicorn/bonklm-huggingface` | HuggingFace connector | `@huggingface/inference` | Active |
| `@blackunicorn/bonklm-vercel` | Vercel AI SDK connector | `ai` | Active |

### Vector Database Connectors

| Package | Purpose | Peer Dependency | Status |
|---------|---------|-----------------|--------|
| `@blackunicorn/bonklm-chroma` | ChromaDB connector | `chromadb` | Active |
| `@blackunicorn/bonklm-pinecone` | Pinecone connector | `@pinecone-database/pinecone` | Active |
| `@blackunicorn/bonklm-qdrant` | Qdrant connector | `@qdrant/js-client-rest` | Active |
| `@blackunicorn/bonklm-weaviate` | Weaviate connector | `weaviate-client` | Active |

### Framework Connectors

| Package | Purpose | Peer Dependency | Status |
|---------|---------|-----------------|--------|
| `@blackunicorn/bonklm-langchain` | LangChain integration | `@langchain/core` | Active |
| `@blackunicorn/bonklm-llamaindex` | LlamaIndex integration | `llamaindex` | Active |
| `@blackunicorn/bonklm-genkit` | Google GenKit integration | `genkit` | Active |
| `@blackunicorn/bonklm-copilotkit` | CopilotKit integration | `@copilotkit/react-core` | Active |
| `@blackunicorn/bonklm-mastra` | Mastra framework integration | `@mastra/core` | Active |
| `@blackunicorn/bonklm-mcp` | Model Context Protocol | `@modelcontextprotocol/sdk` | Active |

### Middleware & Framework Integration

| Package | Purpose | Peer Dependency | Status |
|---------|---------|-----------------|--------|
| `@blackunicorn/bonklm-express` | Express middleware | `express` | Active |
| `@blackunicorn/bonklm-fastify` | Fastify plugin | `fastify`, `fastify-plugin` | Active |
| `@blackunicorn/bonklm-nestjs` | NestJS module | `@nestjs/*` | Active |

### Supporting Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@blackunicorn/bonklm-logger` | Attack Logger & Awareness Display | Active |
| `@blackunicorn/bonklm-wizard` | CLI setup wizard (DEPRECATED) | Deprecated |

---

## Dependency Matrix

### Dependency Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPENDENCY TREE                                │
└─────────────────────────────────────────────────────────────────────────────┘

                                   @blackunicorn/bonklm (CORE)
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
   ┌─────────┐                     ┌─────────┐                       ┌──────────┐
   │ LLM     │                     │Vector DB│                       │Framework │
   │Provider │                     │Connectors                       │Connectors│
   │Connectors│                     │         │                       │          │
   └─────────┘                     └─────────┘                       └──────────┘
        │                                 │                                 │
        ├─────────┬─────────┬─────────┐   ├───────┬─────────┬────────┐   ├─────┬────────┐
        ▼         ▼         ▼         ▼   ▼       ▼         ▼        ▼   ▼     ▼        ▼
     OpenAI Anthropic Ollama HuggingFace Chroma Pinecone Qdrant Weaviate Express Fastify NestJS
```

### Internal Dependencies

- **All packages** depend on `@blackunicorn/bonklm` (core)
- **No circular dependencies** exist in the codebase
- **Connector packages** follow pattern: `@blackunicorn/bonklm` + peer dependency for target SDK

### External Dependency Categories

| Category | Dependencies |
|----------|--------------|
| **Validation** | `zod` (schema validation) |
| **Logging** | `pino`, `lru-cache` |
| **CLI** | `clack`, `commander`, `chalk` |
| **VM Security** | `vm2` |
| **Utilities** | `change-case`, `string_similarity` |

---

## Data Flows

### 1. Primary Request Flow

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ GuardrailEngine.validate(content, options)                  │
│  │                                                           │
│  ├─→ Check override token (bypass mechanism)               │
│  ├─→ Validate engine configuration                          │
│  │                                                           │
│  ├─→ VALIDATOR PHASE                                        │
│  │   ├─→ Text Normalization                                │
│  │   ├─→ Prompt Injection Detection                         │
│  │   ├─→ Jailbreak Detection                                │
│  │   ├─→ Reformulation Detection                            │
│  │   ├─→ Boundary Detection                                 │
│  │   └─→ Multilingual Pattern Detection                     │
│  │                                                           │
│  ├─→ GUARD PHASE                                            │
│  │   ├─→ Secret Detection                                   │
│  │   ├─→ PII Detection                                      │
│  │   ├─→ XSS Safety Check                                   │
│  │   ├─→ Bash Safety Validation                             │
│  │   └─→ Production Environment Check                       │
│  │                                                           │
│  ├─→ HOOK PHASE                                             │
│  │   ├─→ Before Validation Hooks                           │
│  │   ├─→ After Validation Hooks                            │
│  │   ├─→ Before Block Hooks                                │
│  │   └─→ After Allow Hooks                                 │
│  │                                                           │
│  └─→ RESULT AGGREGATION                                    │
│      ├─→ Merge individual results                          │
│      ├─→ Calculate risk score                              │
│      ├─→ Determine severity                                │
│      └─→ Apply short-circuit logic                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
EngineResult
  │ allowed: boolean
  │ blocked: boolean
  │ severity: Severity
  │ risk_level: RiskLevel
  │ risk_score: number
  │ findings: Finding[]
  └─→ Application Decision
```

### 2. Streaming Validation Flow (Planned)

```
Content Stream
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ StreamingValidator                                          │
│  │                                                           │
│  ├─→ Buffer chunks (configurable size)                      │
│  │                                                           │
│  ├─→ PERIODIC VALIDATION                                   │
│  │   ├─→ Every N chunks OR                                 │
│  │   ├─→ Every X milliseconds OR                           │
│  │   └─→ On token boundary                                 │
│  │                                                           │
│  ├─→ STATE TRACKING                                        │
│  │   ├─→ Accumulated content                              │
│  │   ├─→ Previous validation results                      │
│  │   └─→ Context across chunks                            │
│  │                                                           │
│  └─→ EARLY TERMINATION                                     │
│      └─→ If CRITICAL severity detected                     │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
Validated Stream
```

### 3. Hook Execution Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    HOOK EXECUTION LIFECYCLE                 │
└─────────────────────────────────────────────────────────────┘

Engine Validation Complete
         │
         ▼
Register Hook Callbacks
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Create Sandbox Context                                      │
│  ├─→ Security Level (strict/standard/permissive)           │
│  ├─→ Memory Limit (50MB default)                           │
│  ├─→ Timeout (30s default)                                 │
│  └─→ Allowed Globals (console, JSON, Math)                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Validate Hook Code (dangerous patterns)
         │
         ▼
Execute in VM (isolation)
         │
         ▼
Capture Result → Sanitize → Return
         │
         ▼
Update Audit Log (AttackLogger)
         │
         ▼
Fire Interception Events (TelemetryService)
```

### 4. Error Handling Flow

```
Validator/Guard Error
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Catch Block                                                 │
│  ├─→ Log error with context                                │
│  ├─→ Create CRITICAL severity result                       │
│  ├─→ Add error findings to result                          │
│  └─→ Continue processing (fail-safe)                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Create Critical Result
         │
         ▼
Short-circuit Process (if configured)
         │
         ▼
Trigger Error Hooks
         │
         ▼
Return Failure Response
```

### 5. Logging/Audit Flow

```
Validation Event
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Sanitize Content                                            │
│  ├─→ Remove sensitive data (PII, secrets)                  │
│  ├─→ Mask credentials                                      │
│  └─→ Truncate excessive content                            │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
Transform Entry
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Store in AttackLogStore (LRU Cache)                         │
│  ├─→ Maximum entries (1000 default)                        │
│  ├─→ TTL support (auto-cleanup)                            │
│  └─→ Session-based correlation                             │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
Update Session Counters
       │
       ▼
Emit Interception Events
       │
       ▼
Optional External Logging (user-provided callbacks)
```

### 6. Connector Integration Flow

```
CLI: bonklm wizard
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Environment Detection                                       │
│  ├─→ Check package.json for frameworks                     │
│  ├─→ Check environment variables                           │
│  └─→ Scan common TCP ports                                 │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
Framework/Service Detection
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Credential Detection                                       │
│  ├─→ Prompt for API keys                                  │
│  ├─→ Validate credentials                                 │
│  └─→ Store securely (.env with 0o600 permissions)         │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
Connector Selection
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Configuration Testing                                      │
│  ├─→ Stage 1: Connection test                             │
│  └─→ Stage 2: Validation test                             │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
Generate Integration Code
```

---

## Security Boundaries

### Trust Zone Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNTRUSTED ZONE                                      │
│  (User Input, External APIs, File System, Environment Variables)            │
└─────────────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐
│   CLI BOUNDARY      │ │  EXTERNAL API   │ │  FILE SYSTEM BOUNDARY        │
│  Input Validation   │ │   Boundary      │ │  Path Validation, Secure     │
│  Sanitization      │ │  Timeout, Size  │ │  Permissions (0o600)         │
└─────────────────────┘ └─────────────────┘ └─────────────────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SEMI-TRUSTED ZONE                                       │
│                     (Package Boundaries)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐
│   Core Package      │ │  Connectors     │ │  Framework Integrations     │
│  Validator Chain    │ │  Adapter        │ │  Middleware                 │
│  Guard Chain        │ │  Validation     │ │  Request/Response Wrap      │
└─────────────────────┘ └─────────────────┘ └─────────────────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TRUSTED ZONE                                           │
│               (GuardrailEngine Internal)                                    │
│  Hook Sandbox (VM Isolation), Session Tracking, Telemetry                   │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OUTPUT BOUNDARY                                        │
│                 (Redaction, Safe Logging)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Boundary Crossing Points

| Boundary | Entry Point | Validation | Controls |
|----------|-------------|------------|----------|
| **User Input → CLI** | `run.ts`, command handlers | Path validation, length limits, whitelist | No traversal, no null bytes, max 256 chars |
| **External API** | Connector implementations | Timeout, size limits, AbortSignal | 5s timeout, 1MB max input |
| **File System** | `env.ts`, audit utilities | Atomic operations, permissions | 0o600 files, mkdtemp for safety |
| **Package → Engine** | `GuardrailEngine.validate()` | Type guards, schema validation | Zod schemas, input size checks |
| **Engine → Output** | Result serialization | Sanitization, masking | Credential masking, stack trace filtering |

### Data Transformation at Boundaries

**Input Pipeline:**
1. Raw Input → Remove control chars → Normalize line endings → Trim whitespace
2. Structured Data → Safe JSON parse → Validate schema → Normalize format
3. Sensitive Data → Mask with timing-safe padding → Store separately

**Output Pipeline:**
1. Internal Data → Sanitize error messages → Mask credentials → Remove PII
2. Audit Data → HMAC signature → Compress if large → Store with TTL

---

## Architectural Patterns

### 1. Adapter Pattern

**Purpose**: Enable framework-agnostic integration

**Implementation:**
```typescript
interface GuardrailAdapter<TInput, TOutput, TContext> {
  initialize(context?: TContext): Promise<void>;
  validate(input: TInput): Promise<EngineResult>;
  transform(result: EngineResult): TOutput;
  destroy(): Promise<void>;
}
```

**Benefits:**
- Single core works with any framework
- Type-safe per-framework integrations
- Easy to add new framework support

### 2. Plugin Architecture

**Components:**
- Validators: Pluggable content-based checks
- Guards: Pluggable context-aware checks
- Hooks: User-defined custom logic

**Registration:**
```typescript
engine.registerValidator(new PromptInjectionValidator());
engine.registerGuard(new SecretGuard());
engine.registerHook({
  phase: HookPhase.AFTER_VALIDATION,
  callback: async (result) => { /* custom logic */ }
});
```

### 3. Strategy Pattern

**Execution Strategies:**
- Sequential validation (default)
- Parallel validation (performance)
- Short-circuit on block (security-first)
- Collect all results (comprehensive)

### 4. Observer Pattern

**Event Types:**
- Validation started
- Validation completed
- Threat detected
- Error occurred

**Subscribers:**
- AttackLogger
- TelemetryService
- User-provided callbacks

### 5. Decorator Pattern

**Usage:**
- Guards wrap base validation
- Middleware wraps HTTP requests
- Adapters wrap framework-specific types

### 6. Factory Pattern

**Builders:**
- `AdapterBuilder` - Fluent adapter configuration
- `EngineBuilder` - Engine setup helper

### 7. Proxy Pattern

**Usage:**
- Guarded wrappers for LLM clients
- Interception of all operations

---

## Key Interfaces

### Validator Interface

```typescript
interface Validator {
  name?: string;
  validate(content: string): GuardrailResult;
}
```

### Guard Interface

```typescript
interface Guard {
  name?: string;
  validate(content: string, context?: string): GuardrailResult;
}
```

### GuardrailResult Type

```typescript
interface GuardrailResult {
  allowed: boolean;
  blocked: boolean;
  severity: Severity;  // 'INFO' | 'WARNING' | 'CRITICAL'
  risk_level: RiskLevel;  // 'safe' | 'low' | 'medium' | 'high' | 'critical'
  risk_score: number;  // 0-100
  findings: Finding[];
  timestamp: string;
}

interface Finding {
  category: string;
  description: string;
  severity: Severity;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
```

### GuardrailAdapter Interface

```typescript
interface GuardrailAdapter<TInput, TOutput, TContext> {
  initialize(context?: TContext): Promise<void>;
  validate(input: TInput): Promise<EngineResult>;
  transform(result: EngineResult): TOutput;
  destroy(): Promise<void>;
}
```

### Hook Types

```typescript
enum HookPhase {
  BEFORE_VALIDATION = 'before_validation',
  AFTER_VALIDATION = 'after_validation',
  BEFORE_BLOCK = 'before_block',
  AFTER_ALLOW = 'after_allow'
}

interface Hook {
  phase: HookPhase;
  priority?: number;
  timeout?: number;
  callback: HookCallback;
}

type HookCallback = (context: HookContext) => Promise<HookResult | void>;
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Adapter Pattern for Connectors

**Status**: Active
**Date**: 2025-02-15
**Context**: Need framework-agnostic integration

**Decision**:
- Generic `GuardrailAdapter<TInput, TOutput, TContext>` interface
- BaseAdapter class with common functionality
- AdapterBuilder for fluent configuration

**Trade-offs**:
- ✅ Framework agnostic, type-safe
- ❌ Abstraction overhead, boilerplate

### ADR-002: Hook System Design

**Status**: Active
**Date**: 2025-02-15
**Context**: Need extensibility without core modifications

**Decision**:
- Priority-based hook execution
- VM-based sandbox isolation
- 4 execution phases

**Trade-offs**:
- ✅ Extensible, timeout protection
- ❌ Performance overhead, debugging complexity

### ADR-003: Validator vs Guard Separation

**Status**: Active
**Date**: 2025-02-15
**Context**: Different validation types need different approaches

**Decision**:
- Validators: Pure content-based checks
- Guards: Context-aware checks (file paths, environment)

**Trade-offs**:
- ✅ Clear separation of concerns
- ❌ Users must understand when to use each

### ADR-004: CLI → Core Merge

**Status**: Complete
**Date**: 2026-02-19
**Context**: Redundant wizard package

**Decision**:
- Move all CLI to `packages/core/src/cli/`
- Deprecate wizard package

**Trade-offs**:
- ✅ Eliminates duplication, single package
- ❌ Larger core, migration required

### ADR-005: Logger Package Separation

**Status**: Active
**Date**: 2026-02-20
**Context**: Specialized attack logging

**Decision**:
- Separate `@blackunicorn/bonklm-logger` package
- Optional dependency

**Trade-offs**:
- ✅ Optional, specialized
- ❌ Extra package, manual integration

### ADR-006: In-Memory Session Management

**Status**: Active
**Date**: 2025-02-16
**Context**: Detect multi-turn attacks

**Decision**:
- In-memory LRU storage
- Temporal decay (10-min half-life)
- 1-hour timeout

**Trade-offs**:
- ✅ Memory-efficient, detects multi-turn
- ❌ No persistence, lost on restart

---

## Performance Characteristics

### Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Short validator | <5ms | ~3ms |
| Medium validator | <10ms | ~7ms |
| Long validator | <20ms | ~15ms |
| Full engine (2 validators + 1 guard) | <100ms | ~50ms |

### Optimizations

- **Pattern timeout protection**: 100ms max per pattern
- **Parallel execution option**: For performance-critical apps
- **Short-circuit**: Stop on first CRITICAL finding
- **Input length limits**: 100,000 chars max
- **LRU caching**: Session tracking with automatic eviction

---

## Security Architecture

### Threat Model

| Threat | Protection | Status |
|--------|-----------|--------|
| Prompt Injection | Multi-layer detection | ✅ Active |
| Jailbreak | Pattern + fuzzy matching | ✅ Active |
| PII Leakage | PII guard with redaction | ⚠️ Partial |
| Secret Leakage | Secret detection | ✅ Active |
| Command Injection | Bash safety guard | ✅ Active |
| XSS | XSS safety guard | ✅ Active |
| DoS | Input limits, timeouts | ✅ Active |
| Multi-turn Attacks | Session tracking | ✅ Active |

### Security Controls

1. **Input Validation**: All boundaries validate input
2. **Sandboxing**: Hook execution in VM isolation
3. **Credential Security**: Timing-attack-resistant masking
4. **File Permissions**: 0o600 for sensitive files
5. **Audit Trail**: HMAC-signed logs
6. **Fail-Safe**: Errors default to blocking

---

## Extensibility Points

### Adding a Validator

```typescript
import { Validator, GuardrailResult } from '@blackunicorn/bonklm';

class CustomValidator implements Validator {
  name = 'custom-validator';

  validate(content: string): GuardrailResult {
    // Your validation logic
    return {
      allowed: true,
      blocked: false,
      severity: 'INFO',
      risk_level: 'safe',
      risk_score: 0,
      findings: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Register with engine
engine.registerValidator(new CustomValidator());
```

### Adding a Guard

```typescript
import { Guard, GuardrailResult } from '@blackunicorn/bonklm';

class CustomGuard implements Guard {
  name = 'custom-guard';

  validate(content: string, context?: string): GuardrailResult {
    // Your guard logic with context awareness
    return {
      allowed: true,
      blocked: false,
      severity: 'INFO',
      risk_level: 'safe',
      risk_score: 0,
      findings: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Register with engine
engine.registerGuard(new CustomGuard());
```

### Adding a Hook

```typescript
engine.registerHook({
  phase: HookPhase.AFTER_VALIDATION,
  priority: 10,
  callback: async (context) => {
    // Custom logic after validation
    console.log('Validation result:', context.result);
  }
});
```

---

*End of BonkLM Architecture Documentation*
