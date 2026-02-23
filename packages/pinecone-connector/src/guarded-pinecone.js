"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuardedIndex = createGuardedIndex;
const bonklm_1 = require("@blackunicorn/bonklm");
const types_js_1 = require("./types.js");
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = (0, bonklm_1.createLogger)('console');
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
function createGuardedIndex(pineconeIndex, options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, validateRetrievedVectors = true, onBlockedVector = 'filter', productionMode = process.env.NODE_ENV === 'production', validationTimeout = types_js_1.DEFAULT_VALIDATION_TIMEOUT, maxTopK = types_js_1.DEFAULT_MAX_TOP_K, sanitizeMetadataFilters = true, onQueryBlocked, onVectorBlocked, } = options;
    const engine = new bonklm_1.GuardrailEngine({
        validators,
        guards,
        logger,
    });
    /**
     * Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    const validateWithTimeout = async (content, context) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), validationTimeout);
        try {
            const result = await engine.validate(content, context);
            clearTimeout(timeoutId);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return (0, bonklm_1.createResult)(false, bonklm_1.Severity.CRITICAL, [
                    {
                        category: 'timeout',
                        description: 'Validation timeout',
                        severity: bonklm_1.Severity.CRITICAL,
                        weight: 30,
                    },
                ]);
            }
            // Re-throw non-timeout errors
            throw error;
        }
    };
    /**
     * Sanitizes metadata filter expressions to prevent injection.
     *
     * @internal
     */
    const sanitizeFilter = (filter) => {
        if (!sanitizeMetadataFilters || !filter) {
            return filter;
        }
        // Convert to string for validation
        const filterStr = JSON.stringify(filter);
        // Check for dangerous patterns
        const dangerousPatterns = [
            /\$\.\./, // Path traversal
            /\beval\b/i, // eval usage
            /\bconstructor\b/i, // Constructor access
            /\b__proto__\b/i, // Prototype pollution
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(filterStr)) {
                logger.warn('[Guardrails] Dangerous filter pattern detected');
                throw new Error(productionMode ? 'Invalid filter' : 'Filter contains dangerous patterns');
            }
        }
        return filter;
    };
    /**
     * Validates a vector query.
     *
     * @internal
     */
    const validateQuery = async (options) => {
        // Validate vector format
        if (!options.vector || !Array.isArray(options.vector)) {
            throw new Error('Vector must be an array of numbers');
        }
        if (options.vector.some((v) => typeof v !== 'number' || isNaN(v))) {
            throw new Error('Vector must contain only valid numbers');
        }
        // Validate topK
        const topK = Math.min(options.topK || 10, maxTopK);
        if (topK < 1 || topK > maxTopK) {
            throw new Error(`topK must be between 1 and ${maxTopK}`);
        }
        // Create query context for validation
        const queryContext = JSON.stringify({
            topK,
            namespace: options.namespace,
            hasFilter: !!options.filter,
        });
        const result = await validateWithTimeout(queryContext, 'pinecone_query');
        if (!result.allowed) {
            logger.warn('[Guardrails] Query blocked', { reason: result.reason });
            if (onQueryBlocked)
                onQueryBlocked(result);
            throw new Error(productionMode ? 'Query blocked' : `Query blocked: ${result.reason}`);
        }
    };
    /**
     * Validates retrieved vectors.
     *
     * @internal
     */
    const validateVectors = async (matches) => {
        if (!validateRetrievedVectors) {
            return { valid: matches, blocked: 0 };
        }
        const valid = [];
        let blocked = 0;
        for (const match of matches) {
            // Validate metadata content
            let contentToValidate = '';
            if (match.metadata) {
                contentToValidate = JSON.stringify(match.metadata);
            }
            if (match.id) {
                contentToValidate += ` ${match.id}`;
            }
            if (!contentToValidate) {
                // No content to validate, allow it
                valid.push(match);
                continue;
            }
            const result = await validateWithTimeout(contentToValidate, 'pinecone_vector');
            if (result.allowed) {
                valid.push(match);
            }
            else {
                blocked++;
                logger.warn('[Guardrails] Vector blocked', {
                    id: match.id,
                    reason: result.reason,
                });
                if (onVectorBlocked && match.id) {
                    onVectorBlocked(match.id, result);
                }
                if (onBlockedVector === 'abort') {
                    throw new Error(productionMode ? 'Vector blocked' : `Vector blocked: ${result.reason}`);
                }
            }
        }
        return { valid, blocked };
    };
    return {
        /**
         * Executes a vector query with guardrails validation.
         *
         * @param options - Query options including vector and topK
         * @returns Query results with validation metadata
         */
        async query(options) {
            // Step 1: Validate the query
            await validateQuery(options);
            // Step 2: Sanitize filters
            const sanitizedOptions = {
                ...options,
                topK: Math.min(options.topK || 10, maxTopK),
                filter: sanitizeFilter(options.filter),
            };
            // Step 3: Execute the query
            const result = await pineconeIndex.query(sanitizedOptions);
            const matches = result.matches || result.vectors || [];
            // Step 4: Validate retrieved vectors
            const { valid: validMatches, blocked } = await validateVectors(matches);
            return {
                matches: validMatches,
                vectorsBlocked: blocked,
                filtered: blocked > 0,
                raw: result,
            };
        },
    };
}
//# sourceMappingURL=guarded-pinecone.js.map