# BonkLM Security Remediation - Epic and Stories Working Document

**Project**: BonkLM (`@blackunicorn/bonklm`)
**Created**: 2026-02-21
**Status**: IN PROGRESS - SME REVIEWED
**Backup**: `team/backups/before-epic-creation-20260221-222752.tar.gz`

**SME Reviews Integrated**:
- BMM Architect: Reviewed and recommendations incorporated
- Cybersec Security Architect: Reviewed and recommendations incorporated

---

## INDEX

| Epic ID | Title | P0 Issues | P1 Issues | Status |
|---------|-------|-----------|-----------|--------|
| E011 | Core Package Security Fixes | 8 | 9 | **COMPLETE** |
| E016 | Performance & DoS Protection | 0 | 5 | **COMPLETE** |
| E014 | Logger Package Security | 3 | 4 | **COMPLETE** |
| E012 | Connector Security Remediation | 18 | 9 | **COMPLETE** |
| E013 | Middleware Framework Integration | 1 | 6 | **COMPLETE** |
| E015 | Documentation Completeness | 1 | 9 | **COMPLETE** |

**Total**: 31 P0 issues, 42 P1 issues (updated with SME feedback)

**Total Stories**: 40 stories across 6 epics

---

## SPRINT SEQUENCE (SME-Approved)

```
Sprint 1: E011 (Core Security) + E016 (Performance & DoS)
Sprint 2: E014 (Logger - must be before middleware integration)
Sprint 3: E012 Part 1 (Connectors 1-6, starting with S012-000)
Sprint 4: E012 Part 2 (Connectors 7-12)
Sprint 5: E013 (Middleware Integration)
Sprint 6: E015 (Documentation)
```

**Key Dependencies**:
- S012-000 (Connector Utilities) must complete before any other E012 stories
- E014 must complete before S013-004 (AttackLogger integration)
- E011 core package must be stable before connector remediation

---

## EPIC 011: Core Package Security Fixes

**Objective**: Fix 8 P0 and 9 P1 security issues in the core package
**Duration**: 8 stories
**Priority**: CRITICAL
**Dependency**: None (foundational epic)

### Stories

#### S011-001: Production Guard Runtime Verification
**Priority**: P0
**Location**: `packages/core/src/guards/production.ts`
**Issue**: No runtime environment verification - only text pattern matching

**SME Feedback Incorporated**:
- Add test environment detection to prevent test failures
- Include cloud provider detection (AWS, GCP, Azure)
- Add production mode enforcement at runtime

**Acceptance Criteria**:
1. Add `isProductionEnvironment()` function that checks actual runtime environment
2. Validate against `process.env.NODE_ENV`, `RAILS_ENV`, `APP_ENV`, `ENVIRONMENT`
3. Add cloud provider detection (AWS_ENV, GCP_PROJECT, AZURE_ENV)
4. Add `isTestEnvironment()` helper to prevent false positives in tests
5. Update guard to fail when ACTUALLY running in production (not just text matching)
6. Add unit tests for runtime verification including mocked environments
7. Ensure existing tests still pass with new detection logic

**Implementation Steps**:
1. Create `isProductionEnvironment()` helper with cloud detection
2. Create `isTestEnvironment()` helper for test fixture detection
3. Modify `detectProductionIndicators()` to use runtime check
4. Update validation logic to distinguish text patterns from actual environment
5. Add tests for various environment configurations (local, cloud, CI/CD)
6. Verify existing tests still pass

**Files to Modify**:
- `packages/core/src/guards/production.ts`
- `packages/core/tests/guards/production.test.ts`

---

#### S011-002: PII Guard Redaction in Logs
**Priority**: P0
**Location**: `packages/core/src/guards/pii/index.ts`, `validators.ts`
**Issue**: PII values are logged in plaintext without redaction

**SME Feedback Incorporated**:
- Add real-time PII masking during processing (not just logs)
- Coordinate with S014-002 for pattern consistency

**Acceptance Criteria**:
1. Add `redactPII()` function that masks sensitive values
2. Update all log entries to use redacted values
3. Ensure redaction preserves format (show first 2, last 4 chars with `****` in between)
4. Add real-time PII masking for in-memory processing
5. Add unit tests for redaction of all PII types
6. Verify no PII appears in log outputs
7. Coordinate patterns with logger package (S014-002)

**Implementation Steps**:
1. Create redaction function in `validators.ts`
2. Update `detectPii()` to store redacted values only
3. Modify log statements to use redacted matches
4. Add in-memory PII masking for processing pipeline
5. Add tests for all PII pattern types
6. Run tests to verify no regressions

**Files to Modify**:
- `packages/core/src/guards/pii/validators.ts`
- `packages/core/src/guards/pii/index.ts`
- `packages/core/tests/guards/pii.test.ts`

---

#### S011-003: Stack Trace Sanitization
**Priority**: P0
**Location**: `packages/core/src/logging/MonitoringLogger.ts`
**Issue**: Full stack traces with sensitive info logged without sanitization

**SME Feedback Incorporated**:
- Consider async stack traces
- Coordinate with logger package on sanitization approach

**Acceptance Criteria**:
1. Add `sanitizeStackTrace()` method
2. Remove file paths, line numbers, and variable values from stack traces
3. Handle async stack traces properly
4. Replace sensitive info with `[REDACTED]` placeholders
5. Add unit tests for stack trace sanitization
6. Ensure error debugging still possible with sanitized traces

