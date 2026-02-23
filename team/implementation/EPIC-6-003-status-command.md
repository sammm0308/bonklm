# Story 6.3: Status Command

Status: ready-for-dev

**Epic:** EPIC-6 - Wizard UX
**Priority:** P2
**Dependency:** EPIC-3, EPIC-5
**Points:** 2
**File:** `src/commands/status.ts`

## Story

As a user checking my configuration,
I want a command that displays detected environment and configured connectors,
so that I can understand what's available and what's set up.

## Acceptance Criteria

1. Display detected environment (frameworks, services, credentials)
2. Display configured connectors
3. Support JSON output mode
4. Support --json flag

## Tasks / Subtasks

- [ ] Create status command (AC: 1-4)
  - [ ] Use Commander.js subcommand
  - [ ] Define 'status' command
  - [ ] Add --json flag
  - [ ] Add description
- [ ] Detect environment (AC: 1)
  - [ ] Call detectFrameworks()
  - [ ] Call detectServices()
  - [ ] Call detectCredentials()
  - [ ] Store results
- [ ] Read configured connectors (AC: 2)
  - [ ] Read .env file via EnvManager
  - [ ] Parse configured connector IDs
  - [ ] Check status of each
- [ ] Display formatted output (AC: 1, 2)
  - [ ] Section: "Environment Status"
  - [ ] Subsection: "Frameworks"
  - [ ] Subsection: "Services"
  - [ ] Subsection: "Credentials"
  - [ ] Section: "Configured Connectors"
- [ ] Implement JSON mode (AC: 3, 4)
  - [ ] If --json flag
  - [ ] Output structured JSON
  - [ ] Include all detection results
  - [ ] Include configured connectors
- [ ] Add colors and formatting
  - [ ] Use terminal capabilities
  - [ ] Green for available/running
  - [ ] Red for missing/stopped
  - [ ] Yellow for partial

## Dev Notes

### Command Structure

```typescript
import { Command } from 'commander';
import { detectFrameworks } from '../detection/framework.js';
import { detectServices } from '../detection/services.js';
import { detectCredentials } from '../detection/credentials.js';
import { EnvManager } from '../config/env.js';
import { getTerminalCapabilities } from '../utils/terminal.js';

export const statusCommand = new Command('status')
  .option('--json', 'Output in JSON format')
  .description('Show environment and connector status')
  .action(async (options) => {
    // Detect everything
    const frameworks = await detectFrameworks();
    const services = await detectServices();
    const credentials = await detectCredentials();
    const envManager = new EnvManager();
    const env = await envManager.read();

    if (options.json) {
      console.log(JSON.stringify({
        frameworks,
        services,
        credentials,
        configured: Object.keys(env),
        timestamp: new Date().toISOString(),
      }, null, 2));
      return;
    }

    // Formatted output
    displayStatus(frameworks, services, credentials, env);
  });
```

### Display Function

```typescript
function displayStatus(
  frameworks: DetectedFramework[],
  services: DetectedService[],
  credentials: DetectedCredential[],
  env: Record<string, string>
): void {
  const { supportsColor } = getTerminalCapabilities();

  console.log('\n=== Environment Status ===\n');

  // Frameworks
  console.log('Frameworks:');
  if (frameworks.length === 0) {
    console.log('  No frameworks detected');
  } else {
    for (const f of frameworks) {
      const status = supportsColor ? '\x1b[32m✓\x1b[0m' : '✓';
      console.log(`  ${status} ${f.name} ${f.version || ''}`);
    }
  }

  // Services
  console.log('\nServices:');
  if (services.length === 0) {
    console.log('  No services detected');
  } else {
    for (const s of services) {
      const status = s.available
        ? (supportsColor ? '\x1b[32m✓\x1b[0m' : '✓')
        : (supportsColor ? '\x1b[31m✗\x1b[0m' : '✗');
      const state = s.available ? 'running' : 'not running';
      console.log(`  ${status} ${s.name}: ${state}`);
      if (s.address) {
        console.log(`     at ${s.address}`);
      }
    }
  }

  // Credentials
  console.log('\nCredentials:');
  if (credentials.length === 0) {
    console.log('  No credentials detected');
  } else {
    for (const c of credentials) {
      const status = c.present
        ? (supportsColor ? '\x1b[32m✓\x1b[0m' : '✓')
        : (supportsColor ? '\x1b[31m✗\x1b[0m' : '✗');
      console.log(`  ${status} ${c.key}: ${c.maskedValue}`);
    }
  }

  // Configured connectors
  console.log('\n=== Configured Connectors ===\n');

  const configuredKeys = Object.keys(env).filter(k =>
    k.includes('API_KEY') || k.includes('HOST')
  );

  if (configuredKeys.length === 0) {
    console.log('  No connectors configured');
    console.log('  Run "bonklm wizard" to set up connectors');
  } else {
    for (const key of configuredKeys) {
      const status = supportsColor ? '\x1b[32m✓\x1b[0m' : '✓';
      console.log(`  ${status} ${key}`);
    }
  }

  console.log('');
}
```

### Example Output

```
=== Environment Status ===

Frameworks:
  ✓ express ^4.18.0
  ✓ langchain ^0.1.0

Services:
  ✓ ollama: running
     at localhost:11434
  ✗ weaviate: not running

Credentials:
  ✓ OPENAI_API_KEY: sk****************xyz
  ✓ ANTHROPIC_API_KEY: sk****************3456
  ✗ OLLAMA_HOST: not set

=== Configured Connectors ===

  ✓ OPENAI_API_KEY
  ✓ ANTHROPIC_API_KEY

Run "bonklm wizard" to add more connectors.
```

### JSON Output

```json
{
  "frameworks": [
    { "name": "express", "version": "^4.18.0" }
  ],
  "services": [
    { "name": "ollama", "type": "port", "available": true, "address": "localhost:11434" }
  ],
  "credentials": [
    { "name": "openai", "key": "OPENAI_API_KEY", "maskedValue": "sk****************xyz", "present": true }
  ],
  "configured": ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

### Color Coding

| Symbol | Color | Meaning |
|--------|-------|---------|
| ✓ | Green | Available, running, present |
| ✗ | Red | Not available, stopped, missing |
| ⚠ | Yellow | Partial, uncertain |

### Usage

```bash
# Interactive output
bonklm status

# JSON output
bonklm status --json

# Pipe to jq
bonklm status --json | jq '.frameworks'
```

### Project Context Reference

- Wizard UX: [working-document.md#L772-L860](../working-document.md#L772-L860)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
