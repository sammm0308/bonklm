---
project_name: 'BonkLM'
user_name: 'J'
date: '2026-02-18'
sections_completed: ['technology_stack', 'implementation_rules']
existing_patterns_found: 35
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Runtime

| Setting | Value | Notes |
|---------|-------|-------|
| Language | TypeScript 5.3.3 | Strict mode enabled |
| Target Runtime | Node.js 18+ | ES2022 features available |
| Module System | ESM (NodeNext) | No CommonJS, `.js` extensions required in imports |
| Package Manager | pnpm | Workspace monorepo |

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true
  }
}
```

### Critical TypeScript Rules

1. **Import extensions MUST use `.js`** - Even for TypeScript files, imports must end in `.js` because of NodeNext module resolution
   ```typescript
   // ✅ CORRECT
   import { EnvManager } from './env.js';

   // ❌ WRONG
   import { EnvManager } from './env';
   import { EnvManager } from './env.ts';
   ```

2. **No `any` types allowed** - Use `unknown` with type guards if needed
   ```typescript
   // ✅ CORRECT
   function processValue(value: unknown) {
     if (typeof value === 'string') { /* ... */ }
   }

   // ❌ WRONG
   function processValue(value: any) { /* ... */ }
   ```

3. **Strict null checks enforced** - Always handle potential null/undefined
   ```typescript
   // ✅ CORRECT
   const result = config?.value ?? 'default';

   // ❌ WRONG
   const result = config.value; // May crash if undefined
   ```

### Testing Stack

| Setting | Value |
|---------|-------|
| Framework | Vitest 2.1.9 |
| Test Organization | Co-located (`*.test.ts`) |
| Coverage Threshold | 80% (branches, functions, lines, statements) |
| Pool Mode | Forks with 8GB memory limit |

### Linting

| Tool | Configuration |
|------|---------------|
| ESLint | Flat config (`eslint.config.mjs`) |
| TypeScript ESLint | All strict rules enabled |
| Security Rules | No eval, no implied eval, no-new-func |
| Style | Prettier integration, sort-imports |

---

## Critical Implementation Rules

### 1. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | `kebab-case.ts` | `env-manager.ts`, `connector-add.ts` |
| Functions | `camelCase` | `detectFrameworks()`, `validateCredential()` |
| CLI Commands | `kebab-case` | `connector add`, `connector test` |
| Interfaces/Types | `PascalCase` | `ConnectorDefinition`, `TestResult` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_TIMEOUT`, `MAX_RETRIES` |
| Enum Members | `PascalCase` | `ExitCode.Success` |

### 2. Import/Export Patterns

```typescript
// ✅ CORRECT - ESM with .js extension
import { password } from '@clack/prompts';
import { maskKey } from '../utils/mask.js';
import type { ConnectorDefinition } from './base.js';

// Named exports preferred
export function detectServices() { /* ... */ }
export const DEFAULT_TIMEOUT = 5000;
export type { ConnectorSchema };

// ❌ WRONG - Missing extensions
import { maskKey } from '../utils/mask';
export default function() { /* ... */ } // Avoid default exports
```

### 3. Security: Credential Handling (CRITICAL)

**PROHIBITED: Never accept credentials via CLI arguments:**
```typescript
// ❌ FORBIDDEN - Exposes credentials in shell history, process list
program.option('--api-key <key>', 'OpenAI API key');

// ✅ CORRECT - Use interactive prompts only
const apiKey = await password({
  message: 'Enter your OpenAI API key:',
  validate: (value) => value.startsWith('sk-') || 'Invalid API key format'
});
```

**CRITICAL: Use SecureCredential for all credential handling:**
```typescript
import { Buffer } from 'node:buffer';

class SecureCredential {
  private buffer: Buffer;

  constructor(value: string) {
    this.buffer = Buffer.from(value, 'utf-8');
  }

  toString(): string {
    return this.buffer.toString('utf-8');
  }

  // Securely zero memory after use
  dispose(): void {
    this.buffer.fill(0);
  }

  // Use credential with automatic cleanup
  async use<T>(fn: (credential: string) => Promise<T>): Promise<T> {
    try {
      return await fn(this.toString());
    } finally {
      this.dispose();
    }
  }
}

// ✅ CORRECT - Always use SecureCredential
const secureKey = new SecureCredential(apiKey);
await secureKey.use(async (key) => {
  return await validateKey(key);
});
// Memory is automatically zeroed
```

**NEVER log credentials in any form:**
```typescript
// ✅ CORRECT - Always mask before logging
const secureKey = new SecureCredential(apiKey);
await secureKey.use(async (key) => {
  logger.debug('Validating key', { key: maskKey(key) });
  return await validateKey(key);
});

// ❌ WRONG - Credential leakage
logger.debug('API key:', apiKey);
console.log(`Using key: ${apiKey.substring(0, 8)}...`); // Still logging!
```

