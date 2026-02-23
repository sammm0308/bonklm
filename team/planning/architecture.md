---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - prd.md
  - npm-Package-Architecture-Research.md
  - BonkLM-Research.md
  - Codebase-Architecture-Analysis.md
workflowType: 'architecture'
project_name: 'BonkLM'
user_name: 'J'
date: '2026-02-18'
documentCounts: {
  prdCount: 1,
  researchCount: 3,
  uxCount: 0,
  projectDocsCount: 1
}
---

# Architecture Decision Document - BonkLM Installation Wizard

**Author:** J
**Date:** 2026-02-18
**Status:** In Progress

## Document Metadata

This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together.

### Input Documents Loaded

| Document | Source | Purpose |
|----------|--------|---------|
| PRD | `_bmad-output/planning-artifacts/prd.md` | Product requirements, user journeys, FRs, NFRs |
| npm Package Architecture Research | `team/planning/npm-Package-Architecture-Research.md` | Plugin patterns, type-safe interfaces, distribution best practices |
| BonkLM Research | *Agent Research* | Market analysis, OWASP LLM Top 10, threat categories, detection patterns |
| Codebase Architecture Analysis | *Agent Research* | Current architecture, existing validators/guards, tech stack |

---

## Initialization Summary

**Welcome J!** I've set up your Architecture workspace for BonkLM.

**Documents Found:**

- PRD: 1 file loaded
- UX Design: None found
- Research: 3 research documents loaded (npm architecture, LLM guardrails landscape, codebase analysis)
- Project docs: 1 file (README)
- Project context: None found

**Files loaded:**
- `prd.md` - Complete product requirements with 50 functional requirements
- `npm-Package-Architecture-Research.md` - Plugin architecture patterns from ESLint, Webpack, Rollup, Babel
- BonkLM Research (agent-generated) - Market analysis, OWASP Top 10, detection engine patterns
- Codebase Architecture Analysis (agent-generated) - Current monorepo structure, validator/guard systems

**Ready to begin architectural decision making.**

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The Installation Wizard requires 50 functional capabilities organized into 10 categories:

1. **Environment Detection (FR1-FR5)**: Auto-discovery of frameworks (Express, Fastify, NestJS, LangChain), local services (Ollama on :11434), Docker containers, and API keys in environment variables.

2. **Connector Management (FR6-FR11)**: Add, remove, view, test, and validate connectors with auto-generated code snippets.

3. **Credential Management (FR12-FR16)**: Secure credential collection, API validation, .env storage with masking, and update capabilities.

4. **Connection Testing (FR17-FR22)**: Two-tier validation - connectivity testing + sample guardrail execution with clear pass/fail indicators and actionable error messages.

5. **Wizard Interface (FR23-FR27)**: Interactive setup with progress indicators, pre-selected defaults, colored terminal output.

6. **CLI Operations (FR28-FR32)**: Wizard command, connector subcommands, status display, exit codes, and non-interactive flags.

7. **Extensibility (FR33-FR36)**: Plugin architecture for new connectors with per-connector detection rules, test procedures, and configuration schemas.

8. **Configuration Persistence (FR37-FR40)**: .env file read/write/merge with format validation.

9. **Error Handling (FR41-FR45)**: Service unavailability detection, credential validation, recovery suggestions, graceful degradation.

10. **Output & Reporting (FR46-FR50)**: Tabular/JSON status display, timing information, summary statistics, diagnostic logging.

**Non-Functional Requirements:**

Critical NFRs driving architectural decisions:

| Category | Requirements | Architectural Impact |
|----------|--------------|---------------------|
| **Performance** | &lt; 2min wizard, &lt; 10s detection, &lt; 5s per connector test | Parallel detection, optimized test execution |
| **Security** | No plain text keys, no logging of credentials, restrictive .env permissions | Secure prompts, output masking, file permission management |
| **Reliability** | 100% detection accuracy, graceful uncertainty, network timeout handling | Verification before presentation, "Unsure?" fallback |
| **Compatibility** | macOS/Linux/Windows (WSL+native), Node 18+, CI/CD no-TTY | Cross-platform Node APIs, terminal capability detection |
| **Usability** | No docs needed for completion, actionable errors, 80-160 char width | Clear error messages, responsive terminal output |

**Scale & Complexity:**

- Primary domain: CLI Tool / Developer Utility
- Complexity level: Medium
- Estimated architectural components: 8-10 major components
- Connector target: 19 (5 for MVP, extensible to all)

### Technical Constraints & Dependencies

**Existing Codebase Constraints:**

1. **Zero Runtime Dependencies** - Core package philosophy must be maintained
2. **TypeScript 5.3.3, ESM-only** - Module: NodeNext, strict type checking enabled
3. **Node.js 18+** - Engine requirement for modern APIs
4. **Monorepo Structure** - pnpm workspaces with packages/ and adapters/ directories
5. **Existing Connector Packages** - 15+ existing connectors must integrate with wizard

**Integration Requirements:**

1. **Existing GuardrailEngine** - Must use existing validation engine for testing
2. **Existing Validators/Guards** - PromptInjectionValidator, JailbreakValidator, SecretGuard, PIIGuard
3. **SessionTracker** - May leverage for multi-turn detection during testing
4. **HookSandbox** - VM-based isolation available for custom connector logic

**Platform Constraints:**

1. **Cross-Platform Detection** - Port scanning, Docker detection must work on macOS/Linux/Windows
2. **Terminal Compatibility** - Graceful degradation for no-color, no-TTY (CI/CD)
3. **File System** - .env handling with proper permission management across platforms

### Cross-Cutting Concerns Identified

