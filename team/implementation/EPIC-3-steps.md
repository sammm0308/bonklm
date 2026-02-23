# EPIC-3: Detection Engine - Implementation Steps

**Priority:** P1
**Points:** 12
**Stories:** 3
**Dependency:** EPIC-2 (Core Infrastructure), EPIC-1 (Security Foundation)

**SECURITY REVIEW:** This epic has CRITICAL vulnerabilities (C-1, C-4, C-6) that MUST be addressed before implementation.

## Overview

This epic implements the three-phase sequential detection engine that discovers the user's environment.

---

## Story 3.1: Framework Detection (3 points)

**File:** `src/detection/framework.ts`

**CRITICAL VULNERABILITY (C-4):** Path Traversal - Symlink attacks allow reading arbitrary files.

**HIGH PRIORITY (HP-6):** JSON Injection/Prototype Pollution - Malicious package.json can pollute Object.prototype.

**MEDIUM PRIORITY (MP-6):** Uncontrolled Resource Consumption - No file size limits.

### Steps

1. **Create detection directory**
   ```bash
   mkdir -p packages/wizard/src/detection
   ```

2. **Install additional dependencies**
   ```bash
   pnpm add secure-json-parse
   ```

3. **Define interface and patterns**
   ```typescript
   import { readFile } from 'fs/promises';
   import { realpath, cwd } from 'fs/promises';
   import { join, stat } from 'path';
   import { existsSync } from 'fs';
   import { parse } from 'secure-json-parse';
   import { WizardError } from '../utils/error.js';

   export interface DetectedFramework {
     name: string;
     version?: string;
   }

   const FRAMEWORK_PATTERNS = {
     express: {
       dependencies: ['express'],
       devDependencies: [],
     },
     fastify: {
       dependencies: ['fastify'],
       devDependencies: [],
     },
     nestjs: {
       dependencies: ['@nestjs/core'],
       devDependencies: [],
     },
     langchain: {
       dependencies: ['langchain', '@langchain/core'],
       devDependencies: [],
     },
   } as const;

   // SECURITY: Limit file size to prevent DoS
   const MAX_PACKAGE_JSON_SIZE = 1024 * 1024; // 1MB
   const MAX_DEPENDENCIES = 1000;
   ```

4. **Implement detectFrameworks()** (WITH SECURITY FIXES)
   ```typescript
   export async function detectFrameworks(): Promise<DetectedFramework[]> {
     // SECURITY FIX: Resolve real paths to prevent symlink attacks
     const workingDir = await realpath(cwd());
     const pkgPath = join(workingDir, 'package.json');

     // SECURITY FIX: Ensure we're not following symlinks outside project
     let realPath: string;
     try {
       realPath = await realpath(pkgPath);
     } catch {
       // File doesn't exist, return empty
       return [];
     }

     // SECURITY FIX: Validate path is within working directory
     if (!realPath.startsWith(workingDir)) {
       throw new WizardError(
         'PATH_TRAVERSAL',
         'package.json path resolved outside working directory',
         'Ensure package.json is within project directory',
         undefined,
         1
       );
     }

     // SECURITY FIX: Check file size before reading
     try {
       const fileStat = await stat(realPath);
       if (fileStat.size > MAX_PACKAGE_JSON_SIZE) {
         throw new WizardError(
           'FILE_TOO_LARGE',
           `package.json exceeds ${MAX_PACKAGE_JSON_SIZE} bytes`,
           'Remove unused dependencies',
           undefined,
           2
         );
       }
     } catch (error) {
       if ((error as WizardError)?.code === 'FILE_TOO_LARGE') {
         throw error;
       }
       return [];
     }

     // SECURITY FIX: Use secure JSON parser to prevent prototype pollution
     const content = await readFile(realPath, 'utf-8');
     let pkg: any;

     try {
       pkg = parse(content, {
         protoAction: 'remove',
         constructorAction: 'remove'
       });

       // Additional validation
       if (pkg.__proto__ || pkg.constructor) {
         throw new WizardError(
           'INVALID_PACKAGE_JSON',
           'package.json contains prototype pollution',
           'Remove malicious __proto__ or constructor properties'
         );
       }

       if (!pkg || typeof pkg !== 'object') {
         return [];
       }
     } catch (error) {
       if ((error as WizardError)?.code === 'INVALID_PACKAGE_JSON') {
         throw error;
       }
       // Don't expose parse errors (might contain malicious content)
       return [];
     }

     const detected: DetectedFramework[] = [];
     let depsChecked = 0;

     // SECURITY FIX: Limit number of dependencies checked
     for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
       if (depsChecked >= MAX_DEPENDENCIES) {
         console.warn('Maximum dependency check limit reached');
         break;
       }

       const deps = pkg.dependencies || {};
       const devDeps = pkg.devDependencies || {};

       for (const dep of pattern.dependencies) {
         if (deps[dep]) {
           detected.push({ name, version: deps[dep] });
           break;
         }
       }

       for (const dep of pattern.devDependencies) {
         if (devDeps[dep]) {
           detected.push({ name, version: devDeps[dep] });
           break;
         }
       }

       depsChecked++;
     }

     return detected;
   }
   ```

