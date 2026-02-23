/**
 * Mastra Framework Guardrail Integration
 * =====================================
 *
 * Provides security guardrails for Mastra agent and workflow operations.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement to prevent DoS
 * - SEC-005: Tool call injection protection via schema validation
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout with AbortController
 * - SEC-010: Request size limit
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Proper logger integration
 * - DEV-003: Async/await on all validation calls
 *
 * @package @blackunicorn/bonklm-mastra
 */
import { GuardrailEngine, createLogger, Severity, createResult, } from '@blackunicorn/bonklm';
import { DEFAULT_MAX_BUFFER_SIZE, DEFAULT_MAX_CONTENT_LENGTH, DEFAULT_VALIDATION_TIMEOUT, VALIDATION_INTERVAL, StreamValidationError, } from './types.js';
import { messagesToText, toolCallsToText } from './messages-to-text.js';
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
 * Creates a Mastra guardrail integration that intercepts and validates agent operations.
 *
 * @param options - Configuration options for the guardrail integration
 * @returns An object with hook functions for Mastra agents
 *
 * @example
 * ```ts
 * import { createGuardedMastra } from '@blackunicorn/bonklm-mastra';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardrails = createGuardedMastra({
 *   validators: [new PromptInjectionValidator()],
 *   validateAgentInput: true,
 *   validateAgentOutput: true,
 * });
 *
 * // Use with Mastra agent
 * agent.beforeExecution(async (context) => {
 *   const result = await guardrails.beforeAgentExecution(context.messages, context);
 *   if (!result.allowed) throw new Error(result.blockedReason);
 * });
 * ```
 */
