# NestJS Module Security Review Report

**Package**: `@blackunicorn/bonklm-nestjs`
**Date**: 2026-02-21
**Status**: ✅ Review Complete
**Security Grade**: C+ (Needs Improvement)

---

## Files Reviewed

### Core Module Files
- `packages/nestjs-module/src/index.ts`
- `packages/nestjs-module/src/guardrails.module.ts`
- `packages/nestjs-module/src/guardrails.service.ts`
- `packages/nestjs-module/src/guardrails.interceptor.ts`
- `packages/nestjs-module/src/use-guardrails.decorator.ts`
- `packages/nestjs-module/src/types.ts`
- `packages/nestjs-module/src/constants.ts`

### Test Files
- `packages/nestjs-module/tests/guardrails.service.test.ts`
- `packages/nestjs-module/tests/use-guardrails.decorator.test.ts`

### Example Application
- `packages/nestjs-module/examples/nestjs-example/src/main.ts`
- `packages/nestjs-module/examples/nestjs-example/src/app.module.ts`
- `packages/nestjs-module/examples/nestjs-example/src/app.controller.ts`

---

## Security Findings

### P0 - Critical Issues

**P0-1: Insecure Request Metadata Extension**
- **Location**: `guardrails.interceptor.ts` lines 108-109
- **Issue**: The interceptor directly mutates the request object by adding `_guardrailsResults` and `_guardrailsValidated` properties without any validation or sanitization
- **Impact**: This can lead to prototype pollution if an attacker controls the request object
- **Code**:
  ```typescript
  request._guardrailsResults = [inputResult];
  request._guardrailsValidated = true;
  ```
- **Recommendation**: Use a Map or separate storage mechanism for metadata

### P1 - High Severity Issues

**P1-1: Potential Prototype Pollution via Custom Extractors**
- **Location**: `guardrails.interceptor.ts` lines 267-276, 307-316
- **Issue**: Custom extractor functions are called without proper sandboxing or validation
- **Impact**: If a custom extractor returns an object with malicious `__proto__`, it could compromise the application's prototype chain
- **Recommendation**: Implement deep cloning and sanitization for extractor results

**P1-2: JSON Stringification Without Error Handling**
- **Location**: `guardrails.interceptor.ts` lines 291-295, 335-339
- **Issue**: Fallback to JSON.stringify() can throw errors but they're not properly handled
- **Impact**: Could lead to unhandled rejections and application crashes
- **Recommendation**: Implement robust error handling with fallbacks

### P2 - Medium Severity Issues

**P2-1: Insufficient Request Size Validation**
- **Location**: `guardrails.interceptor.ts` lines 139-152
- **Issue**: Custom maxContentLength validation only checks for the specific endpoint's max length, but doesn't validate the actual size of the extracted content
- **Impact**: A request with many small fields could exceed memory limits
- **Recommendation**: Add validation of actual content size after extraction

**P2-2: Missing Input Validation in Decorator Options**
- **Location**: `use-guardrails.decorator.ts` lines 48-52
- **Issue**: The decorator accepts any object without validation of its structure or values
- **Impact**: Could lead to runtime errors if invalid options are provided
- **Recommendation**: Add runtime validation of decorator options

### P3 - Low Severity Issues

**P3-1: Type Assertion Without Validation**
- **Location**: `guardrails.interceptor.ts` lines 271, 311
- **Issue**: Uses `String(result)` without checking if `result` is actually a string-like object
- **Impact**: Could lead to unexpected behavior
- **Recommendation**: Add type checking before string conversion

**P3-2: Missing Rate Limiting**
- **Location**: Entire module
- **Issue**: No rate limiting mechanism is implemented for validation requests
- **Impact**: Could be exploited for DoS attacks
- **Recommendation**: Integrate with Nest rate limiting

---

## Best Practice Deviations

### NestJS Best Practices

| Practice | Status | Notes |
|----------|--------|-------|
| Module Structure | ✅ PASS | Well-structured module with clear separation |
| Dependency Injection | ⚠️ PARTIAL | Some @ts-ignore comments indicate poor handling |
| Interceptor Pattern | ✅ PASS | Proper use of NestJS interceptors |
| Decorator Usage | ⚠️ PARTIAL | Missing validation in decorator options |
| Error Handling | ❌ FAIL | No error boundaries for custom extractors |

### TypeScript Implementation Issues
- Multiple `@ts-ignore` comments indicate poor TypeScript handling
- Missing proper type guards for custom extractors
- Incomplete typing for request metadata extension

---

## Security Features Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Timeout Implementation | ✅ Implemented | Uses AbortController |
| Production Mode Error Handling | ✅ Implemented | Generic error messages |
| Content Size Limits | ✅ Implemented | Built-in protection |
| Path Traversal Protection | ⚠️ PARTIAL | Not fully implemented |
| Fail-Closed Behavior | ✅ Implemented | Validation errors block requests |

---

## Code Quality Assessment

### Strengths
- Clean architecture with clear separation of concerns
- Good use of NestJS dependency injection
- Comprehensive decorator pattern for route-level configuration

### Weaknesses
- Deep nesting in interceptor makes code hard to follow
- Magic numbers should be constants
- Missing JSDoc documentation for private methods
- Limited test coverage for edge cases

---

## Recommendations

### Immediate Actions Required (P0)

1. **Fix Prototype Pollution (P0-1)**:
   ```typescript
   // Instead of mutating request
   const metadata = new Map();
   metadata.set('guardrailsResults', [inputResult]);
   metadata.set('guardrailsValidated', true);
   ```

2. **Implement Safe Stringification (P1-2)**:
   ```typescript
   function safeStringify(obj: any): string {
     try {
       return JSON.stringify(obj);
     } catch {
       return '[Invalid JSON]';
     }
   }
   ```

### High Priority (P1)

3. **Add Input Validation** (P2-2):
   ```typescript
   function validateDecoratorOptions(options: unknown): void {
     if (typeof options !== 'object' || options === null) {
       throw new Error('Options must be an object');
     }
   }
   ```

4. **Implement Sanitization for Custom Extractors** (P1-1):
   ```typescript
   function sanitizeExtractorResult(result: any): string {
     const cloned = deepClone(result);
     return String(cloned ?? '');
   }
   ```

### Medium Priority (P2)

5. Add comprehensive error handling boundaries
6. Add actual content size validation after extraction
7. Implement rate limiting integration

---

## Conclusion

The NestJS module demonstrates good architectural patterns but has several security vulnerabilities that need immediate attention, particularly the prototype pollution issue (P0-1) in the interceptor. The module would benefit from additional security hardening and improved error handling mechanisms.

The presence of P0 issues indicates this package needs security remediation before production use.

**Security Grade: C+ (Needs Improvement)**