**Implementation Steps**:
1. Create `sanitizeStackTrace()` private method
2. Update error logging to use sanitized stack traces
3. Add regex patterns for file paths, line numbers, variable assignments
4. Handle async/await stack frame formats
5. Add tests for various error scenarios
6. Verify error monitoring still functional

**Files to Modify**:
- `packages/core/src/logging/MonitoringLogger.ts`
- `packages/core/tests/logging/test.ts`

---

#### S011-004a: SecureCredential Interface Definition
**Priority**: P0
**Location**: `packages/core/src/base/`
**Issue**: No secure API key handling in adapter interface

**SME Feedback Incorporated**:
- Split from original story to separate interface from migration
- Define in core for use by all connectors

**Acceptance Criteria**:
1. Create `SecureCredential` class in core package
2. Implement Buffer-based credential storage
3. Add `dispose()` method for zeroing memory
4. Add `use()` helper for automatic cleanup
5. Export interface for connector use
6. Add TypeScript types and JSDoc
7. Add unit tests for security properties

**Files to Create**:
- `packages/core/src/base/SecureCredential.ts`

**Files to Modify**:
- `packages/core/src/base/index.ts`

---

#### S011-004b: Migrate Connectors to SecureCredential
**Priority**: P1
**Location**: All connector packages
**Issue**: Connectors need to adopt SecureCredential pattern

**Dependencies**: S011-004a must complete first

**Status**: N/A - Not Applicable

**Rationale**:
After review, all connectors follow a security best practice pattern:
- They accept **pre-configured client instances** from the underlying SDK (OpenAI, Anthropic, etc.)
- They do **not** accept raw credentials (API keys, tokens) directly
- Credential handling is the responsibility of the underlying SDK client

**SecureCredential is already available** in the core package for users who need to handle credentials securely:
```typescript
import { SecureCredential } from '@blackunicorn/bonklm/core';
import OpenAI from 'openai';

// User handles credential securely
const apiKey = new SecureCredential(process.env.OPENAI_API_KEY);
const client = await apiKey.use(async (key) => {
  return new OpenAI({ apiKey: key });
});

// Pass pre-configured client to connector
import { createGuardedOpenAI } from '@blackunicorn/bonklm-openai';
const guardedOpenAI = createGuardedOpenAI(client);
```

**Acceptance Criteria**:
1. ~~Update all 10 LLM connectors to use SecureCredential~~ (N/A - client pattern is correct)
2. ~~Update all 5 vector DB connectors to use SecureCredential~~ (N/A - client pattern is correct)
3. ✅ SecureCredential is exported from core package
4. ✅ Documentation shows SecureCredential usage pattern
5. ✅ Connectors use standard client wrapping pattern

**Files to Modify**: All connector `index.ts` files

---

#### S011-005: Streaming Buffer Overflow Protection
**Priority**: P0
**Location**: `packages/core/src/engine/GuardrailEngine.ts`
**Issue**: No buffer size validation before accumulating content

**SME Feedback Incorporated**:
- Implement circuit breaker for repeated violations
- Coordinate with logger memory limits (S014-005)

**Acceptance Criteria**:
1. Add `maxBufferSize` configuration option (default 1MB)
2. Check buffer size BEFORE accumulating each chunk
3. Throw `StreamValidationError` when limit exceeded
4. Implement circuit breaker after repeated violations
5. Add tests for buffer overflow scenarios
6. Ensure streaming validation works for all connectors
7. Coordinate memory limits with logger package

**Implementation Steps**:
1. Add `maxBufferSize` to engine configuration
2. Add `circuitBreakerThreshold` configuration
3. Modify streaming validation to check size before accumulation
4. Create `StreamValidationError` with proper error codes
5. Implement circuit breaker logic
6. Add tests for buffer limits and circuit breaker
7. Verify existing streaming tests pass

**Files to Modify**:
- `packages/core/src/engine/GuardrailEngine.ts`
- `packages/core/tests/engine/streaming.test.ts`

---

#### S011-006: Override Token Cryptographic Validation
**Priority**: P0
**Location**: `packages/core/src/engine/GuardrailEngine.ts`
**Issue**: Override token vulnerability allows bypassing all validation

**SME Feedback Added**: Critical missing story from Cybersec review

**Acceptance Criteria**:
1. Implement HMAC-based override token validation
2. Add token expiration (default 1 hour)
3. Add token rotation mechanism
4. Include audit logging for all override usage
5. Add tests for token validation
6. Document override token security requirements

**Implementation Steps**:
1. Define HMAC validation schema
2. Implement `validateOverrideToken()` function
3. Add token expiration check
4. Add audit logging for override attempts
5. Add tests for valid/invalid tokens
6. Document security requirements

**Files to Modify**:
- `packages/core/src/engine/GuardrailEngine.ts`
- `packages/core/tests/engine/override.test.ts`

---

#### S011-007: Hook System Security Hardening
**Priority**: P0
**Location**: `packages/core/src/hooks/HookSandbox.ts`
**Issue**: Function.prototype bypass, no timeouts, no rate limiting

**SME Feedback Added**: Critical missing story from Cybersec review

