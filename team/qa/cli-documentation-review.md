# CLI Documentation Review Report

**Review Date**: 2025-02-21
**Reviewer**: Claude Code
**Scope**: BonkLM CLI (`bonklm` command)
**Project**: @blackunicorn/bonklm

---

## Executive Summary

| Criterion | Grade | Status |
|-----------|-------|--------|
| Help Text Accuracy | B | Minor Issues |
| Command Descriptions | B+ | Good |
| Options Documentation | C | Incomplete |
| Examples | C- | Missing |
| Rebranding Consistency | B | Partial |
| Error Messages | A | Excellent |
| **Overall Grade** | **B-** | **Acceptable with Improvements Needed** |

### Key Findings Summary

- **P0 (Critical)**: 0 issues
- **P1 (High)**: 3 issues
- **P2 (Medium)**: 8 issues
- **P3 (Low)**: 6 issues

---

## Detailed Findings by Category

### 1. Help Text Accuracy

#### P1: Inconsistent Branding in Status Command Output

**File**: `/packages/core/src/cli/commands/status.ts`
**Line**: 101
**Severity**: P1 (High)

**Issue**: The status command header displays "LLM-Guardrails" instead of "BonkLM".

```typescript
// Line 101
console.log('  LLM-Guardrails Environment Status');
```

**Recommendation**: Update to:
```typescript
console.log('  BonkLM Environment Status');
```

---

#### P2: Legacy Package Name in Module Comments

**Files**:
- `/packages/core/src/cli/commands/wizard.ts` (line 4)
- `/packages/core/src/cli/commands/connector.ts` (line 4)
- `/packages/core/src/cli/commands/status.ts` (line 4)
- `/packages/core/src/cli/commands/connector-add.ts` (line 4)
- `/packages/core/src/cli/commands/connector-remove.ts` (line 4)
- `/packages/core/src/cli/commands/connector-test.ts` (line 4)

**Severity**: P2 (Medium)

**Issue**: Command file headers reference "LLM-Guardrails" in module JSDoc comments instead of "BonkLM".

**Example**:
```typescript
/**
 * Wizard Command
 *
 * Run interactive setup wizard for LLM-Guardrails connectors.
 * ...
 */
```

**Recommendation**: Update all references to "BonkLM" for consistency.

---

#### P3: Utility Module Header References Old Name

**Files**:
- `/packages/core/src/cli/utils/error.ts` (line 2)
- `/packages/core/src/cli/utils/exit.ts` (line 2)
- `/packages/core/src/cli/utils/terminal.ts` (line 2)
- `/packages/core/src/cli/utils/audit.ts` (line 3)

**Severity**: P3 (Low)

**Issue**: Internal utility module headers reference "LLM-Guardrails Installation Wizard" which is now the "BonkLM CLI".

**Recommendation**: Update module headers to reflect the new product name.

---

### 2. Command Descriptions

#### B+: Command Descriptions are Clear

All commands have clear, concise descriptions in the Commander configuration:

```typescript
// Main entry point - /packages/core/src/bin/run.ts
program
  .name('bonklm')
  .description('BonkLM - LLM Security Guardrails')
  .version('0.1.0');

// Subcommands
wizardCommand     .description('Run interactive setup wizard')
connectorCommand  .description('Manage connector configurations')
statusCommand     .description('Show environment and connector status')
```

This is well done.

---

### 3. Options Documentation

#### P1: Missing --help Option Documentation

**Files**: All command files
**Severity**: P1 (High)

**Issue**: Commands do not explicitly document their options in the help text. While Commander.js provides automatic help generation, the custom options lack usage examples.

**Affected Commands**:
- `wizard --json` - Not documented in help text
- `connector add --force` - Not documented in help text
- `connector remove --yes` - Not documented in help text
- `connector test --json` - Not documented in help text
- `status --json` - Not documented in help text

**Recommendation**: Add option descriptions:

```typescript
export const wizardCommand = new Command('wizard')
  .description('Run interactive setup wizard')
  .option('--json', 'Output results in JSON format')
  .addHelpText('after', `

Examples:
  bonklm wizard
  bonklm wizard --json
`);
```

---

#### P2: No Examples in Command Help

**Files**: All command files
**Severity**: P2 (Medium)

**Issue**: None of the CLI commands include usage examples in their help output. Users must refer to the README to understand how to use the CLI.

**Recommendation**: Add `.addHelpText()` with examples for each command.

---

