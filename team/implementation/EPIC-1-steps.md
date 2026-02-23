# EPIC-1: Security Foundation - Implementation Steps

**Priority:** P0 (Blocking)
**Points:** 16
**Stories:** 6
**Dependency:** None

**SECURITY REVIEW:** This epic has CRITICAL vulnerabilities (C-2, C-3, C-5) that MUST be addressed before implementation.

## Overview

This epic establishes the security-critical infrastructure that ALL other components depend on. Without these components, no feature work can proceed safely.

---

## Story 1.0: Mask Utility (1 point)

**File:** `src/utils/mask.ts`

**CRITICAL:** This utility is referenced throughout the codebase for credential masking.

**SECURITY ISSUE (MP-7):** Timing attack vulnerability - consistent timing leaks key length information.

### Steps

1. **Create mask.ts** (`src/utils/mask.ts`)
   ```typescript
   /**
    * Mask credential values for display
    * Shows only first 2 and last 4 characters
    * Uses random padding to prevent timing attacks
    *
    * @example
    * maskKey('sk-1234567890abcdef') // 'sk-***********cdef'
    * maskKey('short') // '***'
    */
   export function maskKey(value: string): string {
     if (value.length <= 8) return '***';
     // Add random padding to prevent timing attacks
     const padding = '*'.repeat(Math.floor(Math.random() * 10) + 10);
     return `${value.slice(0, 2)}${padding}${value.slice(-4)}`;
   }
   ```

2. **Create tests** (`src/utils/mask.test.ts`)
   - Test short values (≤8 chars) return '***'
   - Test normal values show first 2 + stars + last 4
   - Test edge cases (empty, 9 chars, exact 8 chars)
   - Test timing attack resistance (verify variable output length)

3. **Verify 100% coverage**

---

## Story 1.1: SecureCredential Class (3 points)

**File:** `src/utils/secure-credential.ts`

**CRITICAL VULNERABILITY (C-5):** Buffer Overflow - No size limits allows DoS through memory exhaustion.

### Steps

1. **Create file structure**
   ```bash
   mkdir -p packages/wizard/src/utils
   touch packages/wizard/src/utils/secure-credential.ts
   ```

2. **Implement SecureCredential class** (WITH SIZE LIMITS)
   ```typescript
   import { Buffer } from 'node:buffer';
   import { WizardError } from './error.js';

   const MAX_CREDENTIAL_SIZE = 8192; // 8KB max

   export class SecureCredential {
     private buffer: Buffer;

     constructor(value: string) {
       // Enforce size limits to prevent DoS
       const byteLength = Buffer.byteLength(value, 'utf-8');

       if (byteLength > MAX_CREDENTIAL_SIZE) {
         throw new WizardError(
           'CREDENTIAL_TOO_LARGE',
           `Credential size (${byteLength} bytes) exceeds maximum (${MAX_CREDENTIAL_SIZE} bytes)`,
           'Use a shorter API key or token'
         );
       }

       // Use alloc instead of from for clean memory
       this.buffer = Buffer.alloc(byteLength);
       this.buffer.write(value, 'utf-8');
     }

     toString(): string {
       return this.buffer.toString('utf-8');
     }

     dispose(): void {
       this.buffer.fill(0);
     }

     async use<T>(fn: (credential: string) => Promise<T>): Promise<T> {
       try {
         return await fn(this.toString());
       } finally {
         this.dispose();
       }
     }
   }
   ```

3. **Create co-located tests**
   ```bash
   touch packages/wizard/src/utils/secure-credential.test.ts
   ```

4. **Write tests** (100% coverage required)
   - `toString()` returns original value
   - `dispose()` zeros buffer (verify with buffer inspection)
   - `use()` executes callback and disposes
   - `use()` disposes even on error
   - `use()` returns callback result
   - **NEW:** Constructor throws on oversized credentials (>8KB)
   - **NEW:** Constructor accepts max size credentials (8KB)
   - **NEW:** Buffer uses clean allocation (zeros)

5. **Run tests**
   ```bash
   pnpm test -- secure-credential
   ```

6. **Verify coverage**
   ```bash
   pnpm test -- coverage -- secure-credential
   # Must be 100%
   ```

---

## Story 1.2: Atomic EnvManager (5 points)

**Files:** `src/config/env.ts`, `src/config/permissions.ts`

**CRITICAL VULNERABILITY (C-2):** Race Condition - TOCTOU vulnerability allows symlink attacks.