**Acceptance Criteria**:
1. Add Function.prototype freezing in sandbox
2. Implement hook execution timeout (5s default)
3. Add rate limiting per hook phase
4. Add tests for security bypass attempts
5. Verify all existing hooks work with new limits

**Implementation Steps**:
1. Freeze Function.prototype in sandbox initialization
2. Add timeout wrapper to hook execution
3. Implement rate limiter for hook calls
4. Add security tests for bypass attempts
5. Verify existing functionality

**Files to Modify**:
- `packages/core/src/hooks/HookSandbox.ts`
- `packages/core/tests/hooks/sandbox.test.ts`

---

#### S011-008: Memory-Safe Processing
**Priority**: P1
**Location**: Core package processing pipeline
**Issue**: PII in memory during processing

**SME Feedback Added**: From Cybersec review

**Acceptance Criteria**:
1. Implement secure PII handling during processing
2. Add memory encryption for sensitive data
3. Implement secure garbage collection hints
4. Add tests for memory safety

**Files to Modify**:
- Core processing pipeline files

---

## EPIC 016: Performance & DoS Protection

**Objective**: Address P2 findings with security implications (DoS vectors)
**Duration**: 5 stories
**Priority**: HIGH
**Rationale**: Must be before connector remediation (many depend on engine stability)

**SME Feedback**: New epic added per BMM Architect recommendation

### Stories

#### S016-001: Implement Regex Compilation Caching
**Priority**: P1
**Location**: `packages/core/src/validators/pattern-engine.ts`
**Issue**: No regex caching leads to performance degradation

**Acceptance Criteria**:
1. Implement LRU cache for compiled regex patterns
2. Add cache size limit (default 1000 patterns)
3. Add cache hit/miss metrics
4. Add tests for cache behavior

**Files to Modify**:
- `packages/core/src/validators/pattern-engine.ts`

---

#### S016-002: Add Session Expiration Policy
**Priority**: P1
**Location**: `packages/core/src/session/SessionTracker.ts`
**Issue**: Sessions never expire, memory leak risk

**Acceptance Criteria**:
1. Add session TTL configuration (default 24 hours)
2. Implement automatic session expiration
3. Add expired session cleanup
4. Add tests for expiration behavior

**Files to Modify**:
- `packages/core/src/session/SessionTracker.ts`

---

#### S016-003: Implement Request Rate Limiting
**Priority**: P1
**Location**: Core package
**Issue**: No rate limiting allows DoS attacks

**Acceptance Criteria**:
1. Add rate limiter configuration
2. Implement sliding window rate limiting
3. Add rate limit exceeded error
4. Add tests for rate limiting

**Files to Modify**:
- New rate limiting module in core

---

#### S016-004: Add Hook Execution Timeout
**Priority**: P1
**Location**: `packages/core/src/hooks/HookSandbox.ts`
**Issue**: No timeout allows hanging hooks

**Note**: Implemented in S011-007, this story ensures configuration is exposed

**Acceptance Criteria**:
1. Expose hook timeout configuration
2. Add documentation for timeout behavior
3. Add tests for timeout configuration

**Files to Modify**:
- HookSandbox configuration

---

#### S016-005: Fix DoS Vulnerability in RetryPolicy
**Priority**: P1
**Location**: `packages/core/src/fault-tolerance/RetryPolicy.ts`
**Issue**: Unbounded retries cause DoS

**Acceptance Criteria**:
1. Add maximum retry limit
2. Implement exponential backoff with jitter
3. Add circuit breaker for repeated failures
4. Add tests for DoS scenarios

**Files to Modify**:
- `packages/core/src/fault-tolerance/RetryPolicy.ts`

---

## EPIC 014: Logger Package Security

**Objective**: Fix 3 P0 and 4 P1 logger security issues
**Duration**: 6 stories
**Priority**: HIGH
**Dependency**: Must complete before E013 middleware integration

**SME Feedback**: Moved before E013 per architect recommendation

### Stories

#### S014-001: PII Sanitization Default
**Priority**: P0
**Location**: `packages/logger/src/config.ts`, `AttackLogger.ts`
**Issue**: `sanitize_pii` defaults to `false`

**Acceptance Criteria**:
1. Change default to `true`
2. Add migration guide for existing users
3. Add deprecation warning for explicit `false`
4. Add tests for default behavior
5. Verify existing integrations work

**Files to Modify**:
- `packages/logger/src/config.ts`
- `packages/logger/src/AttackLogger.ts`

---

#### S014-002: Enhanced PII Patterns
**Priority**: P0
**Location**: `packages/logger/src/transform.ts`
**Issue**: Oversimplified regex patterns miss many PII types

**SME Feedback**: Coordinate with S011-002 for pattern consistency

**Acceptance Criteria**:
1. Add phone number patterns (international)
2. Add postal code patterns (US, CA, international)
3. Add passport/driver's license patterns
4. Add IBAN/SWIFT codes
5. Add UUID and crypto address patterns
6. Add configuration for pattern sensitivity
7. Add tests for all new patterns

**Files to Modify**:
- `packages/logger/src/transform.ts`

---

#### S014-003: Path Traversal Protection
**Priority**: P0
**Location**: `packages/logger/src/AttackLogger.ts`
**Issue**: No path validation in exportJSONToFile()

