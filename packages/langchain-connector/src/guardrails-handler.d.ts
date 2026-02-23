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
import type { NewTokenIndices } from '@langchain/core/callbacks/base';
import type { GuardrailsCallbackHandlerOptions, GuardrailsViolationError, StreamValidationError, StreamValidationContext } from './types.js';
interface LLMResultLike {
    generations: Array<{
        text?: string;
    }[]>;
    llmOutput?: unknown;
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
export declare class GuardrailsCallbackHandler extends BaseCallbackHandler {
    /**
     * The name of this callback handler.
     */
    name: string;
    /**
     * Whether this handler supports async operations.
     */
    awaitHandlers: boolean;
    /**
     * Whether to ignore agent events.
     */
    ignoreAgent: boolean;
    /**
     * Whether to ignore chain events.
     */
    ignoreChain: boolean;
    /**
     * Whether to ignore custom events.
     */
    ignoreCustomEvent: boolean;
    /**
     * Whether to ignore LLM events.
     */
    ignoreLLM: boolean;
    /**
     * Whether to ignore retriever events.
     */
    ignoreRetriever: boolean;
    /**
     * Whether to raise errors when validation fails.
     */
    raiseError: boolean;
    private engine;
    private logger;
    private validateStreaming;
    private maxStreamBufferSize;
    private productionMode;
    private validationTimeout;
    private onBlocked?;
    private onStreamBlocked?;
    private onValidationError?;
    private readonly streamContexts;
    /**
     * Creates a new GuardrailsCallbackHandler.
     *
     * @param options - Configuration options for the handler
     */
    constructor(options?: GuardrailsCallbackHandlerOptions);
    /**
     * SEC-008: Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    private validateWithTimeout;
    /**
     * Validates content and throws GuardrailsViolationError if blocked.
     *
     * @internal
     */
    private validateAndThrow;
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
    handleLLMStart(_llm: unknown, prompts: string[], runId: string, _parentRunId?: string, _extraParams?: Record<string, unknown>, _tags?: string[], _metadata?: Record<string, unknown>, _runName?: string): Promise<void>;
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
    handleChatModelStart(_llm: unknown, messages: unknown[][], runId: string, _parentRunId?: string, _extraParams?: Record<string, unknown>, _tags?: string[], _metadata?: Record<string, unknown>, _runName?: string): Promise<void>;
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
    handleLLMNewToken(token: string, _idx: NewTokenIndices, runId: string, _parentRunId?: string, _tags?: string[]): void | Promise<void>;
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
    handleLLMEnd(output: LLMResultLike, runId: string): Promise<void>;
    /**
     * Called if an LLM/ChatModel run encounters an error.
     *
     * @remarks
     * Cleans up stream context when errors occur.
     *
     * @param err - The error object
     * @param runId - Unique run identifier
     */
    handleLLMError(err: unknown, runId: string): Promise<void>;
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
    handleChainStart(_chain: unknown, inputs: Record<string, unknown>, runId: string, _parentRunId?: string, _tags?: string[], _metadata?: Record<string, unknown>, _runType?: string, _runName?: string): Promise<void>;
    /**
     * Called at the end of a Chain run.
     *
     * @remarks
     * Optionally validates chain outputs. This is disabled by default.
     *
     * @param outputs - Chain output values
     * @param runId - Unique run identifier
     */
    handleChainEnd(outputs: Record<string, unknown>, runId: string, _parentRunId?: string, _tags?: string[], _kwargs?: {
        inputs?: Record<string, unknown>;
    }): Promise<void>;
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
    handleToolStart(_tool: unknown, input: string, runId: string, _parentRunId?: string, _tags?: string[], _metadata?: Record<string, unknown>, _runName?: string): Promise<void>;
    /**
     * Called at the end of a Tool run.
     *
     * @remarks
     * Validates tool outputs for malicious content.
     *
     * @param output - Tool output
     * @param runId - Unique run identifier
     */
    handleToolEnd(output: string, runId: string, _parentRunId?: string, _tags?: string[]): Promise<void>;
}
/**
 * Type assertion for GuardrailsViolationError.
 *
 * @internal
 */
export declare function isGuardrailsViolationError(error: unknown): error is GuardrailsViolationError;
/**
 * Type assertion for StreamValidationError.
 *
 * @internal
 */
export declare function isStreamValidationError(error: unknown): error is StreamValidationError;
export type { GuardrailsCallbackHandlerOptions, StreamValidationContext, };
export { GuardrailsViolationError, StreamValidationError } from './types.js';
//# sourceMappingURL=guardrails-handler.d.ts.map