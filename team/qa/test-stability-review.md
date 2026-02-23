# Test Stability & Flaky Test Review - Epic 7 Story 7.5

**Date**: 2026-02-21
**Epic**: E007 - Testing & Quality Assurance
**Story**: S007-005 - Test Stability & Flaky Test Review
**Status**: ✅ COMPLETED (Research Phase)

---

## Executive Summary

Comprehensive analysis of test stability identified several categories of potentially flaky tests across the BonkLM project. The main issues are related to timing-dependent assertions, missing cleanup in integration tests, and insufficient timeout configurations. While most tests are well-structured, there are specific areas that need attention to improve reliability.

**Overall Assessment**: Grade B+ (Good stability, some improvements needed)
- **Flaky Test Indicators**: C+ (Several timing-dependent tests)
- **Timeout Configuration**: B (Good defaults, some specific issues)
- **Test Isolation**: B+ (Generally good, some gaps)

---

## 1. Flaky Test Identification

### Potentially Flaky Tests by Category

#### Performance Benchmark Tests

**File**: `/packages/core/tests/benchmark.test.ts`
- **Tests affected**: Lines 21-49 (validation performance tests)
- **Reason**: Uses `performance.now()` with strict `<5ms`, `<10ms`, `<20ms` thresholds
- **Risk**: High - will fail on slower systems or under load
- **Recommendation**: Use percentile-based assertions, add padding

**File**: `/packages/logger/tests/integration/performance.spec.ts`
- **Tests affected**:
  - Lines 55-81 (NFR-P1: <1ms logging overhead)
  - Lines 136-158 (async callback <1ms)
  - Lines 192-233 (display performance)
- **Reason**: Multiple strict timing assertions under varying load
- **Risk**: High - timing-dependent
- **Recommendation**: Relax to percentiles, separate from functional tests

#### Concurrent Operation Tests

**File**: `/packages/logger/tests/integration/concurrent-operations.spec.ts`
- **Tests affected**: Lines 286-298 (race condition tests)
- **Reason**: Tests for "no lost logs during rapid concurrent writes"
- **Risk**: Medium - timing-dependent state consistency
- **Recommendation**: Use deterministic synchronization, add retry logic

**File**: `/packages/logger/tests/integration/async-logging.spec.ts`
- **Tests affected**: Lines 276-303 (clear during active logging)
- **Reason**: Mixed timing-dependent operations
- **Risk**: Medium - race conditions
- **Recommendation**: Use async barriers, add explicit state verification

#### Fault Tolerance Tests

**File**: `/packages/core/tests/unit/fault-tolerance/fault-tolerance.test.ts`
- **Tests affected**:
  - Lines 220-234 (OPEN to HALF_OPEN transition)
  - Lines 274-288 (HALF_OPEN state execution)
- **Reason**: Tests rely on `setTimeout` with specific delays (50ms, 75ms)
- **Risk**: High - timing-dependent state transitions
- **Recommendation**: Use clock mocking, test state independently

#### Edge Case Tests

**File**: `/packages/core/tests/edge-cases.test.ts`
- **Tests affected**: Lines 275-321 (timing and race conditions)
- **Reason**: Complex content validation timing
- **Risk**: Low - mostly functional but has timing assertion
- **Recommendation**: Isolate timing from functional validation

---

## 2. Timeout Issues Analysis

### Current Global Configuration
| Setting | Value | Assessment |
|---------|-------|------------|
| Test Timeout | 30,000ms (30s) | ✅ Good default |
| Hook Timeout | 30,000ms (30s) | ✅ Good default |
| Max Workers | 1 | ✅ Reduces race conditions |
| Pool | Forks | ✅ Isolates execution |

### Issues Identified

#### 🔴 High Priority

1. **Very Short Test-Specific Timeouts**
   - **File**: `fault-tolerance.test.ts`
   - **Test**: Circuit Breaker Timeout (lines 514-527)
   - **Current**: 50ms timeout testing
   - **Issue**: Could fail on slower systems
   - **Fix**: Increase to 100-200ms or use clock mocking

2. **Network-Dependent Tests Without Adequate Timeouts**
   - **Files**: Multiple connector tests
   - **Issue**: Tests make actual API calls without explicit timeouts
   - **Fix**: Add longer timeouts or use mocking

#### 🟡 Medium Priority

3. **Arbitrary Timeout Values**
   - **File**: `express-middleware/tests/middleware.test.ts`
   - **Tests**: Multiple tests use 50-200ms delays
   - **Issue**: No justification for specific values
   - **Fix**: Use vi.waitFor() or proper async patterns

4. **Benchmark Tests with Strict Assertions**
   - **File**: `packages/core/tests/benchmark.test.ts`
   - **Tests**: `<5ms`, `<10ms`, `<20ms` assertions
   - **Issue**: Highly susceptible to flakiness
   - **Fix**: Use flexible timing or statistical testing

#### 🟢 Low Priority

