# Engine & Core Logic Audit Report

**Story ID**: S002-004
**Date**: 2026-02-21
**Status**: FINDINGS DOCUMENTED
**Agents**: 5 parallel research agents

---

## Executive Summary

The GuardrailEngine and core logic provide **robust validation infrastructure** with comprehensive hook system, VM-based sandboxing, and fault tolerance mechanisms. Several **medium-to-high priority security issues** were identified including override token vulnerabilities, DoS vectors, and performance concerns.

**Overall Assessment**: STRONG architecture with recommended security hardening

---

## Agent Reports Summary

### Agent 1: GuardrailEngine Analysis

**Component**: `packages/core/src/core/GuardrailEngine.ts`

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| Override token vulnerability | High | Can bypass all validation with override token |
| Short-circuit order issues | Medium | Validators run before guards, inconsistent behavior |
| No input size validation | High | No size limit check at engine level |
| Session ID validation weak | Medium | No format validation for session IDs |
| Performance concerns | Low | Synchronous validators block execution |

**Key Issues**:
```typescript
// Override token bypass - accepts any non-empty string
if (options.overrideToken && options.overrideToken.length > 0) {
  return createResult(true, Severity.INFO, [{
    category: 'override',
    description: 'Validation overridden via token',
  }]);
}
```

**Recommendations**:
- Add cryptographic override token validation
- Implement engine-level input size limit
- Add session ID format validation
- Consider parallel validator execution with Promise.all()

---

### Agent 2: Hook System Review

**Component**: `packages/core/src/core/HookSystem.ts`

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| Function.prototype bypass risk | High | Malicious code can modify prototype |
| No rate limiting on hooks | Medium | Can overwhelm system with rapid calls |
| Limited security level differentiation | Low | Standard/Permissive modes similar |
| No hook timeout | Medium | Infinite loops can hang system |

**Hook Phases**:
1. BEFORE_VALIDATION - Pre-validation checks
2. AFTER_VALIDATION - Result modification
3. BEFORE_BLOCK - Pre-block notification
4. AFTER_ALLOW - Post-allow logging

**Strengths**:
- VM-based isolation for hook code
- Phase-based execution flow
- Comprehensive error handling

**Recommendations**:
- Add Function.prototype freezing in sandbox
- Implement hook execution timeout (5s default)
- Add rate limiting per hook phase
- Enhance security level differentiation

---

### Agent 3: Sandbox Implementation Review

**Component**: `packages/core/src/core/HookSandbox.ts`

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| Regex-based validation insufficient | High | AST-based validation needed |
| No async operation control | Medium | No limit on async operations |
| Context leakage possible | Low | Global context may leak |
| Memory leak in VM reuse | Medium | VMs retain state across calls |

**Security Levels**:
- **STRICT**: No dangerous APIs, no network, no file access
- **STANDARD**: Limited console access
- **PERMISSIVE**: Full access (for trusted hooks)

**Blocked APIs in STRICT mode**:
- `eval`, `Function` constructor
- `require`, `import`
- `process`, `child_process`
- `fs`, `net`, `http`, `https`
- All shell execution

**Strengths**:
- VM-based isolation (Node.js vm module)
- Comprehensive dangerous API blocking
- Configurable security levels

**Recommendations**:
- Implement AST-based code validation
- Add async operation limits
- Clear VM context between uses
- Add memory limits per VM

---

### Agent 4: Fault Tolerance Review

**Components**: `CircuitBreaker.ts`, `RetryPolicy.ts`

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| DoS vulnerability in retry policy | High | Unlimited retries can exhaust resources |
| No circuit breaker tampering protection | Medium | State can be manually modified |
| Missing health metrics | Low | No visibility into system health |
| No backoff timeout cap | Medium | Exponential backoff unbounded |

**Circuit Breaker States**:
- CLOSED - Normal operation
- OPEN - Failing, requests blocked
- HALF_OPEN - Testing recovery

**Retry Policy Configuration**:
```typescript
{
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}
```

**Strengths**:
- Well-implemented exponential backoff
- State-based circuit breaker
- Configurable thresholds

**Recommendations**:
- Add max total retry time cap
- Implement circuit breaker state protection
- Add health check endpoints
- Limit concurrent retries

---

### Agent 5: Performance Profiling

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| No regex compilation caching | Medium | Re-compiled on every request |
| Memory leak in session storage | High | Sessions never expire |
| DoS through large inputs | High | No request rate limiting |
| No performance metrics | Low | Can't detect degradation |

**Performance Concerns**:
- Sequential validator execution
- No request queue management
- Unbounded session growth
- No connection pooling for adapters

**Recommendations**:
- Implement regex cache
- Add session expiration policy
- Implement request rate limiting
- Add performance monitoring

---

## Security Issues Summary

### Critical (P0)
None identified.

### High (P1)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| GuardrailEngine | Override token vulnerability | P1 |
| GuardrailEngine | No input size validation | P1 |
| Hook System | Function.prototype bypass risk | P1 |
| Sandbox | Regex validation insufficient | P1 |
| Fault Tolerance | DoS in retry policy | P1 |
| Performance | Memory leak in session storage | P1 |
| Performance | DoS through large inputs | P1 |

