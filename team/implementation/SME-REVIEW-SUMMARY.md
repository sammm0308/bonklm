# SME Review Summary: Implementation Steps

**Date:** 2026-02-18
**Review Type:** Architecture, Security, Penetration Testing
**Status:** ✅ Complete (3/3 reviews complete, all findings consolidated)

---

## Executive Summary

Three SME agents reviewed the implementation steps for the BonkLM Installation Wizard. This document consolidates all findings, recommendations, and required changes to the epic steps.

**Overall Assessment:** 🟡 **READY WITH REVISIONS** (8/10)

**Required Action:** Address CRITICAL and HIGH PRIORITY issues before implementation begins.

---

## Review Status

| Reviewer | Status | Score | Critical Issues |
|----------|--------|-------|-----------------|
| Architect Agent | ✅ Complete | 8/10 | 3 HIGH, 4 MEDIUM issues |
| Security Architect Agent | ✅ Complete | N/A | 5 P0 fixes (all applied) |
| Pentester Agent | ✅ Complete | N/A | **6 CRITICAL, 8 HIGH, 9 MEDIUM, 4 LOW** |

**Total Vulnerabilities Found:** 27

---

## CRITICAL VULNERABILITIES (Must Fix Before Implementation)

### C-1: Command Injection in Docker Detection (EPIC-3, Story 3.2)

**Location:** `src/detection/services.ts` - Docker container detection

**Impact:** PATH manipulation allows execution of arbitrary binaries

**Attack Vector:**
- Attacker can modify `PATH` environment variable to point to malicious `docker` executable
- Container names are not sanitized before display/storage

**Required Fix:**
```typescript
import { which } from 'which';

async function detectDockerContainers(): Promise<string[]> {
  try {
    // Validate docker binary path
    const dockerPath = await which('docker');
    if (!dockerPath) return [];

    const { stdout } = await execFile(dockerPath, [
      'ps',
      '--format',
      '{{.Names}}'
    ], {
      timeout: 2000,
      env: { ...process.env, PATH: process.env.PATH } // Explicit PATH
    });

    // Sanitize container names (prevent injection)
    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(name => name.replace(/[^a-zA-Z0-9_-]/g, ''));
  } catch {
    return [];
  }
}
```

---

### C-2: Race Condition in .env Atomic Write (EPIC-1, Story 1.2)

**Location:** `src/config/env.ts` - writeAtomic method

**Impact:** TOCTOU vulnerability - Attacker can swap temp file with symlink

**Attack Vector:**
- Time-of-check to time-of-use between permission setting and rename
- Attacker can force writes to arbitrary system files

**Required Fix:**
```typescript
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';

private async writeAtomic(content: string): Promise<void> {
  // Use secure temp directory
  const tempDir = await mkdtemp(join(tmpdir(), '.env-'));
  const tempPath = join(tempDir, 'write.tmp');

  try {
    await writeFile(tempPath, content, { mode: 0o600 });
    await this.setSecurePermissions(tempPath);

    // Ensure same filesystem for atomic rename
    await this.ensureSameFilesystem(tempPath, this.path);

    await rename(tempPath, this.path);
    await this.verifyPermissions(this.path);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
```

---

### C-3: Credential Leakage in Error Sanitization (EPIC-1, Story 1.4)

**Location:** `src/utils/error.ts` - sanitizeError function

**Impact:** Credentials bypass sanitization via base64 encoding, Unicode, new formats

**Attack Vector:**
- Patterns don't cover all credential formats
- Base64-encoded credentials bypass filters
- High-entropy strings not detected

