# RAG & Vector Store Connectors

This guide covers integrating BonkLM with Retrieval-Augmented Generation (RAG) systems and vector databases.

## Available Connectors

| Connector | Package | Platform | Status |
|-----------|---------|----------|--------|
| LlamaIndex | `@blackunicorn/bonklm-llamaindex` | LlamaIndex | ✅ |
| Pinecone | `@blackunicorn/bonklm-pinecone` | Pinecone | ✅ |
| HuggingFace | `@blackunicorn/bonklm-huggingface` | HuggingFace | ✅ |
| ChromaDB | `@blackunicorn/bonklm-chroma` | ChromaDB | ✅ |
| Weaviate | `@blackunicorn/bonklm-weaviate` | Weaviate | ✅ |
| Qdrant | `@blackunicorn/bonklm-qdrant` | Qdrant | ✅ |

---

## LlamaIndex Connector

### Installation

```bash
npm install @blackunicorn/bonklm-llamaindex llamindex
```

### Basic Usage (Query Engine)

```typescript
import { createGuardedQueryEngine } from '@blackunicorn/bonklm-llamaindex';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardedEngine = createGuardedQueryEngine(queryEngine, {
  validators: [new PromptInjectionValidator()],
});

const response = await guardedEngine.query({
  query: userInput,
});
```

### Basic Usage (Retriever)

```typescript
import { createGuardedRetriever } from '@blackunicorn/bonklm-llamaindex';

const guardedRetriever = createGuardedRetriever(retriever, {
  validators: [new PromptInjectionValidator()],
  validateRetrievalQuery: true,
  validateRetrievedDocuments: true,
});

const nodes = await guardedRetriever.retrieve(userQuery);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateQueryInput` | `boolean` | `true` | Validate query input |
| `validateQueryOutput` | `boolean` | `true` | Validate query output |
| `validateRetrievalQuery` | `boolean` | `true` | Validate retrieval queries |
| `validateRetrievedDocuments` | `boolean` | `true` | Validate retrieved docs |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onQueryBlocked` | `Function` | - | Callback when query blocked |
| `onRetrievalBlocked` | `Function` | - | Callback when retrieval blocked |
| `onDocumentBlocked` | `Function` | - | Callback when document blocked |

---

## Pinecone Connector

### Installation

```bash
npm install @blackunicorn/bonklm-pinecone @pinecone-database/pinecone
```

### Basic Usage

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { createGuardedIndex } from '@blackunicorn/bonklm-pinecone';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('my-index');

const guardedIndex = createGuardedIndex(index, {
  validators: [new PromptInjectionValidator()],
  allowedNamespaces: ['documents', 'articles'],
  maxVectorDimension: 1536,
});

// Query with validation
const results = await guardedIndex.query({
  vector: embedding,
  topK: 10,
  includeMetadata: true,
});

// Upsert with validation
await guardedIndex.upsert([
  {
    id: 'doc1',
    values: embedding,
    metadata: { text: 'content here' },
  },
]);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `allowedNamespaces` | `string[]` | `[]` | Namespace allowlist |
| `validateFilters` | `boolean` | `true` | Validate filter expressions |
| `validateMetadata` | `boolean` | `true` | Validate metadata |
| `maxVectorDimension` | `number` | `100000` | Max vector dimension |
| `maxMetadataSize` | `number` | `102400` | Max metadata size (100KB) |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onQueryBlocked` | `Function` | - | Callback when query blocked |
| `onUpsertBlocked` | `Function` | - | Callback when upsert blocked |

### Filter Sanitization

The Pinecone connector automatically sanitizes filter expressions to prevent NoSQL injection:

```typescript
// Dangerous filters are sanitized
const results = await guardedIndex.query({
  vector: embedding,
  filter: {
    // This would be blocked/rejected:
    "$ne": null,
    "$regex": ".*",
  },
});
```

---

## HuggingFace Connector

### Installation

```bash
npm install @blackunicorn/bonklm-huggingface @huggingface/inference
```

### Basic Usage

```typescript
import { HfInference } from '@huggingface/inference';
import { createGuardedInference } from '@blackunicorn/bonklm-huggingface';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const hf = new HfInference(process.env.HF_API_KEY);
const guardedHF = createGuardedInference(hf, {
  validators: [new PromptInjectionValidator()],
  allowedModels: ['BAAI/bge-base-en-v1.5', 'BAAI/bge-large-en-v1.5'],
});

// Text generation with validation
const result = await guardedHF.textGeneration({
  model: 'meta-llama/Llama-2-7b',
  inputs: userInput,
});

// Question answering
const answer = await guardedHF.questionAnswer({
  model: 'deepset/roberta-base-squad2',
  inputs: {
    question: userQuestion,
    context: documentContext,
  },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `allowedModels` | `string[]` | `[]` | Model allowlist |
| `validateInputs` | `boolean` | `true` | Validate all inputs |
| `validateOutputs` | `boolean` | `true` | Validate all outputs |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onInputBlocked` | `Function` | - | Callback when input blocked |
| `onModelNotAllowed` | `Function` | - | Callback when model not allowed |

---

## ChromaDB Connector

### Installation

```bash
npm install @blackunicorn/bonklm-chroma chromadb
```

### Basic Usage

