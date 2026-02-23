# Story 2.1: Package Structure & CLI Scaffolding

Status: ready-for-dev

**Epic:** EPIC-2 - Core Infrastructure
**Priority:** P1
**Dependency:** EPIC-1
**Points:** 5
**Files:** `package.json`, `bin/run.ts`, `src/index.ts`, `src/commands/*.ts`

## Story

As a developer setting up the wizard package,
I want a complete CLI scaffolding with Commander.js and Clack,
so that users can invoke the wizard command with all subcommands.

## Acceptance Criteria

1. Create `packages/wizard/` package structure
2. Set up package.json with Commander.js, Clack, dotenv
3. Create binary entry point at `bin/run.ts`
4. Implement command structure: wizard, connector add/remove/test, status
5. Add flags: --yes (non-interactive), --json (output format)
6. Basic CLI help and version output
7. All tests pass with 80% coverage

## Tasks / Subtasks

- [ ] Create package directory structure (AC: 1)
  - [ ] Create `packages/wizard/` directory
  - [ ] Create subdirectories: `bin/`, `src/commands/`, `src/utils/`, `src/config/`
  - [ ] Create `tests/` directory
- [ ] Set up package.json (AC: 2)
  - [ ] Name: `@blackunicorn/wizard` (or similar)
  - [ ] Type: "module"
  - [ ] Add bin entry: "./bin/run.ts"
  - [ ] Add dependencies: commander, clack, dotenv
  - [ ] Add devDependencies: typescript, @types/node, vitest
  - [ ] Add scripts: test, dev, build
- [ ] Create binary entry point (AC: 3)
  - [ ] Add shebang: `#!/usr/bin/env node`
  - [ ] Import Command from commander
  - [ ] Import all command modules
  - [ ] Set up main program with name, description, version
  - [ ] Add all subcommands
  - [ ] Call program.parse()
- [ ] Create command stub files (AC: 4)
  - [ ] `src/commands/wizard.ts` - Main wizard command
  - [ ] `src/commands/connector-add.ts` - Add connector
  - [ ] `src/commands/connector-remove.ts` - Remove connector
  - [ ] `src/commands/connector-test.ts` - Test connector
  - [ ] `src/commands/status.ts` - Show status
  - [ ] Each exports a Command instance
- [ ] Add command flags (AC: 5)
  - [ ] Add --yes flag to wizard command
  - [ ] Add --json flag to wizard and status commands
  - [ ] Add --help and --version (built-in to commander)
- [ ] Implement basic help output (AC: 6)
  - [ ] Command descriptions
  - [ ] Option descriptions
  - [ ] Usage examples
- [ ] Create TypeScript configuration
  - [ ] Extend root tsconfig or create package-specific
  - [ ] Ensure NodeNext module resolution
- [ ] Create unit tests (AC: 7)
  - [ ] Test CLI entry point
  - [ ] Test command registration
  - [ ] Test flag parsing
  - [ ] Achieve 80% coverage

## Dev Notes

### Package Structure

```
packages/wizard/
├── package.json
├── bin/
│   └── run.ts                    # CLI entry point
├── src/
│   ├── index.ts                  # Package entry point
│   ├── commands/                 # Command handlers
│   │   ├── wizard.ts
│   │   ├── connector-add.ts
│   │   ├── connector-test.ts
│   │   ├── connector-remove.ts
│   │   └── status.ts
│   ├── utils/                    # From EPIC-1
│   └── config/                   # From EPIC-1
├── tests/
│   ├── integration/
│   └── fixtures/
└── tsconfig.json                 # Optional: extends root
```

### Package.json Configuration

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
    "vitest": "^2.0.0"
  },
  "scripts": {
    "test": "vitest",
    "dev": "tsx bin/run.ts",
    "build": "tsc"
  }
}
```

### Entry Point (bin/run.ts)

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

### Command Structure

Each command file exports a `Command` instance:

```typescript
// src/commands/wizard.ts
import { Command } from 'commander';

export const wizardCommand = new Command('wizard')
  .description('Run interactive setup wizard')
  .option('--yes', 'Accept all defaults (non-interactive)')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    // Implementation in EPIC-6
  });
```

### TypeScript Path Aliases

If using path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Import Extensions (CRITICAL)

Remember: All imports MUST use `.js` extension even for TypeScript files:

```typescript
// ✅ CORRECT
import { wizardCommand } from '../src/commands/wizard.js';

// ❌ WRONG
import { wizardCommand } from '../src/commands/wizard';
```

### pnpm Workspace Integration

Update root `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

### Dependencies Version Locking

Use exact versions from root package.json to ensure consistency.

### Test Strategy

- Mock all command actions (stubs only)
- Test CLI parses arguments correctly
- Test help output is generated
- Test version flag works

### Project Context Reference

- Tech Stack: [working-document.md#L52-L85](../working-document.md#L52-L85)
- File Organization: [working-document.md#L182-L220](../working-document.md#L182-L220)
- CLI Commands: [working-document.md#L52-L85](../working-document.md#L52-L85)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
