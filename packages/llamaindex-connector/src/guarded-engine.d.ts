/**
 * LlamaIndex Guarded Wrapper
 * ==========================
 *
 * Provides security guardrails for LlamaIndex.TS RAG operations.
 *
 * Security Features:
 * - Query injection validation before retrieval
 * - Retrieved document poisoning detection
 * - Response synthesis validation
 * - Production mode error messages
 * - Validation timeout with AbortController
 *
 * @package @blackunicorn/bonklm-llamaindex
 */
import type { GuardedLlamaIndexOptions, GuardedQueryResult } from './types.js';
/**
 * Represents a wrapped QueryEngine with guardrails.
 */
export interface GuardedQueryEngine {
    query(queryStr: string, options?: any): Promise<GuardedQueryResult>;
}
/**
 * Represents a wrapped Retriever with guardrails.
 */
export interface GuardedRetriever {
    retrieve(queryStr: string, options?: any): Promise<any[]>;
}
/**
 * Creates a guarded QueryEngine wrapper for LlamaIndex operations.
 *
 * @param queryEngine - The LlamaIndex QueryEngine to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns A guarded query engine with validation
 *
 * @example
 * ```ts
 * import { VectorStoreIndex } from 'llamaindex';
 * import { createGuardedQueryEngine } from '@blackunicorn/bonklm-llamaindex';
 * import { PromptInjectionValidator, PIIGuard } from '@blackunicorn/bonklm';
 *
 * const index = await VectorStoreIndex.fromDocuments(documents);
 * const queryEngine = index.asQueryEngine();
 *
 * const guardedEngine = createGuardedQueryEngine(queryEngine, {
 *   validators: [new PromptInjectionValidator()],
 *   guards: [new PIIGuard()],
 *   validateRetrievedDocs: true,
 *   onBlockedDocument: 'filter'
 * });
 *
 * const result = await guardedEngine.query('Tell me about X');
 * ```
 */
export declare function createGuardedQueryEngine(queryEngine: any, options?: GuardedLlamaIndexOptions): GuardedQueryEngine;
/**
 * Creates a guarded Retriever wrapper for LlamaIndex retrieval operations.
 *
 * @param retriever - The LlamaIndex Retriever to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns A guarded retriever with validation
 *
 * @example
 * ```ts
 * import { createGuardedRetriever } from '@blackunicorn/bonklm-llamaindex';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardedRetriever = createGuardedRetriever(retriever, {
 *   validators: [new PromptInjectionValidator()],
 *   validateRetrievedDocs: true
 * });
 *
 * const nodes = await guardedRetriever.retrieve('Find documents about X');
 * ```
 */
export declare function createGuardedRetriever(retriever: any, options?: Omit<GuardedLlamaIndexOptions, 'onResponseBlocked'>): GuardedRetriever;
/**
 * Re-exports types for convenience.
 */
export type { GuardedLlamaIndexOptions, GuardedQueryResult, } from './types.js';
//# sourceMappingURL=guarded-engine.d.ts.map