# Story 4.1: Connector Registry

Status: ready-for-dev

**Epic:** EPIC-4 - Connector System
**Priority:** P2
**Dependency:** EPIC-2
**Points:** 3
**File:** `src/connectors/registry.ts`

## Story

As the connector system managing available connectors,
I want a registry that stores and provides connector definitions,
so that commands can look up connectors by ID or category.

## Acceptance Criteria

1. Registry stores connector definitions
2. getConnector(id) method
3. getAllConnectors() method
4. getConnectorsByCategory() method
5. Auto-discovery from implementations/ folder
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Import all connector definitions
  - [ ] Import from implementations/openai.ts
  - [ ] Import from implementations/anthropic.ts
  - [ ] Import from implementations/ollama.ts
  - [ ] Import from implementations/express.ts
  - [ ] Import from implementations/langchain.ts
- [ ] Create CONNECTORS array (AC: 1)
  - [ ] Store all imported connectors
  - [ ] Mark as readonly
- [ ] Implement getConnector(id) function (AC: 2)
  - [ ] Accept connector ID string
  - [ ] Find in CONNECTORS array
  - [ ] Return undefined if not found
- [ ] Implement getAllConnectors() function (AC: 3)
  - [ ] Return copy of CONNECTORS array
  - [ ] Prevent mutation of internal array
- [ ] Implement getConnectorsByCategory() function (AC: 4)
  - [ ] Accept category parameter
  - [ ] Filter CONNECTORS by category
  - [ ] Return filtered array
- [ ] Implement auto-discovery (AC: 5)
  - [ ] Use import.meta.glob or similar
  - [ ] Load all files from implementations/
  - [ ] Extract default exports
  - [ ] Fallback to manual imports if glob unavailable
- [ ] Create unit tests (AC: 6)
  - [ ] Test getConnector() with valid ID
  - [ ] Test getConnector() with invalid ID
  - [ ] Test getAllConnectors()
  - [ ] Test getConnectorsByCategory()
  - [ ] Test registry contains all 5 MVP connectors
  - [ ] Achieve 90% coverage

## Dev Notes

### Registry Implementation

```typescript
import type { ConnectorDefinition, ConnectorCategory } from './base.js';
import { openaiConnector } from './implementations/openai.js';
import { anthropicConnector } from './implementations/anthropic.js';
import { ollamaConnector } from './implementations/ollama.js';
import { expressConnector } from './implementations/express.js';
import { langchainConnector } from './implementations/langchain.js';

const CONNECTORS: readonly ConnectorDefinition[] = [
  openaiConnector,
  anthropicConnector,
  ollamaConnector,
  expressConnector,
  langchainConnector,
] as const;

export function getConnector(id: string): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export function getAllConnectors(): ConnectorDefinition[] {
  return [...CONNECTORS];
}

export function getConnectorsByCategory(
  category: ConnectorCategory
): ConnectorDefinition[] {
  return CONNECTORS.filter((c) => c.category === category);
}
```

### Auto-Discovery (Optional Enhancement)

If using Vite or a bundler that supports import.meta.glob:

```typescript
const modules = import.meta.glob('./implementations/*.ts', { eager: true });
const CONNECTORS = Object.values(modules)
  .map((mod: any) => mod.default)
  .filter(Boolean);
```

**Note:** Manual imports are preferred for reliability and tree-shaking.

### Usage Examples

```typescript
// Get specific connector
const openai = getConnector('openai');
if (openai) {
  console.log(openai.name); // 'OpenAI'
}

// Get all connectors
const all = getAllConnectors();
console.log(all.length); // 5

// Get LLM connectors only
const llms = getConnectorsByCategory('llm');
console.log(llms.map(c => c.id)); // ['openai', 'anthropic', 'ollama']

// Get framework connectors
const frameworks = getConnectorsByCategory('framework');
console.log(frameworks.map(c => c.id)); // ['express', 'langchain']
```

### File Structure

```
packages/wizard/src/connectors/
├── base.ts                    # Interfaces
├── registry.ts                # Registry (this story)
└── implementations/
    ├── openai.ts              # EPIC-4-002
    ├── anthropic.ts           # EPIC-4-003
    ├── ollama.ts              # EPIC-4-004
    ├── express.ts             # EPIC-4-005
    └── langchain.ts           # EPIC-4-006
```

### Connector IDs

Standardized connector IDs:
- `openai` - OpenAI API
- `anthropic` - Anthropic Claude API
- `ollama` - Ollama local LLM
- `express` - Express.js framework
- `langchain` - LangChain framework

### Immutable Registry

The CONNECTORS array is marked `readonly` and functions return copies to prevent accidental mutation:

```typescript
// Prevents this:
const all = getAllConnectors();
all.push(fakeConnector); // TypeScript error if readonly
```

### Extensibility

New connectors are added by:
1. Creating implementation file in `implementations/`
2. Importing in `registry.ts`
3. Adding to CONNECTORS array

### Test Strategy

- Mock connector definitions for isolation
- Test lookup with valid/invalid IDs
- Test filtering by category
- Test immutability (mutations don't affect internal array)

### Project Context Reference

- Connector System: [working-document.md#L582-L680](../working-document.md#L582-L680)
- Base Interface: [working-document.md#L310-L360](../working-document.md#L310-L360)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