**Security:**
- Credential handling throughout the application lifecycle
- API key validation without external leakage
- .env file permission management (owner read/write only)
- No credential logging or diagnostic output

**Extensibility:**
- Plugin architecture enabling community connector contributions
- Detection rule system per connector type
- Test procedure abstraction for different connector protocols
- Configuration schema validation

**Reliability:**
- 100% detection accuracy requirement drives verification-first architecture
- Partial failure handling (some connectors fail shouldn't block wizard)
- Network timeout resilience
- Graceful uncertainty when detection cannot be certain

**Compatibility:**
- Cross-platform service detection (port scanning varies by OS)
- Terminal capability detection (colors, width, TTY)
- CI/CD environment handling (non-interactive mode)

---

## Starter Template Evaluation

### Primary Technology Domain

**CLI Tool / Developer Utility** - Extending existing npm package with interactive setup wizard

### CLI Framework Options Considered

| Framework | Type | Zero-Dep Aligned | TypeScript | Wizard UX | Verdict |
|-----------|------|------------------|------------|-----------|---------|
| **Commander.js** | CLI Parser | ✅ Minimal | ✅ Excellent | ⚠️ Basic | ⭐⭐⭐ SELECTED |
| **Oclif** | Full Framework | ❌ Heavy | ✅ Excellent | ⚠️ Complex | ❌ Overkill |
| **Yargs** | Parser + Utils | ⚠️ Medium | ✅ Good | ⚠️ Basic | ❌ Too verbose |
| **Clack** | Terminal UI | ✅ Minimal | ✅ Excellent | ✅ Beautiful | ⭐⭐⭐⭐ SELECTED |
| **Inquirer.js** | Terminal UI | ⚠️ Medium | ✅ Good | ✅ Mature | ⚪ Backup option |

### Selected Approach: Commander.js + Clack

**Rationale for Selection:**

1. **Philosophy Alignment**: Both packages are lightweight and respect the zero-dependency approach
2. **Developer Experience**: Clack provides modern, beautiful terminal UI (spinners, progress bars, colors)
3. **TypeScript First**: Both have native TypeScript support with strict mode compatibility
4. **Community Adoption**: Commander.js powers 80K+ packages; Clack is rapidly growing
5. **Maintainability**: Simple APIs, clear patterns, easy to onboard contributors

**Installation Commands:**

```bash
# Core CLI framework
pnpm add commander

# Terminal UI for wizard interactions
pnpm add clack

# Type definitions (included with both packages)
```

**Architectural Decisions Provided:**

**Language & Runtime:**
- TypeScript 5.3.3 with strict mode (existing)
- ESM module system (NodeNext)
- Node.js 18+ target (existing)

**CLI Structure:**
- Binary entry point: `packages/wizard/bin/run.ts`
- Command structure: `wizard|connector add|connector test|status`
- Flag support: `--yes` (non-interactive), `--json` (output format)

**Terminal UI (Clack):**
- Intro/outro screens for branded experience
- Multi-select prompts for connector selection
- Password prompts for API keys (masked)
- Spinners for detection/testing phases
- Progress bars for long operations

**Code Organization:**
```
packages/wizard/
├── bin/
│   └── run.ts              # CLI entry point
├── src/
│   ├── commands/           # Command handlers
│   │   ├── wizard.ts       # Main wizard command
│   │   ├── connector-add.ts
│   │   ├── connector-test.ts
│   │   └── status.ts
│   ├── detection/          # Detection engine
│   │   ├── framework.ts    # package.json detection
│   │   ├── services.ts     # Port/Docker detection
│   │   └── credentials.ts  # Environment detection
│   ├── connectors/         # Connector plugin system
│   │   ├── base.ts         # Connector interface
│   │   └── implementations/
│   ├── testing/            # Validation framework
│   │   └── validator.ts    # Connection + query testing
│   └── config/             # Configuration management
│       └── env.ts          # .env file handling
└── package.json
```

**Development Experience:**
- Hot reload via `tsx` for development
- Vitest for testing (existing infrastructure)
- TypeScript path aliases for clean imports

**Note:** Package setup and CLI scaffolding should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ✅ Detection Engine Architecture: Sequential Phased Detection
- ✅ Connector Plugin System: Functional Schema (Zod-based)
- ✅ Configuration Management: dotenv + Custom Merge
- ✅ Security/Credential Handling: Clack Password Prompts

**Important Decisions (Shape Architecture):**
- ✅ CLI Framework: Commander.js + Clack
- ✅ Testing Strategy: Vitest (existing infrastructure)
- ✅ Error Handling: Graceful degradation with actionable messages

**Deferred Decisions (Post-MVP):**
- Telemetry/Analytics: Not needed for MVP
- Shell Completion: User demand will dictate
- Connector Recommendation Engine: Phase 3 feature

---

### Decision Details

#### 1. Detection Engine Architecture

| Field | Value |
|-------|-------|
| Decision | Sequential Phased Detection |
| Phases | Framework → Services → Credentials |
| Rationale | Simpler error handling, predictable execution flow, easier debugging, clear progress mapping |
| Affects | Detection engine, UX progress indicators, error recovery |

**Architecture:**
```
Phase 1: Framework Detection (package.json parsing)
  ├─ Express, Fastify, NestJS, LangChain detection
  └─ Returns: Detected frameworks with versions

Phase 2: Service Detection (port scanning + Docker)
  ├─ Ollama (localhost:11434)
  ├─ Vector DBs (Chroma, Weaviate, Qdrant)
  └─ Returns: Running services with availability status

Phase 3: Credential Detection (environment variables)
  ├─ API keys in process.env
  └─ Returns: Found credentials with validation status
```

---

#### 2. Connector Plugin System

| Field | Value |
|-------|-------|
| Decision | Functional Schema (Zod-based) |
| Rationale | Simplicity, zero app performance impact, easy community contributions, minimal boilerplate (~15 LOC/connector) |
| Affects | Connector definitions, contributor experience, wizard performance |

**Interface Definition:**
```typescript
interface ConnectorDefinition {
  id: string;
  name: string;
  category: 'llm' | 'framework' | 'vector-db';
  detection: {
    packageJson?: string[];      // Dependencies to check
    envVars?: string[];          // Environment variables
    ports?: number[];            // Ports to check
    dockerContainers?: string[]; // Docker container names
  };
  test: (config: Record<string, string>) => Promise<TestResult>;
  generateSnippet: (config: Record<string, string>) => string;
  configSchema: z.ZodSchema;     // Configuration validation
}

interface TestResult {
  connection: boolean;
  validation: boolean;
  error?: string;
  latency?: number;
}
```

**Example Connector Definition:**
```typescript
export const openaiConnector: ConnectorDefinition = {
  id: 'openai',
  name: 'OpenAI',
  category: 'llm',
  detection: {
    envVars: ['OPENAI_API_KEY'],
  },
  test: async (config) => {
    // Validate API key with OpenAI
    // Run sample guardrail check
  },
  generateSnippet: (config) => `
import { GuardrailEngine } from '@blackunicorn/bonklm';
import { openaiConnector } from '@blackunicorn/bonklm/openai-connector';

const engine = new GuardrailEngine({
  connectors: [openaiConnector({ apiKey: process.env.OPENAI_API_KEY })]
});
  `,
  configSchema: z.object({
    apiKey: z.string().startsWith('sk-'),
  }),
};
```

---

#### 3. Configuration Management

| Field | Value |
|-------|-------|
| Decision | dotenv + Custom Merge |
| Dependencies | `dotenv` (proven parsing) |
| Rationale | Battle-tested parsing, minimal dependencies, custom merge gives us control |

**Architecture:**
```typescript
class EnvManager {
  // Read and parse .env file
  read(path: string): Record<string, string>;

  // Merge new entries without overwriting existing
  merge(existing: Record<string, string>, new: Record<string, string>): Record<string, string>;

  // Write to .env with proper permissions (0600)
  write(path: string, content: string): Promise<void>;

  // Mask values for display
  mask(value: string): string;

  // Validate format
  validate(content: string): boolean;
}
```

**File Permissions:**
- Create new .env: `0o600` (owner read/write only)
- Respect existing .env permissions
- Cross-platform: Node.js `fs.promises.chmod()`

---

#### 4. Security & Credential Handling

| Field | Value |
|-------|-------|
| Decision | Clack Password Prompts |
| Rationale | Native masked input, no extra code, aligns with simplicity principle |

**Security Measures:**
```typescript
// Secure credential collection
const apiKey = await password({
  message: 'Enter your OpenAI API key:',
  validate: (value) => {
    if (!value.startsWith('sk-')) return 'Invalid API key format';
    return true;
  }
});

// Immediate validation, then clear
const result = await validateApiKey(apiKey);
apiKey = null; // Clear from memory

// Never log credentials
logger.log('Testing connector...', { apiKey: '***REDACTED***' });

// Masked display
console.log(`OpenAI: ${maskKey('sk-...abc')}`);
```

**Security Checklist:**
- ✅ No plain text display in terminal
- ✅ No logging of credentials
- ✅ Immediate validation, then memory clear
- ✅ Restrictive .env file permissions (0600)
- ✅ No external leakage during validation

---

### Decision Impact Analysis

**Implementation Sequence:**

1. **Foundation First:**
   - CLI scaffolding (Commander.js + Clack)
   - EnvManager (dotenv + custom merge)
   - Base Connector interface

2. **Detection Engine:**
   - Framework detection (package.json)
   - Service detection (port scanning)
   - Credential detection (environment)

3. **Connector System:**
   - Functional schema definition
   - 5 MVP connectors (OpenAI, Anthropic, Ollama, Express, LangChain)
   - Test framework

4. **Wizard UX:**
   - Sequential phased detection UI
   - Progress indicators
   - Secure credential prompts

**Cross-Component Dependencies:**

```
CLI Commands → Detection Engine → Connector System → Test Framework
     ↓              ↓                  ↓               ↓
   Clack         EnvManager      ConnectorSchema   GuardrailEngine
     ↓              ↓                  ↓               ↓
Terminal UX   .env read/write    Plugin Registry   Validation
```

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 areas where AI agents could make different choices that would cause inconsistencies.

### Naming Patterns

**Code Naming Conventions:**

| Type | Convention | Example |
|------|------------|---------|
| Files | `kebab-case.ts` | `env-manager.ts`, `connector-add.ts` |
| Functions | `camelCase` | `detectFrameworks()`, `validateCredential()` |
| CLI Commands | `kebab-case` | `connector add`, `connector test` |
| Interfaces/Types | `PascalCase` | `ConnectorDefinition`, `TestResult` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_TIMEOUT`, `MAX_RETRIES` |

**Rationale:** Matches Node.js ecosystem conventions and existing BonkLM codebase patterns.

### Structure Patterns

**Project Organization:**

```
packages/wizard/
├── bin/
│   └── run.ts                    # CLI entry point
├── src/
│   ├── commands/                 # Command handlers
│   │   ├── wizard.ts            # Main wizard command
│   │   ├── connector-add.ts     # Add connector command
│   │   ├── connector-test.ts    # Test connector command
│   │   └── status.ts            # Status display command
│   │   └── *.test.ts            # Co-located tests
│   ├── detection/               # Detection engine
│   │   ├── framework.ts         # Framework detection
│   │   ├── services.ts          # Service/port detection
│   │   ├── credentials.ts       # Credential detection
│   │   └── *.test.ts            # Co-located tests
│   ├── connectors/              # Connector plugin system
│   │   ├── base.ts              # Base interface
│   │   ├── registry.ts          # Plugin registry
│   │   └── implementations/      # Connector definitions
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       └── *.test.ts
│   ├── testing/                 # Validation framework
│   │   └── validator.ts
│   ├── config/                  # Configuration management
│   │   ├── env.ts               # .env file handling
│   │   └── *.test.ts
│   └── utils/                   # Shared utilities
│       ├── logger.ts            # Secure logging
│       ├── mask.ts              # Credential masking
│       └── terminal.ts          # Terminal capabilities
└── package.json
```

**Test Organization:**
- **Unit tests:** Co-located with source files (`*.test.ts`)
- **Integration tests:** `tests/integration/` directory
- **Fixture data:** `tests/fixtures/` directory

### Format Patterns

**CLI Output Formats:**

| Mode | Format | Use Case |
|------|--------|----------|
| Interactive | Colored, formatted (Clack) | Default user experience |
| JSON | Structured, parsable | CI/CD, programmatic consumption |
| Exit Codes | 0/1/2 | Script integration |

**Exit Code Convention:**
```typescript
const ExitCode = {
  SUCCESS: 0,           // All operations completed
  ERROR: 1,             // Operation failed
  PARTIAL: 2,           // Some operations succeeded, some failed
} as const;
```

**JSON Output Format:**
```typescript
interface JsonOutput {
  success: boolean;
  exitCode: 0 | 1 | 2;
  data?: {
    detected: DetectedInfo[];
    tested: TestResult[];
    configured: string[];
  };
  error?: {
    code: string;
    message: string;
    suggestion?: string;
  };
  timing: {
    detection: number;
    testing: number;
    total: number;
  };
}
```

### Communication Patterns

**Error Result Wrapper:**
```typescript
interface WizardError {
  code: string;              // e.g., 'ENV_READ_FAILED', 'API_KEY_INVALID'
  message: string;           // User-friendly message
  suggestion?: string;       // Actionable next step
  cause?: Error;             // Original error (for debugging)
  exitCode?: 1 | 2;          // Exit code for CLI
}

// Throwing errors
throw new WizardError('ENV_READ_FAILED', {
  message: 'Could not read .env file',
  suggestion: 'Check file permissions and ensure .env exists',
  exitCode: 1
});
```

**Event Naming (internal):**
- Use past tense for events: `connectorDetected`, `credentialValidated`
- Payload includes event type and timestamp

### Process Patterns

**Error Handling:**
```typescript
// ✅ CORRECT - Structured error handling
try {
  await detectServices();
} catch (error) {
  throw new WizardError('SERVICE_DETECTION_FAILED', {
    message: 'Failed to detect running services',
    suggestion: 'Check that Docker is running and containers are accessible',
    cause: error,
    exitCode: 2 // Partial - other detections may have succeeded
  });
}

// ❌ WRONG - Unstructured errors
try {
  await detectServices();
} catch (e) {
  console.error('Error:', e); // Lost context, no actionable guidance
  throw e;
}
```

**Credential Security Pattern:**
```typescript
// ✅ CORRECT - Secure credential handling
const apiKey = await password({ message: 'Enter API key:' });
logger.debug('Validating API key', { key: maskKey(apiKey) });
const result = await validateKey(apiKey);
apiKey = undefined; // Clear from memory

// ❌ WRONG - Credential leakage
logger.debug('Validating API key', { key: apiKey }); // LEAK!
```

**Validation Timing:**
- Validate credentials immediately after collection
- Don't store unvalidated credentials
- Clear credentials from memory after validation

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow naming conventions** - kebab-case files, camelCase functions, PascalCase types
2. **Co-locate unit tests** - Place `*.test.ts` files next to source files
3. **Never log credentials** - Always mask before logging
4. **Use WizardError for errors** - Provide code, message, and suggestion
5. **Clear credentials after validation** - Set to `undefined` or overwrite
6. **Respect .env file permissions** - Create with 0o600, preserve existing

**Pattern Verification:**
- ESLint rules for naming conventions
- Pre-commit hooks for credential masking checks
- Code review checklist for security patterns

### Pattern Examples

**Good Example:**
```typescript
// connector-add.ts
import { password } from '@clack/prompts';
import { maskKey } from '../utils/mask.js';
import { WizardError } from '../utils/error.js';

export async function addConnector(id: string) {
  const apiKey = await password({
    message: `Enter ${id} API key:`,
    validate: (value) => value.startsWith('sk-') || 'Invalid API key format'
  });

  // Secure logging
  console.log(`Validating ${id} API key: ${maskKey(apiKey)}`);

  try {
    const result = await validateKey(apiKey);
    apiKey = undefined; // Clear immediately
    return result;
  } catch (error) {
    apiKey = undefined; // Clear on error too
    throw new WizardError('API_KEY_INVALID', {
      message: `${id} API key validation failed`,
      suggestion: 'Verify your API key is valid and has not expired',
      cause: error as Error,
      exitCode: 1
    });
  }
}
```

**Anti-Patterns to Avoid:**
```typescript
// ❌ WRONG - Logging credentials
logger.debug('API key:', apiKey);

// ❌ WRONG - Not clearing credentials
let apiKey = await collectKey();
await validateKey(apiKey);
// apiKey still in memory!

// ❌ WRONG - Inconsistent naming
function Detect_Services() { } // Mixed case

// ❌ WRONG - Unstructured errors
throw new Error('Failed'); // No code, message, or suggestion
```

---

## Project Structure & Boundaries

### Complete Project Directory Structure

The wizard is implemented as a new package in the existing monorepo:

```
BonkLM/
├── packages/
│   ├── core/                    # Existing: Core guardrails package
│   ├── adapters/                # Existing: Framework adapters
│   └── wizard/                  # NEW: Installation Wizard
│       ├── package.json
│       ├── bin/
│       │   └── run.ts           # CLI entry point (bonklm)
│       ├── src/
│       │   ├── index.ts         # Package entry point
│       │   ├── commands/        # CLI command handlers
│       │   │   ├── wizard.ts
│       │   │   ├── connector-add.ts
│       │   │   ├── connector-test.ts
│       │   │   ├── connector-remove.ts
│       │   │   └── status.ts
│       │   │   └── *.test.ts
│       │   ├── detection/       # Detection engine
│       │   │   ├── index.ts
│       │   │   ├── framework.ts      # Framework detection (package.json)
│       │   │   ├── services.ts       # Service/port detection
│       │   │   ├── docker.ts         # Docker container detection
│       │   │   └── credentials.ts    # Environment variable detection
│       │   │   └── *.test.ts
│       │   ├── connectors/      # Connector plugin system
│       │   │   ├── registry.ts       # Plugin registry
│       │   │   ├── base.ts           # Connector interface
│       │   │   └── implementations/  # Connector definitions
│       │   │       ├── openai.ts
│       │   │       ├── anthropic.ts
│       │   │       ├── ollama.ts
│       │   │       ├── express.ts
│       │   │       └── langchain.ts
│       │   │       └── *.test.ts
│       │   ├── testing/         # Validation framework
│       │   │   ├── validator.ts      # Connection + query testing
│       │   │   └── guardrail-test.ts # Sample guardrail execution
│       │   ├── config/          # Configuration management
│       │   │   ├── env.ts            # .env file read/write/merge
│       │   │   └── permissions.ts    # Cross-platform file permissions
│       │   │   └── *.test.ts
│       │   └── utils/           # Shared utilities
│       │       ├── logger.ts        # Secure logging (never logs credentials)
│       │       ├── mask.ts          # Credential masking
│       │       ├── terminal.ts      # Terminal capability detection
│       │       └── error.ts         # WizardError class
│       │       └── *.test.ts
│       ├── tests/               # Integration tests
│       │   ├── integration/
│       │   │   ├── wizard.test.ts
│       │   │   └── connector-flow.test.ts
│       │   └── fixtures/
│       │       ├── package-examples/
│       │       └── env-examples/
│       └── README.md
├── package.json                # Root: Add wizard to workspace
├── pnpm-workspace.yaml         # Add packages/wizard
└── tsconfig.json               # Extended for wizard package
```

### Architectural Boundaries

**CLI Boundary (wizard → user):**
- Entry point: `bin/run.ts`
- Commands: `wizard`, `connector add/remove/test`, `status`
- Output: Interactive (Clack) or JSON
- Exit codes: 0 (success), 1 (error), 2 (partial)

**Detection Engine Boundaries:**
- Framework detection: Reads package.json, no side effects
- Service detection: Port scanning, read-only
- Credential detection: Reads process.env, no mutation

**Connector System Boundaries:**
- Registry: Read-only plugin discovery
- Connectors: Immutable definitions, pure functions
- Testing: Executes validation, doesn't modify external state

**Configuration Boundary (wizard → .env):**
- Read: Parse existing .env
- Merge: Combine new entries with existing (preserve user entries)
- Write: Atomic write with 0o600 permissions

### Requirements to Structure Mapping

**FR Category → Directory Mapping:**

| FR Category | Location |
|-------------|----------|
| FR1-FR5: Environment Detection | `src/detection/` |
| FR6-FR11: Connector Management | `src/commands/`, `src/connectors/` |
| FR12-FR16: Credential Management | `src/config/`, `src/utils/mask.ts` |
| FR17-FR22: Connection Testing | `src/testing/` |
| FR23-FR27: Wizard Interface | `src/commands/wizard.ts` |
| FR28-FR32: CLI Operations | `src/commands/`, `bin/run.ts` |
| FR33-FR36: Extensibility | `src/connectors/registry.ts` |
| FR37-FR40: Configuration | `src/config/env.ts` |
| FR41-FR45: Error Handling | `src/utils/error.ts` |
| FR46-FR50: Output & Reporting | `src/utils/terminal.ts` |

### Integration Points

**Internal Communication:**
```
CLI Commands → Detection Engine → Connector Registry → Test Framework
                    ↓                  ↓                ↓
              EnvManager        ConnectorDefs    GuardrailEngine
```

**External Integrations:**
- Existing core package: `@blackunicorn/bonklm`
- Existing connectors: `@blackunicorn/bonklm/*-connector`
- GuardrailEngine for testing

**Data Flow:**
```
User Input → CLI Command → Detection → Connector Selection → Testing → .env Write
                     ↓           ↓               ↓            ↓
                  Read Env   Find Connectors  Validate API  Merge & Save
```

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Commander.js + Clack work together without conflicts
- Sequential phased detection aligns with Clack's spinner UX
- Functional connector schema supports zero-dependency philosophy
- All choices align with existing codebase (ESM, TypeScript 5.3.3, Node 18+)

**Pattern Consistency:**
- Naming conventions match Node.js ecosystem
- Co-located tests align with Vitest best practices
- Security patterns are comprehensive

**Structure Alignment:**
- Project structure supports all architectural decisions
- Boundaries are clear: CLI → Detection → Connectors → Testing

### Requirements Coverage Validation ✅

**All 50 Functional Requirements covered** across 10 categories

| FR Category | Status | Location |
|-------------|--------|----------|
| FR1-FR5: Environment Detection | ✅ | `src/detection/` |
| FR6-FR11: Connector Management | ✅ | `src/commands/`, `src/connectors/` |
| FR12-FR16: Credential Management | ✅ | `src/config/`, `src/utils/mask.ts` |
| FR17-FR22: Connection Testing | ✅ | `src/testing/` |
| FR23-FR27: Wizard Interface | ✅ | `src/commands/wizard.ts` |
| FR28-FR32: CLI Operations | ✅ | `src/commands/`, `bin/run.ts` |
| FR33-FR36: Extensibility | ✅ | `src/connectors/registry.ts` |
| FR37-FR40: Configuration | ✅ | `src/config/env.ts` |
| FR41-FR45: Error Handling | ✅ | `src/utils/error.ts` |
| FR46-FR50: Output & Reporting | ✅ | `src/utils/terminal.ts` |

**All Non-Functional Requirements addressed:**
- ✅ Performance: <10s detection, <5s per connector test
- ✅ Security: No plain text keys, credential masking, 0o600 permissions
- ✅ Reliability: 100% detection accuracy, graceful uncertainty
- ✅ Compatibility: Cross-platform Node APIs, terminal capability detection
- ✅ Usability: Actionable errors, 80-160 char width handling

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with rationale

**Structure Completeness:** Complete directory tree with all files defined

**Pattern Completeness:** 5 conflict points addressed with clear rules

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps:** None

**Nice-to-Have Gaps:**
- Shell completion (deferred post-MVP)
- Connector recommendation engine (Phase 3)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear architectural decisions aligned with existing codebase
- Comprehensive security patterns for credential handling
- Extensible connector system for community contributions
- Well-defined boundaries and integration points

**Areas for Future Enhancement:**
- Shell completion for improved UX
- Connector recommendation engine
- Advanced Docker service discovery
- Telemetry for usage insights

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
1. Create `packages/wizard/` package structure
2. Set up CLI scaffolding (Commander.js + Clack)
3. Implement EnvManager for .env handling
4. Define base Connector interface

---

## SME Review & Security Fixes (Post-Validation)

### Review Summary

Reviews conducted by:
- **Architect Agent**: Structural coherence, extensibility, integration points
- **Security Architect Agent**: Credential handling, file permissions, memory security
- **Pentester Agent**: STRIDE threat model, attack vectors, mitigations
- **QA Agent**: Test coverage, mock strategy, cross-platform testing

### Critical Security Fixes Applied

#### Fix #1: Prohibit Credential Arguments (WIZ-001, WIZ-005)

**Issue:** CLI arguments like `--api-key=xxx` expose credentials in:
- Shell history (`.bash_history`, `.zsh_history`)
- Process list (`ps aux`, `/proc/*/cmdline`)
- System logging (auditd, systemd journal)

**Resolution:**
```typescript
// ❌ FORBIDDEN - Never accept credentials via CLI arguments
// program.option('--api-key <key>', 'OpenAI API key');

// ✅ CORRECT - Use interactive prompts only
const apiKey = await password({
  message: 'Enter your OpenAI API key:',
  validate: (value) => value.startsWith('sk-') || 'Invalid API key format'
});
```

**Updated Rule:** Credentials MUST only be collected via Clack `password()` prompts or stdin. Never via CLI arguments.

---

#### Fix #2: Atomic .env File Writes (WIZ-003)

**Issue:** Non-atomic writes create race condition vulnerabilities where an attacker can tamper with .env between read and write.

**Resolution:**
```typescript
import { rename, writeFile } from 'fs/promises';
import { constants, chmod } from 'fs/promises';
import { platform } from 'os';

class EnvManager {
  /**
   * Atomically write .env file with secure permissions
   */
  async writeAtomic(path: string, content: string): Promise<void> {
    const tempPath = `${path}.${Date.now()}.${process.pid}.tmp`;

    // Write to temporary file first
    await writeFile(tempPath, content, { mode: 0o600 });

    // Set platform-specific permissions
    await this.setSecurePermissions(tempPath);

    // Atomic rename (atomic on POSIX, nearly atomic on Windows)
    await rename(tempPath, path);

    // Verify permissions were set
    await this.verifyPermissions(path);
  }

  /**
   * Set secure file permissions based on platform
   */
  private async setSecurePermissions(path: string): Promise<void> {
    if (platform() === 'win32') {
      // On Windows, use icacls to restrict inheritance
      const { execFile } = await import('child_process/promises');
      try {
        await execFile('icacls', [path, '/inheritance:r']);
      } catch (error) {
        // Log warning but continue - Windows permissions are limited
        console.warn(`Could not set Windows ACLs: ${path}`);
      }
    } else {
      // Unix-like systems: owner read/write only
      await chmod(path, 0o600);
    }
  }

  /**
   * Verify file permissions after write
   */
  private async verifyPermissions(path: string): Promise<void> {
    const { constants } = await import('fs');
    try {
      await access(path, constants.R_OK | constants.W_OK);
    } catch (error) {
      throw new WizardError(
        'ENV_PERMISSION_FAILED',
        `Cannot verify .env permissions: ${path}`,
        'Ensure you have write access to the directory',
        error as Error,
        1
      );
    }
  }
}
```

**Updated Rule:** All .env writes MUST use atomic pattern: write temp → set permissions → atomic rename → verify.

---

#### Fix #3: Buffer-Based Credential Handling (WIZ-002)

**Issue:** Setting `apiKey = undefined` doesn't zero memory because JavaScript strings are immutable.

**Resolution:**
```typescript
import { Buffer } from 'node:buffer';

/**
 * Secure credential container using Buffer
 * Allows memory to be explicitly zeroed after use
 */
class SecureCredential {
  private buffer: Buffer;

  constructor(value: string) {
    // Copy string into a Buffer
    this.buffer = Buffer.from(value, 'utf-8');
    // Zero the original string reference (best effort)
    // Note: Original string may still exist in memory but is unreachable
  }

  /**
   * Get credential value for use
   */
  toString(): string {
    return this.buffer.toString('utf-8');
  }

  /**
   * Securely zero memory after use
   */
  dispose(): void {
    this.buffer.fill(0);
  }

  /**
   * Use credential with automatic cleanup
   */
  async use<T>(
    fn: (credential: string) => Promise<T>
  ): Promise<T> {
    try {
      return await fn(this.toString());
    } finally {
      this.dispose();
    }
  }
}

// Usage pattern
async function validateApiKey(key: string): Promise<boolean> {
  const secureKey = new SecureCredential(key);

  try {
    return await secureKey.use(async (apiKey) => {
      // Make API call with apiKey
      return await checkKey(apiKey);
    });
  } finally {
    // Memory is zeroed via use() finally block
  }
}
```

**Updated Rule:** Credentials MUST be handled using `SecureCredential` wrapper for secure memory handling.

---

#### Fix #4: Audit Logging System (WIZ-004)

**Issue:** No audit trail for configuration changes - security events cannot be attributed or detected.

**Resolution:**
```typescript
/**
 * Audit event structure
 */
interface AuditEvent {
  timestamp: string;
  action: AuditAction;
  connector_id?: string;
  success: boolean;
  error_code?: string;
  user?: string;  // System user if available
}

type AuditAction =
  | 'connector_detected'
  | 'connector_added'
  | 'connector_removed'
  | 'connector_tested'
  | 'credential_validated'
  | 'env_written'
  | 'env_read';

/**
 * Audit logger for security events
 */
class AuditLogger {
  private logPath: string;

  constructor(logPath: string = '.bonklm/audit.log') {
    this.logPath = logPath;
  }

  /**
   * Log audit event (never contains credentials)
   */
  async log(event: AuditEvent): Promise<void> {
    const entry = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Append to audit log
    await fs.appendFile(this.logPath, entry + '\n', { mode: 0o600 });
  }

  /**
   * Read audit log for investigations
   */
  async read(limit: number = 100): Promise<AuditEvent[]> {
    try {
      const content = await fs.readFile(this.logPath, 'utf-8');
      const lines = content.trim().split('\n');
      return lines
        .slice(-limit)
        .map((line) => JSON.parse(line));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // No audit log yet
      }
      throw error;
    }
  }
}