**SME Feedback**: Add allowed path patterns validation

**Acceptance Criteria**:
1. Add path validation function
2. Restrict exports to specific directory
3. Validate against allowed path patterns
4. Add file extension validation
5. Add tests for path traversal attempts

**Files to Modify**:
- `packages/logger/src/AttackLogger.ts`

---

#### S014-004: Log Injection Prevention
**Priority**: P1
**Location**: `packages/logger/src/transform.ts`
**Issue**: Control characters stored, only sanitized at export

**Acceptance Criteria**:
1. Apply escaping during storage
2. Add ANSI sequence stripping on input
3. Add comprehensive control character handling
4. Add tests for injection scenarios

**Files to Modify**:
- `packages/logger/src/transform.ts`

---

#### S014-005: Memory Bounds and Session Security
**Priority**: P1
**Location**: `packages/logger/src/AttackLogger.ts`, `AttackLogStore.ts`, `config.ts`
**Issues**: Unbounded memory, weak session ID

**SME Feedback**: Coordinate with S011-005 for unified memory strategy

**Acceptance Criteria**:
1. Add `max_content_size` configuration (default 1MB)
2. Replace Math.random() with crypto.randomBytes (16 bytes)
3. Add session ID format validation
4. Add tests for memory limits
5. Add tests for session ID strength

**Files to Modify**:
- `packages/logger/src/AttackLogger.ts`
- `packages/logger/src/AttackLogStore.ts`
- `packages/logger/src/config.ts`

---

#### S014-006: ADR for Type Sharing Strategy
**Priority**: P1
**Location**: `team/architecture/ADRs/`
**Issue**: Need architectural decision before deduplicating types

**SME Feedback**: ADR required per architect review

**Acceptance Criteria**:
1. Create ADR document analyzing three options:
   - Option A: Import from core (tight coupling)
   - Option B: Keep duplicate types (loose coupling)
   - Option C: Create shared types package
2. Document recommendation and rationale
3. Get approval from architecture team
4. Implement approved approach

**Files to Create**:
- `team/architecture/ADRs/007-logger-type-sharing.md`

---

## EPIC 012: Connector Security Remediation

**Objective**: Fix 18 P0 and 9 P1 security issues across 10 connectors
**Duration**: 13 stories
**Priority**: CRITICAL
**Dependency**: S012-000 must complete first

**SME Feedback**: Added S012-000 per architect recommendation

**Sprint 3 Status**: ✅ COMPLETED (2026-02-22)
- S012-000 through S012-005 all completed
- All connector security fixes implemented
- Code review findings addressed and fixed

**Sprint 4 Status**: ✅ COMPLETED (2026-02-22)
- S012-006 (Qdrant): Filter refinement and ReDoS protection - 77 tests passing
- S012-007 (Chroma): Document validation and filter bypass fixes - 56 tests passing
- S012-008 (CopilotKit): Action injection prevention with validation - 19 tests passing
- S012-009 (Weaviate): Response structure handling - 58 tests passing (3 skipped)
- S012-010 (GenKit): Callback signature fixes - 25 tests passing
- S012-011 (Connector Exports): Standardized error class exports across connectors
- Core package: S011-007 Reflect.construct bypass fix - 2003 tests passing
- Code review completed with no issues found in Sprint 4 changes

### Stories

#### S012-000: Create Connector Utilities Base Package ✅
**Priority**: P0
**Location**: `packages/core/src/connector-utils/`
**Issue**: No shared utilities for connector patterns

**Implementation**:
- Created `packages/core/src/connector-utils/` directory
- Implemented standard error classes: `ConnectorValidationError`, `StreamValidationError`, `ConnectorConfigurationError`, `ConnectorTimeoutError`
- Implemented standard utilities: `extractContentFromResponse()`, `validateBufferBeforeAccumulation()`, `updateStreamValidatorState()`, `createStandardLogger()`, `logValidationFailure()`, `logTimeout()`
- Added to core package exports with path `./core/connector-utils`

---

#### S012-001: MCP Connector Exports and Error Handling ✅
**Priority**: P0
**Location**: `packages/mcp-connector/`
**Issues**: Missing exports, inconsistent error handling

**Implementation**:
- Exported `StreamValidationError` and other error classes from types.ts and index.ts
- Updated to use connector-utils error classes and logging utilities
- Updated `extractResultText()` to use connector-utils `extractContentFromResponse()` as fallback
- Implemented consistent error handling pattern with `logValidationFailure()` and `logTimeout()`

**Files to Modify**:
- `packages/mcp-connector/src/types.ts`
- `packages/mcp-connector/src/index.ts`
- `packages/mcp-connector/src/guarded-mcp.ts`

---

#### S012-002: Pinecone Connector API Usage
**Priority**: P0
**Location**: `packages/pinecone-connector/src/guarded-pinecone.ts`
**Issue**: Incorrect GuardrailEngine API usage (single result vs array)

**Acceptance Criteria**:
1. Update `engine.validate()` call to handle array results
2. Use connector-utils content extractor
3. Add tests for array result handling
4. Verify error handling works correctly

**Implementation**:
- Updated `validateWithTimeout()` to return `EngineResult` instead of `GuardrailResult[]`
- Updated all validation checks to use `result.allowed` instead of `results.find()`
- Exported connector-utils error classes from index.ts
- Applied `logValidationFailure()` and `logTimeout()` utilities