**Required Fix:**
```typescript
// Enhanced credential detection
const CREDENTIAL_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-ant-[a-zA-Z0-9]{20,}/g,
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  /api[_-]?key["\s:=]+[^\s"'`<>]+/gi,
  // Base64 patterns (detect high-entropy base64 strings)
  /(?:["']|:)\s*([A-Za-z0-9+/]{32,}={0,2})(?:["']|\s|$)/g,
];

function isHighEntropy(str: string): boolean {
  const unique = new Set(str).size;
  return unique / str.length > 0.7 && str.length > 30;
}

function sanitizeError(error: Error): Error {
  let sanitizedMessage = error.message;
  let sanitizedStack = error.stack;

  for (const pattern of CREDENTIAL_PATTERNS) {
    sanitizedMessage = sanitizedMessage.replace(pattern, (match) => {
      return isHighEntropy(match) ? '***REDACTED***' : match;
    });
    if (sanitizedStack) {
      sanitizedStack = sanitizedStack.replace(pattern, (match) => {
        return isHighEntropy(match) ? '***REDACTED***' : match;
      });
    }
  }

  const sanitized = new Error(sanitizedMessage);
  sanitized.stack = sanitizedStack;
  return sanitized;
}
```

---

### C-4: Path Traversal in package.json Detection (EPIC-3, Story 3.1)

**Location:** `src/detection/framework.ts` - detectFrameworks

**Impact:** Symlink attacks allow reading arbitrary files

**Attack Vector:**
- `process.cwd()` can be manipulated before wizard runs
- Symbolic links can redirect to arbitrary files
- No validation that package.json is within expected directory

**Required Fix:**
```typescript
import { realpath } from 'fs/promises';
import { cwd } from 'process';

export async function detectFrameworks(): Promise<DetectedFramework[]> {
  const workingDir = await realpath(cwd());
  const pkgPath = join(workingDir, 'package.json');

  // Ensure we're not following symlinks outside project
  const realPath = await realpath(pkgPath).catch(() => pkgPath);

  if (!realPath.startsWith(workingDir)) {
    throw new WizardError(
      'PATH_TRAVERSAL',
      'package.json path resolved outside working directory',
      'Ensure package.json is within project directory'
    );
  }

  // ... rest of detection
}
```

---

### C-5: Buffer Overflow in SecureCredential (EPIC-1, Story 1.1)

**Location:** `src/utils/secure-credential.ts` - constructor

**Impact:** DoS through memory exhaustion

**Attack Vector:**
- No size limits on credential values
- Extremely large credentials can exhaust memory

**Required Fix:**
```typescript
const MAX_CREDENTIAL_SIZE = 8192; // 8KB max

export class SecureCredential {
  private buffer: Buffer;

  constructor(value: string) {
    // Enforce size limits
    const byteLength = Buffer.byteLength(value, 'utf-8');

    if (byteLength > MAX_CREDENTIAL_SIZE) {
      throw new WizardError(
        'CREDENTIAL_TOO_LARGE',
        `Credential size (${byteLength} bytes) exceeds maximum (${MAX_CREDENTIAL_SIZE} bytes)`,
        'Use a shorter API key or token'
      );
    }

    this.buffer = Buffer.alloc(byteLength);
    this.buffer.write(value, 'utf-8');
  }
}
```

---

### C-6: Denial of Service in Port Scanning (EPIC-3, Story 3.2)

**Location:** `src/detection/services.ts` - checkPort function

**Impact:** Unbounded port scanning consumes resources

**Attack Vector:**
- No limit on number of ports checked
- Attacker can force scanning of port ranges

**Required Fix:**
```typescript
const MAX_PORTS_TO_CHECK = 10;

async function checkPort(
  host: string,
  port: number,
  timeout = 1000
): Promise<boolean> {
  // Validate inputs
  if (typeof port !== 'number' || port < 1 || port > 65535) {
    return false;
  }

  if (typeof host !== 'string' || host.length > 253) {
    return false;
  }

  return new Promise((resolve) => {
    const socket = createConnection(port, host);
    const cleanup = () => socket.destroy();

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, Math.min(timeout, 2000));  // Cap timeout

    socket.on('connect', () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    });
  });
}
```

---

## HIGH PRIORITY Issues (Must Fix Before Implementation)

### HP-1: Missing `maskKey()` Utility Function

**Location:** Referenced in EPIC-3-003

**Impact:** CREDENTIAL LEAKAGE - Cannot mask credentials consistently

**Required Fix:** Add to EPIC-1 as Story 1.0 (already applied)

---

### HP-2: Detection Timeout Enforcement Missing

**Location:** EPIC-3-002 (Service Detection)

**Impact:** DoS vulnerability - Service detection could hang indefinitely

**Required Fix:** Add timeout enforcement (already applied to EPIC-3)

---

### HP-3: Credential Detection in Plain Memory

**Location:** EPIC-3-003 (Credential Detection)

**Impact:** Memory dump vulnerability - Credentials remain as plain strings

**Required Fix:** Use SecureCredential wrapper (already applied to EPIC-3)

---

### HP-4: Environment Variable Injection (EPIC-3, Story 3.3)

**Location:** `src/detection/credentials.ts`

**Impact:** Attacker can set arbitrary environment variables

**Required Fix:**
```typescript
// Validate environment variable names against whitelist
const ALLOWED_ENV_PATTERNS = /^OPENAI_API_KEY$|^ANTHROPIC_API_KEY$|^OLLAMA_HOST$/;

