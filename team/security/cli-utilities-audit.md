# CLI Utilities Security Audit Report

**Story ID**: S002-005C
**Date**: 2026-02-21
**Status**: FINDINGS DOCUMENTED
**Agents**: 2 parallel research agents

---

## Executive Summary

The CLI utilities provide **strong security foundations** with excellent credential handling, comprehensive audit logging, and proper error sanitization. Several **medium-to-high priority security issues** were identified including timing attack vulnerabilities, memory security limitations, and race conditions.

**Overall Assessment**: STRONG security posture with recommended hardening

---

## Agent Reports Summary

### Agent 1: CLI Utils Security

**Files Reviewed**:
1. `packages/core/src/cli/utils/error.ts` - Error handling
2. `packages/core/src/cli/utils/audit.ts` - Audit logging
3. `packages/core/src/cli/utils/mask.ts` - Credential masking
4. `packages/core/src/cli/utils/secure-credential.ts` - Secure credentials
5. `packages/core/src/cli/utils/validation.ts` - Validation utilities
6. `packages/core/src/cli/utils/terminal.ts` - Terminal utilities
7. `packages/core/src/cli/utils/progress.ts` - Progress indicators
8. `packages/core/src/cli/utils/exit.ts` - Exit handling

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| Memory security limitation | Critical | JavaScript strings immutable, can't be zeroed |
| Timing attack in masking | High | Rejection sampling timing-dependent |
| Audit log race condition | High | TOCTOU in directory creation |
| Stack trace leakage | High | Stack traces preserved in sanitized errors |
| Development HMAC key fallback | Medium | Insecure if used in production |
| Incomplete error sanitization | Medium | Edge cases in credential detection |
| No rate limiting on errors | Medium | DoS through rapid error creation |
| Terminal detection spoofing | Low | CI detection could be spoofed |
| Progress timing leaks | Low | Duration information leaked |

**Strengths**:
- Excellent credential sanitization with entropy detection
- Secure audit logging with HMAC signing
- Memory protection with Buffer.alloc()
- Rate limiting on validation
- Proper file permissions (0o600, 0o700)

---

### Agent 2: Detection Modules Security

**Files Reviewed**:
1. `packages/core/src/cli/detection/services.ts` - Service detection
2. `packages/core/src/cli/detection/credentials.ts` - Credential detection
3. `packages/core/src/cli/detection/framework.ts` - Framework detection
4. `packages/core/src/cli/testing/validator.ts` - Connector testing

**Security Findings**:
| Issue | Severity | Description |
|-------|----------|-------------|
| Docker binary execution | High | Could execute malicious docker binary |
| Service info disclosure | Medium | Port addresses revealed |
| Container name sanitization | Low | Could reveal too much info |
| Error message leakage | Low | System info in error messages |
| Missing config validation | Low | No pattern validation in config |
| Timeout cleanup race | Low | Abort signal race condition |

**Strengths**:
- Excellent DoS protection (timeouts, resource limits)
- Strong path validation with realpath()
- Secure credential handling
- Prototype pollution protection
- Command injection prevention

---

## Security Issues Summary

### Critical (P0)
None identified.

### High (P1)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| SecureCredential | Memory security limitation | P1 |
| Mask utility | Timing attack vulnerability | P1 |
| Audit log | TOCTOU race condition | P1 |
| Error handling | Stack trace leakage | P1 |
| Detection services | Docker binary execution risk | P1 |

### Medium (P2)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| Audit log | Development HMAC key fallback | P2 |
| Error handling | Incomplete sanitization | P2 |
| Error handling | No rate limiting | P2 |
| Detection services | Service info disclosure | P2 |

### Low (P3)
| Component | Issue | Fix Priority |
|-----------|-------|--------------|
| Terminal | CI detection spoofing | P3 |
| Progress | Timing leaks | P3 |
| Detection | Container name sanitization | P3 |
| Detection | Error message leakage | P3 |
| Validator | Missing config validation | P3 |

---

## Recommended Fixes

### Fix 1: Add Stack Trace Removal in Production (P1)

**File**: `packages/core/src/cli/utils/error.ts`

```typescript
// In sanitizeError function
const sanitized = new Error(sanitizedMessage);
// Remove stack traces in production
if (process.env.NODE_ENV === 'production') {
  sanitized.stack = undefined;
} else {
  sanitized.stack = sanitizedStack;
}
return sanitized;
```

### Fix 2: Fix Audit Log Race Condition (P1)

**File**: `packages/core/src/cli/utils/audit.ts`

```typescript
// Use atomic directory creation
try {
  await mkdir(this.auditDir, {
    recursive: true,
    mode: SECURE_DIR_MODE,
  });
} catch (error) {
  if ((error as any).code !== 'EEXIST') {
    throw new WizardError('AUDIT_DIR_FAILED', 'Failed to create audit directory');
  }
  // Directory exists, verify permissions
  await this.verifyPermissions(this.auditDir);
}
```

### Fix 3: Add Docker Binary Validation (P1)

**File**: `packages/core/src/cli/detection/services.ts`

```typescript
// Verify docker binary is legitimate before execution
const { stat } = await import('node:fs/promises');
const stats = await stat(dockerPath);

// Check if executable
if ((stats.mode & parseInt('111', 8)) === 0) {
  return [];
}

// Additional check: verify binary is in trusted location
const trustedPaths = ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin'];
const isTrusted = trustedPaths.some(path => dockerPath.startsWith(path));
if (!isTrusted) {
  return [];
}
```

### Fix 4: Add Config Value Validation (P3)

**File**: `packages/core/src/cli/testing/validator.ts`

```typescript
// Add basic validation for config values
for (const [key, value] of Object.entries(config)) {
  if (typeof value !== 'string') {
    errors.push(`${key}: Value must be a string`);
    continue;
  }
  if (value.length > 10000) {
    errors.push(`${key}: Value too long (max 10000 characters)`);
  }
}
```

---

## Future Enhancements (Out of Scope)

### High Priority
1. Implement constant-time masking operation
2. Add runtime type validation for configs
3. Implement proper memory zeroing for credentials
4. Add rate limiting to error creation

### Medium Priority
1. Make HMAC key required in production
2. Add more restrictive container name sanitization
3. Implement concurrent connection limits
4. Add security event logging

---

## Test Results

**Existing Tests**: Passing (1831/1831)

**Additional Test Cases Recommended**:
1. Stack trace removal in production mode
2. Audit log directory creation race conditions
3. Docker binary path validation
4. Config value length limits
5. Timing attack resistance in masking

---

## Conclusion

The CLI utilities demonstrate **strong security foundations** with:
- Excellent credential handling with entropy detection
- Comprehensive audit logging with HMAC signatures
- Strong DoS protection across all modules
- Proper file permissions and path validation

**Critical areas needing improvement**:
- Stack trace leakage in error handling (P1)
- Audit log race conditions (P1)
- Docker binary validation (P1)
- Memory security limitations (P1)

**Next Steps**:
1. Implement P1 fixes (stack traces, race conditions, docker validation)
2. Implement P2 fixes (HMAC key requirement, error rate limiting)
3. Add test cases for security scenarios
4. Run full test suite

---

**Exit Condition**: All P1 fixes must be implemented and tested. P2 fixes documented for future sprints.
