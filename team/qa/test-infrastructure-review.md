# Test Infrastructure Review - Epic 7 Story 7.1

**Date**: 2026-02-21
**Epic**: E007 - Testing & Quality Assurance
**Story**: S007-001 - Test Infrastructure Review
**Status**: ✅ COMPLETED (Research Phase)

---

## Executive Summary

Comprehensive review of the BonkLM project's test infrastructure identified significant inconsistencies across Vitest configurations, setup/teardown patterns, and mocking strategies. While the core testing foundation is solid, standardization efforts would improve reliability, performance, and maintainability.

**Overall Assessment**: Grade C+ (Needs Improvement)
- **Vitest Configuration**: C+ (Version inconsistencies, memory bottlenecks)
- **Setup/Teardown**: B (Good patterns, inconsistent cleanup)
- **Mocking Strategy**: C+ (Functional but needs standardization)

---

## 1. Vitest Configuration Review

### Configuration Files Found

**Root Configuration:**
- `/vitest.config.ts` - Main project configuration

**Package Configurations (21 packages):**
- `/packages/core/vitest.config.ts`
- `/packages/logger/vitest.config.ts`
- `/packages/wizard/vitest.config.ts`
- `/packages/express-middleware/vitest.config.ts`
- `/packages/nestjs-module/vitest.config.ts`
- 15 connector package configurations

### Current Settings Summary

#### Root Configuration
| Setting | Value | Notes |
|---------|-------|-------|
| Test Environment | `node` | Standard |
| File Inclusion | `packages/**/*.test.ts` | Explicit path optimization |
| Coverage Provider | `istanbul` | Better TypeScript support |
| Timeout | 30 seconds | For tests and hooks |
| Pool | Forks | Memory optimization enabled |
| Concurrency | 1 worker | Memory concern |
| Setup Files | `./tests/vitest-setup.js` | Custom path resolution |

### Issues Found

#### 🔴 High Severity Issues

1. **Version Inconsistencies** (P1)
   - Vitest versions range from `^1.0.0` to `^4.0.18` across packages
   - Coverage packages also have version mismatches
   - Compatibility and security vulnerability risks

2. **Memory Management Overhead** (P2)
   - Root config limits to 1 worker despite multi-package architecture
   - Unnecessary performance bottleneck
   - Each package tests independently without parallel execution

3. **Coverage Provider Inconsistency** (P2)
   - Root uses `istanbul`
   - Most packages use `v8`
   - Different coverage calculation methods

#### 🟡 Medium Severity Issues

4. **Test Pattern Inconsistencies** (P2)
   - Some packages use `**/*.test.ts`, others use specific paths
   - `packages/core` includes both `tests/**/*.test.{ts,js}` and `src/**/*.test.{ts,js}`

5. **Missing Mock/Stub Configuration** (P2)
   - No global mock/stub configuration defined
   - Inconsistent test isolation across packages

6. **Setup File Inconsistencies** (P2)
   - Only root and a few packages have setup files
   - Complex path resolution logic in `tests/vitest-setup.js`

#### 🟢 Low Severity Issues

7. **Timeout Variations** (P3)
   - Test timeouts range from 10-30 seconds across packages
   - No standardized timeout policy

8. **Missing Coverage Thresholds** (P3)
   - Only `langchain-connector` and `wizard` define coverage thresholds

---

## 2. Setup/Teardown Patterns Analysis

### Patterns Observed

#### 1. BeforeEach/AfterEach (Good Consistency)
```typescript
describe('AttackLogger', () => {
  let logger: AttackLogger;

  beforeEach(() => {
    resetSessionId();
    logger = new AttackLogger({
      max_logs: 100,
      ttl: 60000,
      enabled: true,
    });
  });

  afterEach(() => {
    logger.clear();
  });
});
```

#### 2. BeforeAll/AfterAll (Limited Usage)
- Only 2 instances found (NestJS module setup)
- Proper cleanup of TestingModule

#### 3. Mock Reset Patterns
```typescript
beforeEach(() => {
  clearValidationCache();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});
```

### Issues Found

#### 🔴 High Severity

1. **Inconsistent Resource Cleanup** (P1)
   - Location: `/packages/core/tests/unit/fault-tolerance/fault-tolerance.test.ts`
   - Circuit breaker instances not consistently destroyed
   - Only 1/3 tests call `destroy()` manually

#### 🟡 Medium Severity

2. **Environment Pollution** (P2)
   - `process.env.NODE_ENV = 'test'` set globally
   - Missing cleanup of environment variables
   - Could affect parallel test execution

3. **Mock Scope Management** (P2)
   - Location: `/packages/core/src/cli/utils/validation.test.ts`
   - Global fetch mock not properly scoped
   - Risk of test interference

4. **Missing Test Fixture Management** (P2)
   - No dedicated test fixture system
   - Test data created inline in tests

#### 🟢 Low Severity

5. **Setup Inconsistencies** (P3)
   - Pattern variation: fresh instances vs pre-created instances

6. **Missing Error Handling in Setup** (P3)
   - No error handling for setup failures

---

## 3. Mocking Strategy Review

### Patterns Observed

