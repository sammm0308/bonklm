# EPIC-2: Core Infrastructure - Implementation Steps

**Priority:** P1
**Points:** 12
**Stories:** 4
**Dependency:** EPIC-1 (Security Foundation)

## Overview

This epic creates the foundational CLI structure and core interfaces that all other components will use.

---

## Story 2.1: Package Structure & CLI Scaffolding (5 points)

**Files:** `package.json`, `bin/run.ts`, `src/index.ts`, `src/commands/*.ts`

### Steps

1. **Create package directory structure**
   ```bash
   mkdir -p packages/wizard/{bin,src/{commands,utils,config,connectors},tests/{integration,fixtures}}
   ```

2. **Create package.json** (`packages/wizard/package.json`)
   ```json
   {
     "name": "@blackunicorn/wizard",
     "version": "1.0.0",
     "type": "module",
     "description": "BonkLM Installation Wizard",
     "bin": {
       "bonklm": "./bin/run.ts"
     },
     "exports": {
       ".": "./src/index.ts"
     },
     "dependencies": {
       "commander": "^12.0.0",
       "clack": "^0.1.0",
       "dotenv": "^16.4.0"
     },
     "devDependencies": {
       "@types/node": "^20.0.0",
       "typescript": "^5.3.0",
       "vitest": "^2.0.0",
       "tsx": "^4.0.0"
     },
     "scripts": {
       "test": "vitest",
       "dev": "tsx bin/run.ts",
       "build": "tsc"
     }
   }
   ```

3. **Create binary entry point** (`bin/run.ts`)
   ```typescript
   #!/usr/bin/env node
   import { Command } from 'commander';
   import { wizardCommand } from '../src/commands/wizard.js';
   import { connectorAddCommand } from '../src/commands/connector-add.js';
   import { connectorRemoveCommand } from '../src/commands/connector-remove.js';
   import { connectorTestCommand } from '../src/commands/connector-test.js';
   import { statusCommand } from '../src/commands/status.js';

   const program = new Command();

   program
     .name('bonklm')
     .description('BonkLM Installation Wizard')
     .version('1.0.0');

   program.addCommand(wizardCommand);
   program.addCommand(connectorAddCommand);
   program.addCommand(connectorRemoveCommand);
   program.addCommand(connectorTestCommand);
   program.addCommand(statusCommand);

   program.parse();
   ```

4. **Make binary executable**
   ```bash
   chmod +x packages/wizard/bin/run.ts
   ```

5. **Create command stub files**
   - `src/commands/wizard.ts`
   - `src/commands/connector-add.ts`
   - `src/commands/connector-remove.ts`
   - `src/commands/connector-test.ts`
   - `src/commands/status.ts`

   Each exports a Command instance:
   ```typescript
   import { Command } from 'commander';

   export const wizardCommand = new Command('wizard')
     .description('Run interactive setup wizard')
     .option('--yes', 'Accept all defaults')
     .option('--json', 'Output in JSON format')
     .action(async (options) => {
       // Implementation in EPIC-6
     });
   ```

6. **Create src/index.ts** (package entry point)
   ```typescript
   export { SecureCredential } from './utils/secure-credential.js';
   export { EnvManager } from './config/env.js';
   export { AuditLogger } from './utils/audit.js';
   export { WizardError, ExitCode } from './utils/error.js';
   ```

7. **Create TypeScript config** (`packages/wizard/tsconfig.json`)
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./"
     },
     "include": ["src/**/*", "bin/**/*"]
   }
   ```

8. **Update root pnpm-workspace.yaml** (if needed)
   ```yaml
   packages:
     - 'packages/*'
   ```

9. **Install dependencies**
   ```bash
   pnpm install
   ```

10. **Test CLI**
    ```bash
    pnpm --filter @blackunicorn/wizard dev -- --help
    ```

---

## Story 2.2: ConnectorDefinition Interface (3 points)

**File:** `src/connectors/base.ts`

### Steps

1. **Create connectors directory**
   ```bash
   mkdir -p packages/wizard/src/connectors/implementations
   ```

2. **Define types and interfaces**
   ```typescript
   import type { z } from 'zod';

   export type ConnectorCategory = 'llm' | 'framework' | 'vector-db';

   export interface DetectionRules {
     packageJson?: string[];
     envVars?: string[];
     ports?: number[];
     dockerContainers?: string[];
   }

   export interface TestResult {
     connection: boolean;
     validation: boolean;
     error?: string;
     latency?: number;
   }

   export interface ConnectorDefinition {
     id: string;
     name: string;
     category: ConnectorCategory;
     detection: DetectionRules;
     test: (config: Record<string, string>) => Promise<TestResult>;
     generateSnippet: (config: Record<string, string>) => string;
     configSchema: z.ZodSchema;
   }
   ```

3. **Create tests** (100% coverage)

---

## Story 2.3: Terminal Capability Detection (2 points)

**File:** `src/utils/terminal.ts`

### Steps

1. **Implement getTerminalCapabilities()**
   ```typescript
   export interface TerminalCapabilities {
     isTTY: boolean;
     supportsColor: boolean;
     width: number;
   }

   export function getTerminalCapabilities(): TerminalCapabilities {
     return {
       isTTY: Boolean(process.stdout.isTTY),
       supportsColor: process.env.FORCE_COLOR !== '0',
       width: process.stdout.columns || 80,
     };
   }
   ```

2. **Create tests** (90% coverage)

---

## Story 2.4: Exit Code Handling (2 points)

**File:** `src/utils/exit.ts`

### Steps

1. **Implement exit functions**
   ```typescript
   import { WizardError, ExitCode as ExitCodes } from './error.js';

   export function exit(code: keyof typeof ExitCodes = 'SUCCESS'): never {
     const exitCode = ExitCodes[code];
     process.exit(exitCode);
   }

   export function exitWithError(error: Error): never {
     if (error instanceof WizardError) {
       console.error(error.toString());
       exit(error.exitCode ?? 'ERROR');
     }
     console.error('Unexpected error:', error.message);
     exit('ERROR');
   }

   export function setupShutdownHandlers(): void {
     const shutdown = (signal: string) => {
       console.log(`\nReceived ${signal}, shutting down...`);
       process.exit(2);
     };
     process.on('SIGINT', () => shutdown('SIGINT'));
     process.on('SIGTERM', () => shutdown('SIGTERM'));
   }
   ```

2. **Create tests** (90% coverage, mock process.exit)

---

## Epic Completion Checklist

- [ ] All 4 stories implemented
- [ ] CLI scaffolding complete
- [ ] Commands structure defined
- [ ] Terminal detection working
- [ ] Exit code handling working
- [ ] TypeScript compilation successful

**Next Epic:** EPIC-3 - Detection Engine