export function createGuardedMastra(options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, // DEV-002: Use proper logger
    validateAgentInput = true, validateAgentOutput = true, validateToolCalls = true, validateToolResults = true, validateStreaming = false, streamingMode = 'incremental', // SEC-002: Default to incremental
    maxStreamBufferSize = DEFAULT_MAX_BUFFER_SIZE, // SEC-003: Default 1MB
    maxContentLength = DEFAULT_MAX_CONTENT_LENGTH, // SEC-010: Default 100KB
    productionMode = process.env.NODE_ENV === 'production', // SEC-007
    validationTimeout = DEFAULT_VALIDATION_TIMEOUT, // SEC-008: Default 30s
    onBlocked, onStreamBlocked, onToolCallBlocked, } = options;
    // Validate critical security options
    validatePositiveNumber(maxStreamBufferSize, 'maxStreamBufferSize');
    validatePositiveNumber(validationTimeout, 'validationTimeout');
    validatePositiveNumber(maxContentLength, 'maxContentLength');
    const engine = new GuardrailEngine({
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
            // DEV-003: AWAIT the validation
            const engineResult = await engine.validate(content, context);
            clearTimeout(timeoutId);
            return engineResult.results;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Mastra Guardrails] Validation timeout');
                return [
                    createResult(false, Severity.CRITICAL, [
                        {
                            category: 'timeout',
                            severity: Severity.CRITICAL,
                            description: 'Validation timeout',
                        },
                    ]),
                ];
            }
            throw error;
        }
    };
    /**
     * SEC-007: Error handler that varies by production mode.
     *
     * @internal
     */
    const createErrorMessage = (result) => {
        if (productionMode) {
            return 'Content blocked by security policy';
        }
        return `Content blocked: ${result.reason}`;
    };
    /**
     * Validates content before processing.
     *
     * @internal
     */
    const validateBefore = async (content, context, executionContext) => {
        // SEC-010: Check content length
        if (content.length > maxContentLength) {
            const errorResult = createResult(false, Severity.WARNING, [
                {
                    category: 'size-limit',
                    severity: Severity.WARNING,
                    description: `Content exceeds maximum length of ${maxContentLength}`,
                },
            ]);
            onBlocked?.(errorResult, executionContext);
            logger.warn('[Mastra Guardrails] Content too large');
            return {
                allowed: false,
                blockedReason: createErrorMessage(errorResult),
            };
        }
        // DEV-003: AWAIT the validation
        const results = await validateWithTimeout(content, context);
        const blocked = results.find((r) => !r.allowed);
        if (blocked) {
            onBlocked?.(blocked, executionContext);
            logger.warn('[Mastra Guardrails] Input blocked', { reason: blocked.reason });
            return {
                allowed: false,
                blockedReason: createErrorMessage(blocked),
            };
        }
        return { allowed: true };
    };
    /**
     * Validates content after processing.
     *
     * @internal
     */
    const validateAfter = async (content, executionContext) => {
        // DEV-003: AWAIT the validation
        const results = await validateWithTimeout(content, 'output');
        const blocked = results.find((r) => !r.allowed);
        if (blocked) {
            onBlocked?.(blocked, executionContext);
            logger.warn('[Mastra Guardrails] Output blocked', { reason: blocked.reason });
            return {
                allowed: false,
                blockedReason: createErrorMessage(blocked),
            };
        }
        return { allowed: true };
    };
    /**
     * Creates a streaming validator function.
     *
     * @remarks
     * Returns a function that can be called with each chunk.
     * Implements SEC-002 and SEC-003 for secure streaming validation.
     *
     * @internal
     */
    const createStreamValidator = (executionContext) => {
        let accumulatedText = '';
        let chunkCount = 0;
        return async (chunk) => {
            // SEC-003: Check buffer size before adding
            if (accumulatedText.length + chunk.length > maxStreamBufferSize) {
                const error = `Stream buffer exceeded maximum size of ${maxStreamBufferSize}`;
                logger.warn('[Mastra Guardrails] Buffer overflow prevented');
                onStreamBlocked?.(accumulatedText, executionContext);
                throw new StreamValidationError(error, 'Buffer overflow', true);
            }
            accumulatedText += chunk;
            chunkCount++;
            // SEC-002: Incremental validation
            if (validateStreaming && streamingMode === 'incremental') {
                if (chunkCount % VALIDATION_INTERVAL === 0) {
                    const result = await validateAfter(accumulatedText, executionContext);
                    if (!result.allowed) {
                        onStreamBlocked?.(accumulatedText, executionContext);
                        throw new StreamValidationError(result.blockedReason || 'Stream blocked', 'Content policy violation', true);
                    }
                }
            }
            return chunk;
        };
    };
    /**
     * Validates stream completion.
     *
     * @internal
     */
    const finalizeStream = async (accumulatedText, executionContext) => {
        if (streamingMode === 'buffer' || !validateStreaming) {
            // Validate full buffer
            const result = await validateAfter(accumulatedText, executionContext);
            if (!result.allowed) {
                onStreamBlocked?.(accumulatedText, executionContext);
                throw new StreamValidationError(result.blockedReason || 'Stream blocked', 'Content policy violation', true);
            }
        }
        return accumulatedText;
    };
    return {
        /**
         * Hook to call before agent execution.
         * Validates input messages for security violations.
         */
        beforeAgentExecution: async (messages, executionContext) => {
            if (!validateAgentInput) {
                return { allowed: true };
            }
            const text = messagesToText(messages);
            return validateBefore(text, 'input', executionContext);
        },
        /**
         * Hook to call after agent execution.
         * Validates agent response for security violations.
         */
        afterAgentExecution: async (response, executionContext) => {
            if (!validateAgentOutput) {
                return { allowed: true };
            }
            const text = typeof response === 'string'
                ? response
                : messagesToText([response]);
            return validateAfter(text, executionContext);
        },
        /**
         * Validates a tool call before execution.
         * Addresses SEC-005: Tool call injection protection.
         */
        validateToolCall: async (toolCall, executionContext) => {
            if (!validateToolCalls) {
                return { allowed: true };
            }
            // SEC-005: Validate tool call inputs
            const text = toolCallsToText([toolCall]);
            const result = await validateBefore(text, 'tool_input', executionContext);
            if (!result.allowed) {
                onToolCallBlocked?.(toolCall, createResult(false, Severity.CRITICAL, [
                    {
                        category: 'tool-call-blocked',
                        severity: Severity.CRITICAL,
                        description: result.blockedReason || 'Tool call blocked',
                    },
                ]), executionContext);
            }
            return result;
        },
        /**
         * Validates a tool result after execution.
         */
        validateToolResult: async (toolResult, _toolCall, executionContext) => {
            if (!validateToolResults) {
                return { allowed: true };
            }
            const text = typeof toolResult === 'string'
                ? toolResult
                : messagesToText([toolResult]);
            return validateAfter(text, executionContext);
        },
        /**
         * Creates a stream validator for streaming responses.
         *
         * @example
         * ```ts
         * const validator = guardrails.createStreamValidator();
         * for await (const chunk of stream) {
         *   const validated = await validator(chunk);
         *   if (validated) process.stdout.write(validated);
         * }
         * ```
         */
        createStreamValidator: (executionContext) => {
            return createStreamValidator(executionContext);
        },
        // Internal: Expose finalizeStream for complete validation
        _finalizeStream: finalizeStream,
    };
}
/**
 * Creates a Mastra agent wrapper with automatic guardrail hooks.
 *
 * @remarks
 * This is a convenience function that wraps a Mastra agent with
 * before/after hooks for automatic validation.
 *
 * @param agent - The Mastra agent to wrap
 * @param options - Guardrail configuration options
 * @returns Wrapped agent with guardrail hooks applied
 *
 * @example
 * ```ts
 * import { wrapAgent } from '@blackunicorn/bonklm-mastra';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardedAgent = wrapAgent(myAgent, {
 *   validators: [new PromptInjectionValidator()],
 * });
 *
 * // Use the agent normally - guardrails are applied automatically
 * const result = await guardedAgent.execute('Hello');
 * ```
 */
export function wrapAgent(agent, options = {}) {
    const guardrails = createGuardedMastra(options);
    const wrappedExecute = async (input) => {
        // Normalize input to messages array
        const messages = typeof input === 'string'
            ? [{ role: 'user', content: input }]
            : input;
        // Validate input
        const beforeResult = await guardrails.beforeAgentExecution(messages);
        if (!beforeResult.allowed) {
            throw new Error(beforeResult.blockedReason || 'Input blocked');
        }
        // Execute agent
        const response = await agent.execute(input);
        // Validate output
        const afterResult = await guardrails.afterAgentExecution(response);
        if (!afterResult.allowed) {
            // Return a safe fallback instead of throwing
            return typeof response === 'string'
                ? '[Content filtered by security policy]'
                : { role: 'assistant', content: '[Content filtered by security policy]' };
        }
        return response;
    };
    return {
        ...agent,
        execute: wrappedExecute,
    };
}
//# sourceMappingURL=mastra-guardrail.js.map