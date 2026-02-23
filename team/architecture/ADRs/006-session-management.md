# ADR-006: In-Memory Session Management

**Status**: Active
**Date**: 2025-02-16
**Decision**: Use in-memory session tracking with temporal decay

---

## Context

Multi-turn attacks can bypass single-turn validation:

1. **Gradual escalation**: Slowly increase suspicious content over turns
2. **Fragmented injection**: Split attacks across multiple requests
3. **Many-shot attacks**: Overwhelm with multiple similar requests
4. **Slow-drip attacks**: Low-intensity threats over time

A session tracking system was needed to detect these patterns.

### Options Considered

1. **No session tracking**: Each request validated independently
2. **In-memory sessions**: Store in process memory (current)
3. **Persistent sessions**: Store in database/Redis
4. **Client-side tokens**: Client maintains session state
5. **Hybrid approach**: In-memory with optional persistence

## Decision

**Chose: In-memory session tracking with temporal decay**

```typescript
class SessionTracker {
  private store = new LRUCache<string, SessionData>({
    max: 10_000,
    ttl: 3_600_000  // 1 hour
  });

  // Temporal decay: 10-minute half-life
  private decayScore(score: number, ageMs: number): number {
    const halfLifeMs = 600_000;  // 10 minutes
    return score * Math.pow(0.5, ageMs / halfLifeMs);
  }
}
```

### Features

- **LRU eviction**: 10,000 session limit
- **Temporal decay**: 10-minute half-life for scores
- **Timeout**: 1-hour session expiration
- **Multi-turn detection**: Category repetition, accumulated weight, fragment injection
- **Many-shot detection**: Pattern frequency analysis
- **Slow-drip detection**: Temporal pattern analysis

## Consequences

### Positive

- ✅ **Memory efficient**: LRU + TTL prevents unbounded growth
- ✅ **Fast**: In-memory lookups, no network I/O
- ✅ **Detects sophisticated attacks**: Multi-turn patterns identified
- ✅ **Low false positives**: Temporal decay reduces old signal
- ✅ **No infrastructure**: No database needed

### Negative

- ❌ **No persistence**: Sessions lost on restart
- ❌ **Single-process**: Doesn't scale across multiple instances
- ❌ **Memory usage**: Consumes memory for active sessions
- ❌ **No cross-server**: Can't track sessions across load balancers

## Attack Detection Patterns

| Pattern | Detection |
|---------|-----------|
| **Category repetition** | Same category appearing frequently |
| **Accumulated weight** | Total risk score exceeds threshold |
| **Fragment injection** | Incomplete attack patterns across turns |
| **Many-shot** | High frequency of similar requests |
| **Slow-drip** | Low-level threats over extended time |

## Future Enhancements

Potential additions for future versions:

1. **Optional persistence**: Redis/database backend
2. **Distributed tracking**: Cross-instance session sharing
3. **Configurable decay**: Adjustable half-life per deployment
4. **Session export**: Import/export for analysis

## Related Decisions

- [ADR-002: Hook System Design](./002-hook-system.md) - Integration with hooks
- [ADR-005: Logger Package Separation](./005-logger-separation.md) - Logger integration

## References

- Implementation: `/packages/core/src/session/SessionTracker.ts`
- Security review: `/team/security/epic2-stories-2.7-2.12-audit.md`