#### P3: Missing Global Options Documentation

**File**: `/packages/core/src/bin/run.ts`
**Severity**: P3 (Low)

**Issue**: The main program doesn't document any global options like `--version` or `--help` explicitly.

**Recommendation**: Consider adding global help context about available commands and general usage.

---

### 4. Examples

#### C-: No Inline Help Examples

**Severity**: P1 (High for user experience)

**Issue**: Commands lack inline examples accessible via `--help`. Users must:
1. Know to look at the README
2. Know to look at GitHub documentation
3. Experiment with the CLI

**Current State**:
```bash
$ bonklm --help
# Shows: Usage: bonklm [options] [command]
# No examples shown
```

**Recommended State**:
```bash
$ bonklm --help
# Shows:
# Usage: bonklm [options] [command]
#
# Examples:
#   bonklm                    # Run setup wizard
#   bonklm wizard --json      # Get JSON output
#   bonklm status             # Check environment
#   bonklm connector add openai  # Add OpenAI connector
```

---

### 5. Rebranding Consistency

#### P1: README References Both `npx` and `bonklm` Command

**File**: `/README.md`
**Lines**: 252-267
**Severity**: P1 (High)

**Issue**: The README shows usage with `npx @blackunicorn/bonklm` but doesn't clearly distinguish between:
1. Using via npx (no installation)
2. Using globally installed CLI
3. Using as a dependency

This could confuse users about how to invoke the CLI.

**Current Documentation**:
```bash
npx @blackunicorn/bonklm
bonklm connector add openai
```

**Recommendation**: Clarify the three usage modes:
```bash
# Option 1: No installation (via npx)
npx @blackunicorn/bonklm wizard

# Option 2: Global installation
npm install -g @blackunicorn/bonklm
bonklm wizard

# Option 3: As a dependency (using npm script or node)
npm install @blackunicorn/bonklm
npx bonklm wizard
```

---

#### P2: Deprecated Wizard Package Still References Old CLI Name

**File**: `/packages/wizard/bin/run.ts`
**Line**: 27
**Severity**: P2 (Medium)

**Issue**: The deprecated wizard package still shows `llm-guardrails` as the command name in the deprecation notice, which could confuse users migrating to the new package.

**Current Code**:
```typescript
program
  .name('llm-guardrails')
  .description('BonkLM Installation Wizard (DEPRECATED - use @blackunicorn/bonklm)')
```

**Recommendation**: While this package is deprecated, the deprecation notice should still show the correct old command name for users migrating. The current code is actually correct for legacy users, but consider if this package should even exist anymore.

---

#### P2: Package Bin Configuration Has Redundant Entry

**File**: `/packages/core/package.json`
**Lines**: 9-11
**Severity**: P2 (Medium)

**Issue**: The package.json has an extra "cli" entry in the bin configuration that doesn't match the published package structure.

```json
"bin": {
  "bonklm": "./dist/bin/run.js",
  "cli": "bin/run.ts"  // This appears to be an error - points to source, not dist
}
```

**Recommendation**: Remove the "cli" entry:
```json
"bin": {
  "bonklm": "./dist/bin/run.js"
}
```

---

### 6. Error Messages

#### A: Excellent Error Handling and Messages

**Files**: Various command and utility files
**Severity**: N/A (This is a positive finding)

**Good Practices Observed**:

1. **WizardError Class** (`/packages/core/src/cli/utils/error.ts`):
   - Structured error codes
   - User-friendly messages
   - Actionable suggestions
   - Proper exit codes

2. **Credential Validation Messages** (`/packages/core/src/cli/commands/connector-add.ts`):
   ```typescript
   if (envVar === 'OPENAI_API_KEY' && !value.startsWith('sk-')) {
     return 'OpenAI API key must start with "sk-"';
   }
   ```

3. **Connector Not Found Messages**:
   ```typescript
   p.cancel(`Unknown connector: ${id}`);
   p.log.info(`Available connectors: ${['openai', 'anthropic', 'ollama', 'express', 'langchain'].join(', ')}`);
   ```

4. **Security-Conscious Error Messages**:
   - No credential leakage in errors
   - Masked values in output
   - Sanitized error messages

**No Issues Found** - Error handling is exemplary.

---

### 7. Additional Findings

#### P2: Missing Description for Default Action

**File**: `/packages/core/src/bin/run.ts`
**Lines**: 22-25
**Severity**: P2 (Medium)

