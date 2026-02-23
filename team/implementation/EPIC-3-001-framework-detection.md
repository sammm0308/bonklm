# Story 3.1: Framework Detection (package.json)

Status: ready-for-dev

**Epic:** EPIC-3 - Detection Engine
**Priority:** P1
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/detection/framework.ts`

## Story

As the wizard detecting the user's environment,
I want to detect installed frameworks by reading package.json,
so that I can pre-select relevant connectors.

## Acceptance Criteria

1. Read package.json from current directory
2. Detect: Express, Fastify, NestJS, LangChain
3. Return detected frameworks with versions
4. Handle missing package.json gracefully
5. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define DetectedFramework interface
  - [ ] name: string
  - [ ] version?: string
- [ ] Define FRAMEWORK_PATTERNS constant
  - [ ] express: dependencies ['express']
  - [ ] fastify: dependencies ['fastify']
  - [ ] nestjs: dependencies ['@nestjs/core']
  - [ ] langchain: dependencies ['langchain', '@langchain/core']
- [ ] Implement detectFrameworks() function (AC: 1-4)
  - [ ] Get current working directory: process.cwd()
  - [ ] Construct path to package.json
  - [ ] Check if file exists
  - [ ] Read and parse package.json
  - [ ] Check dependencies and devDependencies
  - [ ] Match against FRAMEWORK_PATTERNS
  - [ ] Return array of DetectedFramework
- [ ] Handle missing package.json (AC: 4)
  - [ ] Return empty array if file doesn't exist
  - [ ] Log debug message (not error)
- [ ] Create unit tests (AC: 5)
  - [ ] Test with Express package.json
  - [ ] Test with Fastify package.json
  - [ ] Test with NestJS package.json
  - [ ] Test with LangChain package.json
  - [ ] Test with multiple frameworks
  - [ ] Test with no frameworks
  - [ ] Test with missing package.json
  - [ ] Achieve 90% coverage

## Dev Notes

### DetectedFramework Interface

```typescript
export interface DetectedFramework {
  name: string;
  version?: string;
}
```

### Framework Patterns

```typescript
const FRAMEWORK_PATTERNS = {
  express: {
    dependencies: ['express'],
    devDependencies: [],
  },
  fastify: {
    dependencies: ['fastify'],
    devDependencies: [],
  },
  nestjs: {
    dependencies: ['@nestjs/core'],
    devDependencies: [],
  },
  langchain: {
    dependencies: ['langchain', '@langchain/core'],
    devDependencies: [],
  },
} as const;
```

### Implementation

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function detectFrameworks(): Promise<DetectedFramework[]> {
  const pkgPath = join(process.cwd(), 'package.json');

  if (!existsSync(pkgPath)) {
    return [];
  }

  const content = await readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(content);

  const detected: DetectedFramework[] = [];

  for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    for (const dep of pattern.dependencies) {
      if (deps[dep]) {
        detected.push({ name, version: deps[dep] });
        break;
      }
    }

    for (const dep of pattern.devDependencies) {
      if (devDeps[dep]) {
        detected.push({ name, version: devDeps[dep] });
        break;
      }
    }
  }

  return detected;
}
```

### Usage Example

```typescript
const frameworks = await detectFrameworks();
// Returns: [
//   { name: 'express', version: '^4.18.0' },
//   { name: 'langchain', version: '^0.1.0' }
// ]
```

### Test Fixtures

Create `tests/fixtures/package-examples/`:
- `express.json` - Express.js project
- `nestjs.json` - NestJS project
- `multi.json` - Multiple frameworks
- `empty.json` - No detected frameworks

### Error Handling

- Invalid JSON in package.json → Treat as missing, return empty
- File read permissions error → Log and return empty
- Don't throw errors for framework detection failures

### Extensions for Future

More frameworks can be added by extending FRAMEWORK_PATTERNS:
- Koa, Hapi (web frameworks)
- Next.js, Nuxt (meta-frameworks)
- Lambda, Azure Functions (serverless)

### Project Context Reference

- Detection Engine: [working-document.md#L482-L580](../working-document.md#L482-L580)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