**Masking function (show first 2 and last 4, never the full prefix):**
```typescript
function maskKey(value: string): string {
  if (value.length <= 8) return '***';
  // Don't show prefix pattern - show only first 2 and last 4
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 6)}${value.slice(-4)}`;
}
```

**Atomic .env writes with platform-aware permissions:**
```typescript
import { rename, writeFile, chmod } from 'fs/promises';
import { platform } from 'os';

class EnvManager {
  async writeAtomic(path: string, content: string): Promise<void> {
    const tempPath = `${path}.${Date.now()}.${process.pid}.tmp`;

    // Write to temporary file first
    await writeFile(tempPath, content, { mode: 0o600 });

    // Set platform-specific permissions
    await this.setSecurePermissions(tempPath);

    // Atomic rename (atomic on POSIX, nearly atomic on Windows)
    await rename(tempPath, path);

    // Verify permissions
    await this.verifyPermissions(path);
  }

  private async setSecurePermissions(path: string): Promise<void> {
    if (platform() === 'win32') {
      // On Windows, use icacls to restrict inheritance
      const { execFile } = await import('child_process/promises');
      try {
        await execFile('icacls', [path, '/inheritance:r']);
      } catch {
        console.warn(`Could not set Windows ACLs: ${path}`);
      }
    } else {
      await chmod(path, 0o600);
    }
  }

  private async verifyPermissions(path: string): Promise<void> {
    const { constants, access } = await import('fs');
    await access(path, constants.R_OK | constants.W_OK);
  }
}
```

**Audit logging for security events:**
```typescript
interface AuditEvent {
  timestamp: string;
  action: 'connector_added' | 'connector_removed' | 'connector_tested' | 'env_written';
  connector_id?: string;
  success: boolean;
  error_code?: string;
}

// Log all security-relevant actions (never containing credentials)
await audit.log({
  action: 'connector_added',
  connector_id: 'openai',
  success: true,
});
```

### 4. Error Handling: WizardError Pattern

All errors must use the `WizardError` class for structured, actionable error messages with sanitization:

```typescript
// Credential patterns for redaction
const CREDENTIAL_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/g,           // OpenAI keys
  /sk-ant-[a-zA-Z0-9]{95}/g,        // Anthropic keys
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, // Bearer tokens
  /api[_-]?key["\s:=]+[^\s"'`<>]+/gi, // Various api_key formats
];

function sanitizeError(error: Error): Error {
  let sanitizedMessage = error.message;
  let sanitizedStack = error.stack;

  // Redact credentials
  for (const pattern of CREDENTIAL_PATTERNS) {
    sanitizedMessage = sanitizedMessage.replace(pattern, '***REDACTED***');
    if (sanitizedStack) {
      sanitizedStack = sanitizedStack.replace(pattern, '***REDACTED***');
    }
  }

  const sanitized = new Error(sanitizedMessage);
  sanitized.stack = sanitizedStack;
  return sanitized;
}