5. **Create test fixtures** (`tests/fixtures/package-examples/`)
   - `express.json` - Express.js project
   - `nestjs.json` - NestJS project
   - `multi.json` - Multiple frameworks
   - `empty.json` - No detected frameworks
   - **NEW:** `malicious-proto.json` - Prototype pollution attempt
   - **NEW:** `large.json` - Oversized file (for DoS testing)

6. **Create tests** (90% coverage)
   - **NEW:** Test symlink rejection (outside working directory)
   - **NEW:** Test prototype pollution prevention
   - **NEW:** Test file size limit enforcement
   - **NEW:** Test dependency count limit

---

## Story 3.2: Service Detection (5 points)

**Files:** `src/detection/services.ts`, `src/detection/timeout.ts`

**SECURITY:** Timeout enforcement is CRITICAL to prevent DoS vulnerabilities.

**CRITICAL VULNERABILITY (C-1):** Command Injection - PATH manipulation allows arbitrary binary execution.

**CRITICAL VULNERABILITY (C-6):** Denial of Service - Unbounded port scanning consumes resources.

### Steps

1. **Install additional dependencies**
   ```bash
   pnpm add which
   ```

2. **Create timeout wrapper** (`src/detection/timeout.ts`)
   ```typescript
   import { WizardError } from '../utils/error.js';

   export const DETECTION_TIMEOUTS = {
     framework: 2000,   // 2s for package.json parsing
     services: 5000,    // 5s for port/Docker scanning
     credentials: 1000, // 1s for env var reading
   } as const;

   export async function detectWithTimeout<T>(
     fn: () => Promise<T>,
     timeout: number,
     phase: string
   ): Promise<T> {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeout);

     try {
       return await fn();
     } catch (error) {
       if ((error as Error).name === 'AbortError') {
         throw new WizardError(
           'DETECTION_TIMEOUT',
           `${phase} detection timed out after ${timeout}ms`,
           'Check for blocking processes or network issues',
           undefined,
           2 // Partial - other detections may succeed
         );
       }
       throw error;
     } finally {
       clearTimeout(timeoutId);
     }
   }
   ```

3. **Define interfaces**
   ```typescript
   export interface DetectedService {
     name: string;
     type: 'port' | 'docker';
     available: boolean;
     address?: string;
   }
   ```

4. **Implement checkPort()** (WITH VALIDATION AND LIMITS)
   ```typescript
   import { createConnection } from 'net';

   // SECURITY FIX: Add limits to prevent DoS
   const MAX_PORTS_TO_CHECK = 10;

   async function checkPort(
     host: string,
     port: number,
     timeout = 1000
   ): Promise<boolean> {
     // SECURITY FIX: Validate inputs
     if (typeof port !== 'number' || port < 1 || port > 65535) {
       return false;
     }

     if (typeof host !== 'string' || host.length > 253) {
       return false;
     }

     return new Promise((resolve) => {
       const socket = createConnection(port, host);
       const cleanup = () => socket.destroy();

       // SECURITY FIX: Cap timeout to prevent long hangs
       const timeoutId = setTimeout(() => {
         cleanup();
         resolve(false);
       }, Math.min(timeout, 2000));

       socket.on('connect', () => {
         clearTimeout(timeoutId);
         cleanup();
         resolve(true);
       });

       socket.on('timeout', () => {
         cleanup();
         resolve(false);
       });

       socket.on('error', () => {
         clearTimeout(timeoutId);
         cleanup();
         resolve(false);
       });
     });
   }
   ```

