# Story 6.1: Wizard Command Flow

Status: ready-for-dev

**Epic:** EPIC-6 - Wizard UX
**Priority:** P2
**Dependency:** EPIC-3, EPIC-5
**Points:** 5
**File:** `src/commands/wizard.ts`

## Story

As a user running the setup wizard,
I want an interactive flow that detects my environment and lets me confirm connectors,
so that I can quickly configure guardrails without manual setup.

## Acceptance Criteria

1. Sequential phased detection (Framework → Services → Credentials)
2. Display detected items with pre-selection
3. User confirmation via Clack prompts
4. Credential collection for selected connectors
5. Test all selected connectors
6. Write to .env file
7. Display summary with results

## Tasks / Subtasks

- [ ] Create wizard command (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Use Commander.js to define 'wizard' command
  - [ ] Add --yes flag (non-interactive)
  - [ ] Add --json flag (output format)
- [ ] Phase 1: Framework Detection (AC: 1)
  - [ ] Call detectFrameworks()
  - [ ] Display results with spinner
  - [ ] Store for later use
- [ ] Phase 2: Service Detection (AC: 1)
  - [ ] Call detectServices()
  - [ ] Display results with spinner
  - [ ] Store for later use
- [ ] Phase 3: Credential Detection (AC: 1)
  - [ ] Call detectCredentials()
  - [ ] Display results with spinner
  - [ ] Store for later use
- [ ] Display detected items (AC: 2)
  - [ ] Show all detected frameworks, services, credentials
  - [ ] Use Clack's select/multiselect prompts
  - [ ] Pre-select items based on detection
- [ ] User confirmation (AC: 3)
  - [ ] Use Clack's confirm prompt
  - [ ] "Continue with selected connectors?"
  - [ ] Allow user to go back or modify selection
- [ ] Credential collection (AC: 4)
  - [ ] For each selected connector needing credentials
  - [ ] Use Clack's password prompt
  - [ ] Validate format immediately
  - [ ] Mask input during entry
- [ ] Test connectors (AC: 5)
  - [ ] Call testConnector() for each
  - [ ] Display progress with spinner
  - [ ] Show pass/fail results
- [ ] Write .env file (AC: 6)
  - [ ] Use EnvManager.write()
  - [ ] Merge with existing .env
  - [ ] Set secure permissions
- [ ] Display summary (AC: 7)
  - [ ] Show all configured connectors
  - [ ] Show test results
  - [ ] Show .env file location
  - [ ] Next steps for user
- [ ] Handle --yes flag
  - [ ] Skip all prompts
  - [ ] Accept all detected items
  - [ ] Use defaults for everything
- [ ] Handle --json flag
  - [ ] Output all results in JSON format
  - [ ] No interactive prompts
- [ ] Error handling
  - [ ] Wrap in try/catch
  - [ ] Use exitWithError() on failure
  - [ ] Log audit events

## Dev Notes

### Command Structure

```typescript
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { detectFrameworks } from '../detection/framework.js';
import { detectServices } from '../detection/services.js';
import { detectCredentials } from '../detection/credentials.js';
import { testConnector } from '../testing/validator.js';
import { EnvManager } from '../config/env.js';
import { AuditLogger } from '../utils/audit.js';
import { exit, exitWithError } from '../utils/exit.js';

export const wizardCommand = new Command('wizard')
  .description('Run interactive setup wizard')
  .option('--yes', 'Accept all defaults (non-interactive)')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    const audit = new AuditLogger();

    try {
      // Intro
      if (!options.json) {
        p.intro('BonkLM Installation Wizard');
      }

      // Phase 1: Framework Detection
      const frameworks = await p.group(
        { frameworks: () => detectFrameworks() },
        {
          onStart: () => p.spinner().start('Detecting frameworks...'),
          onFinish: () => p.spinner().stop('Frameworks detected'),
        }
      );

      // Phase 2: Service Detection
      const services = await p.group(
        { services: () => detectServices() },
        {
          onStart: () => p.spinner().start('Detecting services...'),
          onFinish: () => p.spinner().stop('Services detected'),
        }
      );

      // Phase 3: Credential Detection
      const credentials = await p.group(
        { credentials: () => detectCredentials() },
        {
          onStart: () => p.spinner().start('Checking credentials...'),
          onFinish: () => p.spinner().stop('Credentials checked'),
        }
      );

      // Display and confirm selection
      const selected = await selectConnectors(
        frameworks,
        services,
        credentials,
        options.yes
      );

      if (selected.length === 0) {
        p.outro('No connectors selected. Exiting.');
        exit('SUCCESS');
      }

      // Collect credentials
      const config = await collectCredentials(selected, options.yes);

      // Test connectors
      const testResults = await testAllConnectors(selected, config, options.json);

      // Write .env
      const envManager = new EnvManager();
      await envManager.write(config);

      // Summary
      displaySummary(selected, testResults, options.json);

      await audit.log({
        action: 'connector_added',
        success: true,
      });

      p.outro('Setup complete!');
      exit('SUCCESS');
    } catch (error) {
      await audit.log({
        action: 'connector_added',
        success: false,
        error_code: (error as WizardError).code,
      });
      exitWithError(error as Error);
    }
  });
```

### Clack Prompts

```typescript
import * as p from '@clack/prompts';

// Multi-select for connectors
const selected = await p.multiselect({
  message: 'Select connectors to configure:',
  options: [
    { value: 'openai', label: 'OpenAI', hint: 'API key detected' },
    { value: 'anthropic', label: 'Anthropic', hint: 'No API key' },
    { value: 'ollama', label: 'Ollama', hint: 'Running on :11434' },
  ],
  required: false,
});

// Password prompt for API keys
const apiKey = await p.password({
  message: 'Enter your OpenAI API key:',
  validate: (value) => {
    if (!value.startsWith('sk-')) return 'Invalid API key format';
    return undefined;
  },
});

// Confirm prompt
const confirmed = await p.confirm({
  message: 'Continue with selected connectors?',
  initialValue: true,
});
```

### Phased Detection Flow

```
1. Framework Detection
   ↓
2. Service Detection
   ↓
3. Credential Detection
   ↓
4. Display & Select
   ↓
5. Collect Credentials
   ↓
6. Test Connectors
   ↓
7. Write .env
   ↓
8. Summary
```

### Progress Indicators

Use Clack's group feature for spinners:

```typescript
const result = await p.group(
  {
    detect: () => detectFrameworks(),
  },
  {
    onStart: () => p.spinner().start('Detecting...'),
    onFinish: () => p.spinner().stop('Done'),
  }
);
```

### --yes Flag Behavior

```typescript
if (options.yes) {
  // Auto-select all detected items
  selected = getAllDetected(frameworks, services, credentials);
  // Skip confirmation prompts
  // Use default values
}
```

### --json Flag Behavior

```typescript
if (options.json) {
  // Output everything as JSON
  console.log(JSON.stringify({
    detected: { frameworks, services, credentials },
    selected,
    testResults,
  }, null, 2));
}
```

### Summary Output

```
✓ Setup Complete!

Configured Connectors:
  ✓ OpenAI (validated)
  ✓ Ollama (validated)
  ✗ Anthropic (validation failed)

Environment File:
  Written to: .env
  Permissions: 0600 (owner read/write only)

Next Steps:
  1. Review generated code snippets
  2. Copy snippets into your application
  3. Run: npm test to verify integration
```

### Error Handling

```typescript
try {
  // ... wizard logic
} catch (error) {
  if (error instanceof WizardError) {
    console.error(error.toString());
  } else {
    console.error('Unexpected error:', error);
  }
  process.exit(1);
}
```

### Project Context Reference

- Wizard UX: [working-document.md#L772-L860](../working-document.md#L772-L860)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