export function detectCredentials(): DetectedCredential[] {
  const detected: DetectedCredential[] = [];

  for (const [name, envVar] of Object.entries(CREDENTIAL_PATTERNS)) {
    if (!ALLOWED_ENV_PATTERNS.test(envVar)) {
      continue;  // Skip unexpected patterns
    }

    const value = process.env[envVar];

    // Validate value type
    if (value !== null && typeof value !== 'string') {
      continue;
    }

    detected.push({
      name,
      key: envVar,
      maskedValue: value ? maskKey(value) : 'not set',
      present: Boolean(value),
    });
  }

  return detected;
}
```

---

### HP-5: Audit Log Tampering (EPIC-1, Story 1.3)

**Location:** `src/utils/audit.ts`

**Impact:** No authentication, no integrity checks, concurrent write corruption

**Required Fix:**
```typescript
import { createHash, randomBytes } from 'crypto';
import { lock } from 'proper-lockfile';

export class AuditLogger {
  private logPath: string;
  private signingKey: Buffer;

  constructor(logPath: string = '.bonklm/audit.log') {
    this.logPath = logPath;
    this.signingKey = randomBytes(32);
  }

  async log(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    // Acquire exclusive lock
    const release = await lock(this.logPath, { retries: 3 });

    try {
      // Add monotonic counter and signature
      const counter = await this.getNextCounter();
      const entry: AuditEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        counter,
      };

      // Sign entry
      const signature = this.signEntry(entry);
      const signedEntry = { ...entry, signature };

      const line = JSON.stringify(signedEntry) + '\n';
      await writeFile(this.logPath, line, { flag: 'a', mode: 0o600 });
    } finally {
      await release();
    }
  }

  private signEntry(entry: AuditEvent): string {
    const data = JSON.stringify(entry);
    const hmac = createHmac('sha256', this.signingKey);
    hmac.update(data);
    return hmac.digest('hex');
  }
}
```

---

### HP-6: JSON Injection/Prototype Pollution (EPIC-3, Story 3.1)

**Location:** `src/detection/framework.ts`

**Impact:** Prototype pollution via malicious package.json

**Required Fix:**
```typescript
import { parse } from 'secure-json-parse';

const content = await readFile(pkgPath, 'utf-8');

try {
  const pkg = parse(content, {
    protoAction: 'remove',
    constructorAction: 'remove'
  });

  // Additional validation
  if (pkg.__proto__ || pkg.constructor) {
    throw new WizardError(
      'INVALID_PACKAGE_JSON',
      'package.json contains prototype pollution'
    );
  }
} catch (error) {
  if (error instanceof SyntaxError) {
    throw new WizardError(
      'INVALID_PACKAGE_JSON',
      'package.json is not valid JSON',
      'Fix JSON syntax errors'
    );
  }
  throw error;
}
```

---

### HP-7: Insecure Random Number Generation (EPIC-1, Story 1.2)

**Location:** `src/config/env.ts` - temp file naming

**Impact:** Predictable temp file names allow race condition attacks

**Required Fix:**
```typescript
import { randomBytes } from 'crypto';

const tempPath = `${this.path}.${randomBytes(16).toString('hex')}.tmp`;
```

---

### HP-8: No Rate Limiting on API Validation (EPIC-1, Story 1.5)

**Location:** `src/utils/validation.ts`

**Impact:** Credential enumeration attacks

**Required Fix:**
```typescript
import { LRUCache } from 'lru-cache';

const validationCache = new LRUCache<string, {timestamp: number, result: boolean}>({
  max: 100,
  ttl: 60000  // 1 minute
});

export async function validateApiKeySecure(
  apiKey: string,
  config: SecureValidationConfig
): Promise<boolean> {
  // Check cache
  const cached = validationCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.result;
  }

  // Rate limit: max 5 validations per minute
  const recentValidations = Array.from(validationCache.values())
    .filter(v => Date.now() - v.timestamp < 60000);

  if (recentValidations.length >= 5) {
    throw new WizardError(
      'RATE_LIMITED',
      'Too many validation attempts',
      'Please wait before trying again'
    );
  }

  // ... perform validation

  // Cache result
  validationCache.set(apiKey, { timestamp: Date.now(), result });

  return result;
}
```

---

## MEDIUM PRIORITY Issues (Should Fix)

### MP-1: Import Path Inconsistencies

**Location:** All epic step files

**Issue:** Not all imports include required `.js` extensions for ESM

**Fix:** Verify all imports include `.js` extensions. Add ESLint rule to enforce.

---

### MP-2: Connector Test Return Type Inconsistency

**Location:** EPIC-4 (Connector System)

**Issue:** OpenAI/Anthropic don't include `error` field in return, Ollama does

**Fix:** Standardize all connectors to return consistent `TestResult`

---

### MP-3: Zod Schemas Not Used for Validation

**Location:** EPIC-4 (All connectors)

**Issue:** Schemas defined but never enforced

**Fix:** Integrate Zod validation into Clack prompts

---

### MP-4: Mock Strategy Unclear

**Location:** EPIC-3, EPIC-5 (Testing)

**Issue:** Implementation says "mock X" but doesn't specify how

**Fix:** Specify Vitest mocking strategy

---

### MP-5: Information Disclosure in Status Command (EPIC-6, Story 6.3)

**Location:** `src/commands/status.ts`

**Issue:** Status output reveals directory structure, installed packages, running services

**Fix:** Add warning about sensitive information

---

### MP-6: Uncontrolled Resource Consumption in Framework Detection (EPIC-3, Story 3.1)

**Issue:** No limit on package.json size or number of dependencies checked

**Fix:**
```typescript
const MAX_PACKAGE_JSON_SIZE = 1024 * 1024; // 1MB
const MAX_DEPENDENCIES = 1000;