// Usage in commands
export async function addConnector(id: string): Promise<void> {
  const audit = new AuditLogger();

  await audit.log({
    action: 'connector_detected',
    connector_id: id,
    success: true,
  });

  try {
    await configureConnector(id);
    await audit.log({
      action: 'connector_added',
      connector_id: id,
      success: true,
    });
  } catch (error) {
    await audit.log({
      action: 'connector_added',
      connector_id: id,
      success: false,
      error_code: (error as WizardError).code,
    });
    throw error;
  }
}
```

**Updated Rule:** All security-relevant actions MUST be logged to audit log (never containing credentials).

---

#### Fix #5: Secure API Validation Protocol

**Issue:** API key validation protocol underspecified - potential leakage to server logs.

**Resolution:**
```typescript
/**
 * Secure validation configuration for API keys
 */
interface SecureValidationConfig {
  /** Use HEAD/OPTIONS when possible (no request body) */
  method: 'HEAD' | 'OPTIONS' | 'GET';

  /** Never send credentials in URL parameters */
  sendInHeader: boolean;

  /** Minimal test endpoint (no user-specific data) */
  testEndpoint: string;

  /** Timeout to prevent hanging */
  timeout: number;

  /** Never log request/response bodies */
  logLevel: 'none';
}

/**
 * Validate API key without leaking to logs
 */
