/**
 * Pinecone Guarded Wrapper
 * ========================
 *
 * Provides security guardrails for Pinecone vector database operations.
 *
 * Security Features:
 * - Query injection validation
 * - Retrieved vector poisoning detection
 * - Metadata filter sanitization
 * - Production mode error messages
 * - Validation timeout with AbortController
 *
 * @package @blackunicorn/bonklm-pinecone
 */
import type { GuardedPineconeOptions, GuardedQueryResult, VectorQueryOptions } from './types.js';
/**
 * Represents a wrapped Pinecone Index with guardrails.
 */
export interface GuardedPineconeIndex {
    query(options: VectorQueryOptions): Promise<GuardedQueryResult>;
}
/**
 * Creates a guarded Pinecone Index wrapper for vector operations.
 *
 * @param pineconeIndex - The Pinecone Index to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns A guarded index with validation
 *
 * @example
 * ```ts
 * import { Pinecone } from '@pinecone-database/pinecone';
 * import { createGuardedIndex } from '@blackunicorn/bonklm-pinecone';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const pinecone = new Pinecone({ apiKey: '...' });
 * const index = pinecone.index('my-index');
 *
 * const guardedIndex = createGuardedIndex(index, {
 *   validators: [new PromptInjectionValidator()],
 *   validateRetrievedVectors: true,
 *   sanitizeMetadataFilters: true
 * });
 *
 * const results = await guardedIndex.query({
 *   vector: embedding,
 *   topK: 10
 * });
 * ```
 */
export declare function createGuardedIndex(pineconeIndex: any, options?: GuardedPineconeOptions): GuardedPineconeIndex;
/**
 * Re-exports types for convenience.
 */
export type { GuardedPineconeOptions, GuardedQueryResult, VectorQueryOptions, } from './types.js';
//# sourceMappingURL=guarded-pinecone.d.ts.map