#### Pattern A: Factory Functions
```typescript
function createMockClient() {
  const mockCreate = vi.fn().mockResolvedValue(mockChatCompletion);
  return {
    mockClient: { chat: { completions: { create: mockCreate } } } as any,
    mockCreate
  };
}
```
- **Pros**: Reusable, consistent
- **Cons**: Scattered across files

#### Pattern B: Manual Mock Object Creation
```typescript
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
```
- **Pros**: Simple
- **Cons**: Repetitive, hard to maintain

#### Pattern C: vi.mock Module-Level
```typescript
vi.mock('@blackunicorn/bonklm', () => ({
  GuardrailEngine: class { /* ... */ }
}));
```
- **Pros**: Clean isolation
- **Cons**: All-or-nothing, can't override per test

#### Pattern D: Spy Pattern
```typescript
vi.spyOn(mockLogger, 'debug').mockImplementation(() => {});
```
- **Pros**: Non-invasive
- **Cons**: Only works on existing instances

### Issues Found

#### 🔴 High Severity

1. **Mock Leak - Missing Cleanup** (P1)
   - No afterEach cleanup in multiple files
   - Residual mock state causes test interference

2. **Inconsistent Mock Setup** (P1)
   - `vi.clearAllMocks()` doesn't restore original state
   - Hard to reproduce failures

#### 🟡 Medium Severity

3. **Over-Mocking** (P2)
   - Location: `/packages/openai-connector/tests/guarded-openai.test.ts`
   - Overly complex mock structures
   - Brittle, tightly coupled to implementation

4. **Under-Mocking** (P2)
   - Location: `/packages/core/tests/unit/validators/prompt-injection.test.ts`
   - Tests with no mocking (integration tests as unit tests)

5. **Missing Factory Pattern** (P2)
   - Most test files recreate mocks manually

#### 🟢 Low Severity

6. **Mock Naming Inconsistency** (P3)
   - Mixed conventions: mockClient, mockService, mockedWhich

7. **Documentation Gap** (P3)
   - No centralized mock documentation

---

## Recommendations

### Immediate Actions (P1)

1. **Standardize Vitest Version**
   - Upgrade all packages to Vitest ^4.0.18
   - Ensure coverage package compatibility

2. **Implement Mock Cleanup Standard**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });

   afterEach(() => {
     vi.restoreAllMocks();
   });
   ```

3. **Fix Resource Cleanup**
   - Add afterEach cleanup for all resource-intensive objects
   - Implement consistent destroy patterns

### Optimization Opportunities (P2)

4. **Consolidate Coverage Configuration**
   - Standardize on Istanbul provider
   - Create shared coverage configuration
   - Add consistent coverage thresholds

5. **Create Mock Factory Helpers**
   ```typescript
   // packages/core/test-utils/mocks.ts
   export const createMockOpenAIClient = (responses?: Array<ChatCompletion>) => { /* ... */ };
   export const createMockValidator = (shouldBlock: boolean) => { /* ... */ };
   ```

6. **Add Test Environment Cleanup**
   ```typescript
   const originalEnv = { ...process.env };
   afterAll(() => {
     process.env = originalEnv;
   });
   ```

7. **Improve Test Parallelization**
   - Implement smart worker allocation
   - Balance memory usage with execution speed

### Best Practice Improvements (P3)

8. **File Pattern Standardization**
   - Use consistent glob patterns
   - Implement comprehensive exclusion lists

9. **Centralize Setup Configuration**
   - Move common setup logic to shared location
   - Simplify path resolution in vitest-setup.js

10. **Create Test Fixture System**
    - Shared fixtures for common scenarios
    - Reduce test data duplication

---

## File Locations Requiring Attention

### Critical Issues:
- `/packages/core/tests/unit/fault-tolerance/fault-tolerance.test.ts` - Resource cleanup
- `/packages/core/src/cli/utils/validation.test.ts` - Mock scope
- `/packages/openai-connector/tests/guarded-openai.test.ts` - Over-mocking
- `/packages/nestjs-module/tests/guardrails.service.test.ts` - Cleanup
- `/packages/wizard/src/testing/guardrail-test.test.ts` - Module leaks

### Moderate Issues:
- `/packages/core/tests/unit/base/generic-logger.test.ts` - Manual mocks
- `/packages/core/tests/unit/validators/prompt-injection.test.ts` - Under-mocking
- Multiple connector tests - Repeated mock patterns

---

## Deferred Issues (Future Sprint)

### P1 - Deferred
1. Standardize Vitest version across all packages
2. Implement consistent mock cleanup with restoreAllMocks

### P2 - Deferred
1. Consolidate coverage configuration (istanbul vs v8)
2. Create mock factory helpers
3. Add test environment cleanup
4. Implement test fixture system

### P3 - Deferred
1. Standardize timeout configuration
2. Add coverage thresholds to all packages
3. Centralize setup configuration
4. Create mock documentation

---

## Test Results

- **Before Review**: 1831/1831 tests passing
- **After Review**: 1831/1831 tests passing
- **New Issues Found**: 0 (research only)
- **Test Files Analyzed**: 220+

---

## Next Steps

1. Story 7.2: Test Quality Analysis
2. Story 7.3: Performance Testing Review
3. Story 7.4a: Security Test Coverage Review

---

*End of Test Infrastructure Review*