class WizardError extends Error {
  constructor(
    public code: string,              // e.g., 'ENV_READ_FAILED', 'API_KEY_INVALID'
    message: string,
    public suggestion?: string,       // Actionable next step
    public cause?: Error,             // Original error (will be sanitized)
    public exitCode?: 0 | 1 | 2       // CLI exit code
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

// ✅ CORRECT usage
throw new WizardError(
  'API_KEY_INVALID',
  'OpenAI API key validation failed',
  'Verify your API key is valid and has not expired',
  originalError,
  1 // Error exit code
);

// ❌ WRONG - unstructured errors
throw new Error('Failed'); // No context, no actionable guidance
```

**Exit Code Convention:**
```typescript
const ExitCode = {
  SUCCESS: 0,      // All operations completed
  ERROR: 1,        // Operation failed
  PARTIAL: 2,      // Some operations succeeded, some failed
} as const;
```

### 5. File Organization

```
packages/wizard/
├── bin/
│   └── run.ts                    # CLI entry point
├── src/
│   ├── index.ts                  # Package entry point
│   ├── commands/                 # Command handlers
│   │   ├── wizard.ts
│   │   ├── connector-add.ts
│   │   └── *.test.ts            # Co-located tests
│   ├── detection/
│   │   ├── framework.ts
│   │   └── *.test.ts
│   └── utils/
│       ├── logger.ts
│       └── *.test.ts
└── tests/
    ├── integration/              # Cross-module integration tests
    └── fixtures/                 # Test data
```

**Rules:**
- Unit tests MUST be co-located: `source-file.test.ts`
- Integration tests go in `tests/integration/`
- Fixture data goes in `tests/fixtures/`

### 6. CLI Output Formats

**Interactive Mode (default):**
- Use Clack prompts (intro, outro, spinner, password, multiselect)
- Colored, formatted terminal output
- Progress indicators for long operations

**JSON Mode (CI/CD, scripts):**
```typescript
interface JsonOutput {
  success: boolean;
  exitCode: 0 | 1 | 2;
  data?: unknown;
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

### 7. Async/Await Patterns

```typescript
// ✅ CORRECT - Always handle errors
async function detectServices() {
  try {
    const services = await portScan(PORTS);
    return services;
  } catch (error) {
    throw new WizardError(
      'SERVICE_DETECTION_FAILED',
      'Failed to detect running services',
      'Check that Docker is running and containers are accessible',
      error as Error,
      2 // Partial - other detections may succeed
    );
  }
}

// ❌ WRONG - Unhandled promise rejection
async function detectServices() {
  const services = await portScan(PORTS); // May throw
  return services;
}
```

### 8. Zero-Dependency Philosophy

The core `@blackunicorn/bonklm` package has **no runtime dependencies**. The wizard package is an exception (uses Commander.js, Clack, dotenv), but must:

- Minimize dependency surface
- Prefer pure functions over class-based dependencies
- Use native Node.js APIs when possible (fs, path, crypto)

### 9. Architectural Patterns

**Sequential Phased Detection:**
```
Phase 1: Framework Detection (package.json parsing)
  ↓
Phase 2: Service Detection (port scanning + Docker)
  ↓
Phase 3: Credential Detection (environment variables)
```

Each phase must complete before the next starts. Use Clack spinners for progress indication.

**Connector Functional Schema:**
```typescript
// Connectors are plain objects, not classes
interface ConnectorDefinition {
  id: string;
  name: string;
  category: 'llm' | 'framework' | 'vector-db';
  detection: {
    packageJson?: string[];
    envVars?: string[];
    ports?: number[];
  };
  test: (config: Record<string, string>) => Promise<TestResult>;
  generateSnippet: (config: Record<string, string>) => string;
  configSchema: z.ZodSchema;
}
```

### 10. Testing Requirements

**Unit Tests:**
- Co-located with source: `*.test.ts`
- Test file name matches source: `env-manager.ts` → `env-manager.test.ts`
- Cover: happy path, error cases, edge cases

**Coverage Thresholds (Vitest):**
```javascript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

### 11. Anti-Patterns to Avoid

```typescript
// ❌ WRONG - Credential CLI arguments (exposes to shell history, process list)
program.option('--api-key <key>', 'OpenAI API key');

// ❌ WRONG - Logging credentials
logger.debug('API key:', apiKey);

// ❌ WRONG - String-based credential handling (not zeroed from memory)
let apiKey = await collectKey();
await validateKey(apiKey);
// apiKey still in memory as immutable string!

// ❌ WRONG - Inconsistent naming
function Detect_Services() { } // Mixed case

// ❌ WRONG - Unstructured errors
throw new Error('Failed');

// ❌ WRONG - Missing .js extension
import { foo } from './foo';

// ❌ WRONG - Default exports
export default function foo() { }

// ❌ WRONG - Any types
function process(data: any) { }

// ❌ WRONG - Non-atomic .env write (race condition)
await fs.writeFile('.env', content);

// ❌ WRONG - No audit logging for security events
await addConnector('openai'); // No trail!
```

---

## Quick Reference

### File Extension Rule (ESM)
```typescript
// Imports MUST include .js extension
import { Foo } from './foo.js';  // ✅ Even for .ts files
import { Bar } from './bar';     // ❌ Will fail at runtime
```

### Credential Security Checklist
- [ ] NEVER use CLI arguments for credentials
- [ ] Always use `SecureCredential` wrapper for handling
- [ ] Never log credentials in any form
- [ ] Always mask before display (show first 2 and last 4 only)
- [ ] Clear from memory after validation (`dispose()`)
- [ ] Use atomic .env writes (temp file + rename)
- [ ] Set platform-aware permissions (0o600 or icacls on Windows)
- [ ] Validate immediately after collection
- [ ] Log all security events to audit log (never with credentials)

### Error Pattern
```typescript
throw new WizardError(
  'ERROR_CODE',
  'Human-readable message',
  'Actionable suggestion (optional)',
  originalError,
  exitCode
);
```

### Test Organization
- Unit tests: `src/module/file.test.ts`
- Integration tests: `tests/integration/`
- Fixtures: `tests/fixtures/`
