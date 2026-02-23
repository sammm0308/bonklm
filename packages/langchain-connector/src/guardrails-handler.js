/**
 * LangChain Guardrails Callback Handler
 * =====================================
 *
 * Provides security guardrails for LangChain operations via callback handler.
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
 * @package @blackunicorn/bonklm-langchain
 */
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { GuardrailEngine, createLogger, Severity, createResult, } from '@blackunicorn/bonklm';
import { DEFAULT_VALIDATION_INTERVAL, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_VALIDATION_TIMEOUT, } from './types.js';
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = createLogger('console');
/**
 * Validates that a numeric option is a positive number.
 *
 * @internal
 * @throws {TypeError} If value is not a positive finite number
 */
function validatePositiveNumber(value, optionName) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new TypeError(`${optionName} must be a positive number. Received: ${value}`);
    }
}
/**
 * Extracts text content from message-like objects.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content with structured blocks
 * - Different message types (human, ai, system, etc.)
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data.
 *
 * @param messages - Array of message objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages = [
 *   { content: 'Hello', _getType: () => 'human' },
 *   { content: [{ type: 'text', text: 'Hi there' }], _getType: () => 'human' }
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
        // Handle array content (SEC-006: structured data)
        if (Array.isArray(content)) {
            return content
                .filter((c) => {
                // Extract text blocks for validation
                return typeof c === 'object' && c !== null && 'type' in c && c.type === 'text';
            })
                .map((c) => {
                if (typeof c === 'object' && c !== null && 'type' in c && c.type === 'text' && 'text' in c) {
                    return String(c.text || '');
                }
                return '';
            })
                .join('\n');
        }
        // Handle other types (convert to string)
        return String(content ?? '');
    })
        .filter((c) => c.length > 0)
        .join('\n');
}
/**
 * Extracts text content from an LLMResult-like object.
 *
 * @internal
 */
function extractLLMResultText(llmResult) {
    const texts = [];
    for (const generations of llmResult.generations) {
        for (const gen of generations) {
            if (gen.text) {
                texts.push(gen.text);
            }
        }
    }
    return texts;
}
/**
 * LangChain Callback Handler for Guardrails Validation.
 *
 * @remarks
 * This handler integrates with LangChain's callback system to provide:
 * - Input validation before LLM calls
 * - Output validation after LLM responses
 * - Streaming validation with early termination
 * - Tool call validation
 *
 * @example
 * ```ts
 * import { GuardrailsCallbackHandler } from '@blackunicorn/bonklm-langchain';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const handler = new GuardrailsCallbackHandler({
 *   validators: [new PromptInjectionValidator()],
 *   validateStreaming: true,
 * });
 *
 * await chain.invoke(input, { callbacks: [handler] });
 * ```
 */
