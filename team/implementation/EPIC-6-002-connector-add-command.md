# Story 6.2: Connector Add Command

Status: ready-for-dev

**Epic:** EPIC-6 - Wizard UX
**Priority:** P2
**Dependency:** EPIC-3, EPIC-5
**Points:** 3
**File:** `src/commands/connector-add.ts`

## Story

As a user adding a single connector,
I want a quick command that detects, configures, and tests a connector,
so that I can rapidly add connectors without running the full wizard.

## Acceptance Criteria

1. Accept connector ID as argument
2. Run detection for that connector
3. Collect credentials via secure prompt
4. Test connector before saving
5. Write to .env file
6. Log audit event

## Tasks / Subtasks

- [ ] Create connector-add command (AC: 1)
  - [ ] Use Commander.js subcommand
  - [ ] Define 'add' under 'connector' namespace
  - [ ] Accept connector ID as argument
  - [ ] Add description
- [ ] Implement connector lookup (AC: 2)
  - [ ] Call getConnector(id)
  - [ ] Handle unknown connector (error + exit)
- [ ] Run detection (AC: 2)
  - [ ] Check connector's detection rules
  - [ ] Display what was detected
  - [ ] Confirm with user
- [ ] Collect credentials (AC: 3)
  - [ ] For each envVar in connector.detection
  - [ ] Use Clack's password prompt
  - [ ] Validate format immediately
  - [ ] Store in config object
- [ ] Test connector (AC: 4)
  - [ ] Call testConnector()
  - [ ] Display test result with spinner
  - [ ] Handle test failure
  - [ ] Ask user if they want to continue despite failure
- [ ] Write to .env (AC: 5)
  - [ ] Use EnvManager.write()
  - [ ] Pass collected credentials
  - [ ] Confirm file location
- [ ] Log audit events (AC: 6)
  - [ ] Log connector_detected event
  - [ ] Log connector_added event (success/failure)
- [ ] Error handling
  - [ ] Use exitWithError() on failure
  - [ ] Provide actionable error messages

## Dev Notes

### Command Structure

```typescript
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { getConnector } from '../connectors/registry.js';
import { testConnector } from '../testing/validator.js';
import { EnvManager } from '../config/env.js';
import { AuditLogger } from '../utils/audit.js';
import { exit, exitWithError } from '../utils/exit.js';

export const connectorAddCommand = new Command('add')
  .argument('<id>', 'Connector ID (e.g., openai, anthropic, ollama)')
  .description('Add a connector')
  .action(async (id) => {
    const audit = new AuditLogger();

    try {
      p.intro(`Adding ${id} connector`);

      await audit.log({
        action: 'connector_detected',
        connector_id: id,
        success: true,
      });

      // Get connector
      const connector = getConnector(id);
      if (!connector) {
        console.error(`Unknown connector: ${id}`);
        console.error('Available connectors:');
        console.log('  - openai');
        console.log('  - anthropic');
        console.log('  - ollama');
        console.log('  - express');
        console.log('  - langchain');
        exit('ERROR');
      }

      // Show detection results
      console.log(`\nConnector: ${connector.name}`);
      console.log(`Category: ${connector.category}`);

      // Collect credentials
      const config: Record<string, string> = {};

      for (const key of connector.detection.envVars || []) {
        const value = await p.password({
          message: `Enter ${key}:`,
          validate: (val) => {
            if (!val) return 'Value is required';
            if (key.includes('KEY') && !val.startsWith('sk-')) {
              return 'Invalid format';
            }
            return undefined;
          },
        });

        if (typeof value === 'string') {
          config[key] = value;
        }
      }

      // Test connector
      const testSpinner = p.spinner();
      testSpinner.start('Testing connector...');

      const result = await testConnector(connector, config);

      if (result.connection && result.validation) {
        testSpinner.stop('✓ Connector test passed');
      } else {
        testSpinner.stop('✗ Connector test failed');
        console.log(`Error: ${result.error}`);

        const continueAnyway = await p.confirm({
          message: 'Connector test failed. Continue anyway?',
          initialValue: false,
        });

        if (typeof continueAnyway !== 'boolean' || !continueAnyway) {
          await audit.log({
            action: 'connector_added',
            connector_id: id,
            success: false,
            error_code: 'TEST_FAILED',
          });
          exit('ERROR');
        }
      }

      // Write to .env
      const envManager = new EnvManager();
      await envManager.write(config);

      await audit.log({
        action: 'connector_added',
        connector_id: id,
        success: true,
      });

      p.outro(`✓ ${connector.name} connector added successfully.`);
      exit('SUCCESS');
    } catch (error) {
      await audit.log({
        action: 'connector_added',
        connector_id: id,
        success: false,
        error_code: (error as WizardError)?.code,
      });
      exitWithError(error as Error);
    }
  });
```

### Command Registration

```typescript
// In bin/run.ts or commands/connector.ts
const connectorCommand = new Command('connector');
connectorCommand.addCommand(connectorAddCommand);
program.addCommand(connectorCommand);
```

### Usage

```bash
# Add OpenAI connector
bonklm connector add openai

# Add Anthropic connector
bonklm connector add anthropic

# Add Ollama connector
bonklm connector add ollama
```

### Credential Validation

```typescript
validate: (value) => {
  if (!value) return 'API key is required';
  if (id === 'openai' && !value.startsWith('sk-')) {
    return 'OpenAI API keys start with sk-';
  }
  if (id === 'anthropic' && !value.startsWith('sk-ant-')) {
    return 'Anthropic API keys start with sk-ant-';
  }
  return undefined;
}
```

### Test Failure Handling

1. Show error message
2. Ask user: "Continue anyway?"
3. If yes → write to .env anyway
4. If no → exit with error code

### EnvManager Integration

```typescript
const envManager = new EnvManager();
await envManager.write({
  OPENAI_API_KEY: 'sk-...',
  ANTHROPIC_API_KEY: 'sk-ant-...',
});
```

### Audit Events

```typescript
// Detection
await audit.log({
  action: 'connector_detected',
  connector_id: id,
  success: true,
});

// Success
await audit.log({
  action: 'connector_added',
  connector_id: id,
  success: true,
});

// Failure
await audit.log({
  action: 'connector_added',
  connector_id: id,
  success: false,
  error_code: 'TEST_FAILED',
});
```

### Error Messages

| Scenario | Message | Suggestion |
|----------|---------|------------|
| Unknown connector | `Unknown connector: xyz` | List available connectors |
| Invalid API key | `Invalid API key format` | Check key starts with correct prefix |
| Test failed | `Connector test failed` | Check credentials and network |
| Write failed | `Failed to write .env` | Check file permissions |

### Project Context Reference

- Wizard UX: [working-document.md#L772-L860](../working-document.md#L772-L860)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