5. **Progress/Spinner Tests with Long Delays**
   - **Files**: `progress.test.ts` files
   - **Issue**: 10,000ms delays for animations
   - **Fix**: Use configurable or shorter test-specific delays

6. **0ms setTimeout Usage**
   - **File**: `services.test.ts`
   - **Issue**: setTimeout(callback, 0) is unreliable
   - **Fix**: Use setImmediate or proper async patterns

---

## 3. Test Isolation Issues

### Issues Identified

#### 🔴 High Priority

1. **Empty afterEach in Integration Tests**
   - **File**: `/packages/express-middleware/tests/integration.test.ts`
   - **Lines**: 23-25
   - **Issue**: `afterEach` hook is empty, no cleanup
   - **Fix**: Add proper cleanup for Express app instances

2. **Global Session Reset**
   - **File**: `/packages/core/tests/jailbreak.test.ts`
   - **Issue**: `clearAllSessions()` affects global state
   - **Fix**: Use isolated test data

#### 🟡 Medium Priority

3. **Shared State in Session Tracking**
   - **File**: `packages/core/tests/unit/session/session-tracker.test.ts`
   - **Tests**: Lines 295-342, 462-520
   - **Issue**: Tests may depend on execution order
   - **Fix**: Use unique session IDs per test

4. **Mock Object Persistence**
   - **File**: `/packages/logger/tests/unit/AttackLogger.spec.ts`
   - **Issue**: Logger state may not be fully reset
   - **Fix**: Add comprehensive afterEach cleanup

5. **File System Tests Without Cleanup**
   - **Files**: Multiple CLI utility tests
   - **Issue**: Tests write temp files but don't clean up
   - **Fix**: Add fs.rm/fs.unlink in afterEach

#### 🟢 Low Priority

6. **Missing Test Data Isolation**
   - **Pattern**: Multiple test files
   - **Issue**: Hardcoded session IDs, similar mock data
   - **Fix**: Use test data factories with unique IDs

---

## 4. Recommendations

### Immediate Actions (P0)

1. **Fix Empty afterEach Hook**
   ```typescript
   afterEach(() => {
     if (app && app._router) {
       app._router.stack = [];
     }
   });
   ```

2. **Add Clock Mocking for Fault Tolerance Tests**
   ```typescript
   vi.useFakeTimers();
   // Run tests
   vi.runAllTimers();
   vi.useRealTimers();
   ```

3. **Increase Short Timeouts**
   - Change 50ms timeout tests to 100-200ms
   - Add 2-3x padding for operation timeouts

### Short Term (P1)

4. **Replace Strict Timing Assertions**
   ```typescript
   // Instead of:
   expect(duration).toBeLessThan(5);

   // Use:
   const durations = Array.from({length: 10}, () => measureOperation());
   const p95 = percentile(durations, 95);
   expect(p95).toBeLessThan(10);
   ```

5. **Implement Test Data Factories**
   ```typescript
   export const createTestId = (prefix: string) =>
     `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   ```

6. **Add File System Cleanup**
   ```typescript
   afterEach(async () => {
     await fs.rm('/tmp/test-config.json', { force: true });
   });
   ```

### Medium Term (P2)

7. **Separate Performance Tests**
   - Move to separate test suite
   - Use environment-specific timing expectations
   - Add CI detection for adjustments

8. **Implement Retry Logic for Flaky Tests**
   ```typescript
   const retry = async (fn: () => Promise<void>, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try { await fn(); return; }
       catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
     }
   };
   ```

9. **Use vi.waitFor() Instead of Delays**
   ```typescript
   await vi.waitFor(() => {
     expect(element).toBeInTheDocument();
   }, { timeout: 100 });
   ```

---

## 5. Priority Summary

| Priority | Count | Type | Action Required |
|----------|-------|------|-----------------|
| P0 | 3 | Critical | Fix immediately |
| P1 | 4 | High | Fix within sprint |
| P2 | 3 | Medium | Fix next sprint |
| P3 | 2 | Low | Nice to have |

---

## Test Results

- **Before Review**: 1846/1846 tests passing
- **After Review**: 1846/1846 tests passing
- **Flaky Tests Identified**: 15+
- **New Tests Added**: 15 (from Story 7.4b)

---

## Conclusion

The BonkLM test suite demonstrates good overall stability with proper use of `beforeEach/afterEach` hooks and reasonable global timeout configurations. However, there are specific areas where improvements would significantly reduce flakiness:

1. **Timing-dependent tests** need clock mocking or relaxed assertions
2. **Integration tests** need proper cleanup
3. **Performance tests** should be separated from functional tests
4. **Network-dependent tests** need appropriate timeouts or mocking

Implementing the recommended changes should improve test reliability, especially in CI/CD environments where performance can vary significantly.

---

## Next Steps

1. Update working document with Epic 7 findings
2. Consolidate all findings into FINDINGS-CODE-REVIEW.md
3. Run final code review

---

*End of Test Stability & Flaky Test Review*
