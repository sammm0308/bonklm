# ADR-001: Adapter Pattern for Framework Integration

**Status**: Active
**Date**: 2025-02-15
**Decision**: Adopt generic adapter pattern for LLM framework integration

---

## Context

BonkLM needed to integrate with multiple LLM frameworks and SDKs while maintaining a single, unified security validation core. The challenge was:

1. Frameworks have different request/response formats
2. Some support streaming, others don't
3. Type safety is important for TypeScript users
4. New frameworks are frequently released

### Options Considered

1. **Direct integration**: Write separate validation for each framework
2. **Wrapper pattern**: Wrap framework-specific clients
3. **Adapter pattern**: Generic interface with framework-specific implementations
4. **Middleware pattern**: HTTP-level interception only

## Decision

**Chose: Adapter pattern**

```typescript
interface GuardrailAdapter<TInput, TOutput, TContext> {
  initialize(context?: TContext): Promise<void>;
  validate(input: TInput): Promise<EngineResult>;
  transform(result: EngineResult): TOutput;
  destroy(): Promise<void>;
}

abstract class BaseAdapter<TInput, TOutput, TContext>
  implements GuardrailAdapter<TInput, TOutput, TContext> {
  protected engine: GuardrailEngine;

  constructor(engine: GuardrailEngine) {
    this.engine = engine;
  }

  // Common implementation
  abstract validate(input: TInput): Promise<EngineResult>;
  abstract transform(result: EngineResult): TOutput;
}
```

### Implementation Details

- **Generic types**: Each adapter specifies its input/output types
- **BaseAdapter**: Provides common functionality
- **AdapterBuilder**: Fluent configuration API
- **AdapterRegistry**: Manage multiple adapters

## Consequences

### Positive

- ✅ **Framework agnostic**: Works with any framework
- ✅ **Type-safe**: TypeScript generics ensure correctness
- ✅ **Extensible**: New adapters added without core changes
- ✅ **Testable**: Each adapter can be tested independently
- ✅ **Builder pattern**: Simplifies configuration

### Negative

- ❌ **Abstraction overhead**: Additional layer adds slight latency
- ❌ **Boilerplate**: Each adapter requires similar code
- ❌ **Learning curve**: Users must understand adapter concept

## Related Decisions

- [ADR-002: Hook System Design](./002-hook-system.md)
- [ADR-003: Validator vs Guard Separation](./003-validator-guard-separation.md)

## References

- Implementation: `/packages/core/src/adapters/types.ts`
- Example adapters: `/packages/openai-connector/`, `/packages/anthropic-connector/`