**Issue**: When no command is provided, the CLI doesn't trigger the wizard by default. It shows help instead, but this behavior is not documented.

```typescript
program.action(() => {
  // Show help if no command provided - commander will handle this
});
```

**Recommendation**: Either:
1. Make `bonklm` (no args) run the wizard by default (more user-friendly)
2. Document this behavior explicitly in the help text

---

#### P3: Inconsistent Use of Backticks in Command Descriptions

**Files**: Various
**Severity**: P3 (Low)

**Issue**: Some command descriptions use connector IDs in backticks, others don't. Inconsistent formatting makes help text harder to scan.

**Examples**:
- Line 25 of connector-add.ts: `'Connector ID (e.g., openai, anthropic, ollama)'` (no backticks)
- Line 25 of connector-test.ts: `'Connector ID (e.g., openai, anthropic, ollama)'` (no backticks)

**Recommendation**: Use backticks consistently for command elements:
```typescript
.argument('<id>', 'Connector ID (e.g., `openai`, `anthropic`, `ollama`)')
```

---

#### P3: No Usage Hints for Common Tasks

**File**: Main CLI entry point
**Severity**: P3 (Low)

**Issue**: The CLI doesn't provide hints for common workflows after operations complete.

**Example**: After `bonklm connector add openai` succeeds:
```
✓ OpenAI connector added successfully.
Run 'bonklm status' to see all configured connectors.
Done!
```

This is actually good, but could be improved with next-step hints like:
```
Next steps:
  • Run 'bonklm wizard' to add more connectors
  • See docs.bonklm.dev for integration examples
```

---

## File-Specific Issues Summary

### `/packages/core/src/bin/run.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 23-25 | No default action - doesn't run wizard | P2 |

### `/packages/core/src/cli/commands/status.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 4 | "LLM-Guardrails" in header comment | P2 |
| 101 | "LLM-Guardrails" in output | P1 |

### `/packages/core/src/cli/commands/wizard.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 4 | "LLM-Guardrails" in header | P2 |
| 276 | "LLM-Guardrails" in intro message | P2 |

### `/packages/core/src/cli/commands/connector-add.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 4 | "LLM-Guardrails" in header | P2 |

### `/packages/core/src/cli/commands/connector-remove.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 22 | "EPIC-6" reference in TODO | P3 |

### `/packages/core/src/cli/commands/connector-test.ts`
| Line | Issue | Severity |
|------|-------|----------|
| 21 | "EPIC-5" reference in TODO | P3 |

### `/packages/core/package.json`
| Line | Issue | Severity |
|------|-------|----------|
| 9-11 | Redundant "cli" bin entry | P2 |

---

## Recommendations

### Priority 1 (Must Fix)

1. **Update status command output** from "LLM-Guardrails" to "BonkLM"
2. **Add inline examples** to all command help text
3. **Clarify CLI invocation methods** in README (npx vs global vs dependency)

### Priority 2 (Should Fix)

1. Update all module header comments from "LLM-Guardrails" to "BonkLM"
2. Remove redundant "cli" entry from package.json bin configuration
3. Consider making `bonklm` (no args) run the wizard by default
4. Add option descriptions to help text (`--json`, `--force`, `--yes`)

### Priority 3 (Nice to Have)

1. Remove TODO comments referencing EPIC numbers from production code
2. Add next-step hints after successful operations
3. Use consistent backtick formatting in command descriptions
4. Consider adding a `--verbose` flag for debugging

---

## Testing Recommendations

To validate CLI help text completeness, test the following commands:

```bash
# Main help
bonklm --help

# Command-specific help
bonklm wizard --help
bonklm connector --help
bonklm connector add --help
bonklm connector remove --help
bonklm connector test --help
bonklm status --help

# Error handling
bonklm connector add invalid-connector
bonklm nonexistent-command
```

---

## Appendix: CLI Structure Overview

```
bonklm
|-- (default)        : Shows help (should run wizard?)
|-- wizard           : Interactive setup wizard
|   |-- --json       : Output in JSON format
|-- connector        : Connector management
|   |-- add <id>     : Add a connector
|   |   |-- --force  : Skip connection test
|   |-- remove <id>  : Remove a connector
|   |   |-- --yes    : Skip confirmation
|   |-- test <id>    : Test a connector
|   |   |-- --json   : Output in JSON format
|-- status           : Show environment status
    |-- --json       : Output in JSON format
```

---

**Review Complete**: 2025-02-21
**Next Review**: After implementing Priority 1 fixes
