/**
 * ChromaDB Guarded Wrapper
 * ========================
 *
 * Provides security guardrails for ChromaDB vector database operations.
 *
 * Security Features:
 * - Query injection validation before retrieval
 * - Retrieved document poisoning detection
 * - Metadata filter sanitization
 * - Production mode error messages
 * - Validation timeout with AbortController
 *
 * @package @blackunicorn/bonklm-chroma
 */
import type { GuardedChromaOptions, GuardedChromaQueryResult, ChromaQueryOptions } from './types.js';
/**
 * Represents a wrapped ChromaDB collection with guardrails.
 */
export interface GuardedChromaCollection {
    query(options: ChromaQueryOptions): Promise<GuardedChromaQueryResult>;
    add(options: any): Promise<void>;
    delete(options: any): Promise<void>;
}
/**
 * Creates a guarded ChromaDB collection wrapper for vector operations.
 *
 * @param chromaCollection - The ChromaDB collection to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns A guarded collection with validation
 *
 * @example
 * ```ts
 * import { ChromaClient } from 'chromadb';
 * import { createGuardedCollection } from '@blackunicorn/bonklm-chroma';
 * import { PromptInjectionValidator, PIIGuard } from '@blackunicorn/bonklm';
 *
 * const client = new ChromaClient();
 * const collection = await client.getOrCreateCollection({ name: 'my_collection' });
 *
 * const guardedCollection = createGuardedCollection(collection, {
 *   validators: [new PromptInjectionValidator()],
 *   guards: [new PIIGuard()],
 *   validateRetrievedDocs: true,
 *   sanitizeFilters: true
 * });
 *
 * const results = await guardedCollection.query({
 *   queryTexts: ['Tell me about X'],
 *   nResults: 5
 * });
 * ```
 */
export declare function createGuardedCollection(chromaCollection: any, options?: GuardedChromaOptions): GuardedChromaCollection;
/**
 * Re-exports types for convenience.
 */
export type { GuardedChromaOptions, GuardedChromaQueryResult, ChromaQueryOptions, BlockedDocumentHandling, } from './types.js';
//# sourceMappingURL=guarded-chroma.d.ts.map