async function validateApiKeySecure(
  apiKey: string,
  config: SecureValidationConfig
): Promise<boolean> {
  const secureKey = new SecureCredential(apiKey);

  try {
    return await secureKey.use(async (key) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(config.testEndpoint, {
          method: config.method,
          headers: config.sendInHeader
            ? { 'Authorization': `Bearer ${key}` }
            : {},
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
      } catch (error) {
        clearTimeout(timeout);
        if ((error as Error).name === 'AbortError') {
          throw new WizardError(
            'VALIDATION_TIMEOUT',
            'API key validation timed out',
            'Check your network connection',
            error as Error,
            2
          );
        }
        throw error;
      }
    });
  } finally {
    secureKey.dispose();
  }
}

// Connector definitions with secure validation
export const openaiConnector: ConnectorDefinition = {
  id: 'openai',
  name: 'OpenAI',
  category: 'llm',
  detection: {
    envVars: ['OPENAI_API_KEY'],
  },
  test: async (config) => {
    return await validateApiKeySecure(config.apiKey, {
      method: 'GET',
      sendInHeader: true,
      testEndpoint: 'https://api.openai.com/v1/models',
      timeout: 5000,
      logLevel: 'none',
    });
  },
  // ... rest of definition
};
```

**Updated Rule:** API validation MUST use secure protocol (headers only, minimal endpoint, timeout, no logging).

---

### Additional Architecture Updates

#### Connector Metadata Strategy

**Issue:** Existing connector packages export factory functions, not configuration objects.

**Resolution:** Add `meta` export to connector packages:

```typescript
// In @blackunicorn/bonklm-openai/src/meta.ts
export const connectorMeta: ConnectorDefinition = {
  id: 'openai',
  name: 'OpenAI',
  category: 'llm',
  detection: {
    envVars: ['OPENAI_API_KEY'],
    packageJson: ['openai'],
  },
  test: async (config) => { /* ... */ },
  generateSnippet: (config) => { /* ... */ },
  configSchema: z.object({
    apiKey: z.string().startsWith('sk-'),
  }),
};