// Check file size before reading
const stats = await stat(pkgPath);
if (stats.size > MAX_PACKAGE_JSON_SIZE) {
  throw new WizardError(
    'FILE_TOO_LARGE',
    `package.json exceeds ${MAX_PACKAGE_JSON_SIZE} bytes`,
    'Remove unused dependencies'
  );
}
```

---

### MP-7: Timing Attack in maskKey() (EPIC-1, Story 1.0)

**Issue:** Consistent timing leaks information about key length

**Fix:**
```typescript
export function maskKey(value: string): string {
  if (value.length <= 8) return '***';
  // Add random padding to prevent timing attacks
  const padding = '*'.repeat(Math.floor(Math.random() * 10) + 10);
  return `${value.slice(0, 2)}${padding}${value.slice(-4)}`;
}
```

---

## Security Fixes Already Applied (P0)

The following 5 critical security fixes have been documented and are reflected in the updated epic steps:

### P0-1: Prohibit Credential Arguments
- Credentials MUST only be collected via Clack `password()` prompts
- Never via CLI arguments (exposed in shell history, process lists)

### P0-2: Atomic .env File Writes
- Write temp file → Set permissions → Atomic rename → Verify

### P0-3: Buffer-Based Credential Handling
- SecureCredential class using Buffer for zeroable memory

### P0-4: Audit Logging System
- All security-relevant actions logged to audit log

### P0-5: Secure API Validation Protocol
- Headers only, minimal endpoint, timeout, no logging

---

## Implementation Priority (Updated)

Based on all reviews, implementation MUST follow this order:

### Phase 0: Critical Security Fixes (PRE-BLOCKING)
1. ✅ Create `src/utils/mask.ts` utility function
2. ✅ Add detection timeout enforcement wrapper
3. ✅ Fix credential detection to use SecureCredential
4. 🔄 **NEW:** Add path validation to prevent directory traversal
5. 🔄 **NEW:** Fix race condition in atomic write
6. 🔄 **NEW:** Enhance credential sanitization patterns
7. 🔄 **NEW:** Add size limits to credential handling
8. 🔄 **NEW:** Add input validation to all external data sources

### Phase 1: Security Foundation (P0 - BLOCKS ALL OTHER WORK)
1. Implement `SecureCredential` class with size limits
2. Implement atomic `EnvManager.writeAtomic()` with secure temp dir
3. Implement `AuditLogger` class with signing and locking
4. Update `WizardError` with enhanced sanitization
5. Implement `validateApiKeySecure()` with rate limiting

### Phase 2: Core Infrastructure (P1)
1. Create `packages/wizard/` package structure
2. Set up CLI scaffolding (Commander.js + Clack)
3. Define base `ConnectorDefinition` interface
4. Fix import path inconsistencies

### Phase 3: Detection Engine (P1)
1. Framework detection (with path validation, size limits)
2. Service detection (with timeout enforcement, Docker sanitization, binary validation)
3. Credential detection (using SecureCredential, env var whitelist)

### Phase 4: Connector System (P2)
1. Define connector metadata strategy
2. Implement 5 MVP connectors with:
   - Consistent TestResult return types
   - Zod schema validation integration
   - Secure API validation

### Phase 5: Testing Framework (P2)
1. Connection testing framework
2. Guardrail validation test (with graceful fallback)
3. Test result display
4. Security testing: fuzz tests, race condition tests, injection tests

### Phase 6: Wizard UX (P2)
1. Sequential phased detection UI with Clack
2. Progress indicators with timeouts
3. Secure credential prompts
4. Complete audit logging integration

---

## Summary by Epic

| Epic | Critical Issues | High Priority Issues | Medium Priority Issues | Status |
|------|----------------|---------------------|----------------------|--------|
| **EPIC-1: Security Foundation** | C-2, C-3, C-5 | HP-1, HP-5, HP-7, HP-8 | MP-7 | 🔴 Major security gaps |
| **EPIC-2: Core Infrastructure** | None | None | MP-1 | 🟢 Ready |
| **EPIC-3: Detection Engine** | C-1, C-4, C-6 | HP-2, HP-3, HP-4, HP-6 | MP-4, MP-6 | 🔴 Critical vulnerabilities |
| **EPIC-4: Connector System** | None | None | MP-2, MP-3 | 🟡 Needs standardization |
| **EPIC-5: Testing Framework** | None | None | MP-4 | 🟡 Needs security tests |
| **EPIC-6: Wizard UX** | None | None | MP-5 | 🟢 Mostly complete |

---

## Additional Dependencies Required

Based on security fixes, add these dependencies:

```json
{
  "dependencies": {
    "secure-json-parse": "^2.5.0",
    "proper-lockfile": "^4.1.2",
    "lru-cache": "^10.0.0",
    "which": "^4.0.0"
  }
}
```

---

## Security Testing Requirements

**Mandatory Security Tests:**

1. **Fuzz Testing:**
   - Fuzz all user inputs with random data
   - Test with oversized inputs (DoS protection)
   - Test with special characters (injection protection)

2. **Race Condition Testing:**
   - Concurrent .env writes
   - Concurrent audit log writes
   - Temp file creation during high load

3. **Credential Leakage Testing:**
   - Force errors with credentials in messages
   - Verify all error paths sanitize credentials
   - Check audit logs contain no sensitive data

4. **Path Traversal Testing:**
   - Test with symlinks outside project
   - Test with `../` in paths
   - Test with absolute paths

5. **Injection Testing:**
   - Test Docker detection with malicious container names
   - Test package.json with prototype pollution
   - Test environment variable injection

---

## Test Strategy Updates

**Security-Critical Coverage Requirements:**
- `src/utils/mask.ts`: 100% coverage
- `src/utils/secure-credential.ts`: 100% coverage
- `src/config/env.ts`: 90% coverage
- `src/utils/audit.ts`: 90% coverage
- `src/utils/error.ts`: 90% coverage

**Mock Strategy (Vitest):**
```typescript
// External dependencies: vi.mock()
import { vi } from 'vitest';
vi.mock('net', () => ({ createConnection: vi.fn() }));
vi.mock('child_process/promises', () => ({ execFile: vi.fn() }));

