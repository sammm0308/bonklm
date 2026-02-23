# ADR-002: Hook System Design

**Status**: Active
**Date**: 2025-02-15
**Decision**: Implement priority-based hook system with VM sandboxing

---

## Context

Users needed to extend BonkLM's behavior without modifying the core codebase. Requirements:

1. Execute custom logic at specific points in validation flow
2. Allow blocking responses based on custom criteria
3. Transform validation results
4. Isolate hook execution for security

### Options Considered

1. **Event emitter**: Node.js style event system
2. **Middleware chain**: Express-like middleware array
3. **Plugin system**: Loadable plugins with lifecycle hooks
4. **Priority hooks**: Ordered callbacks with sandboxing

## Decision

**Chose: Priority-based hook system with VM isolation**

```typescript
enum HookPhase {
  BEFORE_VALIDATION = 'before_validation',
  AFTER_VALIDATION = 'after_validation',
  BEFORE_BLOCK = 'before_block',
  AFTER_ALLOW = 'after_allow'
}

interface Hook {
  phase: HookPhase;
  priority?: number;  // Lower number = higher priority
  timeout?: number;   // Max execution time (ms)
  callback: HookCallback;
}

class HookSandbox {
  execute(code: string, context: SandboxContext): Promise<SandboxResult>;
}
```

### Implementation Details

- **4 execution phases**: Before/after validation, before block, after allow
- **Priority-based**: Lower number = earlier execution
- **Individual timeouts**: Default 30s per hook
- **VM isolation**: Hooks execute in restricted VM context
- **Helper functions**: `createBlockingHook`, `createTransformHook`

## Consequences

### Positive

- ✅ **Extensible**: Users can add custom logic without core changes
- ✅ **Timeout protection**: Prevents infinite loops/hangs
- ✅ **Priority control**: Critical hooks execute first
- ✅ **Isolated**: VM sandbox protects against malicious hooks
- ✅ **Flexible**: Can block, transform, or just observe

### Negative

- ❌ **Performance impact**: Hook execution adds latency
- ❌ **Complexity**: Harder to debug with async hooks
- ❌ **VM overhead**: Sandboxing has performance cost
- ❌ **Context limits**: VM has restricted access to Node.js APIs

## Security Considerations

- **VM isolation**: No access to file system, network, or process
- **Memory limits**: 50MB default per hook execution
- **Timeout enforcement**: 30s default, configurable
- **Dangerous pattern detection**: Blocks certain API usage

## Related Decisions

- [ADR-001: Adapter Pattern](./001-adapter-pattern.md)
- [ADR-005: Logger Package Separation](./005-logger-separation.md)

## References

- Implementation: `/packages/core/src/hooks/`
- Sandbox: `/packages/core/src/hooks/HookSandbox.ts`