---

#### S012-003: HuggingFace Connector API and Proxy ✅
**Priority**: P0
**Location**: `packages/huggingface-connector/`
**Issues**: Incorrect API usage, incomplete method interception

**Implementation**:
- Updated `validateWithTimeout()` to return `EngineResult`
- Fixed regex pattern escaping to prevent errors with model names containing special characters
- Applied `logValidationFailure()` and `logTimeout()` utilities
- Removed unused `createGuardedMethod` function

---

#### S012-004: Mastra Connector Validation Bypass ✅
**Priority**: P0
**Location**: `packages/mastra-connector/src/mastra-guardrail.ts`
**Issues**: Returns filtered content instead of throwing, buffer check after accumulation

**SME Feedback**: Implement proper error codes and recovery

**Implementation**:
- Updated `validateWithTimeout()` to return `EngineResult`
- Updated buffer validation to use connector-utils `validateBufferBeforeAccumulation()` and `updateStreamValidatorState()`
- Implemented proper UTF-8 byte size calculation (was using character count)
- Integrated circuit breaker with check in `validateBefore()`
- Added `recordFailure()` and `recordSuccess()` calls
- Applied `logValidationFailure()` and `logTimeout()` utilities

---

#### S012-005: Vercel Connector Buffer Mode ✅
**Priority**: P0
**Location**: `packages/vercel-connector/src/guarded-ai.ts`
**Issue**: Declares buffer mode support but doesn't implement

**Acceptance Criteria**:
1. Implement buffer mode validation using connector-utils
2. Add proper streaming validation with buffer checks
3. Add tests for buffer mode
4. Update documentation

**Implementation**:
- Implemented proper buffer mode that accumulates all chunks before validating
- Applied connector-utils `validateBufferBeforeAccumulation()` and `updateStreamValidatorState()`
- Updated `validateWithTimeout()` to return `EngineResult`
- Fixed tsconfig.json to remove invalid paths configuration
- Applied `logValidationFailure()` and `logTimeout()` utilities

**Code Review Fixes Applied**:
- Fixed duplicate `'completion'` field in content-extractor.ts
- Fixed unsafe regex pattern escaping in HuggingFace connector
- Updated Mastra connector to use connector-utils buffer validation
- Removed temporary "Code review fix" comments from Pinecone connector

---

#### S012-006: Qdrant Connector Filter and ReDoS ✅
**Priority**: P0
**Location**: `packages/qdrant-connector/src/guarded-qdrant.ts`
**Issues**: Overly aggressive filters, ReDoS vulnerability

**SME Feedback**: Consider regex safety at pattern level

**Status**: COMPLETED (2026-02-22)
- Refined dangerous keys list to allow legitimate Qdrant operators
- Implemented proper regex escaping and length limits
- Added input validation to prevent ReDoS (max pattern length 100)
- 77 tests passing

**Acceptance Criteria**:
1. Refine dangerous keys list to allow legitimate operators
2. Implement proper regex escaping and length limits
3. Use safe matching algorithms (no catastrophic backtracking)
4. Add tests for DoS resistance
5. Add fuzzing tests for filter inputs

**Files to Modify**:
- `packages/qdrant-connector/src/guarded-qdrant.ts`

---

#### S012-007: Chroma Connector Document Validation ✅
**Priority**: P0
**Location**: `packages/chroma-connector/src/guarded-chroma.ts`
**Issues**: Missing complex document validation, filter bypass risk

**Status**: COMPLETED (2026-02-22)
- Added comprehensive document validation for complex objects
- Improved filter sanitization with depth limits (max 10 levels)
- Added nested document field validation
- 56 tests passing

**Acceptance Criteria**:
1. Add comprehensive document validation for complex objects
2. Improve filter sanitization with depth limits
3. Validate all document fields recursively
4. Add tests for nested document structures
5. Add NoSQL injection tests

**Files to Modify**:
- `packages/chroma-connector/src/guarded-chroma.ts`

---

#### S012-008: CopilotKit Action Injection ✅
**Priority**: P0
**Location**: `packages/copilotkit-connector/`
**Issues**: Action injection, unbounded message content

**SME Feedback**: Add schema validation and sandboxing

**Status**: COMPLETED (2026-02-22)
- Added action name validation (default blacklist: eval, exec, deleteDatabase, etc.)
- Implemented action argument size limits (maxArgumentsSize)
- Added whitelist/blacklist pattern support for action names
- Added message content length limits (maxContentLength)
- 19 tests passing

**Acceptance Criteria**:
1. Add action name validation and schema checking
2. Implement action schema validation
3. Add sandboxing for action execution
4. Implement message size limits
5. Add proper content length checks
6. Add tests for injection scenarios

**Files to Modify**:
- `packages/copilotkit-connector/`

---

#### S012-009: Weaviate Result Structure Handling ✅
**Priority**: P0
**Location**: `packages/weaviate-connector/src/guarded-weaviate.ts`
**Issue**: Inconsistent result structure handling

**Status**: COMPLETED (2026-02-22)
- Implemented robust response structure handling with multiple format support
- Added fallback mechanisms for v4 nested, v4 flat, GraphQL Get, and legacy formats
- Added `getNestedValue()` helper for deep object traversal
- 58 tests passing (3 skipped for unsupported formats)