// In package.json exports
"exports": {
  ".": "./src/index.ts",
  "./meta": "./src/meta.ts"
}
```

---

#### Detection Timeout Enforcement

**Issue:** No timeout enforcement for detection phases (DoS vulnerability).

**Resolution:**
```typescript
const DETECTION_TIMEOUTS = {
  framework: 2000,   // 2s for package.json parsing
  services: 5000,    // 5s for port/Docker scanning
  credentials: 1000, // 1s for env var reading
} as const;

async function detectWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  phase: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fn();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new WizardError(
        'DETECTION_TIMEOUT',
        `${phase} detection timed out after ${timeout}ms`,
        'Check for blocking processes or network issues',
        undefined,
        2 // Partial - other detections may succeed
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

#### Enhanced Error Sanitization

**Issue:** Stack traces in errors could leak credentials.

**Resolution:**
```typescript
/**
 * Credential pattern for redaction
 */
const CREDENTIAL_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/g,           // OpenAI keys
  /sk-ant-[a-zA-Z0-9]{95}/g,        // Anthropic keys
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, // Bearer tokens
  /api[_-]?key["\s:=]+[^\s"'`<>]+/gi, // Various api_key formats
];

/**
 * Sanitize error output to remove credentials
 */
function sanitizeError(error: Error): Error {
  const message = error.message;
  const stack = error.stack;

  // Redact credentials from message
  let sanitizedMessage = message;
  for (const pattern of CREDENTIAL_PATTERNS) {
    sanitizedMessage = sanitizedMessage.replace(pattern, '***REDACTED***');
  }

  // Redact credentials from stack trace
  let sanitizedStack = stack;
  if (sanitizedStack) {
    for (const pattern of CREDENTIAL_PATTERNS) {
      sanitizedStack = sanitizedStack.replace(pattern, '***REDACTED***');
    }
  }

  // Create new error with sanitized content
  const sanitized = new Error(sanitizedMessage);
  sanitized.stack = sanitizedStack;
  return sanitized;
}

