# ADR-003: Validator vs Guard Separation

**Status**: Active
**Date**: 2025-02-15
**Decision**: Separate validators (content-based) from guards (context-aware)

---

## Context

Different security checks require different approaches:

1. **Content-based checks**: Only need the text content (prompt injection, jailbreak)
2. **Context-aware checks**: Need additional context (file paths, environment, metadata)

A single interface would be awkward for both use cases.

### Options Considered

1. **Single interface**: One `validate()` method with optional context
2. **Validator/Guard separation**: Two distinct interfaces
3. **Strategy pattern**: Different strategies for different check types
4. **Decorator pattern**: Wrap base validators with context

## Decision

**Chose: Separate Validator and Guard interfaces**

```typescript
// Content-based validation
interface Validator {
  name?: string;
  validate(content: string): GuardrailResult;
}

// Context-aware validation
interface Guard {
  name?: string;
  validate(content: string, context?: string): GuardrailResult;
}
```

### Execution Order

```
User Request
    │
    ▼
Validators (content-only, fast)
    │
    ▼
Guards (context-aware, may be slower)
    │
    ▼
Result
```

### Validators (Content-Based)

- `PromptInjectionValidator` - Detect prompt injection patterns
- `JailbreakValidator` - Detect jailbreak attempts
- `ReformulationDetector` - Detect query reformulation
- `BoundaryDetector` - Detect boundary testing
- `MultilingualPatterns` - Multi-language pattern detection

### Guards (Context-Aware)

- `SecretGuard` - Detect API keys, secrets (context: file path for bypass)
- `PIIGuard` - Detect PII (context: file type for test data bypass)
- `BashSafetyGuard` - Detect command injection (context: shell environment)
- `XSSSafetyGuard` - Detect XSS patterns
- `ProductionGuard` - Detect dangerous operations in production

## Consequences

### Positive

- ✅ **Clear separation**: Different interfaces for different purposes
- ✅ **Performance**: Validators run first for quick rejection
- ✅ **Context flexibility**: Guards can use or ignore context
- ✅ **Extensibility**: Easy to add new validators or guards
- ✅ **Type safety**: TypeScript knows which accepts context

### Negative

- ❌ **Learning curve**: Users must understand when to use each
- ❌ **Interface bloat**: Two interfaces instead of one
- ❌ **Registration complexity**: Must register validators and guards separately

## Related Decisions

- [ADR-002: Hook System Design](./002-hook-system.md)
- [ADR-006: Session Management](./006-session-management.md)

## References

- Validators: `/packages/core/src/validators/`
- Guards: `/packages/core/src/guards/`
- Engine: `/packages/core/src/engine/GuardrailEngine.ts` lines 324-342