**Acceptance Criteria**:
1. Implement robust response structure handling
2. Add fallback mechanisms for different formats
3. Validate all possible response structures
4. Add tests for various response formats

**Files to Modify**:
- `packages/weaviate-connector/src/guarded-weaviate.ts`

---

#### S012-010: GenKit Callback Signature ✅
**Priority**: P0
**Location**: `packages/genkit-connector/src/genkit-plugin.ts`
**Issue**: onBlocked callback signature mismatch

**Status**: COMPLETED (2026-02-22)
- Fixed onBlocked callback signature to include context parameter
- Added onStreamBlocked, onToolCallBlocked, onToolResultBlocked callbacks
- All callbacks support optional context parameter
- 25 tests passing

**Acceptance Criteria**:
1. Fix onBlocked callback signature to match expected type
2. Ensure proper typing for callback parameters
3. Add tests for callback scenarios

**Files to Modify**:
- `packages/genkit-connector/src/genkit-plugin.ts`

---

#### S012-011: Standardize Connector Exports ✅
**Priority**: P1
**Location**: All connectors
**Issue**: Missing utility function exports

**Status**: COMPLETED (2026-02-22)
- Standardized error class exports across vercel-connector, mcp-connector, langchain-connector
- All connectors now export: StreamValidationError, ConnectorValidationError, ConnectorConfigurationError, ConnectorTimeoutError from @blackunicorn/bonklm/core/connector-utils
- Exported constants (VALIDATION_INTERVAL, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_VALIDATION_TIMEOUT) from applicable connectors

**Acceptance Criteria**:
1. Follow reference connector export pattern
2. Export all utility functions
3. Export custom error classes using connector-utils
4. Add tests for exports

**Files to Modify**: All connector `index.ts` files

---

#### S012-012: Connector Error Handling Consistency
**Priority**: P1
**Location**: All connectors
**Issue**: Inconsistent error handling across connectors

**SME Feedback**: Specify throw vs callback pattern

**Acceptance Criteria**:
1. Implement fail-closed security model
2. Standardize error types using connector-utils
3. Document throw vs callback pattern for each connector
4. Add consistent error tests
5. Verify all connectors throw on validation failure

**Files to Modify**: All connector implementations

---

#### S012-013: Connector Authentication
**Priority**: P0
**Location**: All connectors
**Issue**: No authentication mechanisms for LLM services

**SME Feedback Added**: From Cybersec review

**Acceptance Criteria**:
1. Implement API key validation for protected endpoints
2. Add service account authentication support
3. Add permission-based access control
4. Add tests for authentication scenarios

**Files to Modify**: All connector implementations

---

## EPIC 013: Middleware Framework Integration

**Objective**: Fix 1 P0 and 6 P1 middleware issues, add core integrations
**Duration**: 8 stories
**Priority**: HIGH
**Dependency**: E014 must complete first (AttackLogger integration)

**SME Feedback**: Expanded with security headers and request validation

### Stories

#### S013-001: NestJS Prototype Pollution Fix
**Priority**: P0
**Location**: `packages/nestjs-module/src/guardrails.interceptor.ts`
**Issue**: Direct request mutation allows prototype pollution

**SME Feedback**: Specify cleanup policy to prevent memory leaks

**Acceptance Criteria**:
1. Use WeakMap for metadata storage
2. Implement cleanup policy (on-response-end)
3. Prevent `__proto__` pollution attacks
4. Add tests for prototype pollution scenarios
5. Add tests for middleware chaining (3+ middlewares)
6. Verify WeakMap entries are garbage collected
7. Verify all middleware functionality intact

**Implementation Steps**:
1. Create WeakMap for request metadata with cleanup
2. Replace direct request property assignment
3. Add cleanup on response finish
4. Add security tests for prototype pollution
5. Add middleware chaining tests
6. Verify integration tests pass

**Files to Modify**:
- `packages/nestjs-module/src/guardrails.interceptor.ts`

---

#### S013-002: Express Body Extractor Sanitization
**Priority**: P1
**Location**: `packages/express-middleware/src/middleware.ts`
**Issue**: Missing prototype pollution protection in body extractor

**SME Feedback**: Add content sanitization, not just proto protection

**Acceptance Criteria**:
1. Add prototype pollution protection to JSON stringify
2. Sanitize string outputs
3. Add content sanitization for malicious payloads
4. Add tests for malicious payloads
5. Verify all body types handled

**Files to Modify**:
- `packages/express-middleware/src/middleware.ts`

---

#### S013-003: ConfigValidator Integration
**Priority**: P1
**Location**: All middleware packages
**Issue**: No runtime configuration validation

**SME Feedback**: Must wait for E011 to stabilize

**Acceptance Criteria**:
1. Import and use ConfigValidator from core
2. Define validation schemas for each middleware
3. Throw on invalid configuration
4. Verify core package version compatibility
5. Add integration tests with pinned core version
6. Add tests for config validation

**Files to Modify**:
- `packages/express-middleware/src/middleware.ts`
- `packages/fastify-plugin/src/plugin.ts`
- `packages/nestjs-module/src/guardrails.interceptor.ts`

---

