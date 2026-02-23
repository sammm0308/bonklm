# BonkLM Technical Architecture

> **Product**: BonkLM (`@blackunicorn/bonklm`)
> **Version**: 1.0.0
> **Status**: Planning
> **Last Updated**: 2025-02-16

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Package Structure](#package-structure)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Extension Points](#extension-points)
6. [Connector Architecture](#connector-architecture)
7. [Performance Considerations](#performance-considerations)

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Application Layer                          │
│  (Express, Fastify, NestJS, Vercel AI SDK, LangChain, etc.)        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BonkLM Layer                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                        GuardrailEngine                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │ │
│  │  │ Validators  │  │   Guards    │  │      Hooks          │   │ │
│  │  │             │  │             │  │                     │   │ │
│  │  │ • Prompt    │  │ • Secret    │  │ • Pre-validate      │   │ │
│  │  │   Injection │  │ • PII       │  │ • Post-validate     │   │ │
│  │  │ • Jailbreak │  │ • Bash      │  │ • Custom logic      │   │ │
│  │  │ • Reformul. │  │ • XSS       │  │                     │   │ │
│  │  │ • Boundary  │  │ • Production│  │                     │   │ │
│  │  │ • Multilang │  │             │  │                     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      Session Tracker                          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      Pattern Engine                           │ │
│  │  • 35+ pattern categories  • Multi-layer encoding detection  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      Text Normalizer                          │ │
│  │  • Unicode normalization  • Confusable detection              │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          LLM Provider Layer                         │
│  (OpenAI, Anthropic, Local models, HuggingFace, etc.)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Framework Agnostic** | No dependencies on specific frameworks |
| **Zero Runtime Dependencies** | Minimal dependencies for small bundle size |
| **Tree Shakable** | Import only what you need |
| **Extensible** | Hook system for custom validators |
| **Type Safe** | Full TypeScript support |
| **Testable** | Pure functions where possible |

---

## Package Structure

### Monorepo Layout

```
bonklm/
├── packages/
│   ├── core/                          # Main package
│   │   ├── src/
│   │   │   ├── base/                  # Base types and interfaces
│   │   │   ├── validators/            # Security validators
│   │   │   ├── guards/                # Context-aware guards
│   │   │   ├── hooks/                 # Hook system
│   │   │   ├── session/               # Session tracking
│   │   │   ├── engine/                # GuardrailEngine
│   │   │   ├── adapters/              # Adapter types
│   │   │   └── common/                # Shared utilities
│   │   └── package.json               # @blackunicorn/bonklm
│   │
│   ├── openclaw-adapter/              # OpenClaw integration
│   │   └── package.json               # @blackunicorn/bonklm-openclaw
│   │
│   ├── vercel-ai-sdk-adapter/         # Planned
│   ├── openai-adapter/                # Planned
│   ├── mcp-adapter/                   # Planned
│   ├── anthropic-adapter/             # Planned
│   ├── langchain-adapter/             # Planned
│   ├── express-middleware/            # Planned
│   ├── fastify-plugin/                # Planned
│   └── nestjs-module/                 # Planned
│
├── packages/examples/                 # Usage examples
│   ├── basic-validation/
│   ├── multi-validator/
│   ├── streaming/
│   └── custom-validator/
│
├── docs/
│   └── user/                          # Public documentation
│
└── team/                              # Internal (gitignored)
    ├── planning/
    ├── implementation/
    ├── qa/
    └── security/
```

### Core Package Exports

```typescript
// Main entry point
export * from './base/index.js';        // Types, interfaces
export * from './validators/index.js';  // All validators
export * from './guards/index.js';      // All guards
export * from './hooks/index.js';       // Hook system
export * from './session/index.js';     // Session tracking
export * from './engine/index.js';      // GuardrailEngine
export * from './adapters/index.js';    // Adapter types
export * from './common/index.js';      // Utilities
```

### Subpath Exports

```typescript
import { validatePromptInjection } from '@blackunicorn/bonklm/validators';
import { SecretGuard } from '@blackunicorn/bonklm/guards';
import { HookManager } from '@blackunicorn/bonklm/hooks';
```

---

## Core Components

### 1. Base Types

Location: `packages/core/src/base/`

```typescript
// GuardrailResult - Standard result format
interface GuardrailResult {
  allowed: boolean;
  blocked: boolean;
  severity: 'info' | 'warning' | 'blocked' | 'critical';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  findings: Finding[];
  timestamp: number;
  reason?: string;
}

// GenericLogger - Logger interface
interface Logger {
  debug(message: string, meta?: object): void;
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
}

// ValidatorConfig - Common validator config
interface ValidatorConfig {
  sensitivity?: 'strict' | 'standard' | 'permissive';
  action?: 'block' | 'sanitize' | 'log' | 'allow';
  logger?: Logger;
}
```

### 2. Validators

Location: `packages/core/src/validators/`

| Component | File | Responsibility |
|-----------|------|----------------|
| **PatternEngine** | `pattern-engine.ts` | Core pattern matching with 35+ categories |
| **TextNormalizer** | `text-normalizer.ts` | Unicode normalization, confusable detection |
| **PromptInjectionValidator** | `prompt-injection.ts` | Prompt injection detection |
| **JailbreakValidator** | `jailbreak.ts` | Jailbreak pattern detection |
| **ReformulationDetector** | `reformulation-detector.ts` | Encoding/format attacks |
| **BoundaryDetector** | `boundary-detector.ts` | Boundary violation detection |
| **MultilingualPatterns** | `multilingual-patterns.ts` | Non-English pattern detection |

### 3. Guards

Location: `packages/core/src/guards/`

| Component | File | Responsibility |
|-----------|------|----------------|
| **SecretGuard** | `secret.ts` | API key, token, credential detection |
| **PIIGuard** | `pii/index.ts` | PII detection (emails, SSN, etc.) |
| **BashSafetyGuard** | `bash-safety.ts` | Bash command injection |
| **XSSSafetyGuard** | `xss-safety.ts` | XSS pattern detection |
| **ProductionGuard** | `production.ts` | Environment-specific checks |

### 4. GuardrailEngine

Location: `packages/core/src/engine/GuardrailEngine.ts`

```typescript
class GuardrailEngine {
  constructor(config: GuardrailEngineConfig)

  // Main validation method
  async validate(content: string, context?: string): Promise<EngineResult>

  // Dynamic configuration
  addValidator(validator: Validator): void
  addGuard(guard: Guard): void
  removeValidator(name: string): boolean
  removeGuard(name: string): boolean

  // Inspection
  getValidators(): Validator[]
  getGuards(): Guard[]
  getStats(): EngineStats
}
```

### 5. Hook System

Location: `packages/core/src/hooks/`

```typescript
class HookManager {
  // Register hooks
  on(event: 'pre-validate', handler: (content: string) => string | Promise<string>)
  on(event: 'post-validate', handler: (result: GuardrailResult) => void)

  // Execute hooks
  async executePreValidate(content: string): Promise<string>
  async executePostValidate(result: GuardrailResult): Promise<void>
}

class HookSandbox {
  // Isolated execution environment for custom hooks
  execute<T>(fn: () => T): T
}
```

### 6. Session Tracking

Location: `packages/core/src/session/`

```typescript
class SessionTracker {
  // Track validation state
  createSession(): string
  getSession(id: string): SessionState | undefined
  updateSession(id: string, state: Partial<SessionState>): void
  deleteSession(id: string): void
}
```

---

## Data Flow

### Validation Flow

```
┌────────────────┐
│ User Input     │
│ (content)      │
└────────┬───────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              GuardrailEngine.validate()                 │
└─────────────────────────────────────────────────────────┘
         │
         ├─► Check override token
         │   └─► Bypass if present
         │
         ├─► Execute pre-validate hooks
         │   └─► Transform content
         │
         ├─► Run validators (sequential or parallel)
         │   ├─► PromptInjectionValidator
         │   ├─► JailbreakValidator
         │   ├─► ReformulationDetector
         │   └─► ... (short-circuit if blocked)
         │
         ├─► Run guards
         │   ├─► SecretGuard
         │   ├─► PIIGuard
         │   └─► ... (short-circuit if blocked)
         │
         ├─► Aggregate results
         │   └─► Calculate risk score, severity
         │
         └─► Execute post-validate hooks
             └─► Log, metrics, etc.
         │
         ▼
┌────────────────┐
│ EngineResult   │
│ (allowed?,     │
│  findings,     │
│  risk_score)   │
└────────────────┘
```

### Risk Score Calculation

```
Total Risk Score = Σ(Individual Validator Scores)

Risk Level:
  LOW    : 0 - 9
  MEDIUM : 10 - 24
  HIGH   : 25+

Severity (max of all):
  INFO     : No findings
  WARNING  : Findings but allowed
  BLOCKED  : Action=block and blocked
  CRITICAL : System error
```

---

## Extension Points

### Custom Validator

```typescript
import { Validator, GuardrailResult } from '@blackunicorn/bonklm';

class CustomValidator implements Validator {
  name = 'custom-validator';

  validate(content: string): GuardrailResult {
    // Custom validation logic
    if (content.includes('forbidden')) {
      return {
        allowed: false,
        blocked: true,
        severity: 'blocked',
        risk_level: 'HIGH',
        risk_score: 50,
        findings: [{
          category: 'custom',
          severity: 'blocked',
          description: 'Forbidden content detected'
        }],
        timestamp: Date.now()
      };
    }

    return {
      allowed: true,
      blocked: false,
      severity: 'info',
      risk_level: 'LOW',
      risk_score: 0,
      findings: [],
      timestamp: Date.now()
    };
  }
}
```

### Custom Hook

```typescript
import { HookManager } from '@blackunicorn/bonklm/hooks';

const hooks = new HookManager();

// Pre-validate hook: transform content
hooks.on('pre-validate', async (content) => {
  return content.trim();
});

// Post-validate hook: log results
hooks.on('post-validate', async (result) => {
  console.log(`Validation result: ${result.allowed}`);
  await sendToMetrics(result);
});
```

---

## Connector Architecture

### Connector Interface

All connectors implement a common interface:

```typescript
interface Connector {
  // Initialize connector with framework/app
  init(app: any, config?: ConnectorConfig): void;

  // Create middleware/hook for framework
  createMiddleware(options?: MiddlewareOptions): Middleware;

  // Clean up resources
  destroy(): void;
}
```

### Connector Patterns

#### 1. Middleware Pattern (Express, Fastify)

```typescript
// Express
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';

app.use('/api', createGuardrailsMiddleware({
  validators: [new PromptInjectionValidator()]
}));
```

#### 2. Provider Wrapper Pattern (OpenAI, Anthropic)

```typescript
// OpenAI
import { createOpenAIGuardrails } from '@blackunicorn/bonklm-openai';

const guardedOpenAI = createOpenAIGuardrails(new OpenAI(), {
  validators: [new JailbreakValidator()]
});

const response = await guardedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: userInput }]
});
```

#### 3. SDK Integration Pattern (Vercel AI SDK)

```typescript
// Vercel AI SDK
import { createVercelGuardrails } from '@blackunicorn/bonklm-vercel';

const guardrails = createVercelGuardrails({
  validateStreaming: true
});

export const runtime = 'edge';
export const { actions } = createAI({
  actions: {
    guardrails
  }
});
```

#### 4. Chain Callback Pattern (LangChain)

```typescript
// LangChain
import { createLangChainGuardrails } from '@blackunicorn/bonklm-langchain';

const guardrailsCallback = createLangChainGuardrails({
  validators: [new PromptInjectionValidator()]
});

await chain.call(input, {
  callbacks: [guardrailsCallback]
});
```

---

## Performance Considerations

### Optimization Strategies

| Strategy | Implementation |
|----------|----------------|
| **Lazy Loading** | Tree-shakeable exports, import only what's needed |
| **Parallel Execution** | Run validators in parallel when possible |
| **Short-Circuit** | Stop on first detection when configured |
| **Pattern Caching** | Compile regex patterns once at startup |
| **Streaming Validation** | Validate chunks in real-time for streaming responses |

### Benchmarking Goals

| Metric | Target |
|--------|--------|
| **Single validator** | <5ms per validation |
| **Full engine (3 validators)** | <15ms per validation |
| **Memory overhead** | <5MB additional memory |
| **Bundle size** | <100KB minified + gzipped |

### Streaming Support

For streaming LLM responses, validate chunks incrementally:

```typescript
import { StreamingValidator } from '@blackunicorn/bonklm/examples/streaming';

const validator = new StreamingValidator(
  [new PromptInjectionValidator()],
  [],
  { validateEveryNChunks: 5 }
);

for await (const chunk of llmStream) {
  const { shouldTerminate, result } = await validator.processChunk(chunk);

  if (shouldTerminate) {
    console.log('Stream blocked:', result?.reason);
    break;
  }

  // Forward safe chunk to user
  process.stdout.write(chunk);
}
```

---

## Security Considerations

### Attack Vectors Covered

| Vector | Detection | Component |
|--------|-----------|-----------|
| **Prompt Injection** | ✅ | PromptInjectionValidator |
| **Jailbreak** | ✅ | JailbreakValidator |
| **Encoding Evasion** | ✅ | ReformulationDetector |
| **Boundary Violation** | ✅ | BoundaryDetector |
| **Secret Leakage** | ✅ | SecretGuard |
| **PII Leakage** | ✅ | PIIGuard |
| **Command Injection** | ✅ | BashSafetyGuard |
| **XSS** | ✅ | XSSSafetyGuard |

### Security Best Practices

1. **Validate on both input and output** - Protect against LLM returning harmful content
2. **Use strict mode in production** - Permissive mode for development only
3. **Log all violations** - For audit and analysis
4. **Regular pattern updates** - Subscribe to security updates
5. **Rate limit validations** - Prevent abuse of the guardrails themselves

---

## Reference Implementation

See [README.md](../../README.md) for usage examples.
