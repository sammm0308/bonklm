# Story 3.3: Credential Detection (environment)

Status: ready-for-dev

**Epic:** EPIC-3 - Detection Engine
**Priority:** P1
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/detection/credentials.ts`

## Story

As the wizard detecting configured credentials,
I want to scan environment variables for known API keys,
so that I can pre-fill credentials without asking the user.

## Acceptance Criteria

1. Scan process.env for known API keys
2. Detect: OPENAI_API_KEY, ANTHROPIC_API_KEY
3. Return found credentials with validation status
4. Mask values in output
5. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define DetectedCredential interface
  - [ ] name: string (human-readable)
  - [ ] key: string (env var name)
  - [ ] maskedValue: string
  - [ ] present: boolean
- [ ] Define CREDENTIAL_PATTERNS constant (AC: 2)
  - [ ] openai: 'OPENAI_API_KEY'
  - [ ] anthropic: 'ANTHROPIC_API_KEY'
  - [ ] ollama: 'OLLAMA_HOST' (optional)
- [ ] Implement detectCredentials() function (AC: 1-4)
  - [ ] Iterate over CREDENTIAL_PATTERNS
  - [ ] Check process.env for each key
  - [ ] Mask value using maskKey() utility
  - [ ] Return array of DetectedCredential
- [ ] Implement maskKey() utility function (AC: 4)
  - [ ] Show first 2 and last 4 characters
  - [ ] Fill middle with asterisks
  - [ ] Handle short values (return '***')
- [ ] Create unit tests (AC: 5)
  - [ ] Test with OpenAI key present
  - [ ] Test with Anthropic key present
  - [ ] Test with multiple keys
  - [ ] Test with no keys
  - [ ] Test maskKey() function
  - [ ] Test short values
  - [ ] Test long values
  - [ ] Achieve 90% coverage

## Dev Notes

### DetectedCredential Interface

```typescript
export interface DetectedCredential {
  name: string;           // Human-readable: 'OpenAI', 'Anthropic'
  key: string;            // Env var name: 'OPENAI_API_KEY'
  maskedValue: string;    // 'sk***...xyz'
  present: boolean;       // true if env var is set
}
```

### CREDENTIAL_PATTERNS

```typescript
const CREDENTIAL_PATTERNS = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  ollama: 'OLLAMA_HOST',  // Optional: for Ollama configuration
} as const;
```

### Implementation

```typescript
import { maskKey } from '../utils/mask.js';

export function detectCredentials(): DetectedCredential[] {
  const detected: DetectedCredential[] = [];

  for (const [name, envVar] of Object.entries(CREDENTIAL_PATTERNS)) {
    const value = process.env[envVar];
    detected.push({
      name,
      key: envVar,
      maskedValue: value ? maskKey(value) : 'not set',
      present: Boolean(value),
    });
  }

  return detected;
}

// maskKey() utility (src/utils/mask.ts)
export function maskKey(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 6)}${value.slice(-4)}`;
}
```

### Usage Example

```typescript
const credentials = await detectCredentials();
// Returns:
// [
//   { name: 'openai', key: 'OPENAI_API_KEY', maskedValue: 'sk******xyz', present: true },
//   { name: 'anthropic', key: 'ANTHROPIC_API_KEY', maskedValue: 'not set', present: false }
// ]
```

### Masking Strategy

Show first 2 and last 4 characters:
- `sk-1234567890abcdefghijklmnopqrstuvwxyz` → `sk************************xyz`
- `sk-ant-12345...` → `sk*******************3456`

**Why not show the full prefix?**

Attackers can infer API patterns from prefixes. Showing only minimal chars reduces information leakage.

### Security Considerations

**CRITICAL:** Never log actual credential values. Only log masked values.

```typescript
// ✅ CORRECT
logger.debug('Detected credentials', {
  openai: maskKey(process.env.OPENAI_API_KEY)
});

// ❌ WRONG
logger.debug('Detected credentials', {
  openai: process.env.OPENAI_API_KEY  // LEAK!
});
```

### Test Cases

```typescript
// Test maskKey
maskKey('sk-1234567890abcdefghijklmnop');  // 'sk****************mnop'
maskKey('short');                         // '***'
maskKey('sk-12');                         // '***'
maskKey('sk-1234');                       // 'sk**34'
```

### Extensions for Future

More credentials can be added:
- `COHERE_API_KEY`
- `HUGGINGFACE_API_KEY`
- `GOOGLE_API_KEY`
- `AZURE_OPENAI_API_KEY`

### Cross-Platform

Environment variables work the same across:
- Unix-like: `.env` files loaded via dotenv
- Windows: `.env` files or system environment
- CI/CD: Pipeline environment variables

### Project Context Reference

- Detection Engine: [working-document.md#L482-L580](../working-document.md#L482-L580)
- Security Rules: [working-document.md#L193-L202](../working-document.md#L193-L202)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