#### S013-004: AttackLogger Integration
**Priority**: P1
**Location**: All middleware packages
**Issue**: Validation failures not logged as security events

**SME Feedback**: Must wait for E014 to complete

**Acceptance Criteria**:
1. Integrate AttackLogger from logger package
2. Log all blocked requests with metadata
3. Add optional logger configuration
4. Add tests for logging scenarios
5. Verify logger package version compatibility

**Files to Modify**:
- All middleware packages

---

#### S013-005: SessionTracker Integration
**Priority**: P2
**Location**: All middleware packages
**Issue**: No multi-request attack detection

**SME Feedback**: Specify session storage architecture

**Acceptance Criteria**:
1. Integrate SessionTracker from core package
2. Specify session storage (in-memory with Redis option)
3. Track session-based risk accumulation
4. Escalate based on session history
5. Add tests for session scenarios
6. Document distributed system considerations

**Files to Modify**:
- All middleware packages

---

#### S013-006: NestJS Error Handling
**Priority**: P1
**Location**: `packages/nestjs-module/src/guardrails.interceptor.ts`
**Issue**: JSON stringification errors not properly handled

**Acceptance Criteria**:
1. Add robust error handling for JSON operations
2. Implement fallback mechanisms
3. Add tests for error scenarios

**Files to Modify**:
- `packages/nestjs-module/src/guardrails.interceptor.ts`

---

#### S013-007: Security Headers Implementation
**Priority**: P1
**Location**: All middleware packages
**Issue**: No security headers

**SME Feedback Added**: From Cybersec review

**Acceptance Criteria**:
1. Add Content Security Policy headers
2. Implement X-Frame-Options
3. Add Strict-Transport-Security
4. Add X-Content-Type-Options
5. Add tests for header presence

**Files to Modify**:
- All middleware packages

---

#### S013-008: Request Size Validation
**Priority**: P1
**Location**: All middleware packages
**Issue**: No request size limits

**SME Feedback Added**: From Cybersec review

**Acceptance Criteria**:
1. Implement maximum payload size limits
2. Add streaming validation for large requests
3. Include memory usage monitoring
4. Add tests for size limits

**Files to Modify**:
- All middleware packages

---

## EPIC 015: Documentation Completeness

**Objective**: Fix 1 P0 and 9 P1 documentation issues
**Duration**: 5 stories
**Priority**: MEDIUM
**Can Run In Parallel**: S015-003, S015-004 can run with other epics

**SME Feedback**: Added API documentation story

### Stories

#### S015-001: Core Package README
**Priority**: P0
**Location**: `packages/core/README.md` (DOES NOT EXIST)
**Issue**: Core package has no inline documentation

**Acceptance Criteria**:
1. Create comprehensive README.md
2. Include installation instructions
3. Include quick start guide
4. Include API reference links
5. Include CLI usage examples
6. Include migration notes from wizard
7. Include security best practices summary

**Files to Create**:
- `packages/core/README.md`

---

#### S015-002: Vector Database Connector READMEs
**Priority**: P1
**Location**: `packages/chroma-connector/`, `packages/qdrant-connector/`, `packages/weaviate-connector/`
**Issue**: Missing READMEs for vector DB connectors

**Acceptance Criteria**:
1. Create README for chroma-connector
2. Create README for qdrant-connector
3. Create README for weaviate-connector
4. Follow existing connector pattern
5. Include installation, quick start, configuration
6. Include security considerations

**Files to Create**:
- `packages/chroma-connector/README.md`
- `packages/qdrant-connector/README.md`
- `packages/weaviate-connector/README.md`

---

#### S015-003: CLI Branding and Help Text
**Priority**: P1
**Location**: Various CLI files
**Issues**: Status command shows wrong branding, missing help examples

**SME Feedback**: Use grep to find all occurrences

**Acceptance Criteria**:
1. Use grep to find all "LLM-Guardrails" occurrences
2. Use grep to find all "llm-guardrails" occurrences
3. Fix status command branding (LLM-Guardrails → BonkLM)
4. Add usage examples to all CLI commands
5. Add option documentation (--json, --force, --yes)
6. Fix broken security practices link
7. Verify with `npm run test:cli` and `bonklm --help`

**Files to Modify**:
- `packages/core/src/cli/commands/status.ts`
- `packages/core/src/cli/commands/*.ts` (all commands)
- `docs/getting-started.md`

---

#### S015-004: Internal Code Comments
**Priority**: P1
**Location**: Various CLI files
**Issue**: Internal code comments reference old name

**SME Feedback**: Update in priority order

**Acceptance Criteria**:
1. Find all occurrences using grep
2. Update JSDoc comments to use BonkLM
3. Update error messages to use BonkLM
4. Update package descriptions
5. Update in priority: user-facing strings → JSDoc → internal comments
6. Verify all user-facing strings consistent

**Files to Modify**:
- All files with old references

---

#### S015-005: Document New Security APIs
**Priority**: P1
**Location**: API documentation
**Issue**: New security APIs from E011-E014 need documentation

**SME Feedback Added**: Per architect review

**Dependencies**: E011-E014 must complete

**Acceptance Criteria**:
1. Document SecureCredential usage
2. Document PII redaction behavior
3. Document environment detection in Production Guard
4. Document override token security requirements
5. Document hook system security features
6. Add migration guide for breaking changes
7. Update examples with new patterns

