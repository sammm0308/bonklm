# ADR-007: Logger Package Type Sharing Strategy

**Status**: Proposed
**Date**: 2026-02-22
**Decision**: Import types from core package for logger package

---

## Context

The `@blackunicorn/bonklm-logger` package has duplicate type definitions that exist in `@blackunicorn/bonklm/core`. This creates maintenance burden and potential for drift.

### Duplicate Types Identified

1. **Severity enum**
   - Logger: `'info' | 'warning' | 'blocked' | 'critical'` (literal union)
   - Core: `enum { INFO = "info", WARNING = "warning", BLOCKED = "blocked", CRITICAL = "critical" }`

2. **RiskLevel enum**
   - Logger: `'LOW' | 'MEDIUM' | 'HIGH'` (literal union)
   - Core: `enum { LOW = "LOW", MEDIUM = "MEDIUM", HIGH = "HIGH" }`

3. **Finding interface**
   - Logger has same properties as core's Finding interface
   - Core: Base Finding interface with category, pattern_name, severity, etc.

4. **EngineResult interface**
   - Logger: Simplified version of core's GuardrailResult
   - Core: GuardrailResult interface with similar structure

### Current Coupling Analysis

The logger package imports from core package at 121 locations, indicating existing tight coupling. The logger is designed to intercept and log guardrail validation results which are core types.

---

## Options Considered

### Option A: Import from Core (Tight Coupling)

**Description**: Logger imports all shared types from `@blackunicorn/bonklm/core`

```typescript
// In logger package
import type { Finding, GuardrailResult, RiskLevel } from '@blackunicorn/bonklm/core';

export type EngineResult = GuardrailResult; // Alias for compatibility
```

**Pros**:
- ✅ Single source of truth for shared types
- ✅ Eliminates duplication and potential drift
- ✅ Smaller bundle size for logger package
- ✅ Easier maintenance - changes propagate automatically
- ✅ Type consistency across packages

**Cons**:
- ❌ Creates circular dependency risk if logger needs to export core types
- ❌ Breaking changes in core would affect logger semver
- ❌ Logger package becomes more dependent on core structure
- ❌ May need to export more internal types from core

### Option B: Keep Duplicate Types (Loose Coupling)

**Description**: Maintain separate type definitions in each package

**Pros**:
- ✅ Independent packages with no circular dependencies
- ✅ Logger can evolve its own type system
- ✅ Core changes don't break logger semver
- ✅ Cleaner API boundaries

**Cons**:
- ❌ Type duplication and potential drift
- ❌ Inconsistent enum representations (string literals vs enums)
- ❌ Maintenance burden - changes need to be made in multiple places
- ❌ Confusion for users about which types to use
- ❌ Larger bundle sizes

### Option C: Create Shared Types Package

**Description**: Create `@blackunicorn/bonklm-types` package for shared types

**Pros**:
- ✅ Single source of truth
- ✅ Clear separation of concerns
- ✅ Independent versioning for types
- ✅ Other packages can use shared types if needed
- ✅ Reduces coupling between logger and core

**Cons**:
- ❌ Adds another package to the monorepo
- ❌ Additional build and deployment complexity
- ❌ May be overkill for just 2 packages
- ❌ Users now need to install one more dependency
- ❌ Package boundaries may become unclear

---

## Decision

**Chose: Option A - Import from Core**

### Rationale

1. **Logger is fundamentally dependent on core**: The logger is designed to intercept and log guardrail validation results, which are core types. It doesn't make sense to have separate definitions.

2. **Type consistency is critical**: The logger uses the same data structures that core produces. Keeping them identical ensures no data transformation or interpretation issues.

3. **Simpler API for users**: When users install both packages, they get consistent types without having to choose which version to use.

4. **Maintenance efficiency**: With the current tight coupling (121 import sites), the packages are already closely coupled. Formalizing this relationship through shared types is more honest and easier to maintain.

5. **Enum vs string literal unification**: The core should export string literal types instead of enums for better TypeScript compatibility, which logger can then use consistently.

---

## Implementation Strategy

1. **Update core package exports**: Ensure all necessary types are exported from `packages/core/src/base/index.ts`

2. **Convert core enums to string literal types**: Change from `enum` to `type` for better compatibility
   ```typescript
   // Before
   export enum RiskLevel { LOW = "LOW", MEDIUM = "MEDIUM", HIGH = "HIGH" }

   // After
   export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
   ```

3. **Update logger package imports**: Replace duplicate type definitions with imports from core
   ```typescript
   import type { Finding, GuardrailResult, RiskLevel, Severity } from '@blackunicorn/bonklm/core';
   ```

4. **Create compatibility aliases**: Maintain backward compatibility with existing logger APIs
   ```typescript
   export type EngineResult = GuardrailResult;
   ```

5. **Remove duplicate definitions**: Delete duplicate types from logger package

6. **Add peer dependency**: Ensure logger specifies core as peer dependency in package.json

---

## Consequences

### Positive

- ✅ Eliminates type duplication
- ✅ Single source of truth
- ✅ Automatic type updates
- ✅ Smaller bundle size
- ✅ Consistent API

### Negative

- ❌ Breaking change for logger users (major version bump required)
- ❌ Logger semver tied to core changes
- ❌ Need to coordinate releases between packages

---

## Migration Guide

### For Logger Users

No code changes required for most users. The types are compatible:

```typescript
// Before and After - same usage
import { AttackLogger } from '@blackunicorn/bonklm-logger';

const logger = new AttackLogger();
// logger.getSummary() returns same structure
```

### For Logger Maintainers

When updating logger:

1. Check core package version for breaking changes
2. Update peer dependency range if needed
3. Run tests to verify type compatibility

---

## Related Decisions

- [ADR-005: Logger Package Separation](./005-logger-separation.md)
- [ADR-001: Adapter Pattern](./001-adapter-pattern.md)

## References

- Logger types: `/packages/logger/src/types.ts`
- Core types: `/packages/core/src/base/index.ts`
- Implementation epic: E014 S014-006
