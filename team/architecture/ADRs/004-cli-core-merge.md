# ADR-004: CLI → Core Package Merge

**Status**: Complete
**Date**: 2026-02-19
**Decision**: Merge wizard CLI functionality into core package

---

## Context

The repository had two packages with overlapping functionality:

1. `@blackunicorn/bonklm` (core) - Guardrails engine
2. `@blackunicorn/bonklm-wizard` (wizard) - CLI setup wizard

Analysis showed:
- **100% feature parity**: All wizard functionality existed in core
- **Zero unique features**: No functionality unique to wizard
- **100% dependency overlap**: No unique dependencies in wizard
- **572 KB redundancy**: 24% bundle size overhead

### Options Considered

1. **Keep separate**: Maintain both packages
2. **Merge into core**: Move CLI to core, deprecate wizard
3. **Separate CLI package**: Create dedicated `@blackunicorn/bonklm-cli`
4. **Wizard → Plugin**: Make wizard an optional plugin

## Decision

**Chose: Merge into core and deprecate wizard package**

### Implementation

1. Moved all CLI functionality to `packages/core/src/cli/`
2. Updated CLI command to `bonklm` (from `llm-guardrails-wizard`)
3. Added deprecation notice to wizard package
4. Versioned wizard as `0.1.0-deprecated`

### Migration Path

```bash
# Old (deprecated)
llm-guardrails-wizard init

# New
bonklm init
# or
bonklm wizard  # wizard subcommand for backward compatibility
```

## Consequences

### Positive

- ✅ **Single package**: Users install `@blackunicorn/bonklm` for everything
- ✅ **Eliminated duplication**: DRY principle satisfied
- ✅ **Reduced bundle size**: Removed 572 KB of redundant code
- ✅ **Simplified maintenance**: One codebase to update
- ✅ **Backward compatible**: Wizard subcommand still works

### Negative

- ❌ **Larger core package**: Core package includes CLI code
- ❌ **Tree-shaking needed**: CLI code not used in library context
- ❌ **Migration required**: Users must update imports and commands
- ❌ **Documentation updates**: All references needed updating

## Related Decisions

- [ADR-005: Logger Package Separation](./005-logger-separation.md) - Contrasting decision

## References

- Disposition report: `/team/planning/wizard-package-disposition-report.md`
- CLI location: `/packages/core/src/cli/`
- Deprecated: `/packages/wizard/`