// HTTP: nock for fetch mocking
import nock from 'nock';
```

**Cross-Platform Testing:**
- Add Windows to CI/CD matrix
- Test file permission handling on all platforms
- Verify terminal capability detection

---

## Conclusion

The implementation steps are **READY WITH MAJOR SECURITY REVISIONS**.

### Must Fix (CRITICAL - 6 issues):
1. ✅ Create `src/utils/mask.ts`
2. ✅ Add detection timeout enforcement
3. ✅ Fix credential detection memory handling
4. 🔄 **NEW:** Add path validation (C-4)
5. 🔄 **NEW:** Fix atomic write race condition (C-2)
6. 🔄 **NEW:** Enhance credential sanitization (C-3)
7. 🔄 **NEW:** Add credential size limits (C-5)
8. 🔄 **NEW:** Add port scanning limits (C-6)
9. 🔄 **NEW:** Validate Docker binary path (C-1)

### Must Fix (HIGH - 8 issues):
1. Add environment variable whitelist
2. Add audit log signing
3. Add rate limiting
4. Use secure JSON parsing
5. Add secure random number generation
6. (HP-1, HP-2, HP-3 already addressed)

### Should Fix (MEDIUM - 9 issues):
1. Standardize connector return types
2. Integrate Zod validation
3. Clarify mock strategy
4. Fix import path inconsistencies
5. Add status output warnings
6. Add resource consumption limits
7. Fix timing attack in maskKey

### Already Applied (P0 Security):
1. ✅ Prohibit credential CLI arguments
2. ✅ Atomic .env writes (needs enhancement)
3. ✅ Buffer-based credential handling (needs size limits)
4. ✅ Audit logging system (needs signing)
5. ✅ Secure API validation protocol (needs rate limiting)

**Confidence Level:** Medium (critical security fixes required)

**Next Steps:**
1. 🔄 **NEW:** Apply CRITICAL fixes C-1 through C-6 to epic step documents
2. Begin Phase 0: Critical Security Fixes
3. Proceed with Phase 1-6 in order
4. Implement comprehensive security testing
5. Conduct second security review after fixes applied