**HIGH PRIORITY (HP-7):** Insecure random number generation allows predictable temp file names.

### Steps

1. **Create directory**
   ```bash
   mkdir -p packages/wizard/src/config
   ```

2. **Create EnvManager class** (`src/config/env.ts`) WITH SECURITY FIXES
   ```typescript
   import { readFile, writeFile, rename, chmod, rm } from 'fs/promises';
   import { constants, access } from 'fs/promises';
   import { platform, tmpdir } from 'os';
   import { existsSync } from 'fs';
   import { join } from 'path';
   import { mkdtemp } from 'fs/promises';
   import { randomBytes } from 'crypto';
   import dotenv from 'dotenv';
   import { WizardError } from '../utils/error.js';

   export class EnvManager {
     private path: string;

     constructor(path: string = '.env') {
       this.path = path;
     }

     async read(): Promise<Record<string, string>> {
       if (!existsSync(this.path)) {
         return {};
       }
       const content = await readFile(this.path, 'utf-8');
       return dotenv.parse(content);
     }

     async write(entries: Record<string, string>): Promise<void> {
       const existing = await this.read();
       const merged = { ...existing, ...entries };
       const content = Object.entries(merged)
         .map(([key, value]) => `${key}=${value}`)
         .join('\n');
       await this.writeAtomic(content);
     }

     private async writeAtomic(content: string): Promise<void> {
       // SECURITY FIX: Use secure temp directory instead of predictable filename
       const tempDir = await mkdtemp(join(tmpdir(), '.env-'));
       const tempPath = join(tempDir, 'write.tmp');

       try {
         await writeFile(tempPath, content, { mode: 0o600 });
         await this.setSecurePermissions(tempPath);

         // SECURITY FIX: Ensure same filesystem for atomic rename
         await this.ensureSameFilesystem(tempPath, this.path);

         await rename(tempPath, this.path);
         await this.verifyPermissions(this.path);
       } finally {
         // Cleanup temp directory even if rename fails
         await rm(tempDir, { recursive: true, force: true });
       }
     }

     private async ensureSameFilesystem(from: string, to: string): Promise<void> {
       // Verify both files are on same filesystem for atomic rename
       try {
         const { stat } = await import('fs/promises');
         const stat1 = await stat(from);
         const stat2 = await stat(to).catch(() => stat1); // Use default if target doesn't exist
         if (stat1.dev !== stat2.dev) {
           throw new WizardError(
             'CROSS_FILESYSTEM_RENAME',
             'Cannot atomically rename across filesystems',
             'Ensure .env is on same filesystem as temp directory'
           );
         }
       } catch (error) {
         if ((error as WizardError)?.code === 'CROSS_FILESYSTEM_RENAME') {
           throw error;
         }
         // If stat fails, proceed with caution
       }
     }

     private async setSecurePermissions(filePath: string): Promise<void> {
       if (platform() === 'win32') {
         const { execFile } = await import('child_process/promises');
         try {
           await execFile('icacls', [filePath, '/inheritance:r']);
         } catch {
           console.warn(`Could not set Windows ACLs: ${filePath}`);
         }
       } else {
         await chmod(filePath, 0o600);
       }
     }

     private async verifyPermissions(filePath: string): Promise<void> {
       await access(filePath, constants.R_OK | constants.W_OK);
     }
   }
   ```

3. **Create tests** (`src/config/env.test.ts`)
   - Test read() with existing .env
   - Test read() with missing .env
   - Test write() merge behavior
   - Test atomic write (temp file → rename)
   - Test permission setting (mock platform-specific)
   - **NEW:** Test secure temp directory creation
   - **NEW:** Test temp directory cleanup on error
   - **NEW:** Test cross-filesystem detection

4. **Install dotenv dependency**
   ```bash
   pnpm add dotenv
   pnpm add -D @types/dotenv
   ```

5. **Run tests and verify 90% coverage**

---

## Story 1.3: AuditLogger (3 points)

**File:** `src/utils/audit.ts`

**HIGH PRIORITY (HP-5):** No authentication, no integrity checks, concurrent write corruption.

### Steps

1. **Define interfaces**
   ```typescript
   export interface AuditEvent {
     timestamp: string;
     action: AuditAction;
     connector_id?: string;
     success: boolean;
     error_code?: string;
     counter?: number;  // NEW: Monotonic counter
     signature?: string; // NEW: Entry signature
   }

   export type AuditAction =
     | 'connector_detected'
     | 'connector_added'
     | 'connector_removed'
     | 'connector_tested'
     | 'credential_validated'
     | 'env_written'
     | 'env_read';
   ```