5. **Implement Docker detection** (WITH BINARY VALIDATION)
   ```typescript
   import { execFile } from 'child_process/promises';
   import { which } from 'which';

   async function detectDockerContainers(): Promise<string[]> {
     try {
       // SECURITY FIX: Validate docker binary path to prevent PATH manipulation
       const dockerPath = await which('docker');
       if (!dockerPath) {
         return [];
       }

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

6. **Implement detectServices()** (WITH TIMEOUT ENFORCEMENT AND LIMITS)
   ```typescript
   import { detectWithTimeout, DETECTION_TIMEOUTS } from './timeout.js';

   const SERVICE_PORTS = {
     ollama: 11434,
   } as const;

   const VECTOR_DB_PATTERNS = ['chroma', 'weaviate', 'qdrant'];

   export async function detectServices(): Promise<DetectedService[]> {
     return detectWithTimeout(async () => {
       const detected: DetectedService[] = [];
       let portsChecked = 0;

       // Port-based detection
       for (const [name, port] of Object.entries(SERVICE_PORTS)) {
         // SECURITY FIX: Enforce port check limit
         if (portsChecked >= MAX_PORTS_TO_CHECK) {
           console.warn('Maximum port check limit reached');
           break;
         }

         const available = await checkPort('localhost', port);
         detected.push({
           name,
           type: 'port',
           available,
           address: `localhost:${port}`,
         });

         portsChecked++;
       }

       // Docker-based detection
       const containers = await detectDockerContainers();
       for (const container of containers) {
         const lowerName = container.toLowerCase();
         for (const pattern of VECTOR_DB_PATTERNS) {
           if (lowerName.includes(pattern)) {
             detected.push({
               name: container,
               type: 'docker',
               available: true,
             });
             break;
           }
         }
       }

       return detected;
     }, DETECTION_TIMEOUTS.services, 'services');
   }
   ```

7. **Create tests** (90% coverage, mock net.createConnection, execFile, and which)
   - **NEW:** Test port validation (rejects invalid ports)
   - **NEW:** Test port check limit enforcement
   - **NEW:** Test host validation (rejects oversized hostnames)
   - **NEW:** Test Docker binary validation
   - **NEW:** Test container name sanitization

---

## Story 3.3: Credential Detection (3 points)

**File:** `src/detection/credentials.ts`

**SECURITY:** Use SecureCredential to prevent memory dump vulnerabilities.

**HIGH PRIORITY (HP-4):** Environment Variable Injection - No whitelist allows arbitrary env var access.

### Steps

1. **Define patterns and interface**
   ```typescript
   import { maskKey } from '../utils/mask.js';
   import { SecureCredential } from '../utils/secure-credential.js';

   export interface DetectedCredential {
     name: string;
     key: string;
     maskedValue: string;
     present: boolean;
   }

   const CREDENTIAL_PATTERNS = {
     openai: 'OPENAI_API_KEY',
     anthropic: 'ANTHROPIC_API_KEY',
     ollama: 'OLLAMA_HOST',
   } as const;

   // SECURITY FIX: Whitelist of allowed environment variable names
   const ALLOWED_ENV_PATTERNS = /^OPENAI_API_KEY$|^ANTHROPIC_API_KEY$|^OLLAMA_HOST$/;
   ```

2. **Implement detectCredentials()** (WITH SECURECREDENTIAL AND WHITELIST)
   ```typescript
   export function detectCredentials(): DetectedCredential[] {
     const detected: DetectedCredential[] = [];

     for (const [name, envVar] of Object.entries(CREDENTIAL_PATTERNS)) {
       // SECURITY FIX: Validate environment variable names against whitelist
       if (!ALLOWED_ENV_PATTERNS.test(envVar)) {
         continue;  // Skip unexpected patterns
       }

       const value = process.env[envVar];

       // SECURITY FIX: Validate value type
       if (value !== null && value !== undefined && typeof value !== 'string') {
         continue;
       }

       // Use SecureCredential for memory safety
       const secure = value ? new SecureCredential(value) : null;

       detected.push({
         name,
         key: envVar,
         maskedValue: secure ? maskKey(secure.toString()) : 'not set',
         present: Boolean(secure),
       });

       // Dispose immediately after masking (zero memory)
       secure?.dispose();
     }

     return detected;
   }
   ```

3. **Create tests** (90% coverage)
   - **NEW:** Test environment variable whitelist enforcement
   - **NEW:** Test non-string value rejection
   - **NEW:** Test SecureCredential memory cleanup

---

## Epic Completion Checklist

- [ ] All 3 stories implemented
- [ ] Framework detection working (with path validation and size limits)
- [ ] Service detection working (port + Docker with binary validation)
- [ ] Credential detection working (with SecureCredential and whitelist)
- [ ] Timeout enforcement in place (detectWithTimeout wrapper)
- [ ] Docker container name sanitization in place
- [ ] Docker binary path validation in place
- [ ] All detection phases tested
- [ ] **NEW:** Path traversal protection (realpath validation)
- [ ] **NEW:** Prototype pollution prevention (secure-json-parse)
- [ ] **NEW:** File size limit enforcement (1MB max)
- [ ] **NEW:** Port scanning limits (max 10 ports)
- [ ] **NEW:** Environment variable whitelist

**Next Epic:** EPIC-4 - Connector System
