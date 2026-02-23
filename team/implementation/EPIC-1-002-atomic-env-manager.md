# Story 1.2: Atomic EnvManager

Status: completed

**Epic:** EPIC-1 - Security Foundation
**Priority:** P0 (Blocking)
**Points:** 5
**Files:** `src/config/env.ts`, `src/config/permissions.ts`

## Story

As a security-focused developer,
I want an EnvManager that reads, merges, and writes .env files atomically with secure permissions,
so that credential storage is safe from race conditions and unauthorized access.

## Acceptance Criteria

1. Read .env files and parse with dotenv
2. Merge new entries with existing (preserve user entries)
3. Write atomically (temp file → rename)
4. Set platform-aware permissions (0o600 on Unix, icacls on Windows)
5. Verify permissions after write
6. Handle missing .env gracefully (create new)
7. All tests pass with 90% coverage

## Tasks / Subtasks

- [x] Create EnvManager class (AC: 1, 6)
  - [x] Constructor accepts optional path (default: '.env')
  - [x] read() method: parse .env with dotenv
  - [x] Handle missing .env (return empty object)
- [x] Implement write() method with merge (AC: 2)
  - [x] Read existing entries via read()
  - [x] Merge: `{ ...existing, ...newEntries }`
  - [x] Format as KEY=value lines
  - [x] Call writeAtomic()
- [x] Implement atomic write pattern (AC: 3)
  - [x] Use mkdtemp() for unpredictable temp directory (C-2 fix)
  - [x] Write content to temp file with mode 0o600
  - [x] Set secure permissions on temp file
  - [x] Atomic rename: `fs.rename(tempPath, path)`
  - [x] Verify permissions after rename
  - [x] Cleanup temp directory in finally block
- [x] Implement platform-specific permissions (AC: 4)
  - [x] setSecurePermissions() private method
  - [x] Unix: `fs.chmod(path, 0o600)`
  - [x] Windows: `execFile('icacls', [path, '/inheritance:r'])`
  - [x] Handle Windows failures gracefully (warn, don't fail)
- [x] Implement permission verification (AC: 5)
  - [x] verifyPermissions() private method
  - [x] Use `fs.access(path, constants.R_OK | constants.W_OK)`
  - [x] Throw WizardError on verification failure
- [x] Implement same-filesystem verification (BONUS - security enhancement)
  - [x] ensureSameFilesystem() private method
  - [x] Compare device IDs from stat()
  - [x] Throw WizardError if cross-filesystem rename would occur
- [x] Create unit tests (AC: 7)
  - [x] Test read() with existing .env
  - [x] Test read() with missing .env
  - [x] Test write() merge behavior
  - [x] Test atomic write (temp file created, renamed)
  - [x] Test permission setting on Unix
  - [x] Test Windows ACL handling (mocked)
  - [x] Test same-filesystem verification
  - [x] Test temp directory cleanup
  - [x] Achieve 90% code coverage

## Dev Notes

### Why Atomic Writes?

Non-atomic writes create race condition vulnerabilities where an attacker can tamper with .env between read and write operations.

### Permission Strategy

- **Unix-like (macOS, Linux):** `0o600` = owner read/write only
- **Windows:** `icacls /inheritance:r` removes inherited permissions

**Windows Note:** Windows permissions are limited. We do our best but don't fail the wizard if icacls fails.

### Temp File Pattern (Enhanced for Security)

The implementation uses `mkdtemp()` instead of predictable filenames:

```
/tmp/.env-abc123/write.tmp
     ↑        ↑
    mkdtemp  write.tmp
```

**SECURITY FIX C-2 & HP-7:**
- `mkdtemp()` uses crypto-random suffixes, not Date.now()
- No predictable temp file patterns
- Creates isolated temp directory for cleanup

### File Locations

```
packages/wizard/src/config/
├── env.ts           # EnvManager class
└── permissions.ts   # Permission utilities (optional)
```

### Dependencies

```json
{
  "dependencies": {
    "dotenv": "^16.4.0"
  }
}
```

### Integration with AuditLogger (Story 1.3)

The audit logging call in write() should be added after AuditLogger is implemented. For now, add a TODO comment.

### Error Handling

Use `WizardError` class (from EPIC-1-004) for all errors:

```typescript
throw new WizardError(
  'ENV_PERMISSION_FAILED',
  `Cannot verify .env permissions: ${path}`,
  'Ensure you have write access to the directory',
  error as Error,
  1
);
```

### Test Fixtures

Create `tests/fixtures/.env.example` for testing.

### Project Context Reference

- Security Rules: [working-document.md#L87-L180](../working-document.md#L87-L180)
- Atomic .env Pattern: [working-document.md#L206-L245](../working-document.md#L206-L245)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Completed: 2026-02-18
- All tests passing (33 tests for EnvManager)
- Code coverage: achieved 90%+ coverage
- Security enhancements:
  - mkdtemp() for unpredictable temp names (fixes C-2 and HP-7)
  - Same-filesystem verification before atomic rename
  - Temp directory cleanup in finally block
- Fixed test: corrected existsSyncMock in error test

### File List

- `packages/wizard/src/config/env.ts` (created)
- `packages/wizard/src/config/env.test.ts` (created)
- `packages/wizard/src/config/index.ts` (created)
- `package.json` (updated - added dotenv@^17.3.1)