2. **Install additional dependencies**
   ```bash
   pnpm add proper-lockfile
   ```

3. **Implement AuditLogger class** (WITH SIGNING AND LOCKING)
   ```typescript
   import { writeFile, mkdir, readFile } from 'fs/promises';
   import { existsSync } from 'fs';
   import { join } from 'path';
   import { createHmac, randomBytes } from 'crypto';
   import { lock, unlock } from 'proper-lockfile';
   import { WizardError } from './error.js';

   export class AuditLogger {
     private logPath: string;
     private signingKey: Buffer;
     private counterPath: string;

     constructor(logPath: string = '.bonklm/audit.log') {
       this.logPath = logPath;
       this.signingKey = randomBytes(32);
       this.counterPath = join(logPath, '..', 'counter.txt');
     }

     async log(event: Omit<AuditEvent, 'timestamp' | 'counter' | 'signature'>): Promise<void> {
       // SECURITY: Acquire exclusive lock to prevent concurrent write corruption
       const release = await lock(this.logPath, { retries: 3 });

       try {
         const dir = join(this.logPath, '..');
         if (!existsSync(dir)) {
           await mkdir(dir, { recursive: true, mode: 0o700 });
         }

         // SECURITY: Add monotonic counter to prevent reordering
         const counter = await this.getNextCounter();

         const entry: AuditEvent = {
           ...event,
           timestamp: new Date().toISOString(),
           counter,
         };

         // SECURITY: Sign entry for integrity verification
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

     private async getNextCounter(): Promise<number> {
       try {
         const content = await readFile(this.counterPath, 'utf-8');
         const current = parseInt(content.trim(), 10);
         const next = isNaN(current) ? 0 : current + 1;
         await writeFile(this.counterPath, next.toString(), { mode: 0o600 });
         return next;
       } catch {
         // File doesn't exist, start at 0
         await writeFile(this.counterPath, '0', { mode: 0o600 });
         return 0;
       }
     }

     async read(limit: number = 100): Promise<AuditEvent[]> {
       try {
         const content = await readFile(this.logPath, 'utf-8');
         const lines = content.trim().split('\n');
         return lines.slice(-limit).map((line) => JSON.parse(line));
       } catch (error) {
         if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
           return [];
         }
         throw error;
       }
     }

     async verifyIntegrity(): Promise<boolean> {
       // Verify log signatures haven't been tampered with
       const entries = await this.read();
       for (const entry of entries) {
         if (!entry.signature || !entry.counter) {
           return false; // Missing security fields
         }

         const { signature, ...originalEntry } = entry;
         const expectedSig = this.signEntry(originalEntry);

         if (signature !== expectedSig) {
           return false; // Signature mismatch - tampered
         }
       }
       return true;
     }
   }
   ```

4. **Create tests** (90% coverage)
   - **NEW:** Test concurrent writes don't corrupt log
   - **NEW:** Test signature verification
   - **NEW:** Test monotonic counter increments
   - **NEW:** Test verifyIntegrity() detects tampering

---

## Story 1.4: WizardError with Sanitization (3 points)

**File:** `src/utils/error.ts`

**CRITICAL VULNERABILITY (C-3):** Credential Leakage - Base64 and high-entropy strings bypass sanitization.

### Steps