**Files to Modify**:
- API reference documentation
- Security guide
- Examples

---

## SUCCESS CRITERIA

1. All 31 P0 issues resolved (updated from SME feedback)
2. All 42 P1 issues resolved (updated from SME feedback)
3. All tests passing (1846+ tests)
4. No new security vulnerabilities introduced
5. Code review approved by security SME
6. Architecture review approved by BMM SME
7. Documentation complete and accurate
8. All ADRs created and approved

---

## IMPLEMENTATION RISK MITIGATION

### Breaking Changes Management
- Version bumping strategy: Major version bump for breaking changes
- Migration guides for all breaking API changes
- Deprecation warnings for deprecated features
- Backward compatibility matrix in documentation

### Rollback Strategy
- Git tags for each sprint completion
- Feature flags for critical changes
- Automated rollback testing
- Incident response plan for critical regressions

### Integration Testing
- Cross-package integration test suite
- End-to-end security scenario tests
- Performance regression testing
- Memory leak detection tests

---

## REFERENCES

### Code Review Findings
- `FINDINGS-CODE-REVIEW.md` - Complete code review findings

### Security Audits
- `team/security/engine-core-logic-audit.md` - Core security audit
- `team/security/guards-security-audit.md` - Guards security audit
- `team/security/prompt-injection-audit.md` - Prompt injection audit
- `team/security/jailbreak-detector-audit.md` - Jailbreak detector audit
- `team/security/cli-security-audit.md` - CLI security audit
- `team/security/classification-scheme.md` - Security classification scheme

### QA Reports
- `team/qa/epic4-connector-review-report.md` - Connector review
- `team/qa/epic5-middleware-framework-integration-report.md` - Middleware review
- `team/qa/logger-package-review.md` - Logger review
- `team/qa/main-documentation-review.md` - Documentation review

### Architecture Documentation
- `team/architecture/architecture-documentation.md` - Architecture overview
- `_bmad-output/project-context.md` - Project context and patterns

### SME Reviews
- BMM Architect Review: Integrated (see S012-000, E016, ADR requirements)
- Cybersec Security Architect Review: Integrated (see S011-006, S011-007, S012-013, S013-007, S013-008)

---

## SPRINT PROGRESS TRACKING

### Sprint 1: E011 (Core Security) + E016 (Performance & DoS)
**Started**: 2026-02-21
**Status**: IN PROGRESS (5/12 stories completed)

#### Completed Stories:
- ✅ **S011-001**: Production Guard Runtime Verification
  - Added `isProductionEnvironment()` with cloud provider detection
  - Added `isTestEnvironment()` for test fixture detection
  - Updated guard to fail when actually running in production
  - Fixed AWS_EXECUTION_ENV check (changed from `=== 'AWS_Lambda_*'` to `.startsWith('AWS_Lambda_')`)
  - Location: `packages/core/src/guards/production.ts`

- ✅ **S011-002**: PII Guard Redaction in Logs
  - Added `redactPIIValue()` with format-preserving redaction
  - Added `redactPIIInStringSync()` for logging
  - Added `redactPIIInObject()` for recursive object redaction
  - Location: `packages/core/src/guards/pii/validators.ts`

- ✅ **S011-003**: Stack Trace Sanitization
  - Added `sanitizeStackTrace()` method to MonitoringLogger
  - Removes file paths, line numbers, and function names
  - Handles .ts, .tsx, .mjs, .cjs extensions
  - Location: `packages/core/src/logging/MonitoringLogger.ts`

- ✅ **S011-004a**: SecureCredential Interface Definition
  - Re-exported SecureCredential from CLI utils to base package
  - Location: `packages/core/src/base/SecureCredential.ts`

- ✅ **S011-005**: Streaming Buffer Overflow Protection
  - Added circuit breaker state tracking (CLOSED, OPEN, HALF_OPEN)
  - Added StreamValidationError class
  - Fixed HALF_OPEN state to re-trip on violations
  - Fixed duplicate `readonly` keywords
  - Location: `packages/core/src/engine/GuardrailEngine.ts`

#### Test Results:
- All 1908 tests passing (5 skipped)
- Fixed code review findings:
  - Removed duplicate code in sanitizeContext
  - Fixed async/await bug (using sync functions for logging)
  - Fixed TypeScript file extension handling in stack traces
  - Fixed circuit breaker HALF_OPEN state behavior

#### Remaining Sprint 1 Stories:
- ⏳ S011-006: Override Token Cryptographic Validation
- ⏳ S011-007: Hook System Security Hardening
- ⏳ S016-001: Regex Compilation Caching
- ⏳ S016-002: Session Expiration Policy
- ⏳ S016-003: Request Rate Limiting
- ⏳ S016-004: Hook Execution Timeout
- ⏳ S016-005: Fix DoS Vulnerability in RetryPolicy

---

## NEXT STEPS

1. **Continue Sprint 1**: Complete remaining E011 and E016 stories
2. **Create ADR-007**: Logger Type Sharing Strategy (before S014-006)
3. **Create Connector Utilities**: S012-000 before any connector work
4. **Coordinate E014 before E013**: Logger must be stable before middleware integration

---

*Last Updated: 2026-02-21 - SME Reviews Integrated*