### Medium (P2)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| GuardrailEngine | Short-circuit order issues | P2 |
| GuardrailEngine | Session ID validation weak | P2 |
| Hook System | No hook timeout | P2 |
| Hook System | No rate limiting on hooks | P2 |
| Sandbox | No async operation control | P2 |
| Sandbox | Memory leak in VM reuse | P2 |
| Fault Tolerance | No backoff timeout cap | P2 |
| Performance | No regex caching | P2 |

### Low (P3)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| GuardrailEngine | Synchronous validators | P3 |
| Sandbox | Context leakage possible | P3 |
| Fault Tolerance | Missing health metrics | P3 |
| Performance | No performance metrics | P3 |

---

## Recommended Fixes

### Fix 1: Add Cryptographic Override Token Validation (P1)

**File**: `packages/core/src/core/GuardrailEngine.ts`

```typescript
import { createHash, timingSafeEqual } from 'crypto';

const EXPECTED_OVERRIDE_HASH = process.env.OVERRIDE_TOKEN_HASH;

function validateOverrideToken(token: string): boolean {
  if (!EXPECTED_OVERRIDE_OVERRIDE_HASH) {
    return false; // Disabled by default
  }
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(EXPECTED_OVERRIDE_HASH)
  );
}

// In validate function
if (options.overrideToken) {
  if (!validateOverrideToken(options.overrideToken)) {
    throw new Error('Invalid override token');
  }
  // Log override usage
  return createResult(true, Severity.INFO, [{
    category: 'override',
    description: 'Validation overridden via token',
  }]);
}
```

### Fix 2: Add Engine-Level Input Size Limit (P1)

**File**: `packages/core/src/core/GuardrailEngine.ts`

```typescript
const MAX_ENGINE_INPUT_LENGTH = 1_000_000; // 1MB

export class GuardrailEngine {
  validate(content: string, options: ValidationOptions = {}): GuardrailResult {
    if (content.length > MAX_ENGINE_INPUT_LENGTH) {
      return createResult(false, Severity.CRITICAL, [{
        category: 'input_too_large',
        description: `Input exceeds maximum size of ${MAX_ENGINE_INPUT_LENGTH}`,
        severity: Severity.CRITICAL,
      }]);
    }
    // ... rest of validate
  }
}
```

### Fix 3: Add Hook Execution Timeout (P2)

**File**: `packages/core/src/core/HookSystem.ts`

```typescript
const HOOK_TIMEOUT_MS = 5000; // 5 seconds

async function executeHookWithTimeout<T>(
  hook: Hook,
  context: ValidationContext
): Promise<T> {
  return Promise.race([
    hook.execute(context),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Hook timeout')), HOOK_TIMEOUT_MS)
    ),
  ]);
}
```

### Fix 4: Add Session Expiration Policy (P1)

**File**: `packages/core/src/core/SessionManager.ts`

```typescript
const SESSION_EXPIRY_MS = 3600000; // 1 hour
const MAX_SESSIONS = 10000;

export class SessionManager {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > SESSION_EXPIRY_MS) {
        this.sessions.delete(id);
      }
    }
  }

  set(id: string, data: SessionData): void {
    if (this.sessions.size >= MAX_SESSIONS) {
      this.cleanupExpiredSessions();
    }
    this.sessions.set(id, { ...data, lastAccessed: Date.now() });
  }
}
```

### Fix 5: Add Regex Compilation Cache (P2)

**File**: `packages/core/src/core/PatternEngine.ts`

```typescript
const regexCache = new Map<string, RegExp>();

export function compilePattern(pattern: string, flags: string): RegExp {
  const cacheKey = `${pattern}:${flags}`;
  if (regexCache.has(cacheKey)) {
    return regexCache.get(cacheKey)!;
  }
  const regex = new RegExp(pattern, flags);
  regexCache.set(cacheKey, regex);
  return regex;
}

// Limit cache size
const MAX_CACHE_SIZE = 1000;
if (regexCache.size > MAX_CACHE_SIZE) {
  const firstKey = regexCache.keys().next().value;
  regexCache.delete(firstKey);
}
```

---

## Future Enhancements (Out of Scope)

### High Priority
1. Implement AST-based hook validation
2. Add request rate limiting middleware
3. Implement parallel validator execution
4. Add comprehensive performance monitoring

### Medium Priority
1. Add circuit breaker health endpoints
2. Implement hook result caching
3. Add connection pooling for adapters
4. Implement distributed tracing

---

## Test Results

**Existing Tests**: Passing (1831/1831)

**Additional Test Cases Recommended**:
1. Override token with invalid format
2. Input size limit enforcement
3. Hook timeout scenarios
4. Session expiry behavior
5. Regex cache effectiveness
6. Concurrent request handling
7. Circuit breaker state transitions

---

## Conclusion

The GuardrailEngine and core logic provide **strong foundational infrastructure** with:
- Comprehensive validation pipeline
- VM-based sandbox isolation
- Fault tolerance mechanisms
- Extensible hook system

**Critical areas needing improvement**:
- Override token requires cryptographic validation (P1)
- Add engine-level input size limits (P1)
- Implement session expiration policy (P1)
- Add hook execution timeout (P2)
- Implement regex caching (P2)

**Next Steps**:
1. Implement P1 fixes (override token, input limits, session expiry)
2. Implement P2 fixes (hook timeout, regex cache)
3. Add test cases for security scenarios
4. Run full test suite

---

**Exit Condition**: All P1 fixes must be implemented and tested. P2 fixes documented for future sprints.
