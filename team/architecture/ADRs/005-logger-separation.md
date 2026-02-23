# ADR-005: Logger Package Separation

**Status**: Active
**Date**: 2026-02-20
**Decision**: Keep Attack Logger as separate package

---

## Context

The Attack Logger feature provides specialized security logging and attack awareness displays. The decision was whether to:

1. Include in core package (always available)
2. Separate package (optional dependency)
3. Framework-specific plugins (per-framework logging)

### Options Considered

1. **Core integration**: Always available, no setup
2. **Separate package**: Optional, users choose to install
3. **Plugin system**: Dynamic loading at runtime
4. **Callback-based**: Users provide their own logging

## Decision

**Chose: Separate package (`@blackunicorn/bonklm-logger`)**

### Implementation

```typescript
// Separate package
import { AttackLogger } from '@blackunicorn/bonklm-logger';

// Integration via intercept callback
const logger = new AttackLogger();
const engine = new GuardrailEngine({
  intercept: logger.onIntercept.bind(logger)
});
```

### Features

- **Attack history**: Stores recent validation results
- **Session tracking**: Correlates multi-turn attacks
- **Display formats**: Summary, table, JSON export
- **Retention policies**: Configurable limits and TTL
- **LRU cache**: Memory-efficient storage

## Consequences

### Positive

- ✅ **Optional dependency**: Not forced on users who don't need it
- ✅ **Specialized**: Focused on security logging, not general logging
- ✅ **Rich metadata**: Attack-specific information captured
- ✅ **Flexible**: Users can implement their own logging
- ✅ **Tree-shakeable**: Not included if not used

### Negative

- ❌ **Extra package**: Another package to maintain
- ❌ **Manual integration**: Users must explicitly add it
- ❌ **Discovery**: Users may not know it exists
- ❌ **Type duplication**: Some types duplicated from core (maintenance burden)

## Contrast with ADR-004

This decision **contrasts** with ADR-004 (CLI → Core merge):

- **CLI**: Merged into core because it had 100% overlap and was user-facing
- **Logger**: Kept separate because it's optional and specialized

## Security Considerations

- **PII sanitization**: Configurable PII redaction
- **File permissions**: Secure permissions (0o600, 0o700)
- **HMAC signatures**: Tamper-evident audit logging
- **Memory management**: LRU eviction prevents unbounded growth

## Related Decisions

- [ADR-004: CLI → Core Merge](./004-cli-core-merge.md) - Contrasting approach
- [ADR-002: Hook System Design](./002-hook-system.md) - Integration via intercept

## References

- Implementation: `/packages/logger/src/`
- Spec: `/team/implementation/ATTACK-LOGGER-SPECIFICATION.md`