class WizardError extends Error {
  constructor(
    public code: string,
    message: string,
    public suggestion?: string,
    public cause?: Error,
    public exitCode?: 0 | 1 | 2
  ) {
    super(message);
    this.name = 'WizardError';

    // Sanitize cause error if provided
    if (cause) {
      this.cause = sanitizeError(cause);
    }
  }

  override toString(): string {
    let output = `${this.code}: ${this.message}`;
    if (this.suggestion) {
      output += `\nSuggestion: ${this.suggestion}`;
    }
    // Don't include stack trace in production output
    return output;
  }
}
```

---

### Updated Implementation Priority

**Phase 1: Security Foundation (P0 - Required Before Any Feature Work)**
1. Implement `SecureCredential` class for buffer-based credential handling
2. Implement atomic `EnvManager.writeAtomic()` method
3. Implement `AuditLogger` class
4. Update `WizardError` with sanitization
5. Implement `validateApiKeySecure()` protocol

**Phase 2: Core Infrastructure (P1)**
1. Create `packages/wizard/` package structure
2. Set up CLI scaffolding (Commander.js + Clack)
3. Implement detection timeout enforcement
4. Define base `ConnectorDefinition` interface

**Phase 3: Detection Engine (P1)**
1. Framework detection (package.json parsing)
2. Service detection (port scanning with timeouts)
3. Credential detection (environment variables)

**Phase 4: Connector System (P2)**
1. Define connector metadata strategy
2. Implement 5 MVP connectors with secure validation
3. Add connector test framework

**Phase 5: Wizard UX (P2)**
1. Sequential phased detection UI with Clack
2. Progress indicators with timeouts
3. Secure credential prompts

---

### Test Strategy Updates

**Security-Critical Coverage Requirements:**
- `src/utils/secure-credential.ts`: 100% coverage
- `src/config/env.ts`: 90% coverage
- `src/utils/audit.ts`: 90% coverage
- `src/utils/error.ts`: 90% coverage

**Mock Strategy:**
- Use `nock` for HTTP mocking of API validation
- Create test fixtures for all detection scenarios
- Mock Docker detection via child_process mocking

**Cross-Platform Testing:**
- Add Windows to CI/CD matrix
- Test file permission handling on all platforms
- Verify terminal capability detection

---

### Architecture Status After SME Review

**Overall Status:** ✅ READY FOR IMPLEMENTATION (with P0 fixes applied)

**Applied Fixes:**
- ✅ P0-1: Prohibited credential CLI arguments
- ✅ P0-2: Atomic .env writes with platform-aware permissions
- ✅ P0-3: Buffer-based credential handling
- ✅ P0-4: Audit logging system
- ✅ P0-5: Secure API validation protocol

**Remaining Recommendations (Non-blocking):**
- Consider system credential manager integration (post-MVP)
- Add detection confidence scoring system
- Document Windows-specific security limitations

**Confidence Level:** High

All critical security concerns identified by the SME review have been addressed with specific implementation patterns. The architecture is ready for AI agent implementation with updated security requirements.

---
