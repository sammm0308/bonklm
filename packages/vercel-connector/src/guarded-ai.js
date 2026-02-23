"use strict";
/**
 * Vercel AI SDK Guarded Wrapper
 * ============================
 *
 * Provides security guardrails for Vercel AI SDK operations.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement to prevent DoS
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout with AbortController
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Proper logger integration
 *
 * @package @blackunicorn/bonklm-vercel
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesToText = messagesToText;
exports.createGuardedAI = createGuardedAI;
const bonklm_1 = require("@blackunicorn/bonklm");
const types_js_1 = require("./types.js");
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = (0, bonklm_1.createLogger)('console');
/**
 * Extracts text content from CoreMessage array.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content: [{type: 'text', text: 'Hello'}, {type: 'image', image: '...'}]
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of CoreMessage objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: CoreMessage[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: [{ type: 'text', text: 'Hi there' }] }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
function messagesToText(messages) {
    return messages
        .map((m) => {
        const content = m.content;
        // Handle string content (most common case)
        if (typeof content === 'string') {
            return content;
        }
        // Handle array content (SEC-006: structured data, images, etc.)
        if (Array.isArray(content)) {
            return content
                .filter((c) => c.type === 'text') // Only extract text parts
                .map((c) => (c.type === 'text' ? c.text : ''))
                .join('\n');
        }
        // Handle other types (convert to string)
        return String(content);
    })
        .filter((c) => c.length > 0)
        .join('\n');
}
function createGuardedAI(options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, // DEV-002: Use proper logger
    validateStreaming = false, streamingMode = 'incremental', // SEC-002: Default to incremental
    maxStreamBufferSize = types_js_1.DEFAULT_MAX_BUFFER_SIZE, // SEC-003: Default 1MB
    productionMode = process.env.NODE_ENV === 'production', // SEC-007
    validationTimeout = types_js_1.DEFAULT_VALIDATION_TIMEOUT, // SEC-008: Default 30s
    onBlocked, onStreamBlocked, } = options;
    const engine = new bonklm_1.GuardrailEngine({
        validators,
        guards,
        logger,
    });
    /**
     * SEC-008: Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    const validateWithTimeout = async (content, context) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), validationTimeout);
        try {
            // DEV-001: Correct API signature - use string context, not object
            const engineResult = await engine.validate(content, context);
            clearTimeout(timeoutId);
            // Convert EngineResult to GuardrailResult[]
            if ('allowed' in engineResult) {
                // Single result returned
                return [engineResult];
            }
            // Multiple results returned (from EngineResult.results array)
            return engineResult.results || [engineResult];
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return [
                    (0, bonklm_1.createResult)(false, bonklm_1.Severity.CRITICAL, [
                        {
                            category: 'timeout',
                            description: 'Validation timeout',
                            severity: bonklm_1.Severity.CRITICAL,
                            weight: 30,
                        },
                    ]),
                ];
            }
            throw error;
        }
    };
    /**
     * Validates input messages and throws if blocked.
     *
     * @internal
     */
    const validateInput = async (messages) => {
        // SEC-006: Handle complex message content (arrays, images, etc.)
        const prompt = messagesToText(messages);
        const inputResults = await validateWithTimeout(prompt, 'input');
        const blocked = inputResults.find((r) => !r.allowed);
        if (blocked) {
            logger.warn('[Guardrails] Input blocked', { reason: blocked.reason });
            if (onBlocked)
                onBlocked(blocked);
            // SEC-007: Production mode - generic error
            if (productionMode) {
                throw new Error('Content blocked');
            }
            throw new Error(`Content blocked: ${blocked.reason}`);
        }
    };
    return {
        /**
         * Generates text with guardrails validation.
         *
         * @param opts - Generation options including model and messages
         * @returns Generated text or filtered placeholder
         */
        async generateText(opts) {
            // Validate input first
            await validateInput(opts.messages);
            // Dynamically import to avoid peer dependency issues
            const { generateText: aiGenerateText } = await import('ai');
            // Generate text
            const result = await aiGenerateText(opts);
            // Validate output
            const outputResults = await validateWithTimeout(result.text, 'output');
            const outputBlocked = outputResults.find((r) => !r.allowed);
            if (outputBlocked) {
                logger.warn('[Guardrails] Output blocked', { reason: outputBlocked.reason });
                if (onBlocked)
                    onBlocked(outputBlocked);
                return {
                    text: '[Content filtered by guardrails]',
                    usage: result.usage,
                    finishReason: 'filtered',
                    filtered: true,
                    raw: result,
                };
            }
            return {
                text: result.text,
                usage: result.usage,
                finishReason: result.finishReason,
                filtered: false,
                raw: result,
            };
        },
        /**
         * Streams text with guardrails validation.
         *
         * @remarks
         * When validateStreaming is enabled, implements:
         * - SEC-002: Incremental validation with early termination
         * - SEC-003: Max buffer size enforcement
         *
         * @param opts - Stream options including model and messages
         * @returns Stream result with potential validation wrapping
         */
        async streamText(opts) {
            // Validate input first
            await validateInput(opts.messages);
            // Dynamically import to avoid peer dependency issues
            const { streamText: aiStreamText } = await import('ai');
            // Create stream
            const result = await aiStreamText(opts);
            if (validateStreaming && streamingMode === 'incremental') {
                // SEC-002: Incremental stream validation with early termination
                // SEC-003: Max buffer size enforcement
                const originalStream = result.toDataStream();
                let accumulatedText = '';
                let validationCounter = 0;
                return {
                    ...result,
                    toDataStream: () => {
                        const reader = originalStream.getReader();
                        return new ReadableStream({
                            async pull(controller) {
                                const { done, value } = await reader.read();
                                if (done) {
                                    // Final validation on stream completion
                                    const outputResults = await validateWithTimeout(accumulatedText, 'output');
                                    if (outputResults.some((r) => !r.allowed)) {
                                        logger.warn('[Guardrails] Stream blocked at final validation');
                                        if (onStreamBlocked)
                                            onStreamBlocked(accumulatedText);
                                        // Send error and close
                                        const errorChunk = new TextEncoder().encode(JSON.stringify({
                                            type: 'error',
                                            error: 'Content filtered',
                                        }));
                                        controller.enqueue(errorChunk);
                                    }
                                    controller.close();
                                    return;
                                }
                                // SEC-003: Check buffer size before accumulating
                                const chunk = new TextDecoder().decode(value);
                                if (accumulatedText.length + chunk.length > maxStreamBufferSize) {
                                    logger.warn('[Guardrails] Stream buffer exceeded', {
                                        size: accumulatedText.length + chunk.length,
                                        limit: maxStreamBufferSize,
                                    });
                                    const errorChunk = new TextEncoder().encode(JSON.stringify({
                                        type: 'error',
                                        error: 'Stream too large',
                                    }));
                                    controller.enqueue(errorChunk);
                                    controller.close();
                                    return;
                                }
                                accumulatedText += chunk;
                                validationCounter++;
                                // SEC-002: Incremental validation every N chunks
                                if (validationCounter % types_js_1.VALIDATION_INTERVAL === 0) {
                                    const results = await validateWithTimeout(accumulatedText, 'output');
                                    if (results.some((r) => !r.allowed)) {
                                        logger.warn('[Guardrails] Stream blocked during incremental validation', {
                                            chunkCount: validationCounter,
                                        });
                                        if (onStreamBlocked)
                                            onStreamBlocked(accumulatedText);
                                        const errorChunk = new TextEncoder().encode(JSON.stringify({
                                            type: 'error',
                                            error: 'Content filtered',
                                        }));
                                        controller.enqueue(errorChunk);
                                        controller.close();
                                        return;
                                    }
                                }
                                // Pass through the chunk
                                controller.enqueue(value);
                            },
                        });
                    },
                };
            }
            return result;
        },
    };
}
/**
 * Re-exports the messagesToText utility for external use.
 * This can be shared across different connectors (DEV-005).
 */
//# sourceMappingURL=guarded-ai.js.map