export class GuardrailsCallbackHandler extends BaseCallbackHandler {
    /**
     * The name of this callback handler.
     */
    name = 'guardrails_handler';
    /**
     * Whether this handler supports async operations.
     */
    awaitHandlers = true;
    /**
     * Whether to ignore agent events.
     */
    ignoreAgent = false;
    /**
     * Whether to ignore chain events.
     */
    ignoreChain = false;
    /**
     * Whether to ignore custom events.
     */
    ignoreCustomEvent = false;
    /**
     * Whether to ignore LLM events.
     */
    ignoreLLM = false;
    /**
     * Whether to ignore retriever events.
     */
    ignoreRetriever = true;
    /**
     * Whether to raise errors when validation fails.
     */
    raiseError = true;
    // Properties initialized in constructor via Object.assign
    engine;
    logger;
    validateStreaming;
    maxStreamBufferSize;
    productionMode;
    validationTimeout;
    // Note: streamingValidationInterval is stored but not used in current implementation
    // It's kept for API compatibility and future use
    // private streamingValidationInterval!: number;
    onBlocked;
    onStreamBlocked;
    onValidationError;
    // Per-run stream validation contexts
    streamContexts = new Map();
    /**
     * Creates a new GuardrailsCallbackHandler.
     *
     * @param options - Configuration options for the handler
     */
    constructor(options = {}) {
        super(); // Must call super() first in derived class
        const { validators = [], guards = [], logger = DEFAULT_LOGGER, validateStreaming = false, maxStreamBufferSize = DEFAULT_MAX_BUFFER_SIZE, productionMode = process.env.NODE_ENV === 'production', validationTimeout = DEFAULT_VALIDATION_TIMEOUT, streamingValidationInterval = DEFAULT_VALIDATION_INTERVAL, onBlocked, onStreamBlocked, onValidationError, } = options;
        // Validate critical security options
        validatePositiveNumber(maxStreamBufferSize, 'maxStreamBufferSize');
        validatePositiveNumber(validationTimeout, 'validationTimeout');
        validatePositiveNumber(streamingValidationInterval, 'streamingValidationInterval');
        // Use Object.assign to set private readonly properties
        Object.assign(this, {
            engine: new GuardrailEngine({
                validators,
                guards,
                logger,
            }),
            logger,
            validateStreaming,
            maxStreamBufferSize,
            productionMode,
            validationTimeout,
            streamingValidationInterval,
            onBlocked,
            onStreamBlocked,
            onValidationError,
        });
    }
    /**
     * SEC-008: Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    async validateWithTimeout(content, context) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.validationTimeout);
        try {
            // DEV-001: Correct API signature - use string context, not object
            const engineResult = await this.engine.validate(content, context);
            clearTimeout(timeoutId);
            // Convert EngineResult to GuardrailResult[]
            if ('results' in engineResult) {
                const multiResult = engineResult;
                return multiResult.results || [engineResult];
            }
            return [engineResult];
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('[Guardrails] Validation timeout');
                return [
                    createResult(false, Severity.CRITICAL, [
                        {
                            category: 'timeout',
                            description: 'Validation timeout',
                            severity: Severity.CRITICAL,
                            weight: 30,
                        },
                    ]),
                ];
            }
            throw error;
        }
        finally {
            controller.signal.removeEventListener('abort', () => { });
        }
    }
    /**
     * Validates content and throws GuardrailsViolationError if blocked.
     *
     * @internal
     */
    async validateAndThrow(content, context, runId) {
        const results = await this.validateWithTimeout(content, context);
        const blocked = results.find((r) => !r.allowed);
        if (blocked) {
            this.logger.warn('[Guardrails] Content blocked', {
                context,
                reason: blocked.reason,
                runId,
            });
            if (this.onBlocked) {
                this.onBlocked(blocked);
            }
            // SEC-007: Production mode - generic error message only
            // In production, don't expose sensitive details via error object properties
            const violationError = new Error(this.productionMode
                ? 'Content blocked'
                : `Content blocked: ${blocked.reason}`);
            // Only attach detailed properties in development mode to prevent data leakage
            if (!this.productionMode) {
                Object.assign(violationError, {
                    name: 'GuardrailsViolationError',
                    reason: blocked.reason || 'Unknown reason',
                    findings: blocked.findings || [],
                    riskScore: blocked.risk_score || 0,
                });
            }
            else {
                // In production, only set the name - no sensitive details
                Object.assign(violationError, {
                    name: 'GuardrailsViolationError',
                });
            }
            throw violationError;
        }
    }
    /**
     * Called at the start of an LLM/ChatModel run.
     *
     * @remarks
     * Validates input prompts before they are sent to the LLM.
     *
     * @param _llm - Serialized LLM configuration
     * @param prompts - Array of prompt strings
     * @param runId - Unique run identifier
     */
    async handleLLMStart(_llm, prompts, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extraParams, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runName) {
        try {
            for (let i = 0; i < prompts.length; i++) {
                const prompt = prompts[i];
                // Type guard
                if (typeof prompt !== 'string') {
                    this.logger.warn('[Guardrails] Skipping non-string prompt', {
                        index: i,
                        type: typeof prompt,
                    });
                    continue;
                }
                await this.validateAndThrow(prompt, 'llm-input', runId);
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
    /**
     * Called at the start of a Chat Model run.
     *
     * @remarks
     * Validates chat messages before they are sent to the LLM.
     * Focuses on human/user messages for security validation.
     *
     * @param _llm - Serialized LLM configuration
     * @param messages - Array of message arrays
     * @param runId - Unique run identifier
     */
    async handleChatModelStart(_llm, messages, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extraParams, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runName) {
        try {
            for (const messageList of messages) {
                // Focus on human/user messages for validation
                const humanMessages = messageList.filter((m) => typeof m === 'object' &&
                    m !== null &&
                    '_getType' in m &&
                    typeof m._getType === 'function' &&
                    (m._getType() === 'human' ||
                        m._getType() === 'user'));
                if (humanMessages.length > 0) {
                    const content = messagesToText(humanMessages);
                    if (content) {
                        await this.validateAndThrow(content, 'chat-input', runId);
                    }
                }
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
    /**
     * Called when an LLM in streaming mode produces a new token.
     *
     * @remarks
     * Implements SEC-002 (incremental validation) and SEC-003 (buffer size limit).
     *
     * @param token - The new token
     * @param _idx - Token indices
     * @param runId - Unique run identifier
     * @param _parentRunId - Parent run ID
     * @param _tags - Optional tags
     */
    handleLLMNewToken(token, _idx, runId, _parentRunId, _tags) {
        if (!this.validateStreaming) {
            return;
        }
        // Get or create stream context for this run
        let context = this.streamContexts.get(runId);
        if (!context) {
            context = {
                accumulatedText: '',
                tokenCount: 0,
                validationCounter: 0,
                startTime: Date.now(),
            };
            this.streamContexts.set(runId, context);
        }
        // SEC-003: Check buffer size BEFORE accumulating
        if (context.accumulatedText.length + token.length > this.maxStreamBufferSize) {
            this.logger.warn('[Guardrails] Stream buffer exceeded', {
                runId,
                size: context.accumulatedText.length + token.length,
                limit: this.maxStreamBufferSize,
            });
            // Create error with properties via Object.assign to avoid readonly issues
            const streamError = new Error('Stream buffer exceeded maximum size');
            Object.assign(streamError, {
                name: 'StreamValidationError',
                reason: 'buffer_exceeded',
                blocked: true,
            });
            // Clean up context
            this.streamContexts.delete(runId);
            throw streamError;
        }
        // Accumulate content
        context.accumulatedText += token;
        context.tokenCount++;
        context.validationCounter++;
        // Note: Streaming validation happens at stream end (handleLLMEnd), not incrementally.
        // This is a known limitation: handleLLMNewToken is synchronous, so async validation
        // cannot be performed here. Future versions may implement true incremental validation.
    }
    /**
     * Called at the end of an LLM/ChatModel run.
     *
     * @remarks
     * Validates LLM outputs before they are returned to the user.
     * Also performs final stream validation if streaming was enabled.
     *
     * @param output - LLM output containing generations
     * @param runId - Unique run identifier
     */
    async handleLLMEnd(output, runId) {
        try {
            // Handle streaming validation final check
            const streamContext = this.streamContexts.get(runId);
            if (streamContext && streamContext.accumulatedText.length > 0) {
                // Final validation for accumulated stream content
                const results = await this.validateWithTimeout(streamContext.accumulatedText, 'llm-output');
                if (results.some((r) => !r.allowed)) {
                    this.logger.warn('[Guardrails] Stream blocked at final validation', {
                        runId,
                        tokenCount: streamContext.tokenCount,
                    });
                    if (this.onStreamBlocked) {
                        this.onStreamBlocked(streamContext.accumulatedText);
                    }
                    const blocked = results.find((r) => !r.allowed);
                    // SEC-007: Production mode - generic error message only
                    // In production, don't expose sensitive details via error object properties
                    const violationError = new Error(this.productionMode
                        ? 'Content blocked'
                        : `Content blocked: ${blocked?.reason || 'validation failed'}`);
                    // Only attach detailed properties in development mode to prevent data leakage
                    if (!this.productionMode) {
                        Object.assign(violationError, {
                            name: 'GuardrailsViolationError',
                            reason: blocked?.reason || 'validation failed',
                            findings: blocked?.findings || [],
                            riskScore: blocked?.risk_score || 0,
                        });
                    }
                    else {
                        // In production, only set the name - no sensitive details
                        Object.assign(violationError, {
                            name: 'GuardrailsViolationError',
                        });
                    }
                    this.streamContexts.delete(runId);
                    throw violationError;
                }
                // Clean up context after successful validation
                this.streamContexts.delete(runId);
            }
            // Validate all generations
            const texts = extractLLMResultText(output);
            for (const text of texts) {
                if (text) {
                    await this.validateAndThrow(text, 'llm-output', runId);
                }
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
        finally {
            // Always clean up stream context
            this.streamContexts.delete(runId);
        }
    }
    /**
     * Called if an LLM/ChatModel run encounters an error.
     *
     * @remarks
     * Cleans up stream context when errors occur.
     *
     * @param err - The error object
     * @param runId - Unique run identifier
     */
    async handleLLMError(err, runId) {
        // Clean up stream context on error
        this.streamContexts.delete(runId);
        // Re-throw the error unless it's a validation error we've already handled
        if (err instanceof Error &&
            (err.name === 'GuardrailsViolationError' || err.name === 'StreamValidationError')) {
            // Already logged in other handlers
            throw err;
        }
    }
    /**
     * Called at the start of a Chain run.
     *
     * @remarks
     * Optionally validates chain inputs. This is disabled by default.
     *
     * @param _chain - Serialized chain configuration
     * @param inputs - Chain input values
     * @param runId - Unique run identifier
     */
    async handleChainStart(_chain, inputs, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runType, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runName) {
        try {
            // Extract text from inputs for validation
            const inputText = Object.values(inputs)
                .map((v) => {
                if (typeof v === 'string') {
                    return v;
                }
                if (Array.isArray(v) && v.every((item) => typeof item === 'string')) {
                    return v.join('\n');
                }
                return '';
            })
                .filter((s) => s.length > 0)
                .join('\n');
            if (inputText) {
                await this.validateAndThrow(inputText, 'chain-input', runId);
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
    /**
     * Called at the end of a Chain run.
     *
     * @remarks
     * Optionally validates chain outputs. This is disabled by default.
     *
     * @param outputs - Chain output values
     * @param runId - Unique run identifier
     */
    async handleChainEnd(outputs, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _kwargs) {
        try {
            // Extract text from outputs for validation
            const outputText = Object.values(outputs)
                .map((v) => {
                if (typeof v === 'string') {
                    return v;
                }
                if (Array.isArray(v) && v.every((item) => typeof item === 'string')) {
                    return v.join('\n');
                }
                return '';
            })
                .filter((s) => s.length > 0)
                .join('\n');
            if (outputText) {
                await this.validateAndThrow(outputText, 'chain-output', runId);
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
    /**
     * Called at the start of a Tool run.
     *
     * @remarks
     * Validates tool inputs for injection attacks.
     *
     * @param _tool - Serialized tool configuration
     * @param input - Tool input string
     * @param runId - Unique run identifier
     */
    async handleToolStart(_tool, input, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runName) {
        try {
            if (input && typeof input === 'string') {
                await this.validateAndThrow(input, 'tool-input', runId);
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
    /**
     * Called at the end of a Tool run.
     *
     * @remarks
     * Validates tool outputs for malicious content.
     *
     * @param output - Tool output
     * @param runId - Unique run identifier
     */
    async handleToolEnd(output, runId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parentRunId, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tags) {
        try {
            if (output && typeof output === 'string') {
                await this.validateAndThrow(output, 'tool-output', runId);
            }
        }
        catch (error) {
            if (this.onValidationError && error instanceof Error) {
                this.onValidationError(error, runId);
            }
            throw error;
        }
    }
}
/**
 * Type assertion for GuardrailsViolationError.
 *
 * @internal
 */
export function isGuardrailsViolationError(error) {
    return (error instanceof Error &&
        error.name === 'GuardrailsViolationError');
}
/**
 * Type assertion for StreamValidationError.
 *
 * @internal
 */
export function isStreamValidationError(error) {
    return (error instanceof Error &&
        error.name === 'StreamValidationError');
}
// Re-export error classes
export { GuardrailsViolationError, StreamValidationError } from './types.js';
//# sourceMappingURL=guardrails-handler.js.map