```typescript
import { ChromaClient } from 'chromadb';
import { createGuardedCollection } from '@blackunicorn/bonklm-chroma';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const chroma = new ChromaClient();
const collection = await chroma.getOrCreateCollection({ name: 'documents' });

const guardedCollection = createGuardedCollection(collection, {
  validators: [new PromptInjectionValidator()],
  validateQueries: true,
  validateDocuments: true,
  validateMetadata: true,
});

// Query with validation
const results = await guardedCollection.query({
  queryTexts: [userQuery],
  nResults: 10,
});

// Add documents with validation
await guardedCollection.add({
  documents: ['document content here'],
  ids: ['doc1'],
  metadatas: [{ source: 'trusted' }],
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `validateQueries` | `boolean` | `true` | Validate queries |
| `validateDocuments` | `boolean` | `true` | Validate documents |
| `validateMetadata` | `boolean` | `true` | Validate metadata |
| `sanitizeWhereFilters` | `boolean` | `true` | Sanitize WHERE clauses |
| `maxDocumentLength` | `number` | `100000` | Max document length |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onQueryBlocked` | `Function` | - | Callback when query blocked |
| `onDocumentBlocked` | `Function` | - | Callback when document blocked |

---

## Weaviate Connector

### Installation

```bash
npm install @blackunicorn/bonklm-weaviate weaviate-ts-client
```

### Basic Usage

```typescript
import { createGuardedClient } from '@blackunicorn/bonklm-weaviate';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const guardedClient = createGuardedClient(weaviateClient, {
  validators: [new PromptInjectionValidator()],
  allowedClasses: ['Document', 'Article'],
  allowedFields: ['title', 'content', 'tags'],
});

// NearText search with validation
const results = await guardedClient.collections.get('Document')
  .nearText(['search query'])
  .withLimit(10)
  .do();

// BM25 search with validation
const results = await guardedClient.collections.get('Document')
  .bm25(['search terms'])
  .withLimit(10)
  .do();

// Hybrid search with validation
const results = await guardedClient.collections.get('Document')
  .hybrid('search query', 0.7)
  .withLimit(10)
  .do();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `allowedClasses` | `string[]` | `[]` | Class name allowlist (supports wildcards) |
| `allowedFields` | `string[]` | `[]` | Field allowlist (supports wildcards) |
| `validateFilters` | `boolean` | `true` | Validate filter expressions |
| `validateQueries` | `boolean` | `true` | Validate all queries |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onQueryBlocked` | `Function` | - | Callback when query blocked |
| `onClassNotAllowed` | `Function` | - | Callback when class not allowed |

### Wildcard Patterns

```typescript
const guardedClient = createGuardedClient(weaviateClient, {
  allowedClasses: ['Document*', 'Article*'],  // Matches Document, Documents, Article, Articles, etc.
  allowedFields: ['title', 'content*', 'meta*'],  // Matches content, contents, metadata, etc.
});
```

---

## Qdrant Connector

### Installation

```bash
npm install @blackunicorn/bonklm-qdrant @qdrant/js-client-rest
```

### Basic Usage

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import { createGuardedClient } from '@blackunicorn/bonklm-qdrant';
import { PromptInjectionValidator } from '@blackunicorn/bonklm';

const qdrant = new QdrantClient({ url: 'http://localhost:6333' });
const guardedClient = createGuardedClient(qdrant, {
  validators: [new PromptInjectionValidator()],
  allowedCollections: ['documents', 'articles'],
});

// Query with validation
const results = await guardedClient.query('documents', {
  query: embedding,
  limit: 10,
  with_payload: true,
});

// Upsert with validation
await guardedClient.upsert('documents', {
  points: [
    {
      id: 'doc1',
      vector: embedding,
      payload: { text: 'content here' },
    },
  ],
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `Validator[]` | `[]` | Validators to apply |
| `guards` | `Guard[]` | `[]` | Guards to run |
| `allowedCollections` | `string[]` | `[]` | Collection allowlist |
| `validateFilters` | `boolean` | `true` | Validate filter expressions |
| `validatePayloads` | `boolean` | `true` | Validate point payloads |
| `allowedPayloadFields` | `string[]` | `[]` | Payload field allowlist |
| `maxVectorDimension` | `number` | `100000` | Max vector dimension |
| `productionMode` | `boolean` | `NODE_ENV === 'production'` | Generic errors in production |
| `validationTimeout` | `number` | `30000` | Timeout in milliseconds |
| `onQueryBlocked` | `Function` | - | Callback when query blocked |
| `onUpsertBlocked` | `Function` | - | Callback when upsert blocked |

### Filter Sanitization

The Qdrant connector automatically sanitizes filter expressions to prevent injection:

```typescript
// Dangerous filters are blocked
const results = await guardedClient.query('documents', {
  query: embedding,
  filter: {
    must: [
      // This would be blocked:
      { key: '$where', match: { any: [] } },
    ],
  },
});
```

---

## Common Security Features

All RAG/Vector Store connectors include:

- **Query Validation**: Prevent prompt injection in search queries
- **Document Validation**: Validate retrieved documents before returning
- **Filter Sanitization**: Prevent NoSQL injection in filter expressions
- **Namespace/Collection Access Control**: Restrict which collections can be accessed
- **Metadata Validation**: Validate metadata fields and values
- **Vector Dimension Limits**: Prevent oversized vectors
- **Distance Array Filtering**: Match filtered results with distance scores

## Next Steps

- [Framework Middleware](./framework-middleware.md) - Express, Fastify, NestJS
- [AI SDK Connectors](./ai-sdks.md) - OpenAI, Anthropic, Vercel AI SDK
- [LLM Provider Connectors](./llm-providers.md) - LangChain, Ollama