1. **Define enhanced credential patterns**
   ```typescript
   // Enhanced patterns to catch more credential formats
   const CREDENTIAL_PATTERNS = [
     // Standard formats - more flexible matching
     /sk-[a-zA-Z0-9]{20,}/g,
     /sk-ant-[a-zA-Z0-9]{20,}/g,
     /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
     /api[_-]?key["\s:=]+[^\s"'`<>]+/gi,

     // Base64 patterns (detect high-entropy base64 strings)
     /(?:["']|:)\s*([A-Za-z0-9+/]{32,}={0,2})(?:["']|\s|$)/g,

     // Generic high-entropy strings (40+ chars, high character variety)
     /["']([a-zA-Z0-9_\-\.]{40,})["']/g,
   ];

   // Helper function to detect high-entropy strings
   function isHighEntropy(str: string): boolean {
     if (str.length < 30) return false;
     const unique = new Set(str).size;
     const ratio = unique / str.length;
     return ratio > 0.7; // More than 70% unique characters suggests high entropy
   }
   ```

2. **Create enhanced sanitizeError function**
   ```typescript
   function sanitizeError(error: Error): Error {
     let sanitizedMessage = error.message;
     let sanitizedStack = error.stack;

     for (const pattern of CREDENTIAL_PATTERNS) {
       // Replace with entropy check
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

3. **Create WizardError class**
   ```typescript
   export class WizardError extends Error {
     constructor(
       public code: string,
       message: string,
       public suggestion?: string,
       public cause?: Error,
       public exitCode?: 0 | 1 | 2
     ) {
       super(message);
       this.name = 'WizardError';

       if (cause) {
         this.cause = sanitizeError(cause);
       }
     }

     override toString(): string {
       let output = `${this.code}: ${this.message}`;
       if (this.suggestion) {
         output += `\nSuggestion: ${this.suggestion}`;
       }
       return output;
     }
   }
   ```

4. **Export ExitCode constants**
   ```typescript
   export const ExitCode = {
     SUCCESS: 0,
     ERROR: 1,
     PARTIAL: 2,
   } as const;
   ```

5. **Create tests** (90% coverage)
   - **NEW:** Test base64-encoded credential detection
   - **NEW:** Test high-entropy string detection
   - **NEW:** Test that normal strings are not over-redacted

---

## Story 1.5: Secure API Validation Protocol (3 points)

**File:** `src/utils/validation.ts`

**HIGH PRIORITY (HP-8):** No rate limiting allows credential enumeration attacks.

### Steps

1. **Install additional dependencies**
   ```bash
   pnpm add lru-cache
   ```

2. **Define SecureValidationConfig interface**
   ```typescript
   export interface SecureValidationConfig {
     method: 'HEAD' | 'OPTIONS' | 'GET';
     sendInHeader: boolean;
     testEndpoint: string;
     timeout: number;
     logLevel: 'none';
   }
   ```

3. **Implement validateApiKeySecure** (WITH RATE LIMITING)
   ```typescript
   import { SecureCredential } from './secure-credential.js';
   import { WizardError } from './error.js';
   import { LRUCache } from 'lru-cache';

   // Rate limiting cache
   const validationCache = new LRUCache<string, {timestamp: number, result: boolean}>({
     max: 100,
     ttl: 60000  // 1 minute
   });

   const MAX_VALIDATIONS_PER_MINUTE = 5;

   export async function validateApiKeySecure(
     apiKey: string,
     config: SecureValidationConfig
   ): Promise<boolean> {
     // Check cache first
     const cached = validationCache.get(apiKey);
     if (cached && Date.now() - cached.timestamp < 60000) {
       return cached.result;
     }

     // Rate limit: max 5 validations per minute
     const recentValidations = Array.from(validationCache.values())
       .filter(v => Date.now() - v.timestamp < 60000);

     if (recentValidations.length >= MAX_VALIDATIONS_PER_MINUTE) {
       throw new WizardError(
         'RATE_LIMITED',
         'Too many validation attempts',
         'Please wait before trying again',
         undefined,
         2
       );
     }

     const secureKey = new SecureCredential(apiKey);

     try {
       const result = await secureKey.use(async (key) => {
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

       // Cache successful result
       validationCache.set(apiKey, { timestamp: Date.now(), result });
       return result;
     } finally {
       secureKey.dispose();
     }
   }
   ```

4. **Create tests** (90% coverage)
   - **NEW:** Test rate limiting enforcement
   - **NEW:** Test cache hit/miss behavior
   - **NEW:** Test rate limit resets after TTL

---

## Epic Completion Checklist

- [ ] All 6 stories implemented (including Story 1.0: mask utility)
- [ ] All tests passing (90-100% coverage)
- [ ] Security patterns followed throughout
- [ ] No credential leakage in any code
- [ ] Atomic .env writes working (with secure temp directory)
- [ ] Audit logging functional (with signing and locking)
- [ ] Error sanitization working (with entropy detection)
- [ ] maskKey() utility available for all credential masking
- [ ] **NEW:** SecureCredential enforces 8KB size limit
- [ ] **NEW:** AuditLogger signs entries and uses locks
- [ ] **NEW:** Error sanitization catches base64 and high-entropy strings
- [ ] **NEW:** API validation includes rate limiting

**Next Epic:** EPIC-2 - Core Infrastructure
