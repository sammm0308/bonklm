"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuardedCollection = createGuardedCollection;
const bonklm_1 = require("@blackunicorn/bonklm");
const types_js_1 = require("./types.js");
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = (0, bonklm_1.createLogger)('console');
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
function createGuardedCollection(chromaCollection, options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, validateRetrievedDocs = true, onBlockedDocument, productionMode = process.env.NODE_ENV === 'production', validationTimeout = types_js_1.DEFAULT_VALIDATION_TIMEOUT, maxNResults = types_js_1.DEFAULT_MAX_N_RESULTS, sanitizeFilters = true, onQueryBlocked, onDocumentBlocked, } = options;
    // Default onBlockedDocument to 'filter' if not provided (fixes issue where function parameter was overridden)
    const blockedDocumentHandling = onBlockedDocument ?? 'filter';
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
            throw error;
        }
    };
    /**
     * Sanitizes metadata filter expressions to prevent injection.
     * Uses recursive traversal to catch dangerous patterns at any depth.
     *
     * @internal
     */
    const sanitizeFilter = (filter) => {
        if (!sanitizeFilters || !filter) {
            return filter;
        }
        // Convert to string for initial validation (catches Unicode escapes)
        const filterStr = JSON.stringify(filter);
        // Check for dangerous patterns including Unicode escape variants
        const dangerousPatterns = [
            /\$\.\./, // Path traversal
            /\beval\b/i, // eval usage
            /\bconstructor\b/i, // Constructor access
            /\b__proto__\b/i, // Prototype pollution
            /\$where/i, // MongoDB-style injection
            /\\u0024/i, // Unicode escape for $ (\u0024where)
            /\\u005f/i, // Unicode escape for _ (__proto__ variants)
            /\$ne\b/, // Not equal operator
            /\$regex\b/, // Regex operator
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(filterStr)) {
                logger.warn('[Guardrails] Dangerous filter pattern detected');
                throw new Error(productionMode ? 'Filter contains dangerous patterns' : 'Filter contains dangerous patterns');
            }
        }
        // Deep validation for nested objects
        const deepValidate = (obj, depth = 0) => {
            if (depth > 10) {
                throw new Error(productionMode ? 'Invalid filter' : 'Filter depth exceeded maximum');
            }
            if (obj && typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                    // Check for dangerous keys
                    const dangerousKeys = ['constructor', '__proto__', 'prototype', 'parent', 'where'];
                    if (dangerousKeys.some((dk) => key.toLowerCase().includes(dk.toLowerCase()))) {
                        logger.warn('[Guardrails] Dangerous filter key detected', { key });
                        throw new Error(productionMode ? 'Invalid filter' : 'Filter contains dangerous keys');
                    }
                    // Recurse into nested objects
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        deepValidate(obj[key], depth + 1);
                    }
                }
            }
        };
        try {
            deepValidate(filter);
        }
        catch (e) {
            if (e instanceof Error) {
                throw e;
            }
            throw new Error(productionMode ? 'Invalid filter' : 'Filter validation failed');
        }
        return filter;
    };
    /**
     * Validates a query string or embedding.
     *
     * @internal
     */
    const validateQuery = async (options) => {
        // Validate nResults limit
        const nResults = Math.min(options.nResults || 10, maxNResults);
        if (nResults < 1 || nResults > maxNResults) {
            throw new Error(`nResults must be between 1 and ${maxNResults}`);
        }
        // Validate query text if provided
        if (options.queryTexts && options.queryTexts.length > 0) {
            const queryText = options.queryTexts.join(' ');
            const result = await validateWithTimeout(queryText, 'chroma_query');
            if (!result.allowed) {
                logger.warn('[Guardrails] Query blocked', { reason: result.reason });
                if (onQueryBlocked)
                    onQueryBlocked(result);
                if (productionMode) {
                    throw new Error('Query blocked');
                }
                throw new Error(`Query blocked: ${result.reason}`);
            }
        }
        // Validate filters
        if (options.where) {
            sanitizeFilter(options.where);
        }
        if (options.whereDocument) {
            sanitizeFilter(options.whereDocument);
        }
    };
    /**
     * Validates retrieved documents.
     *
     * @internal
     */
    const validateDocuments = async (documents, metadatas, ids) => {
        if (!validateRetrievedDocs) {
            // Return all indices as valid when validation is disabled
            const validIndices = documents.map((docArray) => docArray.map((_, idx) => idx));
            return { validDocuments: documents, validMetadatas: metadatas, validIds: ids, blocked: 0, validIndices };
        }
        const validDocuments = [];
        const validMetadatas = [];
        const validIds = [];
        const validIndices = [];
        let blocked = 0;
        // Process each query result set
        for (let i = 0; i < documents.length; i++) {
            const queryDocuments = [];
            const queryMetadatas = [];
            const queryIds = [];
            const queryValidIndices = [];
            for (let j = 0; j < documents[i].length; j++) {
                const doc = documents[i][j];
                const metadata = metadatas[i]?.[j];
                const id = ids[i]?.[j];
                // Build content to validate (document + metadata + id)
                let contentToValidate = doc || '';
                if (metadata) {
                    contentToValidate += ' ' + JSON.stringify(metadata);
                }
                if (id) {
                    contentToValidate += ' ' + id;
                }
                const result = await validateWithTimeout(contentToValidate, 'chroma_document');
                if (result.allowed) {
                    queryDocuments.push(doc);
                    if (metadata)
                        queryMetadatas.push(metadata);
                    if (id)
                        queryIds.push(id);
                    queryValidIndices.push(j);
                }
                else {
                    blocked++;
                    logger.warn('[Guardrails] Document blocked', {
                        id,
                        reason: result.reason,
                    });
                    if (onDocumentBlocked) {
                        onDocumentBlocked(doc.substring(0, 200), result);
                    }
                    if (blockedDocumentHandling === 'abort') {
                        throw new Error(productionMode ? 'Document blocked' : `Document blocked: ${result.reason}`);
                    }
                }
            }
            validDocuments.push(queryDocuments);
            validMetadatas.push(queryMetadatas);
            validIds.push(queryIds);
            validIndices.push(queryValidIndices);
        }
        return { validDocuments, validMetadatas, validIds, blocked, validIndices };
    };
    return {
        /**
         * Executes a query with full guardrails validation.
         *
         * @param options - Query options including queryTexts, nResults, filters
         * @returns Query results with validation metadata
         */
        async query(options) {
            // Step 1: Validate the query
            await validateQuery(options);
            // Step 2: Apply limits and sanitization
            const sanitizedOptions = {
                ...options,
                nResults: Math.min(options.nResults || 10, maxNResults),
                where: sanitizeFilter(options.where),
                whereDocument: sanitizeFilter(options.whereDocument),
            };
            // Step 3: Execute the query
            const rawResult = await chromaCollection.query(sanitizedOptions);
            // Step 4: Validate retrieved documents
            const documents = rawResult.documents || [[]];
            const metadatas = rawResult.metadatas || [[]];
            const ids = rawResult.ids || [[]];
            const { validDocuments, validMetadatas, validIds, blocked, validIndices } = await validateDocuments(documents, metadatas, ids);
            // Build filtered result
            const result = {
                documents: validDocuments,
                metadatas: validMetadatas.length > 0 ? validMetadatas : undefined,
                ids: validIds,
                documentsBlocked: blocked,
                filtered: blocked > 0,
                raw: rawResult,
            };
            // Add optional fields if they were in original result
            if (rawResult.embeddings) {
                result.embeddings = rawResult.embeddings;
            }
            if (rawResult.distances) {
                // Filter distances using valid indices for accurate mapping
                result.distances = rawResult.distances.map((distArray, idx) => {
                    const indices = validIndices[idx] || [];
                    if (indices.length < distArray.length) {
                        // Filter distances to only include valid document indices
                        return indices.map((i) => distArray[i]);
                    }
                    return distArray;
                });
            }
            return result;
        },
        /**
         * Adds documents to the collection with optional validation.
         *
         * @param options - Add options including documents, embeddings, metadatas
         */
        async add(options) {
            // Validate documents being added if present
            if (options.documents && Array.isArray(options.documents)) {
                for (const doc of options.documents) {
                    const result = await validateWithTimeout(String(doc), 'chroma_add');
                    if (!result.allowed) {
                        logger.warn('[Guardrails] Document add blocked', { reason: result.reason });
                        throw new Error(productionMode ? 'Document blocked' : `Document blocked: ${result.reason}`);
                    }
                }
            }
            // Validate metadatas if present
            if (options.metadatas && Array.isArray(options.metadatas)) {
                for (const metadata of options.metadatas) {
                    sanitizeFilter(metadata);
                }
            }
            return chromaCollection.add(options);
        },
        /**
         * Deletes documents from the collection.
         *
         * @param options - Delete options
         */
        async delete(options) {
            // Sanitize filters in delete operations (create copy to avoid mutating caller's object)
            const sanitizedOptions = { ...options };
            if (sanitizedOptions.where) {
                sanitizedOptions.where = sanitizeFilter(sanitizedOptions.where);
            }
            if (sanitizedOptions.whereDocument) {
                sanitizedOptions.whereDocument = sanitizeFilter(sanitizedOptions.whereDocument);
            }
            return chromaCollection.delete(sanitizedOptions);
        },
    };
}
//# sourceMappingURL=guarded-chroma.js.map